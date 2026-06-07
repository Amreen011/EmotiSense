import type { EmotionKey } from "./emotionStore";

// Lightweight heuristic voice emotion analyzer using Web Audio API.
// Maps pitch + energy + zero-crossing rate to an emotion category.

export interface VoiceResult {
  emotion: EmotionKey;
  confidence: number; // 0-1
  pitchHz: number;
  energy: number;
}

export class VoiceEmotionAnalyzer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private history: VoiceResult[] = [];

  onUpdate: ((result: VoiceResult | null) => void) | null = null;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.source.connect(this.analyser);
    this.buffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));
    this.tick();
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.source?.disconnect();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.history = [];
    this.onUpdate?.(null);
  }

  private tick = () => {
    if (!this.analyser || !this.buffer) return;
    this.analyser.getFloatTimeDomainData(this.buffer);

    // RMS energy
    let sumSq = 0;
    for (let i = 0; i < this.buffer.length; i++) sumSq += this.buffer[i] * this.buffer[i];
    const rms = Math.sqrt(sumSq / this.buffer.length);

    // Zero-crossing rate
    let zc = 0;
    for (let i = 1; i < this.buffer.length; i++) {
      if ((this.buffer[i - 1] >= 0) !== (this.buffer[i] >= 0)) zc++;
    }
    const zcr = zc / this.buffer.length;

    // Pitch via simple autocorrelation
    const pitch = this.estimatePitch(this.buffer, this.ctx?.sampleRate ?? 48000);

    if (rms < 0.01) {
      // Too quiet to classify
      this.onUpdate?.(null);
    } else {
      const result = classify(pitch, rms, zcr);
      this.history.push(result);
      if (this.history.length > 8) this.history.shift();
      const smoothed = smooth(this.history);
      this.onUpdate?.(smoothed);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private estimatePitch(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let bestOffset = -1;
    let bestCorr = 0;
    const minOffset = Math.floor(sampleRate / 500); // ~500Hz upper
    const maxOffset = Math.floor(sampleRate / 75);  // ~75Hz lower
    for (let offset = minOffset; offset < maxOffset; offset++) {
      let corr = 0;
      for (let i = 0; i < SIZE - offset; i++) corr += buf[i] * buf[i + offset];
      corr = corr / (SIZE - offset);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOffset = offset;
      }
    }
    if (bestOffset <= 0 || bestCorr < 0.01) return 0;
    return sampleRate / bestOffset;
  }
}

function classify(pitch: number, energy: number, zcr: number): VoiceResult {
  // Normalize buckets
  const highPitch = pitch > 200;
  const lowPitch = pitch > 0 && pitch < 140;
  const highEnergy = energy > 0.08;
  const lowEnergy = energy < 0.03;
  const highZcr = zcr > 0.15;

  let emotion: EmotionKey = "neutral";
  let confidence = 0.55;

  if (highEnergy && highPitch) {
    emotion = highZcr ? "surprised" : "happy";
    confidence = 0.78;
  } else if (highEnergy && lowPitch) {
    emotion = "angry";
    confidence = 0.74;
  } else if (lowEnergy && lowPitch) {
    emotion = "sad";
    confidence = 0.7;
  } else if (lowEnergy && highPitch) {
    emotion = "fearful";
    confidence = 0.65;
  } else if (highEnergy && highZcr) {
    emotion = "disgusted";
    confidence = 0.6;
  } else {
    emotion = "neutral";
    confidence = 0.6;
  }

  return { emotion, confidence, pitchHz: pitch, energy };
}

function smooth(history: VoiceResult[]): VoiceResult {
  const counts: Record<string, number> = {};
  let confSum = 0;
  let pitchSum = 0;
  let energySum = 0;
  for (const h of history) {
    counts[h.emotion] = (counts[h.emotion] ?? 0) + 1;
    confSum += h.confidence;
    pitchSum += h.pitchHz;
    energySum += h.energy;
  }
  let top: EmotionKey = history[history.length - 1].emotion;
  let max = 0;
  for (const k of Object.keys(counts)) {
    if (counts[k] > max) {
      max = counts[k];
      top = k as EmotionKey;
    }
  }
  return {
    emotion: top,
    confidence: confSum / history.length,
    pitchHz: pitchSum / history.length,
    energy: energySum / history.length,
  };
}

export function fuseEmotions(
  face: { emotion: EmotionKey; confidence: number } | null,
  voice: { emotion: EmotionKey; confidence: number } | null,
): { emotion: EmotionKey; confidence: number } | null {
  if (!face && !voice) return null;
  if (!face) return voice;
  if (!voice) return face;
  if (face.emotion === voice.emotion) {
    return {
      emotion: face.emotion,
      confidence: Math.min(1, face.confidence * 0.6 + voice.confidence * 0.4 + 0.05),
    };
  }
  // Disagreement → weighted: face 0.65, voice 0.35
  const faceScore = face.confidence * 0.65;
  const voiceScore = voice.confidence * 0.35;
  return faceScore >= voiceScore
    ? { emotion: face.emotion, confidence: faceScore }
    : { emotion: voice.emotion, confidence: voiceScore };
}
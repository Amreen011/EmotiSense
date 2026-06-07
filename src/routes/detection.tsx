import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  ImageDown,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  FileDown,
  Moon,
  Sun,
} from "lucide-react";
import {
  appendDetections,
  saveSession,
  newSessionId,
  summarize,
  type Detection as StoredDetection,
  type EmotionKey,
} from "../lib/emotionStore";
import { exportPDF } from "../lib/emotionExport";
import { VoiceEmotionAnalyzer, fuseEmotions, type VoiceResult } from "../lib/voiceEmotion";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Live Detection — EmotiSense" },
      {
        name: "description",
        content:
          "Real-time facial emotion detection from your webcam using a CNN-based model.",
      },
    ],
  }),
  component: Detection,
});

const EMOTION_META: Record<string, { emoji: string; color: string; label: string }> = {
  happy: { emoji: "😊", color: "oklch(0.7 0.18 145)", label: "Happy" },
  sad: { emoji: "😔", color: "oklch(0.6 0.15 250)", label: "Sad" },
  angry: { emoji: "😠", color: "oklch(0.6 0.22 25)", label: "Angry" },
  surprised: { emoji: "😲", color: "oklch(0.78 0.18 75)", label: "Surprise" },
  neutral: { emoji: "😐", color: "oklch(0.6 0.02 270)", label: "Neutral" },
  fearful: { emoji: "😨", color: "oklch(0.55 0.18 300)", label: "Fear" },
  disgusted: { emoji: "🤢", color: "oklch(0.6 0.15 145)", label: "Disgust" },
};

const ORDERED_EMOTIONS = [
  "happy",
  "sad",
  "angry",
  "surprised",
  "neutral",
  "fearful",
  "disgusted",
];

type Status =
  | "idle"
  | "loading-models"
  | "requesting"
  | "ready"
  | "denied"
  | "error";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

function Detection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const faceapiRef = useRef<typeof import("@vladmandic/face-api") | null>(null);
  const sessionIdRef = useRef<string>("");
  const sessionStartRef = useRef<number>(0);
  const pendingRef = useRef<StoredDetection[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<{ emotion: EmotionKey; confidence: number }[]>([]);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dark, setDark] = useState(false);

  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [fps, setFps] = useState(0);
  const [lightingWarn, setLightingWarn] = useState(false);
  const [tooFarWarn, setTooFarWarn] = useState(false);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [framesProcessed, setFramesProcessed] = useState(0);
  const [sessionTime, setSessionTime] = useState("00:00:00");
  const [stability, setStability] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [voice, setVoice] = useState<VoiceResult | null>(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const voiceRef = useRef<VoiceEmotionAnalyzer | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleVoice = useCallback(async () => {
    if (voiceOn) {
      voiceRef.current?.stop();
      voiceRef.current = null;
      setVoiceOn(false);
      setVoice(null);
      showToast("Microphone disabled");
      return;
    }
    try {
      const v = new VoiceEmotionAnalyzer();
      v.onUpdate = (r) => setVoice(r);
      await v.start();
      voiceRef.current = v;
      setVoiceOn(true);
      showToast("Voice emotion enabled");
    } catch (e) {
      console.error(e);
      showToast("Microphone access denied");
    }
  }, [voiceOn]);

  useEffect(() => () => voiceRef.current?.stop(), []);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Session timer
  useEffect(() => {
    if (!sessionStart) return;
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - sessionStart) / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      setSessionTime(`${h}:${m}:${sec}`);
    }, 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    flushTimerRef.current = null;

    // Flush any pending detections and finalize the session.
    if (pendingRef.current.length > 0) {
      appendDetections(pendingRef.current);
    }
    if (sessionIdRef.current && sessionStartRef.current) {
      const all = pendingRef.current;
      const sum = summarize(all);
      const endedAt = Date.now();
      saveSession({
        id: sessionIdRef.current,
        startedAt: sessionStartRef.current,
        endedAt,
        durationSec: Math.round((endedAt - sessionStartRef.current) / 1000),
        detections: all.length,
        dominant: sum.dominant,
        avgConfidence: sum.avgConfidence,
        distribution: sum.distribution,
      });
      showToast(`Session saved · ${all.length} detections`);
    }
    pendingRef.current = [];
    historyRef.current = [];
    sessionIdRef.current = "";
    sessionStartRef.current = 0;

    setStatus("idle");
    setFaceDetected(false);
    setEmotion(null);
    setConfidence(0);
    setDistribution({});
    setStability(0);
  }, []);

  const start = useCallback(async () => {
    setErrorMsg("");
    try {
      // Load models
      if (!faceapiRef.current) {
        setStatus("loading-models");
        const faceapi = await import("@vladmandic/face-api");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        faceapiRef.current = faceapi;
      }

      setStatus("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const now = Date.now();
      sessionIdRef.current = newSessionId();
      sessionStartRef.current = now;
      pendingRef.current = [];
      historyRef.current = [];
      setSavedCount(0);
      setSessionStart(now);
      showToast("Camera connected");

      // Periodically flush pending detections to localStorage so data survives
      // crashes/refresh mid-session.
      flushTimerRef.current = setInterval(() => {
        if (pendingRef.current.length > savedCount) {
          appendDetections(pendingRef.current.slice(savedCount));
          setSavedCount(pendingRef.current.length);
        }
      }, 4000);

      setStatus("ready");
      loop();
    } catch (e: any) {
      console.error(e);
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMsg("Please allow camera access in your browser settings.");
      } else {
        setStatus("error");
        setErrorMsg(e?.message ?? "Could not start camera.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loop = useCallback(async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!faceapi || !video || !canvas) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const tick = async () => {
      if (!videoRef.current || !streamRef.current) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const detectorOpts = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const results = await faceapi
          .detectAllFaces(video, detectorOpts)
          .withFaceLandmarks(true)
          .withFaceExpressions();

        const ctx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Lighting check via canvas brightness sample
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = 32;
        sampleCanvas.height = 18;
        const sCtx = sampleCanvas.getContext("2d")!;
        sCtx.drawImage(video, 0, 0, 32, 18);
        const img = sCtx.getImageData(0, 0, 32, 18).data;
        let brightness = 0;
        for (let i = 0; i < img.length; i += 4) {
          brightness += (img[i] + img[i + 1] + img[i + 2]) / 3;
        }
        brightness /= img.length / 4;
        setLightingWarn(brightness < 50);

        if (results.length === 0) {
          setFaceDetected(false);
          setFaceCount(0);
          setEmotion(null);
          setConfidence(0);
          setDistribution({});
          setTooFarWarn(false);
          historyRef.current = [];
          setStability(0);
        } else {
          setFaceDetected(true);
          setFaceCount(results.length);

          const primary = results.reduce((a, b) =>
            a.detection.box.area > b.detection.box.area ? a : b
          );
          const faceArea = primary.detection.box.area;
          const frameArea = canvas.width * canvas.height;
          setTooFarWarn(faceArea / frameArea < 0.04);

          // Pick top expression
          const exprs = primary.expressions as unknown as Record<string, number>;
          let rawTop: EmotionKey = "neutral";
          let rawScore = 0;
          for (const k of Object.keys(exprs)) {
            if (exprs[k] > rawScore) {
              rawScore = exprs[k];
              rawTop = k as EmotionKey;
            }
          }

          // Rolling smoothing over last 10 frames; ignore low-confidence frames.
          if (rawScore >= 0.4) {
            historyRef.current.push({ emotion: rawTop, confidence: rawScore });
            if (historyRef.current.length > 10) historyRef.current.shift();
          }

          // Majority vote + averaged confidence.
          const counts: Record<string, number> = {};
          const confSums: Record<string, number> = {};
          for (const h of historyRef.current) {
            counts[h.emotion] = (counts[h.emotion] ?? 0) + 1;
            confSums[h.emotion] = (confSums[h.emotion] ?? 0) + h.confidence;
          }
          let smoothTop: EmotionKey = rawTop;
          let smoothMax = 0;
          for (const k of Object.keys(counts)) {
            if (counts[k] > smoothMax) {
              smoothMax = counts[k];
              smoothTop = k as EmotionKey;
            }
          }
          const smoothConf =
            counts[smoothTop] > 0 ? confSums[smoothTop] / counts[smoothTop] : rawScore;
          const stab = historyRef.current.length
            ? (smoothMax / historyRef.current.length) * 100
            : 0;

          setEmotion(smoothTop);
          setConfidence(smoothConf * 100);
          setDistribution({ ...exprs });
          setStability(stab);

          // Persist this detection only if confidence ≥ 70% and stable.
          if (smoothConf >= 0.7 && stab >= 50 && sessionIdRef.current) {
            const last = pendingRef.current[pendingRef.current.length - 1];
            // Throttle: at most one row per second.
            if (!last || Date.now() - last.timestamp >= 1000) {
              pendingRef.current.push({
                id: `${sessionIdRef.current}_${pendingRef.current.length}`,
                sessionId: sessionIdRef.current,
                timestamp: Date.now(),
                emotion: smoothTop,
                confidence: smoothConf,
              });
            }
          }

          // Draw boxes + landmarks for ALL faces
          results.forEach((r, idx) => {
            const { x: rx, y, width, height } = r.detection.box;
            // Video element is mirrored via CSS scaleX(-1); canvas is NOT
            // mirrored so text stays readable. Flip box X-coordinates so
            // overlays align with the user-facing mirrored video.
            const x = canvas.width - rx - width;
            const isPrimary = r === primary;
            ctx.strokeStyle = isPrimary ? "#22c55e" : "#a78bfa";
            ctx.lineWidth = 3;
            // Corner brackets
            const c = 18;
            ctx.beginPath();
            ctx.moveTo(x, y + c); ctx.lineTo(x, y); ctx.lineTo(x + c, y);
            ctx.moveTo(x + width - c, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + c);
            ctx.moveTo(x, y + height - c); ctx.lineTo(x, y + height); ctx.lineTo(x + c, y + height);
            ctx.moveTo(x + width - c, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - c);
            ctx.stroke();

            // Landmarks (flip X too)
            ctx.fillStyle = isPrimary ? "#22c55e" : "#a78bfa";
            r.landmarks.positions.forEach((p) => {
              ctx.beginPath();
              ctx.arc(canvas.width - p.x, p.y, 1.6, 0, Math.PI * 2);
              ctx.fill();
            });

            // Label (drawn on unmirrored canvas, always readable)
            const labelKey = isPrimary ? smoothTop : "neutral";
            const meta = EMOTION_META[labelKey];
            const text = isPrimary
              ? `${meta.label} ${meta.emoji} ${(smoothConf * 100).toFixed(0)}%`
              : `Face ${idx + 1}`;
            ctx.font = "bold 14px Inter, sans-serif";
            const w = ctx.measureText(text).width + 12;
            ctx.fillStyle = isPrimary ? "#22c55e" : "#a78bfa";
            ctx.fillRect(x, y - 26, w, 22);
            ctx.fillStyle = "white";
            ctx.fillText(text, x + 6, y - 10);
          });
        }

        setFramesProcessed((n) => n + 1);
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
          frameCount = 0;
          lastFpsUpdate = now;
        }
        lastTime = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const takeScreenshot = () => {
    const video = videoRef.current;
    const overlay = canvasRef.current;
    if (!video || !overlay) return;
    const out = document.createElement("canvas");
    out.width = video.videoWidth;
    out.height = video.videoHeight;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    ctx.drawImage(overlay, 0, 0);
    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `emotisense-${Date.now()}.png`;
    a.click();
  };

  const downloadReport = () => {
    // Flush in-memory detections before exporting.
    if (pendingRef.current.length > savedCount) {
      appendDetections(pendingRef.current.slice(savedCount));
      setSavedCount(pendingRef.current.length);
    }
    exportPDF();
    showToast("PDF report downloaded");
  };

  const currentMeta = emotion ? EMOTION_META[emotion] : null;

  return (
    <AppShell title="Live Detection">
      {toast && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold shadow-soft animate-fade-in">
          {toast}
        </div>
      )}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Video stage */}
          <div className="relative rounded-2xl overflow-hidden bg-muted border border-border aspect-video shadow-soft">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1] bg-black"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Pre-permission states */}
            {(status === "idle" || status === "denied" || status === "error" || status === "loading-models" || status === "requesting") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-secondary/40 via-background to-accent/40">
                {status === "loading-models" && (
                  <>
                    <Loader2 className="size-10 text-primary animate-spin mb-3" />
                    <p className="font-bold">Loading CNN model…</p>
                    <p className="text-xs text-muted-foreground mt-1">Tiny Face Detector + FER expression net</p>
                  </>
                )}
                {status === "requesting" && (
                  <>
                    <Loader2 className="size-10 text-primary animate-spin mb-3" />
                    <p className="font-bold">Waiting for camera permission…</p>
                  </>
                )}
                {status === "idle" && (
                  <>
                    <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <Camera className="size-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Camera Access Required</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-5">
                      EmotiSense uses your webcam locally to detect facial expressions. No video leaves your device.
                    </p>
                    <button
                      onClick={start}
                      className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
                    >
                      <Camera className="size-4" /> Enable Camera
                    </button>
                  </>
                )}
                {status === "denied" && (
                  <>
                    <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                      <CameraOff className="size-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Camera Blocked</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mb-5">{errorMsg}</p>
                    <button onClick={start} className="px-5 h-11 rounded-xl bg-primary text-primary-foreground font-semibold">
                      Try Again
                    </button>
                  </>
                )}
                {status === "error" && (
                  <>
                    <AlertTriangle className="size-10 text-destructive mb-3" />
                    <h3 className="font-bold">Something went wrong</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">{errorMsg}</p>
                  </>
                )}
              </div>
            )}

            {/* No face overlay (live, transparent) */}
            {status === "ready" && !faceDetected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/40 backdrop-blur-[2px]">
                <div className="size-14 rounded-full bg-white/10 border-2 border-dashed border-white/60 flex items-center justify-center mb-3">
                  <Camera className="size-6 text-white" />
                </div>
                <p className="text-white font-bold text-lg">No Face Detected</p>
                <p className="text-white/70 text-sm mt-1">Please position your face in front of the camera.</p>
              </div>
            )}

            {/* Top HUD */}
            {status === "ready" && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
                  <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white">Live · {fps} FPS</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {lightingWarn && (
                    <div className="px-3 py-1.5 rounded-full bg-amber-500/90 text-[10px] font-bold uppercase text-white flex items-center gap-1">
                      <AlertTriangle className="size-3" /> Low Light
                    </div>
                  )}
                  {tooFarWarn && (
                    <div className="px-3 py-1.5 rounded-full bg-amber-500/90 text-[10px] font-bold uppercase text-white flex items-center gap-1">
                      <AlertTriangle className="size-3" /> Move Closer
                    </div>
                  )}
                  <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white">
                      {faceCount} Face{faceCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md">
                  <button
                    onClick={stop}
                    className="size-10 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500"
                    title="Stop"
                  >
                    <CameraOff className="size-4" />
                  </button>
                  <button onClick={takeScreenshot} className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" title="Screenshot">
                    <ImageDown className="size-4" />
                  </button>
                  <button onClick={downloadReport} className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" title="Download report">
                    <FileDown className="size-4" />
                  </button>
                  <button
                    onClick={toggleVoice}
                    className={`size-10 rounded-full flex items-center justify-center text-white ${voiceOn ? "bg-primary" : "bg-white/10 hover:bg-white/20"}`}
                    title={voiceOn ? "Disable microphone" : "Enable microphone"}
                  >
                    <Mic className="size-4" />
                  </button>
                  <button onClick={() => setDark((d) => !d)} className="size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" title="Toggle theme">
                    {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Telemetry */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "FPS", value: fps.toString() },
              { label: "Frames", value: framesProcessed.toLocaleString() },
              { label: "Stability", value: `${stability.toFixed(0)}%` },
              { label: "Session", value: sessionTime },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-card border border-border shadow-soft">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-xl font-extrabold font-mono">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Multimodal Fusion */}
          {(() => {
            const face = faceDetected && emotion
              ? { emotion: emotion as EmotionKey, confidence: confidence / 100 }
              : null;
            const voicePart = voice ? { emotion: voice.emotion, confidence: voice.confidence } : null;
            const fused = fuseEmotions(face, voicePart);
            return (
              <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Multimodal Fusion</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground uppercase">Face + Voice</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-3 rounded-lg bg-background border border-border text-center">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Face</p>
                    <div className="text-2xl">{face ? EMOTION_META[face.emotion].emoji : "—"}</div>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: face ? EMOTION_META[face.emotion].color : undefined }}>
                      {face ? `${(face.confidence * 100).toFixed(0)}%` : "—"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background border border-border text-center">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Voice</p>
                    <div className="text-2xl">{voicePart ? EMOTION_META[voicePart.emotion].emoji : voiceOn ? "🎙️" : "—"}</div>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: voicePart ? EMOTION_META[voicePart.emotion].color : undefined }}>
                      {voicePart ? `${(voicePart.confidence * 100).toFixed(0)}%` : voiceOn ? "listening" : "off"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <p className="text-[9px] font-mono uppercase text-primary mb-1">Combined</p>
                    <div className="text-2xl">{fused ? EMOTION_META[fused.emotion].emoji : "—"}</div>
                    <p className="text-[10px] font-bold mt-0.5" style={{ color: fused ? EMOTION_META[fused.emotion].color : undefined }}>
                      {fused ? `${(fused.confidence * 100).toFixed(0)}%` : "—"}
                    </p>
                  </div>
                </div>
                {!voiceOn && (
                  <button onClick={toggleVoice} className="w-full py-2 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center gap-1.5">
                    <Mic className="size-3" /> Enable Voice Detection
                  </button>
                )}
                {voiceOn && voice && (
                  <div className="text-[10px] font-mono text-muted-foreground mt-2 flex justify-between">
                    <span>Pitch: {voice.pitchHz.toFixed(0)} Hz</span>
                    <span>Energy: {(voice.energy * 100).toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold">Detection Result</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">Real-time</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              {faceDetected ? "Face Detected ✓" : "Awaiting face…"}
            </p>

            <div className="text-center mb-6 p-6 rounded-xl bg-gradient-to-br from-secondary/40 to-accent/40 border border-border">
              <div className="text-6xl mb-2">{currentMeta?.emoji ?? "—"}</div>
              <div
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: currentMeta?.color ?? "var(--muted-foreground)" }}
              >
                {currentMeta?.label ?? "—"}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                {faceDetected ? `${confidence.toFixed(1)}% confidence` : "No prediction"}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-widest">
                Timestamp: {faceDetected ? "Live" : "—"}
              </div>
            </div>

            {/* Confidence meter */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground mb-1">
                <span>Confidence</span>
                <span>{confidence.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary-foreground transition-all duration-300"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {ORDERED_EMOTIONS.map((k) => {
                const meta = EMOTION_META[k];
                const v = (distribution[k] ?? 0) * 100;
                return (
                  <div key={k}>
                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                      <span className="flex items-center gap-2">
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="font-mono text-muted-foreground">{v.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${v}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold mb-1">AI Assistant</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {faceDetected && currentMeta
                    ? `Detected ${currentMeta.label.toLowerCase()} expression with ${confidence.toFixed(0)}% confidence. Looking good — keep your face centered for best accuracy.`
                    : "Position your face inside the frame. Make sure lighting is even and remove obstructions like masks or sunglasses."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
            <p className="text-xs font-bold mb-2 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> Detection Pipeline
            </p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>Capture frame from webcam</li>
              <li>Run Tiny Face Detector (CNN)</li>
              <li>Extract 68 facial landmarks</li>
              <li>Classify with FER expression net</li>
              <li>Render bounding box + result</li>
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
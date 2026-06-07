// Persistent emotion detection store backed by localStorage.
// Survives camera shutdown, page refresh, and browser restart.

export type EmotionKey =
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "neutral"
  | "fearful"
  | "disgusted";

export interface Detection {
  id: string;
  sessionId: string;
  timestamp: number;
  emotion: EmotionKey;
  confidence: number; // 0-1
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  detections: number;
  dominant: EmotionKey | null;
  avgConfidence: number;
  distribution: Record<EmotionKey, number>;
}

const DET_KEY = "emotisense.detections.v1";
const SES_KEY = "emotisense.sessions.v1";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded */
  }
}

export function getDetections(): Detection[] {
  return safeRead<Detection[]>(DET_KEY, []);
}

export function getSessions(): Session[] {
  return safeRead<Session[]>(SES_KEY, []);
}

export function appendDetections(items: Detection[]) {
  if (!items.length) return;
  const existing = getDetections();
  // Cap at 5000 to avoid quota issues.
  const merged = [...existing, ...items].slice(-5000);
  safeWrite(DET_KEY, merged);
}

export function saveSession(session: Session) {
  const existing = getSessions();
  existing.push(session);
  safeWrite(SES_KEY, existing.slice(-500));
}

export function newSessionId(): string {
  return `SES_${Date.now().toString(36).toUpperCase()}`;
}

export function summarize(detections: Detection[]) {
  const distribution: Record<string, number> = {};
  let confSum = 0;
  for (const d of detections) {
    distribution[d.emotion] = (distribution[d.emotion] ?? 0) + 1;
    confSum += d.confidence;
  }
  let dominant: EmotionKey | null = null;
  let max = -1;
  for (const k of Object.keys(distribution)) {
    if (distribution[k] > max) {
      max = distribution[k];
      dominant = k as EmotionKey;
    }
  }
  const avgConfidence = detections.length ? confSum / detections.length : 0;
  return { distribution: distribution as Record<EmotionKey, number>, dominant, avgConfidence };
}

export const EMOTION_LABELS: Record<EmotionKey, string> = {
  happy: "Happy",
  sad: "Sad",
  angry: "Angry",
  surprised: "Surprise",
  neutral: "Neutral",
  fearful: "Fear",
  disgusted: "Disgust",
};

export const EMOTION_EMOJI: Record<EmotionKey, string> = {
  happy: "😊",
  sad: "😔",
  angry: "😠",
  surprised: "😲",
  neutral: "😐",
  fearful: "😨",
  disgusted: "🤢",
};

export function clearAll() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DET_KEY);
  localStorage.removeItem(SES_KEY);
}
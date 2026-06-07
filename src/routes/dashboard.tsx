import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { Activity, Camera, Sparkles, TrendingUp, Smile } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  getDetections,
  getSessions,
  summarize,
  EMOTION_LABELS,
  EMOTION_EMOJI,
  type Detection,
  type Session,
  type EmotionKey,
} from "../lib/emotionStore";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EmotiSense" },
      { name: "description", content: "Your emotion detection dashboard with mood analytics and live statistics." },
    ],
  }),
  component: Dashboard,
});

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildWeeklyTrend(detections: Detection[]) {
  const now = new Date();
  const buckets: { day: string; happy: number; sad: number; neutral: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ day: DAY_LABELS[d.getDay()], happy: 0, sad: 0, neutral: 0 });
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  for (const det of detections) {
    const t = new Date(det.timestamp);
    const diffDays = Math.floor((t.getTime() - start.getTime()) / 86400000);
    if (diffDays < 0 || diffDays > 6) continue;
    const b = buckets[diffDays];
    if (det.emotion === "happy") b.happy++;
    else if (det.emotion === "sad") b.sad++;
    else if (det.emotion === "neutral") b.neutral++;
  }
  return buckets;
}

function Dashboard() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setDetections(getDetections());
    setSessions(getSessions());
  }, []);

  const stats = useMemo(() => summarize(detections), [detections]);
  const trendData = useMemo(() => buildWeeklyTrend(detections), [detections]);
  const sessionsToday = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return sessions.filter((s) => s.startedAt >= t.getTime()).length;
  }, [sessions]);
  const moodScore = useMemo(() => {
    if (!detections.length) return 0;
    const weights: Record<EmotionKey, number> = {
      happy: 100, surprised: 80, neutral: 60, sad: 30, fearful: 25, disgusted: 20, angry: 10,
    };
    let s = 0;
    for (const d of detections) s += weights[d.emotion] ?? 50;
    return Math.round(s / detections.length);
  }, [detections]);
  const recent = useMemo(() => detections.slice(-5).reverse(), [detections]);

  const fmtAgo = (ts: number) => {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const statCards = [
    { label: "Sessions Today", value: sessionsToday.toString(), trend: `${sessions.length} total`, icon: Activity, color: "primary" as const },
    { label: "Avg Confidence", value: `${(stats.avgConfidence * 100).toFixed(1)}%`, trend: "live", icon: TrendingUp, color: "secondary" as const },
    { label: "Top Emotion", value: stats.dominant ? EMOTION_LABELS[stats.dominant] : "—", trend: stats.dominant ? EMOTION_EMOJI[stats.dominant] : "·", icon: Smile, color: "emerald" as const },
    { label: "Total Detections", value: detections.length.toLocaleString(), trend: "stored", icon: Sparkles, color: "primary" as const },
  ];

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Greeting + Mood Score */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-8 rounded-2xl bg-surface border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2">Welcome back</p>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                {detections.length === 0
                  ? "Welcome to EmotiSense ✨"
                  : `Your dominant mood is ${stats.dominant ? EMOTION_LABELS[stats.dominant] : "neutral"} ${stats.dominant ? EMOTION_EMOJI[stats.dominant] : ""}`}
              </h2>
              <p className="text-foreground/60 mb-6">
                {detections.length === 0
                  ? "Start your first detection session — your emotion data will be saved locally and stay available after the camera closes."
                  : `${detections.length} detections recorded across ${sessions.length} sessions.`}
              </p>
              <div className="flex gap-3">
                <Link to="/detection" className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-sm flex items-center gap-2">
                  <Camera className="size-4" /> Start Detection
                </Link>
                <Link to="/insights" className="px-5 py-2.5 bg-surface border border-border font-bold rounded-lg text-sm flex items-center gap-2">
                  <Sparkles className="size-4" /> View Insights
                </Link>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-2xl bg-surface border border-border text-center flex flex-col items-center justify-center">
            <div className="relative size-32">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="oklch(1 0 0 / 0.05)" strokeWidth="8" fill="none" />
                <circle cx="50" cy="50" r="42" stroke="oklch(0.65 0.2 275)" strokeWidth="8" fill="none" strokeDasharray="264" strokeDashoffset={264 - (264 * moodScore) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold">{moodScore}</span>
                <span className="text-[10px] font-mono text-foreground/40 uppercase">Mood Score</span>
              </div>
            </div>
            <p className="text-xs text-foreground/60 mt-4 italic">
              {moodScore >= 75 ? "You are radiating positive energy today." : moodScore >= 50 ? "Steady and balanced." : moodScore > 0 ? "Take a moment for yourself." : "No data yet — start a session."}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-surface border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  s.color === "primary" ? "bg-primary/10 text-primary" :
                  s.color === "secondary" ? "bg-secondary/10 text-secondary" :
                  "bg-emerald-500/10 text-emerald-400"
                }`}>
                  <s.icon className="size-4" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{s.trend}</span>
              </div>
              <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
              <div className="text-xs text-foreground/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trend + emotion breakdown */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold">Emotion Trends</h3>
                <p className="text-xs text-foreground/40 mt-1">Last 7 days · Happy / Sad / Neutral</p>
              </div>
              <div className="flex gap-1 p-1 bg-background rounded-lg border border-border">
                {["7D", "30D", "90D"].map((t, i) => (
                  <button key={t} className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${i === 0 ? "bg-primary text-primary-foreground" : "text-foreground/50"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.2 275)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.65 0.2 275)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.22 310)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.65 0.22 310)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="day" stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="happy" stroke="oklch(0.65 0.2 275)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sad" stroke="oklch(0.65 0.22 310)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Today's Emotions</h3>
            <p className="text-xs text-foreground/40 mb-6">Distribution across all sessions</p>
            <div className="space-y-4">
              {(Object.keys(EMOTION_LABELS) as EmotionKey[]).map((k) => {
                const total = detections.length || 1;
                const value = Math.round(((stats.distribution[k] ?? 0) / total) * 100);
                return (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="flex items-center gap-2">{EMOTION_EMOJI[k]} {EMOTION_LABELS[k]}</span>
                    <span className="text-foreground/60 font-mono">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${value}%` }} />
                  </div>
                </div>
              );})}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold">Recent Activity</h3>
              <p className="text-xs text-foreground/40 mt-1">Last 5 detection sessions</p>
            </div>
            <Link to="/history" className="text-xs font-bold text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No detections yet.</p>
            )}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-4 py-3">
                <div className="size-10 rounded-lg bg-background border border-border flex items-center justify-center text-xl">{EMOTION_EMOJI[r.emotion]}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{EMOTION_LABELS[r.emotion]} detected</p>
                  <p className="text-xs text-foreground/40">{fmtAgo(r.timestamp)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-primary">{(r.confidence * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-foreground/40 font-mono uppercase">Confidence</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
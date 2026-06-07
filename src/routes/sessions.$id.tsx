import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { useEffect, useMemo, useState } from "react";
import {
  getSessions,
  getDetections,
  EMOTION_LABELS,
  EMOTION_EMOJI,
  type Detection,
  type Session,
  type EmotionKey,
} from "../lib/emotionStore";
import { exportPDF, exportExcel, exportCSV } from "../lib/emotionExport";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ArrowLeft, FileText, FileSpreadsheet, Download } from "lucide-react";

export const Route = createFileRoute("/sessions/$id")({
  head: () => ({
    meta: [
      { title: "Session Details — EmotiSense" },
      { name: "description", content: "Detailed emotion timeline and AI summary for a single detection session." },
    ],
  }),
  component: SessionDetail,
});

const COLORS: Record<EmotionKey, string> = {
  happy: "oklch(0.7 0.18 145)",
  sad: "oklch(0.6 0.15 250)",
  angry: "oklch(0.6 0.22 25)",
  surprised: "oklch(0.78 0.18 75)",
  neutral: "oklch(0.6 0.02 270)",
  fearful: "oklch(0.55 0.18 300)",
  disgusted: "oklch(0.6 0.15 145)",
};

function buildSummary(session: Session, distPct: Record<string, number>) {
  const dom = session.dominant ? EMOTION_LABELS[session.dominant] : "neutral";
  const happyPct = distPct["happy"] ?? 0;
  const sadPct = distPct["sad"] ?? 0;
  const angryPct = distPct["angry"] ?? 0;
  const stability = 100 - Math.min(100, Math.abs(happyPct - sadPct) + angryPct);
  let line: string;
  if (happyPct > 50) {
    line = `During this session the user displayed mostly positive emotional patterns with a ${stability > 70 ? "stable" : "varied"} mood profile.`;
  } else if (sadPct + angryPct > 50) {
    line = `Session shows elevated negative signals. Dominant: ${dom}. Consider a short reset before the next session.`;
  } else {
    line = `A balanced emotional session — ${dom} dominated, but the overall profile stayed even.`;
  }
  return { summary: line, stability: Math.round(stability) };
}

function SessionDetail() {
  const { id } = useParams({ from: "/sessions/$id" });
  const [session, setSession] = useState<Session | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);

  useEffect(() => {
    const ses = getSessions().find((s) => s.id === id) ?? null;
    setSession(ses);
    setDetections(getDetections().filter((d) => d.sessionId === id));
  }, [id]);

  const distPct = useMemo(() => {
    const out: Record<string, number> = {};
    if (!detections.length) return out;
    const total = detections.length;
    const counts: Record<string, number> = {};
    for (const d of detections) counts[d.emotion] = (counts[d.emotion] ?? 0) + 1;
    for (const k of Object.keys(counts)) out[k] = +((counts[k] / total) * 100).toFixed(1);
    return out;
  }, [detections]);

  const pieData = useMemo(
    () => (Object.keys(EMOTION_LABELS) as EmotionKey[])
      .map((k) => ({ name: EMOTION_LABELS[k], value: distPct[k] ?? 0, key: k }))
      .filter((d) => d.value > 0),
    [distPct],
  );

  const timeline = useMemo(() => {
    if (!detections.length || !session) return [] as { t: string; confidence: number }[];
    return detections.map((d, i) => ({
      t: `${Math.round((d.timestamp - session.startedAt) / 1000)}s`,
      confidence: +(d.confidence * 100).toFixed(1),
      i,
    }));
  }, [detections, session]);

  if (!session) {
    return (
      <AppShell title="Session Details">
        <div className="p-12 rounded-2xl bg-surface border border-border text-center">
          <p className="font-semibold mb-2">Session not found</p>
          <p className="text-sm text-muted-foreground mb-4">It may have been deleted.</p>
          <Link to="/sessions" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold">
            Back to Sessions
          </Link>
        </div>
      </AppShell>
    );
  }

  const summary = buildSummary(session, distPct);

  return (
    <AppShell title="Session Details">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/sessions" className="size-10 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-muted">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-[10px] font-mono text-primary uppercase tracking-widest">{session.id}</p>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {new Date(session.startedAt).toLocaleString()}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-3 h-10 bg-surface border border-border rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-muted">
              <Download className="size-4" /> CSV
            </button>
            <button onClick={exportExcel} className="px-3 h-10 bg-surface border border-border rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-muted">
              <FileSpreadsheet className="size-4" /> Excel
            </button>
            <button onClick={() => exportPDF(session)} className="px-3 h-10 bg-primary text-primary-foreground rounded-lg text-sm font-bold flex items-center gap-2">
              <FileText className="size-4" /> PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Duration", value: `${session.durationSec}s` },
            { label: "Detections", value: session.detections.toString() },
            { label: "Avg Confidence", value: `${(session.avgConfidence * 100).toFixed(1)}%` },
            { label: "Stability", value: `${summary.stability}%` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border shadow-soft">
              <p className="text-[10px] font-mono uppercase text-muted-foreground">{s.label}</p>
              <p className="text-xl font-extrabold mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-surface to-secondary/10 border border-border">
          <p className="text-[10px] font-mono uppercase text-primary tracking-widest mb-2">AI Summary</p>
          <p className="text-base leading-relaxed">{summary.summary}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Emotion Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentage breakdown for this session</p>
            <div className="h-64">
              {pieData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No data</p>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {pieData.map((d) => (
                        <Cell key={d.key} fill={COLORS[d.key as EmotionKey]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(Object.keys(EMOTION_LABELS) as EmotionKey[]).map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <div className="size-2 rounded-full" style={{ background: COLORS[k] }} />
                  <span>{EMOTION_EMOJI[k]} {EMOTION_LABELS[k]}</span>
                  <span className="ml-auto font-mono text-muted-foreground">{distPct[k] ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Confidence Timeline</h3>
            <p className="text-xs text-muted-foreground mb-4">Confidence per detection over session time</p>
            <div className="h-72">
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No data</p>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.5 0.02 270 / 0.1)" />
                    <XAxis dataKey="t" stroke="oklch(0.5 0.02 270 / 0.5)" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="oklch(0.5 0.02 270 / 0.5)" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="confidence" stroke="oklch(0.55 0.22 285)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
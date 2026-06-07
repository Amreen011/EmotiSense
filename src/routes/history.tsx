import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { Search, Filter, Download, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getDetections,
  EMOTION_LABELS,
  EMOTION_EMOJI,
  clearAll,
  type Detection,
  type EmotionKey,
} from "../lib/emotionStore";
import { exportCSV, exportExcel, exportPDF } from "../lib/emotionExport";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — EmotiSense" },
      { name: "description", content: "Browse and filter your complete emotion detection history." },
    ],
  }),
  component: History,
});

const COLOR: Record<EmotionKey, string> = {
  happy: "oklch(0.65 0.2 275)",
  sad: "oklch(0.6 0.15 250)",
  angry: "oklch(0.65 0.24 25)",
  surprised: "oklch(0.78 0.18 75)",
  neutral: "oklch(0.6 0.02 270)",
  fearful: "oklch(0.55 0.18 300)",
  disgusted: "oklch(0.6 0.15 145)",
};

function History() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<EmotionKey | null>(null);
  const [records, setRecords] = useState<Detection[]>([]);

  useEffect(() => {
    setRecords(getDetections().slice().reverse());
  }, []);

  const filtered = records.filter(
    (r) =>
      (!filter || r.emotion === filter) &&
      (!q ||
        r.emotion.toLowerCase().includes(q.toLowerCase()) ||
        r.sessionId.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <AppShell title="Detection History">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-surface border border-border flex-1 min-w-[240px]">
            <Search className="size-4 text-foreground/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by emotion or session ID…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-foreground/30"
            />
          </div>
          <div className="flex gap-1 p-1 bg-surface border border-border rounded-lg">
            <button onClick={() => setFilter(null)} className={`px-3 py-1.5 text-xs font-bold rounded ${!filter ? "bg-primary text-primary-foreground" : "text-foreground/50"}`}>All</button>
            {(Object.keys(EMOTION_LABELS) as EmotionKey[]).map((e) => (
              <button key={e} onClick={() => setFilter(e)} className={`px-3 py-1.5 text-xs font-bold rounded ${filter === e ? "bg-primary text-primary-foreground" : "text-foreground/50"}`}>
                {EMOTION_EMOJI[e]}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="px-4 h-10 bg-surface border border-border text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-muted">
            <Download className="size-4" /> CSV
          </button>
          <button onClick={exportExcel} className="px-4 h-10 bg-surface border border-border text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-muted">
            <FileSpreadsheet className="size-4" /> Excel
          </button>
          <button onClick={() => exportPDF()} className="px-4 h-10 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-2">
            <FileText className="size-4" /> PDF
          </button>
          <button
            onClick={() => {
              if (confirm("Clear all detection history?")) {
                clearAll();
                setRecords([]);
              }
            }}
            className="px-3 h-10 bg-surface border border-border text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-destructive/10 text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-surface border border-border overflow-hidden">
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No detections yet. Start a live detection session to record data.
            </div>
          )}
          {filtered.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 border-b border-border">
                <th className="text-left p-4 font-medium">Preview</th>
                <th className="text-left p-4 font-medium">Emotion</th>
                <th className="text-left p-4 font-medium">Confidence</th>
                <th className="text-left p-4 font-medium">Session</th>
                <th className="text-left p-4 font-medium">Timestamp</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 200).map((r) => {
                const color = COLOR[r.emotion];
                const label = EMOTION_LABELS[r.emotion];
                const emoji = EMOTION_EMOJI[r.emotion];
                const pct = (r.confidence * 100).toFixed(1);
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="size-12 rounded-lg bg-background border border-border flex items-center justify-center text-2xl" style={{ borderColor: color + "30" }}>
                        {emoji}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: color + "20", color }}>
                        {label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-background rounded-full overflow-hidden">
                          <div className="h-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="text-xs font-mono">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono text-foreground/60">{r.sessionId}</td>
                    <td className="p-4 text-xs text-foreground/60">{new Date(r.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button className="text-xs font-bold text-primary hover:underline">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-foreground/50">
          <span>Showing {filtered.length} of {records.length} records</span>
          <span className="flex items-center gap-1"><Filter className="size-3" /> Persisted in browser</span>
        </div>
      </div>
    </AppShell>
  );
}
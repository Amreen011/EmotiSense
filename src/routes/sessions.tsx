import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { useEffect, useState } from "react";
import {
  getSessions,
  EMOTION_LABELS,
  EMOTION_EMOJI,
  type Session,
} from "../lib/emotionStore";
import { exportPDF } from "../lib/emotionExport";
import { FileText, Trash2, ChevronRight, Clock, Activity } from "lucide-react";

export const Route = createFileRoute("/sessions")({
  head: () => ({
    meta: [
      { title: "Session History — EmotiSense" },
      { name: "description", content: "Review every past detection session with duration, dominant emotion, and export options." },
    ],
  }),
  component: Sessions,
});

const SES_KEY = "emotisense.sessions.v1";

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(getSessions().slice().reverse());
  }, []);

  const deleteSession = (id: string) => {
    if (!confirm("Delete this session?")) return;
    const remaining = getSessions().filter((s) => s.id !== id);
    localStorage.setItem(SES_KEY, JSON.stringify(remaining));
    setSessions(remaining.slice().reverse());
  };

  return (
    <AppShell title="Session History">
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">All Sessions</h2>
            <p className="text-sm text-muted-foreground">
              {sessions.length} session{sessions.length === 1 ? "" : "s"} stored locally — available even after the camera closes.
            </p>
          </div>
        </div>

        {sessions.length === 0 && (
          <div className="p-16 rounded-2xl bg-surface border border-border text-center">
            <Activity className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold mb-1">No sessions yet</p>
            <p className="text-sm text-muted-foreground mb-4">Run a live detection session to see it appear here.</p>
            <Link to="/detection" className="inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm">
              Start Detection
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((s, i) => {
            const num = sessions.length - i;
            const date = new Date(s.startedAt);
            return (
              <div key={s.id} className="p-6 rounded-2xl bg-surface border border-border shadow-soft flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-primary uppercase tracking-widest">Session #{num}</p>
                    <p className="font-bold text-lg mt-1">{date.toLocaleDateString(undefined, { dateStyle: "medium" } as any)}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.id}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl">{s.dominant ? EMOTION_EMOJI[s.dominant] : "·"}</div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground mt-1">
                      {s.dominant ? EMOTION_LABELS[s.dominant] : "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-background">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Duration</p>
                    <p className="text-sm font-bold mt-0.5">{fmtDuration(s.durationSec)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Avg Conf</p>
                    <p className="text-sm font-bold mt-0.5">{(s.avgConfidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-background">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Detections</p>
                    <p className="text-sm font-bold mt-0.5">{s.detections}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <span>{new Date(s.startedAt).toLocaleTimeString()} — {new Date(s.endedAt).toLocaleTimeString()}</span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Link
                    to="/sessions/$id"
                    params={{ id: s.id }}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90"
                  >
                    View Details <ChevronRight className="size-3" />
                  </Link>
                  <button
                    onClick={() => exportPDF(s)}
                    className="px-3 py-2 bg-surface border border-border rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-muted"
                    title="Export PDF"
                  >
                    <FileText className="size-3" /> PDF
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="px-2.5 py-2 bg-surface border border-border rounded-lg text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
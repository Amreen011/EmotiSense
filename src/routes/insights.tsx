import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { Sparkles, Heart, Brain, MessageCircle, Send, TrendingUp, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chatWithCompanion } from "../lib/api/companion.functions";
import { getDetections, summarize, EMOTION_LABELS } from "../lib/emotionStore";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — EmotiSense" },
      { name: "description", content: "Personalized AI-generated emotional wellness insights and recommendations." },
    ],
  }),
  component: Insights,
});

function Insights() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text:
        "Hi, I'm EmotiScan Companion. I'm here to listen and talk through whatever is on your mind — work, stress, relationships, sleep, motivation, or just how your day has been.\n\nThere's no rush and no judgment here. What would you like to talk about right now?",
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = msg.trim();
    if (!text || sending) return;
    setError(null);
    const next = [...chat, { role: "user" as const, text }];
    setChat(next);
    setMsg("");
    setSending(true);
    try {
      // Build emotion context from recent detections (last 20)
      let emotionContext: string | undefined;
      try {
        const recent = getDetections().slice(-20);
        if (recent.length > 0) {
          const s = summarize(recent);
          const dom = s.dominant as keyof typeof EMOTION_LABELS;
          emotionContext = `dominant recent emotion: ${EMOTION_LABELS[dom] ?? dom} (avg confidence ${(s.avgConfidence * 100).toFixed(0)}%)`;
        }
      } catch {
        // ignore
      }

      const res = await chatWithCompanion({
        data: {
          messages: next.map((m) => ({
            role: m.role,
            content: m.text,
          })),
          emotionContext,
        },
      });
      setChat((c) => [...c, { role: "assistant", text: res.reply }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : "Something went wrong.";
      setError(m);
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="AI Insights">
      <div className="space-y-6">
        {/* Top summary */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-8 rounded-2xl bg-surface border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-primary" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">AI-Generated Summary · This Week</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-pretty">
                Your emotional baseline is <span className="text-primary">stable and positive</span>, with brief stress peaks midweek.
              </h2>
              <p className="text-foreground/60 leading-relaxed mb-6">
                Across 142 sessions this week, your dominant emotion was <strong className="text-foreground">happiness</strong> (62%).
                Wednesday afternoons consistently show elevated <strong className="text-foreground">stress markers</strong> — consider scheduling buffer time before meetings.
              </p>
              <div className="flex gap-2 flex-wrap">
                {["Stable mood", "+12% vs last week", "Low risk", "Above average"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Smart Alert</span>
            </div>
            <p className="text-sm font-semibold mb-2">Prolonged stress detected</p>
            <p className="text-xs text-foreground/60 leading-relaxed mb-4">
              Stress signals lasted over 40 minutes during your last session. We recommend a short mindfulness break.
            </p>
            <button className="w-full py-2 bg-primary/15 text-primary text-xs font-bold rounded-lg hover:bg-primary/20">
              Start 4-min reset
            </button>
          </div>
        </div>

        {/* Patterns + Recommendations */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="font-bold">Emotional Patterns</h3>
            </div>
            <div className="space-y-4">
              {[
                { title: "Morning brightness", desc: "Your happiness peaks between 9-11 AM. Schedule important work then." },
                { title: "Wednesday slump", desc: "Stress consistently rises midweek. Consider lighter Wednesday schedules." },
                { title: "Weekend recovery", desc: "Mood scores rebound +28% by Saturday. Protect your weekend rituals." },
              ].map((p) => (
                <div key={p.title} className="flex gap-3 p-3 rounded-lg bg-background border border-border">
                  <div className="size-1.5 bg-primary rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold mb-1">{p.title}</p>
                    <p className="text-xs text-foreground/60 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="size-4 text-secondary" />
              <h3 className="font-bold">Wellness Recommendations</h3>
            </div>
            <div className="space-y-3">
              {[
                { emoji: "🧘", title: "Daily 5-min mindfulness", meta: "3x this week" },
                { emoji: "🚶", title: "Walk during lunch break", meta: "Improves PM mood" },
                { emoji: "📵", title: "Phone-free mornings", meta: "Reduces AM anxiety" },
                { emoji: "💧", title: "Hydration reminders", meta: "Every 90 min" },
              ].map((r) => (
                <div key={r.title} className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border">
                  <div className="size-10 rounded-lg bg-secondary/10 flex items-center justify-center text-xl">{r.emoji}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-[10px] font-mono text-foreground/40 uppercase">{r.meta}</p>
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Chat */}
        <div className="p-6 rounded-2xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="size-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold">EmotiScan Companion</h3>
              <p className="text-[10px] font-mono text-foreground/40 uppercase">AI · Emotion-aware</p>
            </div>
          </div>

          <div ref={scrollRef} className="space-y-4 mb-4 max-h-[28rem] overflow-y-auto pr-1">
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-lg shrink-0 ${m.role === "user" ? "bg-gradient-to-br from-primary to-secondary" : "bg-surface border border-border flex items-center justify-center"}`}>
                  {m.role === "assistant" && <Brain className="size-4 text-primary" />}
                </div>
                <div className={`max-w-md px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border border-border"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="size-8 rounded-lg shrink-0 bg-surface border border-border flex items-center justify-center">
                  <Brain className="size-4 text-primary animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl text-sm bg-background border border-border text-foreground/60">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <div className="text-xs text-red-500 px-2">{error}</div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border">
            <MessageCircle className="size-4 text-foreground/40 ml-2" />
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={sending ? "Companion is typing…" : "Share what's on your mind…"}
              disabled={sending}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/30"
            />
            <button
              type="submit"
              disabled={sending || !msg.trim()}
              className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
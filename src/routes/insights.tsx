import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { Sparkles, Heart, Brain, MessageCircle, Send, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

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
  const [chat, setChat] = useState([
    { role: "ai", text: "Hi 👋 I've reviewed your last 7 days of detection sessions. Your overall mood has been bright. How are you feeling right now?" },
    { role: "user", text: "A bit overwhelmed today actually." },
    { role: "ai", text: "I noticed elevated stress signals earlier. Try a 4-minute breathing reset — I can also pause notifications for the next hour. Want me to do that?" },
  ]);

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
              <h3 className="font-bold">EmotiSense Companion</h3>
              <p className="text-[10px] font-mono text-foreground/40 uppercase">AI · Emotion-aware</p>
            </div>
          </div>

          <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`size-8 rounded-lg shrink-0 ${m.role === "user" ? "bg-gradient-to-br from-primary to-secondary" : "bg-surface border border-border flex items-center justify-center"}`}>
                  {m.role === "ai" && <Brain className="size-4 text-primary" />}
                </div>
                <div className={`max-w-md px-4 py-3 rounded-2xl text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border border-border"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!msg.trim()) return;
              setChat((c) => [...c, { role: "user", text: msg }, { role: "ai", text: "I hear you — let's unpack that. Tell me what's been on your mind most." }]);
              setMsg("");
            }}
            className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border"
          >
            <MessageCircle className="size-4 text-foreground/40 ml-2" />
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Talk to your emotion-aware AI companion…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/30"
            />
            <button type="submit" className="size-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90">
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
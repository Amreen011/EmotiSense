import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Brain,
  Camera,
  ChartBar,
  Cpu,
  Database,
  Eye,
  LineChart,
  Mic,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EmotiSense — Real-Time Emotion Detection AI" },
      { name: "description", content: "Understand human emotions through artificial intelligence. Real-time facial emotion detection powered by deep learning." },
      { property: "og:title", content: "EmotiSense — Real-Time Emotion Detection AI" },
      { property: "og:description", content: "Understand human emotions through artificial intelligence. Real-time facial emotion detection powered by deep learning." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded flex items-center justify-center">
              <div className="size-4 border-2 border-white rounded-full opacity-80" />
            </div>
            <span className="font-extrabold tracking-tighter text-xl uppercase">EmotiSense</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/60">
            <a href="#features" className="hover:text-primary transition-colors">Platform</a>
            <a href="#tech" className="hover:text-primary transition-colors">Technology</a>
            <a href="#about" className="hover:text-primary transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-foreground/70 hover:text-foreground hidden sm:inline">
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-foreground text-background text-sm font-bold rounded-md hover:bg-foreground/90 transition-all"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="glow-orb absolute top-20 left-1/4 size-[500px] bg-primary/20 blur-[120px] rounded-full" />
          <div className="glow-orb absolute bottom-0 right-1/4 size-[400px] bg-secondary/15 blur-[100px] rounded-full" style={{ animationDelay: "-4s" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              SYSTEMS ONLINE: v4.2.0-STABLE
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter mb-6 text-pretty">
              Understand Human{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Emotions
              </span>{" "}
              Through AI
            </h1>
            <p className="text-lg text-foreground/60 mb-10 max-w-[50ch] leading-relaxed">
              Real-time emotional intelligence powered by Convolutional Neural Networks trained on the FER-2013 dataset.
              Decode joy, sadness, surprise, fear and more in milliseconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/detection"
                className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                Start Detection
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-surface border border-border font-bold rounded-lg hover:bg-white/5 transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>

          {/* Live Preview */}
          <div className="relative aspect-square w-full max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 bg-surface rounded-2xl border border-border overflow-hidden ring-1 ring-white/5 shadow-2xl">
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative">
                {/* Wireframe face */}
                <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-30">
                  <ellipse cx="200" cy="200" rx="110" ry="140" stroke="oklch(0.65 0.2 275)" strokeWidth="1" fill="none" />
                  {Array.from({ length: 30 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={120 + Math.random() * 160}
                      cy={80 + Math.random() * 240}
                      r="2"
                      fill="oklch(0.65 0.2 275)"
                    />
                  ))}
                  <circle cx="160" cy="170" r="8" stroke="oklch(0.65 0.22 310)" strokeWidth="1" fill="none" />
                  <circle cx="240" cy="170" r="8" stroke="oklch(0.65 0.22 310)" strokeWidth="1" fill="none" />
                  <path d="M 160 250 Q 200 280 240 250" stroke="oklch(0.65 0.22 310)" strokeWidth="1" fill="none" />
                </svg>
              </div>

              <div className="absolute inset-0 pointer-events-none">
                <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent shadow-[0_0_15px_oklch(0.65_0.2_275)]" />

                <div className="absolute top-1/4 left-1/3 w-32 h-40 border border-primary/40 rounded-sm">
                  <div className="absolute -top-1 -left-1 size-2 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1 -right-1 size-2 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1 -left-1 size-2 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1 -right-1 size-2 border-b-2 border-r-2 border-primary" />
                  <span className="absolute top-0 right-0 translate-x-full pl-2 font-mono text-[10px] text-primary whitespace-nowrap">
                    ID: SUBJECT_082
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-background/70 backdrop-blur-xl border border-white/5">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-mono text-foreground/40 uppercase mb-1">Detected State</p>
                      <p className="text-2xl font-bold text-primary tracking-tight">Sincere Happiness 😊</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-foreground/40 uppercase mb-1">Confidence</p>
                      <p className="text-xl font-mono text-foreground/80">98.4%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "HAPPY", value: 98, color: "bg-primary" },
                      { label: "NEUTRAL", value: 2, color: "bg-white/30" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3">
                        <span className="w-14 text-[10px] font-mono text-foreground/40">{row.label}</span>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${row.color}`} style={{ width: `${row.value}%`, animation: "bar-grow 1.5s ease-out forwards", ["--final-width" as never]: `${row.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">Core Capabilities</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">A complete emotional intelligence stack</h2>
            <p className="text-foreground/60">From real-time webcam detection to long-term mood archiving — everything you need for production deployment.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: "Real-Time Detection", desc: "Live webcam streams with bounding-box tracking and confidence scoring.", meta: "12ms latency", color: "primary" },
              { icon: Brain, title: "CNN Engine", desc: "Deep convolutional network trained on FER-2013 across 7 distinct emotion classes.", meta: "99.2% accuracy", color: "secondary" },
              { icon: Mic, title: "Voice Emotion", desc: "Combine facial and vocal cues for multi-modal sentiment classification.", meta: "Beta", color: "emerald" },
              { icon: Users, title: "Multi-Person Detection", desc: "Track multiple subjects in a single frame with individual emotion labels.", meta: "Up to 12", color: "primary" },
              { icon: LineChart, title: "Mood Archiving", desc: "Historical trend analytics, weekly summaries and monthly reports.", meta: "Infinite retention", color: "secondary" },
              { icon: Sparkles, title: "AI Insights", desc: "Generative wellness recommendations grounded in your emotional patterns.", meta: "GPT-powered", color: "emerald" },
            ].map((f) => (
              <div key={f.title} className="p-8 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-colors">
                <div className={`size-12 rounded-xl flex items-center justify-center mb-6 ${
                  f.color === "primary" ? "bg-primary/10 text-primary" :
                  f.color === "secondary" ? "bg-secondary/10 text-secondary" :
                  "bg-emerald-500/10 text-emerald-400"
                }`}>
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed mb-6">{f.desc}</p>
                <div className="pt-4 border-t border-border flex items-center justify-between font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
                  <span>Metric</span>
                  <span className={
                    f.color === "primary" ? "text-primary" :
                    f.color === "secondary" ? "text-secondary" :
                    "text-emerald-400"
                  }>{f.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-24 border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div>
            <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">Infrastructure</p>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Built on production-grade AI infrastructure</h2>
            <p className="text-foreground/60 text-sm">React, Tailwind, FastAPI, TensorFlow, and MongoDB — orchestrated for low-latency emotional inference at scale.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { tag: "Frontend", items: ["React", "Tailwind", "Framer"] },
              { tag: "Backend", items: ["FastAPI", "Python 3.11"] },
              { tag: "AI Core", items: ["TensorFlow", "Keras", "OpenCV"] },
              { tag: "Data", items: ["MongoDB", "FER-2013"] },
            ].map((g) => (
              <div key={g.tag} className="space-y-3 p-5 rounded-xl bg-surface border border-border">
                <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">{g.tag}</div>
                {g.items.map((i) => (
                  <div key={i} className="text-sm font-semibold">{i}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-3">About EmotiSense</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-6">
            An AI-powered emotion analysis platform
          </h2>
          <p className="text-foreground/60 leading-relaxed text-lg">
            EmotiSense helps users understand emotional patterns through real-time facial
            and voice recognition. Powered by computer vision and deep learning, it turns
            everyday expressions into meaningful insights — privately, on your device.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
            <div className="relative">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Ready to read the room?</h2>
              <p className="text-foreground/60 mb-8 max-w-md mx-auto">Launch your first emotion detection session in under 60 seconds.</p>
              <Link
                to="/detection"
                className="inline-block px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all"
              >
                Start Detection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary/20 rounded flex items-center justify-center">
              <div className="size-3 border border-primary rounded-full" />
            </div>
            <span className="font-bold tracking-tighter uppercase text-sm">EmotiSense</span>
          </div>
          <div className="flex gap-6 text-xs font-mono text-foreground/40">
            <a href="#" className="hover:text-foreground transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-foreground transition-colors">TERMS</a>
            <a href="#" className="hover:text-foreground transition-colors">DOCS</a>
            <a href="#" className="hover:text-foreground transition-colors">STATUS</a>
          </div>
          <p className="text-xs text-foreground/40 font-mono">© 2026 EMOTISENSE LABS</p>
        </div>
      </footer>
    </div>
  );
}

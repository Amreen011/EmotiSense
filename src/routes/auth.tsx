import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — EmotiSense" },
      { name: "description", content: "Sign in to your EmotiSense account to access real-time emotion detection." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border bg-surface/40">
        <div className="glow-orb absolute top-20 left-1/4 size-[400px] bg-primary/30 blur-[120px] rounded-full" />
        <div className="glow-orb absolute bottom-20 right-1/4 size-[300px] bg-secondary/20 blur-[100px] rounded-full" style={{ animationDelay: "-4s" }} />
        <div className="relative z-10 m-auto p-12 max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="size-8 bg-primary rounded flex items-center justify-center">
              <div className="size-4 border-2 border-white rounded-full opacity-80" />
            </div>
            <span className="font-extrabold tracking-tighter text-xl uppercase">EmotiSense</span>
          </Link>
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-4">Neural Engine v4.2</p>
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-pretty">
            Decode emotions in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">real-time</span>.
          </h2>
          <p className="text-foreground/60 leading-relaxed">
            Join 12,000+ researchers and developers building the next generation of emotionally intelligent applications.
          </p>

          <div className="mt-12 p-5 rounded-xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-foreground/40 tracking-widest">Live System Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">2.4M</div>
                <div className="text-[10px] text-foreground/40 font-mono uppercase">Faces/day</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">99.2%</div>
                <div className="text-[10px] text-foreground/40 font-mono uppercase">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">12ms</div>
                <div className="text-[10px] text-foreground/40 font-mono uppercase">Latency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-8 bg-primary rounded" />
              <span className="font-extrabold tracking-tighter text-xl uppercase">EmotiSense</span>
            </Link>
          </div>

          <div className="flex gap-1 p-1 bg-surface border border-border rounded-lg mb-8 w-fit">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-foreground/60 mb-8">
            {mode === "login" ? "Sign in to continue to your dashboard." : "Get started with EmotiSense in seconds."}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/dashboard" });
            }}
            className="space-y-4"
          >
            {mode === "signup" && (
              <Field label="Full name" type="text" placeholder="Your name" />
            )}
            <Field icon={<Mail className="size-4" />} label="Email" type="email" placeholder="you@lab.ai" />
            <Field icon={<Lock className="size-4" />} label="Password" type="password" placeholder="••••••••" />

            {mode === "login" && (
              <div className="flex justify-between items-center text-xs">
                <label className="flex items-center gap-2 text-foreground/60">
                  <input type="checkbox" className="accent-primary" /> Remember me
                </label>
                <a href="#" className="text-primary hover:underline">Forgot password?</a>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight className="size-4" />
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="w-full h-12 bg-surface border border-border font-semibold rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-foreground/40 mt-8">
            By continuing you agree to our <a className="underline">Terms</a> & <a className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, icon }: { label: string; type: string; placeholder: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground/70 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 px-3 h-12 rounded-lg bg-surface border border-border focus-within:border-primary/50 transition-colors">
        {icon && <span className="text-foreground/40">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/30"
        />
      </div>
    </div>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell";
import { Download, FileSpreadsheet } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — EmotiSense" },
      { name: "description", content: "Visualize your emotion detection patterns with rich analytics." },
    ],
  }),
  component: Analytics,
});

const COLORS = ["oklch(0.65 0.2 275)", "oklch(0.65 0.22 310)", "oklch(0.78 0.18 75)", "oklch(0.65 0.24 25)", "oklch(0.75 0.18 180)", "oklch(0.55 0.18 300)", "oklch(0.6 0.15 145)"];
const pieData = [
  { name: "Happy", value: 42 },
  { name: "Neutral", value: 24 },
  { name: "Surprise", value: 12 },
  { name: "Sad", value: 9 },
  { name: "Angry", value: 6 },
  { name: "Fear", value: 4 },
  { name: "Disgust", value: 3 },
];
const weekly = [
  { day: "Mon", happy: 65, sad: 12, angry: 8, surprise: 15 },
  { day: "Tue", happy: 72, sad: 8, angry: 5, surprise: 15 },
  { day: "Wed", happy: 58, sad: 22, angry: 12, surprise: 8 },
  { day: "Thu", happy: 80, sad: 5, angry: 3, surprise: 12 },
  { day: "Fri", happy: 75, sad: 10, angry: 6, surprise: 9 },
  { day: "Sat", happy: 88, sad: 3, angry: 2, surprise: 7 },
  { day: "Sun", happy: 82, sad: 6, angry: 4, surprise: 8 },
];
const accuracy = Array.from({ length: 12 }).map((_, i) => ({
  m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  acc: 92 + Math.random() * 7,
}));

function Analytics() {
  return (
    <AppShell title="Analytics">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Emotion Analytics</h2>
            <p className="text-sm text-foreground/50">Detailed reports across all your detection sessions</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface border border-border text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-white/5">
              <FileSpreadsheet className="size-4" /> Export Excel
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-2">
              <Download className="size-4" /> Download PDF
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Emotion Distribution</h3>
            <p className="text-xs text-foreground/40 mb-4">All-time breakdown</p>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} stroke="oklch(0.13 0.02 270)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="size-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-foreground/70">{d.name}</span>
                  <span className="font-mono text-foreground/40 ml-auto">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Weekly Trend</h3>
            <p className="text-xs text-foreground/40 mb-4">Emotion intensity by day</p>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="day" stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <YAxis stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="happy" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="surprise" stackId="a" fill={COLORS[2]} />
                  <Bar dataKey="sad" stackId="a" fill={COLORS[1]} />
                  <Bar dataKey="angry" stackId="a" fill={COLORS[3]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Detection Accuracy</h3>
            <p className="text-xs text-foreground/40 mb-4">Monthly model performance</p>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={accuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="m" stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <YAxis domain={[88, 100]} stroke="oklch(1 0 0 / 0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "oklch(0.18 0.025 270)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="acc" stroke="oklch(0.65 0.2 275)" strokeWidth={2} dot={{ fill: "oklch(0.65 0.2 275)", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="font-bold mb-1">Frequency Heatmap</h3>
            <p className="text-xs text-foreground/40 mb-4">Emotions by hour of day</p>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 7 * 12 }).map((_, i) => {
                const v = Math.random();
                return (
                  <div key={i} className="aspect-square rounded-sm" style={{ background: `oklch(0.65 0.2 275 / ${v})` }} title={`${(v*100).toFixed(0)}%`} />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-foreground/40 uppercase">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                  <div key={v} className="size-3 rounded-sm" style={{ background: `oklch(0.65 0.2 275 / ${v})` }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
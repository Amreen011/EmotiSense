import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import {
  getDetections,
  getSessions,
  summarize,
  EMOTION_LABELS,
  type Session,
} from "./emotionStore";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV() {
  const rows = [["Timestamp", "Session", "Emotion", "Confidence"]];
  for (const d of getDetections()) {
    rows.push([
      new Date(d.timestamp).toISOString(),
      d.sessionId,
      EMOTION_LABELS[d.emotion] ?? d.emotion,
      (d.confidence * 100).toFixed(2) + "%",
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  download(new Blob([csv], { type: "text/csv" }), `emotisense-detections-${Date.now()}.csv`);
}

export function exportExcel() {
  const wb = XLSX.utils.book_new();
  const detRows = getDetections().map((d) => ({
    Timestamp: new Date(d.timestamp).toLocaleString(),
    Session: d.sessionId,
    Emotion: EMOTION_LABELS[d.emotion] ?? d.emotion,
    Confidence: +(d.confidence * 100).toFixed(2),
  }));
  const sesRows = getSessions().map((s) => ({
    Session: s.id,
    Start: new Date(s.startedAt).toLocaleString(),
    End: new Date(s.endedAt).toLocaleString(),
    DurationSec: s.durationSec,
    Detections: s.detections,
    Dominant: s.dominant ? EMOTION_LABELS[s.dominant] : "—",
    AvgConfidence: +(s.avgConfidence * 100).toFixed(2),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detRows), "Detections");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sesRows), "Sessions");
  XLSX.writeFile(wb, `emotisense-report-${Date.now()}.xlsx`);
}

export function exportPDF(session?: Session) {
  const doc = new jsPDF();
  const sessions = getSessions();
  const target = session ?? sessions[sessions.length - 1];
  const detections = getDetections();
  const overall = summarize(detections);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("EmotiSense Report", 20, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

  let y = 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Overall Statistics", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total detections: ${detections.length}`, 20, y); y += 6;
  doc.text(`Total sessions: ${sessions.length}`, 20, y); y += 6;
  doc.text(`Dominant emotion: ${overall.dominant ? EMOTION_LABELS[overall.dominant] : "—"}`, 20, y); y += 6;
  doc.text(`Average confidence: ${(overall.avgConfidence * 100).toFixed(1)}%`, 20, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Emotion Distribution", 20, y); y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const total = detections.length || 1;
  for (const k of Object.keys(EMOTION_LABELS) as (keyof typeof EMOTION_LABELS)[]) {
    const count = overall.distribution[k] ?? 0;
    const pct = ((count / total) * 100).toFixed(1);
    doc.text(`${EMOTION_LABELS[k].padEnd(10, " ")}  ${pct}%  (${count})`, 20, y);
    y += 6;
  }

  if (target) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Latest Session: ${target.id}`, 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Date: ${new Date(target.startedAt).toLocaleString()}`, 20, y); y += 6;
    doc.text(`Duration: ${target.durationSec}s`, 20, y); y += 6;
    doc.text(`Detections: ${target.detections}`, 20, y); y += 6;
    doc.text(`Dominant: ${target.dominant ? EMOTION_LABELS[target.dominant] : "—"}`, 20, y); y += 6;
    doc.text(`Avg confidence: ${(target.avgConfidence * 100).toFixed(1)}%`, 20, y); y += 6;
  }

  doc.save(`emotisense-report-${Date.now()}.pdf`);
}
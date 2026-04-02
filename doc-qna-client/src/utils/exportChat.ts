import jsPDF from "jspdf";
import type { ChatBubble } from "../types";

export const exportAsMarkdown = (
  messages: ChatBubble[],
  documentName: string,
): void => {
  const lines = [
    `# DocQnA Chat Export`,
    `**Document:** ${documentName}`,
    `**Exported:** ${new Date().toLocaleDateString("en-IN")}`,
    ``,
    `---`,
    ``,
  ];

  messages.forEach((msg) => {
    if (msg.type === "user") {
      lines.push(`## 🙋 You`);
      lines.push(msg.content);
      lines.push("");
    } else {
      lines.push(`## 🤖 DocQnA`);
      if (msg.answerSource === "ai_fallback") {
        lines.push("> ⚠️ Answer from AI general knowledge");
        lines.push("");
      }
      lines.push(msg.content);
      if (msg.sources && msg.sources.length > 0) {
        lines.push("");
        lines.push(`*Sources: ${msg.sources.length} document chunk(s) used*`);
      }
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  });

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `docqna-chat-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportAsPDF = (
  messages: ChatBubble[],
  documentName: string,
): void => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - 2 * margin;
  let y = margin;

  const checkPage = (needed = 10) => {
    if (y + needed > 275) {
      pdf.addPage();
      y = margin;
    }
  };

  // Title
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(31, 78, 121);
  pdf.text("DocQnA Chat Export", margin, y);
  y += 8;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Document: ${documentName}`, margin, y);
  y += 5;
  pdf.text(`Exported: ${new Date().toLocaleDateString("en-IN")}`, margin, y);
  y += 8;

  pdf.setDrawColor(46, 117, 182);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  messages.forEach((msg) => {
    checkPage(20);

    if (msg.type === "user") {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 78, 121);
      pdf.text("You:", margin, y);
      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      const lines = pdf.splitTextToSize(msg.content, contentW);
      checkPage(lines.length * 5 + 8);
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 6;
    } else {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(46, 117, 182);
      pdf.text("DocQnA:", margin, y);
      y += 5;

      if (msg.answerSource === "ai_fallback") {
        pdf.setFontSize(8);
        pdf.setTextColor(200, 100, 0);
        pdf.text("⚠️ AI general knowledge answer", margin, y);
        y += 5;
      }

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);
      const lines = pdf.splitTextToSize(msg.content, contentW);
      checkPage(lines.length * 5 + 8);
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 4;

      if (msg.sources && msg.sources.length > 0) {
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`Sources: ${msg.sources.length} chunk(s) used`, margin, y);
        y += 5;
      }

      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.2);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;
    }
  });

  pdf.save(`docqna-chat-${Date.now()}.pdf`);
};

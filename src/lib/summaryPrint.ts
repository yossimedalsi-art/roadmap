import { buildSessionSummary, type SummarySession } from "./sessionSummary";

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

// Print a separate document: screen overflow, fixed overlays and nested page breaks
// cannot clip the shared summary or push its contents onto an empty page.
export function summaryPrintHtml(session: SummarySession) {
  const summary = buildSessionSummary(session);
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>סיכום המפגש · מצפן הלב</title><style>
    @page { size: A4; margin: 15mm; } * { box-sizing: border-box; }
    body { color: #172838; background: white; font: 14px/1.7 Arial, sans-serif; max-width: 760px; margin: auto; }
    h1 { font-size: 25px; } h2 { font-size: 18px; margin: 0 0 8px; } p { margin: 8px 0; white-space: pre-wrap; }
    section { border: 1px solid #aabfcd; border-radius: 12px; padding: 16px; margin: 16px 0; }
    h2, h3 { break-after: avoid; } li { break-inside: avoid; } ol { padding-right: 25px; } small { color: #385668; }
  </style></head><body><small>מצפן הלב · מ.ס.ע</small><h1>מה אני לוקח מהמפגש</h1>
    <section><h2>${summary.patternConfirmed ? "הדפוס שביררנו יחד" : "הדפוס לבדיקה"}</h2><strong>${escape(summary.pattern?.title || "הבירור עדיין פתוח")}</strong>
    ${summary.pattern ? `<p>${escape(summary.pattern.description)}</p>` : ""}
    ${summary.resourceName ? `<p>כוח לתמיכה: ${escape(summary.resourceName)}</p>` : ""}</section>
    <section><h2>המעגל שביררנו</h2><ol>${summary.loop.map((part) => `<li><strong>${escape(part.label)}:</strong> ${escape(part.value || "נשאר פתוח לבירור")}</li>`).join("")}</ol>
    <h2>מה לקחנו להמשך</h2><p>${escape(summary.reflection)}</p>${summary.takeaway ? `<h3>במילים שלך</h3><p>${escape(summary.takeaway)}</p>` : ""}</section>
    <section><small>${escape(summary.practice.purpose)}</small><h2>התרגול שלי לשבוע · ${escape(summary.practice.title)}</h2><p>${escape(summary.homework)}</p><p><strong>למפגש הבא:</strong> ${escape(summary.practice.review)}</p></section>
  </body></html>`;
}

export function printSessionSummary(session: SummarySession) {
  document.getElementById("session-summary-print")?.remove();
  const frame = document.createElement("iframe");
  frame.id = "session-summary-print";
  frame.title = "סיכום המפגש להדפסה";
  frame.setAttribute("aria-hidden", "true");
  // Keep a real layout surface: display:none can produce an empty PDF.
  frame.style.cssText =
    "position:fixed;left:0;top:0;width:min(800px,100vw);height:1120px;border:0;opacity:0;pointer-events:none;z-index:-1;";
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  };
  frame.srcdoc = summaryPrintHtml(session);
  document.body.appendChild(frame);
}

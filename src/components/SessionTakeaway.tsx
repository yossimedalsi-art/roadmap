import { useState } from "react";
import { mechanisms } from "../data/mechanisms";
import {
  buildSessionSummary,
  type SummarySession,
} from "../lib/sessionSummary";

export default function SessionTakeaway({
  session,
  audience,
  onSave,
  saving = false,
}: {
  session: SummarySession;
  audience: "coach" | "participant";
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
  saving?: boolean;
}) {
  const summary = buildSessionSummary(session);
  const [taskDraft, setTaskDraft] = useState<string | null>(null);
  const [takeawayDraft, setTakeawayDraft] = useState<string | null>(null);
  const [patternDraft, setPatternDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const disabled = busy || saving;
  async function persist(patch: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const saved = await onSave(patch);
      if (!saved) setError("השינוי לא נשמר. נסו שוב לפני סגירת המפגש.");
      return saved;
    } catch {
      setError("השינוי לא נשמר. נסו שוב לפני סגירת המפגש.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="session-takeaway space-y-5" aria-label="סיכום משותף לשבוע">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <p className="text-sm text-teal-200">
          {summary.status === "completed"
            ? "המפגש הסתיים · הסיכום מתעדכן בשני המסכים"
            : "סוגרים יחד · הסיכום מתעדכן בשני המסכים"}
        </p>
        <div>
          <h2 className="text-lg font-bold mb-2">
            {summary.patternConfirmed ? "הדפוס שביררנו יחד" : "הדפוס לבדיקה"}
          </h2>
          <p className="text-2xl font-bold">
            {summary.pattern?.title || "הבירור עדיין פתוח"}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {summary.pattern?.description ||
              "לא סוכם שם של דפוס. אפשר להמשיך לעבוד עם המעגל שמיפינו."}
          </p>
          {!summary.patternConfirmed && summary.pattern && (
            <p className="text-sm text-amber-200 mt-2">
              כיוון שנבחר לבדיקה; טרם סוכם יחד.
            </p>
          )}
        </div>
        {audience === "coach" && (
          <div className="print:hidden border-t border-white/10 pt-4">
            <label className="block text-sm mb-2" htmlFor="summary-pattern">
              איזה דפוס סיכמתם יחד?
            </label>
            <select
              id="summary-pattern"
              className="hc-input w-full"
              value={patternDraft ?? summary.pattern?.id ?? ""}
              onChange={(e) => setPatternDraft(e.target.value)}
            >
              <option value="">עדיין לא סוכם דפוס</option>
              {mechanisms.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button
              className="hc-button mt-3"
              disabled={disabled}
              onClick={async () => {
                if (
                  await persist({
                    "answers.summary_pattern_id":
                      patternDraft ?? summary.pattern?.id ?? "",
                  })
                )
                  setPatternDraft(null);
              }}
            >
              שמירת הדפוס שסיכמנו
            </button>
          </div>
        )}
        {summary.resourceName && (
          <p>
            <span className="text-slate-400">כוח לתמיכה: </span>
            <strong>{summary.resourceName}</strong>
          </p>
        )}
        {summary.afterIntensity != null && (
          <p className="text-sm text-slate-300">
            עוצמה בסיום: {summary.afterIntensity} מתוך 10 · מידע לשיחה
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold mb-4">המעגל שביררנו</h2>
        <ol className="grid sm:grid-cols-2 gap-3">
          {summary.loop.map((part, index) => (
            <li
              key={part.id}
              className="rounded-xl border border-white/10 bg-black/10 p-4"
            >
              <p className="text-xs text-teal-300 mb-2">
                {index + 1} · {part.label}
              </p>
              <p className="text-sm leading-6 whitespace-pre-wrap">
                {part.value || (
                  <span className="text-slate-400">נשאר פתוח לבירור</span>
                )}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="font-bold mb-2">מה לקחנו להמשך</h3>
          <p className="leading-7">{summary.reflection}</p>
          {summary.takeaway && (
            <div className="mt-3">
              <p className="text-sm text-teal-200">במילים שלך</p>
              <p className="leading-7 whitespace-pre-wrap">
                {summary.takeaway}
              </p>
            </div>
          )}
        </div>
        <div className="print:hidden">
          {takeawayDraft === null ? (
            <button
              className="hc-button-secondary mt-4"
              disabled={disabled}
              onClick={() => setTakeawayDraft(summary.takeaway || "")}
            >
              אפשר להוסיף משהו שחשוב לי לזכור
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block" htmlFor={`takeaway-${audience}`}>
                מה התבהר לך או מה תרצה לזכור?
              </label>
              <textarea
                id={`takeaway-${audience}`}
                className="hc-input w-full"
                rows={3}
                value={takeawayDraft}
                onChange={(e) => setTakeawayDraft(e.target.value)}
              />
              <button
                className="hc-button"
                disabled={disabled}
                onClick={async () => {
                  if (
                    await persist({
                      "answers.session_takeaway": takeawayDraft.trim(),
                    })
                  )
                    setTakeawayDraft(null);
                }}
              >
                שמירת התוספת
              </button>
              <button
                className="hc-button-secondary mr-3"
                disabled={disabled}
                onClick={() => setTakeawayDraft(null)}
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="rounded-2xl border border-teal-300/30 bg-teal-300/5 p-6">
        <p className="text-sm text-teal-200 mb-2">{summary.practice.purpose}</p>
        <h2 className="text-xl font-bold mb-2">
          התרגול שלי לשבוע · {summary.practice.title}
        </h2>
        <p
          className="whitespace-pre-wrap leading-8 text-teal-100"
          role="status"
        >
          {summary.homework}
        </p>
        <p className="text-sm text-slate-300 mt-4">
          <strong>למפגש הבא: </strong>
          {summary.practice.review}
        </p>
        <div className="print:hidden mt-4">
          {taskDraft === null ? (
            <button
              disabled={disabled}
              className="hc-button-secondary"
              onClick={() => setTaskDraft(summary.homework)}
            >
              התאמת התרגול, אם צריך
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block" htmlFor={`task-${audience}`}>
                אפשר להתאים את הגודל, המצב או התמיכה
              </label>
              <textarea
                id={`task-${audience}`}
                className="hc-input w-full"
                rows={4}
                value={taskDraft}
                onChange={(e) => setTaskDraft(e.target.value)}
              />
              <button
                className="hc-button"
                disabled={disabled || !taskDraft.trim()}
                onClick={async () => {
                  if (
                    await persist({
                      "answers.homework_proposal": taskDraft.trim(),
                      "answers.homework_proposal_id": crypto.randomUUID(),
                    })
                  )
                    setTaskDraft(null);
                }}
              >
                שמירת התרגול המעודכן
              </button>
              <button
                className="hc-button-secondary mr-3"
                disabled={disabled}
                onClick={() => setTaskDraft(null)}
              >
                ביטול
              </button>
              {summary.proposal && (
                <button
                  className="block underline text-sm"
                  disabled={disabled}
                  onClick={async () => {
                    if (
                      await persist({
                        "answers.homework_proposal": "",
                        "answers.homework": "",
                        "answers.homework_proposal_id": crypto.randomUUID(),
                      })
                    )
                      setTaskDraft(null);
                  }}
                >
                  חזרה לתרגול המותאם לשלב
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      {error && (
        <p role="alert" className="text-red-200 print:hidden">
          {error}
        </p>
      )}
    </div>
  );
}

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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
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
    <div className="space-y-5" aria-label="סיכום משותף לשבוע">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <p className="text-sm text-teal-200">
          {summary.status === "completed"
            ? "המפגש הסתיים · הסיכום מתעדכן בשני המסכים"
            : "סוגרים יחד · הבחירה עדיין פתוחה"}
        </p>
        <div>
          <h2 className="text-lg font-bold mb-2">
            {summary.patternConfirmed ? "הדפוס שביררנו יחד" : "הדפוס לבדיקה"}
          </h2>
          <p className="text-2xl font-bold">
            {summary.pattern?.title || "עוד לא סוכם דפוס"}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {summary.pattern?.description ||
              "המנחה יכול לבחור כאן שם מתוך מפת הדפוסים אחרי הבירור המשותף."}
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
              onChange={(event) => setPatternDraft(event.target.value)}
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
        {summary.choice && (
          <p>
            <span className="text-slate-400">מה מתאים כרגע: </span>
            {summary.choice}
          </p>
        )}
        {summary.afterIntensity != null && (
          <p className="text-sm text-slate-300">
            עוצמה בסיום: {summary.afterIntensity} מתוך 10 · מידע לשיחה
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-teal-300/20 bg-teal-300/5 p-6">
        <h2 className="text-xl font-bold mb-3">המשימה שלי לשבוע הקרוב</h2>
        {summary.homework ? (
          <p
            className="whitespace-pre-wrap leading-7 text-teal-100"
            role="status"
          >
            {summary.homework}
          </p>
        ) : (
          <p className="text-slate-300">עוד לא סוכמה משימה לשבוע.</p>
        )}
        {!summary.homework && summary.taskSuggestion && (
          <div className="mt-4 border border-white/10 rounded-xl p-4">
            <p className="text-xs text-amber-200 mb-2">
              הצעה להתאמה יחד · עדיין לא משימה שסוכמה
            </p>
            <p className="leading-7">{summary.taskSuggestion}</p>
          </div>
        )}
        {!summary.homework && summary.action && (
          <p className="mt-4 text-sm text-slate-300">
            כיוון שהצעת במפגש: {summary.action}
          </p>
        )}
        <div className="print:hidden">
          {!editing ? (
            <button
              disabled={disabled}
              className="hc-button mt-4"
              onClick={() => {
                setDraft(
                  summary.noTask
                    ? ""
                    : summary.homework ||
                        summary.taskSuggestion ||
                        summary.action ||
                        "",
                );
                setEditing(true);
              }}
            >
              {summary.homework ? "דיוק המשימה לשבוע" : "ננסח משימה שמתאימה לי"}
            </button>
          ) : (
            <div className="mt-4">
              <label
                htmlFor={`weekly-task-${audience}`}
                className="block text-sm mb-2"
              >
                מה אעשה או אשים לב אליו, באילו רגעים וכמה פעמים השבוע?
              </label>
              <textarea
                id={`weekly-task-${audience}`}
                className="hc-input w-full"
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  disabled={disabled || !draft.trim()}
                  className="hc-button"
                  onClick={async () => {
                    if (await persist({ "answers.homework": draft.trim() }))
                      setEditing(false);
                  }}
                >
                  שמירת המשימה שסיכמנו
                </button>
                <button
                  disabled={disabled}
                  className="hc-button-secondary"
                  onClick={() => setEditing(false)}
                >
                  ביטול העריכה
                </button>
              </div>
            </div>
          )}
          <button
            className="block text-sm underline mt-4 text-slate-300"
            disabled={disabled}
            onClick={async () => {
              if (
                await persist({
                  "answers.homework": "בינתיים בלי משימה — נברר יחד במפגש הבא",
                })
              )
                setEditing(false);
            }}
          >
            בינתיים בלי משימה
          </button>
        </div>
        {!summary.noTask && summary.homework && (
          <p className="text-sm text-slate-300 mt-4">
            למפגש הבא: הביאו רגע אחד שבו ניסיתם, מה עזר ומה תרצו לדייק. גם
            ניסיון קטן הוא מידע על המסוגלות שלכם.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-200 print:hidden">
          {error}
        </p>
      )}
    </div>
  );
}

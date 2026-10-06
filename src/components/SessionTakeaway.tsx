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
  const participant = audience === "participant";
  const [editingReflection, setEditingReflection] = useState(false);
  const [takeawayDraft, setTakeawayDraft] = useState("");
  const [consequenceDraft, setConsequenceDraft] = useState("");
  const [resultMeaningDraft, setResultMeaningDraft] = useState("");
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
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-bold mb-2">המעגל שביררנו</h2>
        <p className="text-sm text-slate-400 mb-4">
          האירוע, המשמעות והתגובה — ומה קרה אחר כך. פרטים שלא נאמרו נשארים
          פתוחים.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                  <span className="text-slate-500">לא תועד במפגש</span>
                )}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-5 border-t border-white/10 pt-4">
          <h3 className="font-bold mb-2">מה אני לוקח מהמפגש</h3>
          <p className="leading-7 whitespace-pre-wrap">
            {summary.takeaway ||
              "עוד לא ניסחנו במילים שלך מה הבנת או מה תרצה לזכור."}
          </p>
        </div>
        {!editingReflection ? (
          <button
            className="hc-button-secondary mt-4 print:hidden"
            disabled={disabled}
            onClick={() => {
              setTakeawayDraft(summary.takeaway || "");
              setConsequenceDraft(session.answers?.loop_consequence || "");
              setResultMeaningDraft(session.answers?.loop_result_meaning || "");
              setEditingReflection(true);
            }}
          >
            {participant ? "אדייק את הסיכום במילים שלי" : "השלמת הסיכום יחד"}
          </button>
        ) : (
          <div className="mt-5 space-y-4 print:hidden">
            <label className="block text-sm">
              מה קרה מיד אחרי התגובה שלך?
              <textarea
                className="hc-input w-full mt-2"
                rows={2}
                value={consequenceDraft}
                onChange={(event) => setConsequenceDraft(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              מה חשבת בעקבות התוצאה, אם בכלל?
              <textarea
                className="hc-input w-full mt-2"
                rows={2}
                value={resultMeaningDraft}
                onChange={(event) => setResultMeaningDraft(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              מה הבנת או מה תרצה לזכור מהמפגש?
              <textarea
                className="hc-input w-full mt-2"
                rows={3}
                value={takeawayDraft}
                onChange={(event) => setTakeawayDraft(event.target.value)}
              />
            </label>
            <p className="text-xs text-slate-400">
              אפשר להשאיר שדה פתוח. אלה המילים שלכם, בלי צורך להמציא מסקנה.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="hc-button"
                disabled={disabled}
                onClick={async () => {
                  if (
                    await persist({
                      "answers.loop_consequence": consequenceDraft.trim(),
                      "answers.loop_result_meaning": resultMeaningDraft.trim(),
                      "answers.session_takeaway": takeawayDraft.trim(),
                    })
                  )
                    setEditingReflection(false);
                }}
              >
                שמירת הסיכום
              </button>
              <button
                className="hc-button-secondary"
                disabled={disabled}
                onClick={() => setEditingReflection(false)}
              >
                ביטול העריכה
              </button>
            </div>
          </div>
        )}
      </section>
      <div className="rounded-2xl border border-teal-300/20 bg-teal-300/5 p-6">
        <h2 className="text-xl font-bold mb-3">
          {summary.homeworkApproved
            ? "המשימה שבחרתי לשבוע"
            : "בחירה לשבוע הקרוב"}
        </h2>
        {summary.homework ? (
          <p
            className="whitespace-pre-wrap leading-7 text-teal-100"
            role="status"
          >
            {summary.homework}
          </p>
        ) : summary.noTask ? (
          <p role="status" className="text-slate-300">
            בחרתי לסיים בינתיים בלי משימה.
          </p>
        ) : (
          <p className="text-slate-300">עוד לא סוכמה משימה לשבוע.</p>
        )}
        {summary.homeworkApproved && (
          <p className="text-xs text-teal-200 mt-2">
            נבחרה ואושרה על ידי המשתתף
          </p>
        )}
        {!summary.homework &&
          !summary.noTask &&
          (summary.proposal || summary.taskSuggestion) && (
            <div className="mt-4 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-amber-200 mb-2">
                הצעה בלבד · ממתינה לבחירה ולאישור המשתתף
              </p>
              <p className="leading-7">
                {summary.proposal || summary.taskSuggestion}
              </p>
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
                        summary.proposal ||
                        summary.taskSuggestion ||
                        summary.action ||
                        "",
                );
                setEditing(true);
              }}
            >
              {participant
                ? "אנסח משימה שמתאימה לי"
                : "הצעת משימה או שינוי הניסוח"}
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
                    const text = draft.trim();
                    const version = crypto.randomUUID();
                    const patch: Record<string, unknown> = {
                      "answers.homework_proposal": text,
                      "answers.homework_proposal_id": version,
                    };
                    if (participant)
                      Object.assign(patch, {
                        "answers.homework_approved_text": text,
                        "answers.homework_approved_id": version,
                        "answers.homework_confirmation": "approved",
                      });
                    if (await persist(patch)) setEditing(false);
                  }}
                >
                  {participant
                    ? "זו המשימה שאני בוחר לשבוע"
                    : "שליחת הניסוח כהצעה"}
                </button>
                <button
                  disabled={disabled}
                  className="hc-button-secondary"
                  onClick={() => setEditing(false)}
                >
                  ביטול העריכה
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {participant
                  ? "שמירה בכפתור הבחירה היא אישור שלך למשימה הזאת."
                  : "הניסוח יישאר הצעה עד שהמשתתף יבחר ויאשר במסך שלו."}
              </p>
            </div>
          )}
          {participant &&
            summary.proposal &&
            !summary.homeworkApproved &&
            !editing && (
              <button
                className="hc-button mt-4"
                disabled={disabled}
                onClick={async () => {
                  const version = summary.proposalId || crypto.randomUUID();
                  const patch: Record<string, unknown> = {
                    "answers.homework_approved_text": summary.proposal,
                    "answers.homework_approved_id": version,
                    "answers.homework_confirmation": "approved",
                  };
                  if (!summary.proposalId)
                    Object.assign(patch, {
                      "answers.homework_proposal": summary.proposal,
                      "answers.homework_proposal_id": version,
                    });
                  await persist(patch);
                }}
              >
                המשימה מתאימה לי — אני בוחר בה
              </button>
            )}
          {participant && (
            <button
              className="block text-sm underline mt-4 text-slate-300"
              disabled={disabled}
              onClick={async () => {
                if (
                  await persist({
                    "answers.homework_confirmation": "none",
                    "answers.homework_approved_text": "",
                    "answers.homework_approved_id": summary.proposalId,
                  })
                )
                  setEditing(false);
              }}
            >
              אני בוחר לסיים בינתיים בלי משימה
            </button>
          )}
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

import { useId, useState } from "react";
import { Search, Compass, ChevronDown, Check } from "lucide-react";
import {
  mechanisms,
  searchMechanisms,
  type Mechanism,
} from "../data/mechanisms";

export default function MechanismLibrary({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect?: (mechanism: Mechanism | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputId = useId();
  const [domain, setDomain] = useState("");
  const [emotionGroup, setEmotionGroup] = useState("");
  const domains = [...new Set(mechanisms.map((item) => item.domain))];
  const emotionGroups = [
    ...new Set(
      mechanisms
        .filter((item) => !domain || item.domain === domain)
        .map((item) => item.emotionGroup),
    ),
  ];
  const results = searchMechanisms(query).filter(
    (item) =>
      (!domain || item.domain === domain) &&
      (!emotionGroup || item.emotionGroup === emotionGroup),
  );
  return (
    <section
      className="max-w-6xl mx-auto mb-8 rounded-3xl border border-teal-400/20 bg-gradient-to-bl from-teal-950/40 to-[#171a23] p-5 md:p-8"
      aria-label="ספריית מנגנונים"
    >
      <div className="flex flex-wrap gap-5 items-start justify-between mb-5">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-teal-200">
            <Compass size={22} /> ספריית מנגנונים
          </h2>
          <p className="text-neutral-300 text-sm mt-2 max-w-2xl leading-relaxed">
            חפשו שם מתוך מפת הדפוסים או ביטוי יומיומי. מילים נרדפות עוזרות למצוא
            כיוונים, בלי להוסיף דפוסים למפה. הדמות מציעה כיוון לבירור; המשתתף
            נותן לה משמעות ויכול לבחור אחרת. אפשר להכין מפגש גם לפני בחירת
            משתתף.
          </p>
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={() => onSelect?.(undefined)}
            className="text-sm underline text-teal-200"
          >
            נקה הצעה למפגש
          </button>
        )}
      </div>
      <label htmlFor={inputId} className="block text-sm font-medium mb-2">
        מה תרצו לברר?
      </label>
      <div className="relative">
        <Search
          className="absolute right-4 top-3.5 text-teal-300"
          size={20}
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="למשל: לא מצליח להגיד לא, דוחה משימות, לחץ לפני מבחן"
          className="w-full bg-black/30 rounded-xl border border-white/20 py-3 pr-12 pl-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>
      {domains.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <label className="text-sm text-neutral-300">
            תחום במפת הדפוסים
            <select
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value);
                setEmotionGroup("");
              }}
              className="block w-full mt-2 bg-[#171a23] border border-white/20 rounded-xl p-3 text-white"
            >
              <option value="">כל התחומים</option>
              {domains.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-neutral-300">
            קבוצת רגש במפה
            <select
              value={emotionGroup}
              onChange={(event) => setEmotionGroup(event.target.value)}
              className="block w-full mt-2 bg-[#171a23] border border-white/20 rounded-xl p-3 text-white"
            >
              <option value="">כל הקבוצות</option>
              {emotionGroups.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p
        role="status"
        aria-live="polite"
        className="text-xs text-neutral-400 my-3"
      >
        {results.length === 1 ? "כיוון אחד לבירור" : `${results.length} כיוונים לבירור`} · ההצעה אינה אבחון
      </p>
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-6 text-neutral-300">
          לא נמצא כיוון מתאים. נסו לתאר את המצב במילים אחרות, או התחילו באירוע
          שהמשתתף מביא בלי לבחור מנגנון.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[32rem] overflow-y-auto p-1">
          {results.map((mechanism) => (
            <article
              key={mechanism.id}
              className={`rounded-2xl border p-4 ${selectedId === mechanism.id ? "border-teal-300 bg-teal-400/10" : "border-white/10 bg-black/20"}`}
            >
              <button
                type="button"
                aria-expanded={expanded === mechanism.id}
                onClick={() =>
                  setExpanded(expanded === mechanism.id ? null : mechanism.id)
                }
                className="w-full text-right flex justify-between gap-2 font-bold text-white"
              >
                {mechanism.title}
                <ChevronDown
                  size={18}
                  className={expanded === mechanism.id ? "rotate-180" : ""}
                />
              </button>
              {mechanism.domain && (
                <p className="text-xs text-neutral-400 mt-2">
                  {mechanism.domain} · {mechanism.emotionGroup}
                </p>
              )}
              <p className="text-sm text-neutral-300 leading-relaxed mt-2">
                {mechanism.description}
              </p>
              <p className="text-sm text-teal-200 mt-3">
                {mechanism.openingQuestion}
              </p>
              {expanded === mechanism.id && (
                <div className="mt-4 space-y-3 text-sm text-neutral-300">
                  <p>
                    <strong className="text-white">כוונת הגנה אפשרית: </strong>
                    {mechanism.protectiveIntent}
                  </p>
                  <p>
                    <strong className="text-white">מחיר אפשרי: </strong>
                    {mechanism.possibleCost}
                  </p>
                  <div>
                    <strong className="text-white">אירועים לפתיחת שיחה</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {mechanism.scenarios.map((s) => (
                        <li key={s.id}>{s.title}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-white">שאלות לבירור</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {mechanism.questions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {onSelect && (
                <button
                  type="button"
                  onClick={() => onSelect?.(mechanism)}
                  className="mt-4 w-full flex justify-center items-center gap-2 rounded-lg border border-teal-300/30 text-teal-200 hover:bg-teal-300/10 py-2 text-sm font-bold"
                >
                  {selectedId === mechanism.id ? (
                    <>
                      <Check size={16} /> הצעה נבחרה למפגש
                    </>
                  ) : (
                    "הצע כנקודת פתיחה"
                  )}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

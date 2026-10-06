import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import HeartCompassLogo from "./HeartCompassLogo";

function wasAccepted(key: string, participant: boolean) {
  try {
    return (
      (participant ? sessionStorage : localStorage).getItem(key) === "true"
    );
  } catch {
    return false;
  }
}

export default function ToSGate({
  children,
  participant = false,
}: {
  children: React.ReactNode;
  participant?: boolean;
}) {
  const { pathname } = useLocation();
  const storageKey = participant
    ? "hc-participant-v2:" + pathname
    : "hc-coach-terms-v2";
  return (
    <SessionGate
      key={storageKey}
      storageKey={storageKey}
      participant={participant}
    >
      {children}
    </SessionGate>
  );
}

function SessionGate({
  children,
  storageKey,
  participant,
}: {
  children: React.ReactNode;
  storageKey: string;
  participant: boolean;
}) {
  const [accepted, setAccepted] = useState(() =>
    wasAccepted(storageKey, participant),
  );
  function accept() {
    try {
      (participant ? sessionStorage : localStorage).setItem(storageKey, "true");
    } catch {
      /* Acceptance can remain in memory when browser storage is unavailable. */
    }
    setAccepted(true);
  }
  if (accepted) return children;
  return (
    <main
      className="hc-shell min-h-screen grid place-items-center p-5"
      dir="rtl"
    >
      <section
        className="hc-panel max-w-lg w-full p-7 sm:p-9"
        aria-labelledby="welcome-title"
      >
        <div className="text-amber-200 mb-6">
          <HeartCompassLogo size={42} />
        </div>
        <p className="hc-kicker mb-3">
          {participant ? "לפני שנכנסים למפגש" : "מרחב המנחה"}
        </p>
        <h1 id="welcome-title" className="text-2xl sm:text-3xl font-bold mb-6">
          {participant ? "הקצב והבחירה נשארים שלך." : "עובדים יחד לפי מ.ס.ע."}
        </h1>
        <div className="space-y-5 text-sm sm:text-base text-slate-300 leading-relaxed">
          <p>
            {participant
              ? "המשחק מלווה מפגש עם מנחה. הדמויות מציעות דרך להסתכל על מנגנונים; הן אינן קובעות מי אתם או מה עברתם."
              : "הכלי תומך בליווי אישי. שאלות ודמויות הן הזמנה לבירור, ולא אבחון או תחליף לשיקול דעת מקצועי."}
          </p>
          <p>
            התשובות שנשלחות נשמרות במערכת ומופיעות אצל המנחה. קישור המפגש מעניק
            גישה למידע המשותף בו — שומרים אותו לעצמכם.
          </p>
          <p>
            {participant
              ? "אפשר לומר לא יודע, לבחור לא לענות או לקחת הפסקה. לפני נושא אישי, כדאי להסכים עם המנחה מה נשאר ביניכם ומה עשוי להיות משותף לאחרים."
              : "מגדירים יחד מטרת מפגש, מוכנות, קצב וגבולות שיתוף. מעבר לעומק דורש הסכמה, והשלמת מסכים אינה הוכחה לשינוי."}
          </p>
          <p className="text-xs text-slate-400">
            התוכן והממשק של מצפן הלב מיועדים לשימוש מורשה. אין להעתיק או להפיץ
            לשימוש מסחרי ללא רשות.
          </p>
        </div>
        <button autoFocus className="hc-button w-full mt-8" onClick={accept}>
          {participant ? "הבנתי, אפשר להיכנס" : "קראתי, למרחב המנחה"}
        </button>
        <Link className="hc-link justify-center w-full mt-3" to="/">
          חזרה לדף הבית
        </Link>
      </section>
    </main>
  );
}

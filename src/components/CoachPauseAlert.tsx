import type { GuidedSession, Trainee } from "../lib/sessionTypes";

export default function CoachPauseAlert({
  sessions,
  trainees,
  onOpen,
}: {
  sessions: GuidedSession[];
  trainees: Trainee[];
  onOpen: (sessionId: string) => void;
}) {
  const paused = sessions.filter((session) => session.participantPause);
  if (!paused.length) return null;
  return (
    <section
      role="alert"
      aria-label="בקשות לעצירה"
      className="sticky top-3 z-40 rounded-2xl border-2 border-amber-300 bg-[#38290c] shadow-2xl p-5 mb-6 print:hidden"
      dir="rtl"
    >
      <h2 className="font-bold text-xl text-amber-200 mb-2">
        משתתף ביקש רגע לעצירה
      </h2>
      <p className="text-slate-200 mb-4">
        תנו מקום להפוגה ובדקו יחד מתי ואם מתאים לחזור. ההתראה נשארת עד שהמשתתף
        בוחר לחזור לשיחה.
      </p>
      <ul className="space-y-3">
        {paused.map((session) => (
          <li
            key={session.id}
            className="flex flex-wrap gap-3 items-center justify-between"
          >
            <strong>
              {trainees.find((trainee) => trainee.id === session.traineeId)
                ?.name || "משתתף במפגש שלך"}{" "}
              · כרגע בעצירה
            </strong>
            <button
              className="hc-button-secondary"
              onClick={() => onOpen(session.id)}
            >
              פתיחת המפגש
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

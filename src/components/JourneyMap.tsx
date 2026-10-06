import { Check, Compass, X } from "lucide-react";
import type { JourneyStep } from "../data/journey";
import ParticipantDialog from "./ParticipantDialog";
export default function JourneyMap({
  currentPhase,
  phases,
  onClose,
  resolveTitle = (title) => title,
}: {
  currentPhase: number;
  phases: JourneyStep[];
  onClose: () => void;
  resolveTitle?: (title: string) => string;
}) {
  return (
    <ParticipantDialog labelledBy="map-title" onClose={onClose}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2
          id="map-title"
          className="text-2xl font-bold flex gap-2 items-center"
        >
          <Compass className="text-teal-300 h-6 w-6" />
          מפת המפגש
        </h2>
        <button aria-label="סגירת המפה" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="text-slate-400 text-sm leading-6 mb-5">
        אלה תחנות לשיחה, לא משימות שחייבים להשלים. אפשר לשנות קצב וכיוון עם
        המנחה.
      </p>
      <ol className="space-y-2">
        {phases.map((phase, index) => {
          const current = currentPhase === index + 1;
          const passed = currentPhase > index + 1;
          return (
            <li
              key={phase.id}
              aria-current={current ? "step" : undefined}
              className={`flex items-start gap-3 rounded-xl p-3 border ${current ? "border-teal-300/40 bg-teal-300/10" : "border-white/5"}`}
            >
              <span
                className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs ${passed ? "bg-white/10 text-slate-300" : "bg-teal-300/10 text-teal-200"}`}
              >
                {passed ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div>
                <p className="text-sm leading-6">
                  {resolveTitle(phase.traineeTitle)}
                </p>
                {current && (
                  <p className="text-xs text-teal-300">כאן אנחנו עכשיו</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </ParticipantDialog>
  );
}

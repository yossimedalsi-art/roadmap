import { useState } from "react";
import { Backpack as BackpackIcon, X, Sparkles } from "lucide-react";
import type { Archetype } from "../data/worlds";
import ParticipantDialog from "./ParticipantDialog";
export default function Backpack({
  resourceArchetype,
  onUseResource,
}: {
  resourceArchetype?: Pick<
    Archetype,
    "name" | "description" | "imageUrl"
  > | null;
  onUseResource: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-label="פתיחת המשאבים שלי"
        onClick={() => setOpen(true)}
        className="print:hidden fixed bottom-6 left-5 z-40 rounded-2xl border border-teal-300/30 bg-[#13233a] text-teal-200 shadow-xl px-4 py-3 flex items-center gap-2"
      >
        <BackpackIcon className="w-5 h-5" />
        <span className="text-sm font-bold">המשאבים שלי</span>
      </button>
      {open && (
        <ParticipantDialog
          labelledBy="backpack-title"
          onClose={() => setOpen(false)}
        >
          <div className="flex justify-between items-center mb-5">
            <h2 id="backpack-title" className="text-2xl font-bold">
              המשאבים שלי
            </h2>
            <button aria-label="סגירת המשאבים" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-slate-300 text-sm leading-6 mb-5">
            תזכורת למשהו שכבר קיים בך. אפשר לברר יחד איך להיעזר בו בפועל.
          </p>
          {resourceArchetype ? (
            <div className="rounded-2xl border border-teal-300/20 p-5 bg-teal-300/5">
              {resourceArchetype.imageUrl && (
                <img
                  loading="lazy"
                  src={resourceArchetype.imageUrl}
                  alt=""
                  className="h-40 w-full rounded-xl object-cover mb-4"
                />
              )}
              <h3 className="font-bold text-xl mb-2">
                {resourceArchetype.name}
              </h3>
              <p className="text-slate-300 text-sm leading-6">
                {resourceArchetype.description}
              </p>
              <button
                onClick={() => {
                  setOpen(false);
                  onUseResource();
                }}
                className="mt-5 w-full flex justify-center items-center gap-2 rounded-xl bg-teal-300 text-slate-950 font-bold p-3"
              >
                <Sparkles className="h-4 w-4" />
                איך אוכל להיעזר בו?
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-6">
              <p className="text-slate-300">עדיין לא בחרת משאב במסך.</p>
              <p className="text-sm text-slate-400 mt-2">
                אפשר להתחיל ממשהו שעזר לך בעבר, אדם תומך או יכולת שלך — ולבחור
                עם המנחה בהמשך.
              </p>
            </div>
          )}
        </ParticipantDialog>
      )}
    </>
  );
}

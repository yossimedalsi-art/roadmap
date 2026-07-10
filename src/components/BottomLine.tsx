import { stage3Phases, loopFeedLines } from "../data/journey";

interface BottomLineProps {
  journeyStage: number;
  answers: Record<string, string>;
}

const DASH = "—";

function pick(answers: Record<string, string>, key?: string): string | undefined {
  if (!key) return undefined;
  const value = answers[key];
  return value && value.trim().length > 0 ? value : undefined;
}

// s3_ramp_choice's own choiceConfig labels — read straight from the step
// definition instead of duplicating the strings, so this card can't drift
// out of sync with what the trainee actually saw on the consent-ramp screen.
const s3ChoiceStep = stage3Phases.find((step) => step.id === "s3_ramp_choice");

function resolveBelief(journeyStage: number, answers: Record<string, string>): string {
  if (journeyStage === 1) return pick(answers, "step_2b_touched") ?? DASH;
  if (journeyStage === 2) return pick(answers, "s2_step_2b_touched") ?? DASH;
  if (journeyStage === 3) return pick(answers, "s3_step_2_secondary_gain") ?? DASH;
  if (journeyStage === 4) return pick(answers, "s4_why") ?? DASH;
  return DASH;
}

function resolveGain(journeyStage: number, answers: Record<string, string>): string {
  // Stage 1: step_7_protection ("על מה [ארכיטיפ] מנסה לשמור?") is the
  // protection/secondary-gain-like step. Stage 2 has no equivalent step in
  // its shorter loop (it goes straight from the reaction to the cost) — a
  // deliberate gap in this round's content, so it renders as "—".
  if (journeyStage === 1) return pick(answers, "step_7_protection") ?? DASH;
  if (journeyStage === 2) return DASH;
  if (journeyStage === 3) return pick(answers, "s3_ramp_gain") ?? DASH;
  if (journeyStage === 4) return pick(answers, "s4_step_4_secondary_gain") ?? DASH;
  return DASH;
}

function resolveCost(journeyStage: number, answers: Record<string, string>): string {
  if (journeyStage === 3) return pick(answers, "s3_ramp_price") ?? DASH;
  // Stage 4 (goal map) has no cost-equivalent step in this round's content.
  if (journeyStage === 4) return DASH;
  const reactionKey = journeyStage === 2 ? "s2_step_5_reaction" : "step_5_urge";
  const reaction = pick(answers, reactionKey);
  if (!reaction) return DASH;
  return loopFeedLines[reaction] || reaction;
}

function resolveDecision(journeyStage: number, answers: Record<string, string>): string {
  if (journeyStage === 1) return pick(answers, "step_9b_asimon") ?? DASH;
  if (journeyStage === 2) return pick(answers, "s2_step_8b_asimon") ?? DASH;
  if (journeyStage === 4) return pick(answers, "s4_contract") ?? DASH;
  if (journeyStage === 3) {
    const choice = answers.s3_ramp_choice;
    const consent = pick(answers, "s3_ramp_consent");
    if (choice === "ready") return consent ?? s3ChoiceStep?.choiceConfig?.yes ?? DASH;
    if (choice === "not_yet_1" || choice === "not_yet_final") return s3ChoiceStep?.choiceConfig?.notYet ?? DASH;
    return DASH;
  }
  return DASH;
}

// "השורה התחתונה שלי" (round 6, נספח א'6) — a compact recap card rendered
// above the BlockerCircle at the end of the journey (both TraineeJourney's
// summary and CoachLiveSession's journey-complete panel). Pulls four
// answers straight out of the trainee's saved `answers`, with per-stage
// source mapping since each stage's flow names its steps differently.
// Any answer that's missing — an older session that predates a field, or a
// stage with no equivalent step — renders as "—" instead of guessing.
export default function BottomLine({ journeyStage, answers }: BottomLineProps) {
  const rows = [
    { label: "מה שמפעיל אותי", value: resolveBelief(journeyStage, answers) },
    { label: "מה שהדפוס נותן לי", value: resolveGain(journeyStage, answers) },
    { label: "מה שהוא גובה", value: resolveCost(journeyStage, answers) },
    { label: "ההחלטה שלי", value: resolveDecision(journeyStage, answers) },
  ];

  return (
    <div className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6 print:border-neutral-200 print:bg-transparent" dir="rtl">
      <h3 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
        💡 השורה התחתונה שלי
      </h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-1">{row.label}</dt>
            <dd className="text-white text-sm font-medium leading-snug break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

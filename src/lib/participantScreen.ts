import {
  journeyPhases,
  stage2Phases,
  stage3Phases,
  stage4Phases,
} from "../data/journey";
import { findMechanism } from "../data/mechanisms";
import { worldsData } from "../data/worlds";

type ScreenSession = {
  phase?: number;
  status?: string;
  journeyStage?: number;
  answers?: Record<string, string>;
  mechanismId?: string | null;
  archetype?: string | null;
  environment?: string | null;
  isYouthMode?: boolean;
};

export function sessionPhases(stage = 1) {
  return stage === 4
    ? stage4Phases
    : stage === 3
      ? stage3Phases
      : stage === 2
        ? stage2Phases
        : journeyPhases;
}

// phase is authoritative; legacy screen metadata must never hide the actual screen.
// Only welcome/world share a phase and therefore need an explicit screen marker.
export function resolveParticipantScreen(session?: ScreenSession | null) {
  if (session?.status === "completed") return "summary";
  const phase = session?.phase || 0;
  if (phase === 0)
    return session?.answers?.participant_screen === "world"
      ? "world"
      : "welcome";
  if (phase === 1) return "archetype";
  if (phase === 2) return "event";
  const phases = sessionPhases(session?.journeyStage);
  if (phase > phases.length) return "choice";
  return phases[phase - 1]?.uiType === "meditation" ? "meditation" : "question";
}

export function eventAnswerKey(stage = 1) {
  return sessionPhases(stage).find((step) => step.id.includes("trigger"))!.id;
}

export function eventChoices(session: ScreenSession) {
  const mechanism = findMechanism(session.mechanismId);
  if (mechanism && mechanism.archetypeId === session.archetype)
    return mechanism.scenarios.map((item) => item.title);
  const character = worldsData
    .find((world) => world.id === session.environment)
    ?.archetypes.find((item) => item.id === session.archetype);
  return character
    ? session.isYouthMode
      ? character.youthTriggers || character.triggers
      : character.triggers
    : [];
}

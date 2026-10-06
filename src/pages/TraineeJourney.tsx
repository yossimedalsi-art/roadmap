import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Compass,
  Download,
  Map,
  Pause,
  Shield,
  Sparkles,
} from "lucide-react";
import { useParams } from "react-router-dom";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { worldsData, goodPowersData } from "../data/worlds";
import {
  journeyPhases,
  stage2Phases,
  stage3Phases,
  stage4Phases,
} from "../data/journey";
import { findMechanism } from "../data/mechanisms";
import { chosenAction } from "../lib/journeyAnswers";
import Backpack from "../components/Backpack";
import JourneyMap from "../components/JourneyMap";
import ParticipantDialog from "../components/ParticipantDialog";
import SessionTakeaway from "../components/SessionTakeaway";

export type Session = {
  phase?: number;
  environment?: string | null;
  archetype?: string | null;
  resourceArchetype?: string | null;
  trigger?: string | null;
  answers?: Record<string, string>;
  journeyStage?: number;
  isYouthMode?: boolean;
  mechanismId?: string | null;
  participantPause?: boolean;
  previousAgreement?: string;
  sessionNumber?: number;
  status?: string;
  coachWhisper?: string | null;
  coachInjectedResource?: string | null;
  blockerStrengthBefore?: number | null;
  blockerStrengthAfter?: number | null;
};
const phasesFor = (stage = 1) =>
  stage === 4
    ? stage4Phases
    : stage === 3
      ? stage3Phases
      : stage === 2
        ? stage2Phases
        : journeyPhases;
const phaseNames: Record<number, string> = {
  1: "מיפוי · להכיר את מה שקורה",
  2: "מיפוי · להבין את ההגנה והמחיר",
  3: "סילוק · להרחיב את מרחב הבחירה",
  4: "עצמאות · לנוע לעבר מה שחשוב",
};
const fallbackImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
  if (!event.currentTarget.src.endsWith("/images/guardian.webp"))
    event.currentTarget.src = "/images/guardian.webp";
};

const previewSession: Session = {
  phase: 0,
  journeyStage: 1,
  isYouthMode: true,
  answers: {},
  participantPause: false,
  status: "active",
};

export default function TraineeJourney({
  preview: requestedPreview = false,
  previewSession: suppliedPreviewSession,
  onPreviewSave,
}: {
  preview?: boolean;
  previewSession?: Session;
  onPreviewSave?: (patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const preview = import.meta.env.DEV && requestedPreview;
  const { sessionId } = useParams();
  const [localSession, setSession] = useState<Session | null>(
    preview ? previewSession : null,
  );
  const session =
    preview && suppliedPreviewSession ? suppliedPreviewSession : localSession;
  const [loadError, setLoadError] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [draft, setDraft] = useState("");
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(
    preview ? "preview" : null,
  );
  const [showMap, setShowMap] = useState(false);
  const [showResource, setShowResource] = useState(false);
  const [resourceDraft, setResourceDraft] = useState("");
  const [dismissedWhisper, setDismissedWhisper] = useState<string | null>(null);
  const [dismissedResource, setDismissedResource] = useState<string | null>(
    null,
  );
  const [initialResource, setInitialResource] = useState<string | null>(null);
  const [welcomeReady, setWelcomeReady] = useState(false);
  const [pendingWrite, setPendingWrite] = useState<DocumentData | null>(null);
  const [editingAction, setEditingAction] = useState(false);
  const [actionDraft, setActionDraft] = useState("");
  const sessionRef = useRef<Session | null>(preview ? previewSession : null);
  const loadedSessionIdRef = useRef<string | null>(preview ? "preview" : null);
  const contentRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (preview && suppliedPreviewSession)
      sessionRef.current = suppliedPreviewSession;
  }, [preview, suppliedPreviewSession]);

  useEffect(() => {
    if (preview || !sessionId) return;
    return onSnapshot(
      doc(db, "hc_live_sessions", sessionId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setLoadError(true);
          return;
        }
        const next = snapshot.data() as Session;
        if (loadedSessionIdRef.current !== sessionId) {
          setPendingWrite(null);
          setSyncError(false);
          setDraft("");
          setShowMap(false);
          setShowResource(false);
          setWelcomeReady(false);
          setInitialResource(null);
          setEditingAction(false);
        }
        if (next.phase !== sessionRef.current?.phase) setDraft("");
        loadedSessionIdRef.current = sessionId;
        setLoadedSessionId(sessionId);
        sessionRef.current = next;
        setSession(next);
        setLoadError(false);
      },
      () => setLoadError(true),
    );
  }, [sessionId, retry, preview]);

  useEffect(() => {
    if (session?.participantPause)
      document.querySelectorAll("audio").forEach((player) => player.pause());
  }, [session?.participantPause]);

  // Only user actions write patches. Receiving a coach snapshot never writes it back.
  // Dot paths preserve answers written concurrently by the coach.
  async function save(patch: DocumentData) {
    if (preview && suppliedPreviewSession && onPreviewSave) {
      setSaving(true);
      try {
        return await onPreviewSave(patch);
      } finally {
        setSaving(false);
      }
    }
    if (preview && sessionRef.current) {
      const next: Session = {
        ...sessionRef.current,
        answers: { ...sessionRef.current.answers },
      };
      for (const [key, value] of Object.entries(patch)) {
        if (key.startsWith("answers.")) next.answers![key.slice(8)] = value;
        else Object.assign(next, { [key]: value });
      }
      sessionRef.current = next;
      setSession(next);
      return true;
    }
    if (
      !sessionId ||
      !sessionRef.current ||
      loadedSessionIdRef.current !== sessionId
    )
      return false;
    const writingSessionId = sessionId;
    setSaving(true);
    try {
      await updateDoc(doc(db, "hc_live_sessions", sessionId), patch);
      if (loadedSessionIdRef.current !== writingSessionId) return false;
      setPendingWrite(null);
      setSyncError(false);
      return true;
    } catch {
      if (loadedSessionIdRef.current === writingSessionId) {
        setPendingWrite(patch);
        setSyncError(true);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }
  const answers = session?.answers || {};
  const phase = session?.phase || 0;
  const loaded = session !== null && (preview || loadedSessionId === sessionId);
  useEffect(() => {
    if (loaded) contentRef.current?.focus();
  }, [phase, loaded]);
  const stage = session?.journeyStage || 1;
  const phases = phasesFor(stage);
  const step = phases[phase - 1];
  const world = worldsData.find((item) => item.id === session?.environment);
  const character = world?.archetypes.find(
    (item) => item.id === session?.archetype,
  );
  const resource =
    goodPowersData.find(
      (item) =>
        item.id === session?.resourceArchetype ||
        item.name === session?.resourceArchetype,
    ) ||
    worldsData
      .flatMap((item) => item.archetypes)
      .find((item) => item.id === session?.resourceArchetype);
  const suggestion = findMechanism(session?.mechanismId);
  // A character can represent several patterns. Never infer a pattern from its artwork.
  const mechanism =
    suggestion?.archetypeId === session?.archetype ? suggestion : undefined;
  const answer = step ? answers[step.id] : undefined;
  const replaceTitle = (title: string) =>
    title
      .replace(/\[ארכיטיפ\]/g, character?.name || "הדמות שבחרתי")
      .replace(/\[משאב\]/g, resource?.name || "המשאב שלי")
      .replace(/\[משפט_מטרה\]/g, answers.s4_step_1_what_i_want || "הכיוון שלי")
      .replace(/\[חוזה\]/g, answers.s3_step_9_new_contract || "ההצעה שלי")
      .replace(
        /\[רווח\]/g,
        answers.s3_step_2_secondary_gain || "מה שההגנה מנסה להשיג",
      );
  const writeAnswer = (id: string, value: string, extra: DocumentData = {}) =>
    save({ [`answers.${id}`]: value, ...extra });
  const selectedClass = (selected: boolean) =>
    `rounded-2xl border p-4 text-right transition ${selected ? "border-teal-300 bg-teal-300/10 text-white" : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:bg-white/[0.06]"}`;
  const buttonClass =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-teal-200 disabled:cursor-wait disabled:opacity-40";
  const title = step
    ? replaceTitle(
        session?.isYouthMode && step.youthTraineeTitle
          ? step.youthTraineeTitle
          : step.traineeTitle,
      )
    : "";

  async function next() {
    const nextPhase = phase + 1;
    if (await save({ phase: nextPhase })) {
      setDraft("");
      window.scrollTo(0, 0);
    }
  }
  const actionKey =
    stage === 4
      ? "s4_step_6_action"
      : stage === 3
        ? "s3_step_9_new_contract"
        : stage === 2
          ? "s2_step_8_new_action"
          : "step_9_resource_action";
  const action = chosenAction(answers[actionKey]);
  const complete = phase > phases.length;
  const needsChoice =
    complete && !answers.choice_moment && session?.status !== "completed";
  const finishChoice = (choice: string) =>
    writeAnswer("choice_moment", choice, {
      status: "completed",
      completedAt: serverTimestamp(),
    });

  if (loadError || !session || !loaded)
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#0a1321] text-white grid place-items-center p-6"
      >
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <Compass className="mx-auto mb-5 h-10 w-10 text-teal-300" />
          <h1 className="text-2xl font-bold">
            {loadError ? "לא הצלחנו לפתוח את המפגש" : "מתחברים למפגש שלך"}
          </h1>
          <p className="my-4 text-slate-300">
            {loadError
              ? "אפשר לבדוק את החיבור ואת הקישור עם המנחה. התשובות שלך לא יוחלפו במסע חדש."
              : "עוד רגע נמשיך מהמקום שבו המפגש נמצא."}
          </p>
          {loadError && (
            <button
              className={buttonClass}
              onClick={() => {
                setLoadError(false);
                setRetry((value) => value + 1);
              }}
            >
              ניסיון נוסף
            </button>
          )}
        </div>
      </main>
    );

  return (
    <div
      dir="rtl"
      className="hc-participant min-h-screen bg-[#0a1321] text-slate-100 pb-28 relative"
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%,rgba(45,212,191,.1),transparent 55%),radial-gradient(ellipse at 0% 80%,rgba(129,140,248,.08),transparent 50%)",
        }}
      />
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 border-b border-white/10 print:hidden">
        <div className="flex items-center gap-3">
          <Compass className="h-8 w-8 text-teal-300" />
          <div>
            <span className="block font-bold">מצפן הלב · מ.ס.ע</span>
            <span className="text-xs text-slate-400">
              {phaseNames[stage]} · מפגש עם מנחה
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {phase > 0 && (
            <button
              aria-label="פתיחת מפת המסע"
              onClick={() => setShowMap(true)}
              className="rounded-xl border border-white/15 px-3 py-2 text-sm flex gap-2 items-center"
            >
              <Map className="h-4 w-4" />
              המפה
            </button>
          )}
          <button
            disabled={saving}
            onClick={() => save({ participantPause: true })}
            className="rounded-xl border border-white/15 px-3 py-2 text-sm flex gap-2 items-center"
          >
            <Pause className="h-4 w-4" />
            רגע לעצמי
          </button>
        </div>
      </header>
      {syncError && (
        <div
          role="alert"
          className="relative mx-auto max-w-4xl mt-4 rounded-xl border border-rose-300/30 bg-rose-400/10 p-4 flex flex-wrap gap-3 items-center"
        >
          <span>התשובה האחרונה עדיין לא נשמרה. אפשר להמתין ולנסות שוב.</span>
          <button
            className="underline"
            disabled={saving}
            onClick={() => pendingWrite && save(pendingWrite)}
          >
            שמירה מחדש
          </button>
        </div>
      )}
      <main
        ref={contentRef}
        tabIndex={-1}
        className="relative mx-auto w-full max-w-6xl px-5 pt-8 md:pt-12 outline-none"
      >
        {preview && !suppliedPreviewSession && (
          <div className="mb-6 flex flex-wrap gap-3 items-center rounded-xl border border-amber-300/30 bg-amber-300/5 p-3 text-xs">
            <strong className="text-amber-200">
              תצוגת פיתוח · ללא שמירה או חיבור למנחה
            </strong>
            {[1, 2, 3, 4].map((value) => (
              <button
                key={value}
                onClick={() => {
                  sessionRef.current = {
                    ...previewSession,
                    journeyStage: value,
                  };
                  setSession(sessionRef.current);
                  setWelcomeReady(false);
                  setDraft("");
                }}
                className="underline"
              >
                מסלול {value}
              </button>
            ))}
            {step?.uiType === "meditation" && (
              <button onClick={next} className="underline">
                התקדמות מנחה לדוגמה
              </button>
            )}
          </div>
        )}
        {phase > 0 && !complete && (
          <div className="mb-7 flex items-center gap-4 text-xs text-slate-400">
            <span>
              תחנה {phase} מתוך {phases.length}
            </span>
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div
                className="h-1 rounded-full bg-teal-300 transition-all"
                style={{ width: `${(phase / phases.length) * 100}%` }}
              />
            </div>
            <span>בקצב שלך</span>
          </div>
        )}

        {phase === 0 && (
          <section className="mx-auto max-w-4xl">
            <div className="mb-9 max-w-2xl">
              <p className="mb-3 text-sm text-teal-300">מתחילים בקשר ובבחירה</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                יש מקום למה שמעסיק אותך.
                <br />
                <span className="text-slate-400">ואפשר להתחיל לאט.</span>
              </h1>
              <p className="mt-5 text-slate-300 leading-7">
                זה מפגש משותף עם המנחה. הדמויות מציעות דרך להתבונן במחסומים; הן
                לא אומרות מי אנחנו. תשובות שנשלחות כאן מוצגות למנחה. מותר לא
                לדעת, לשנות ניסוח או לעצור.
              </p>
            </div>
            {session.previousAgreement && (
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs text-slate-400 mb-2">
                  מה שבחרת במפגש הקודם — אפשר לעדכן
                </p>
                <p>{session.previousAgreement}</p>
              </div>
            )}
            <div className="rounded-3xl border border-teal-300/20 bg-teal-300/5 p-6 mb-7">
              <h2 className="font-bold text-xl mb-2">
                מה יכול לעזור לך להיות כאן היום?
              </h2>
              <p className="text-slate-300 text-sm mb-4">
                אפשר לבחור משאב להתחלה. אין צורך להרגיש אותו מיד.
              </p>
              <div className="flex flex-wrap gap-2">
                {goodPowersData.map((power) => (
                  <button
                    key={power.id}
                    aria-pressed={initialResource === power.id}
                    onClick={() => setInitialResource(power.id)}
                    className={`rounded-full px-4 py-2 border text-sm ${initialResource === power.id ? "bg-teal-300/15 border-teal-300" : "border-white/15"}`}
                  >
                    {power.icon} {power.name}
                  </button>
                ))}
              </div>
              <button
                className={`${buttonClass} mt-5`}
                disabled={saving}
                onClick={async () => {
                  if (
                    !initialResource ||
                    (await save({ resourceArchetype: initialResource }))
                  )
                    setWelcomeReady(true);
                }}
              >
                {" "}
                {initialResource ? "זה המשאב שלי להתחלה" : "נבחר יחד בהמשך"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            {welcomeReady && (
              <>
                <h2 className="text-2xl font-bold mb-2">איזה מרחב מתאים לך?</h2>
                <p className="text-slate-400 mb-5">
                  זו בחירה של סגנון, לא אבחון.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {worldsData.map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      onClick={() => save({ environment: item.id, phase: 1 })}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-right hover:border-teal-300/50"
                    >
                      <span className="block text-3xl mb-4">
                        {
                          {
                            clouds: "☁️",
                            forest: "🌿",
                            arcade: "◈",
                            fairies: "✦",
                          }[item.id]
                        }
                      </span>
                      <span className="font-bold">{item.title}</span>
                      {suggestion?.worldId === item.id && (
                        <span className="block text-xs text-teal-300 mt-2">
                          יש כאן הצעה מהמנחה
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {(phase === 1 || phase === 2) && (
          <section>
            <div className="max-w-2xl mb-8">
              <p className="text-sm text-teal-300 mb-3">
                {phase === 1 ? "מחסום אפשרי · לא מי שאני" : "מתחילים ממה שקרה"}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {phase === 1
                  ? "איזו דמות יכולה לייצג את מה שמעכב?"
                  : "איזה אירוע מתאים לברר יחד?"}
              </h1>
              <p className="text-slate-300 leading-7">
                {phase === 1
                  ? "אפשר להתעניין בדמות בלי להסכים לתיאור שלה. המשמעות היא שלך, ונברר יחד מה היא מנסה להשיג ובאיזה מחיר."
                  : "נבחר רגע אחד ונפריד בין מה שנאמר או נעשה לבין המשמעות שניתנה לו."}
              </p>
              {suggestion && (
                <p className="mt-3 text-teal-200 text-sm">
                  המנחה מציע לבדוק: {suggestion.title}. זו הצעה שאפשר לשנות.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-5 mb-5">
              <button
                disabled={saving}
                onClick={() =>
                  save({
                    phase: 0,
                    environment: null,
                    archetype: null,
                    trigger: null,
                  })
                }
                className="text-sm underline text-slate-400"
              >
                בחירת מרחב אחר
              </button>
              <button
                disabled={saving}
                onClick={() =>
                  save({
                    phase: 2,
                    archetype: null,
                    trigger: null,
                    "answers.character_meaning":
                      "לא מצאתי דמות שמתאימה לי — נברר במילים שלי",
                  })
                }
                className="text-sm underline text-teal-200"
              >
                אף דמות לא מתאימה — נתחיל מהאירוע
              </button>
            </div>
            {phase === 1 && (
              <div className="grid gap-4 md:grid-cols-3">
                {world?.archetypes
                  .filter(
                    (item) => !("kind" in item) || item.kind !== "resource",
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      aria-pressed={character?.id === item.id}
                      onClick={() => {
                        setDraft("");
                        save({ archetype: item.id, trigger: null, phase: 2 });
                      }}
                      className={`${selectedClass(character?.id === item.id)} overflow-hidden p-0`}
                    >
                      <img
                        loading="lazy"
                        src={item.imageUrl || "/images/guardian.webp"}
                        onError={fallbackImage}
                        alt=""
                        className="w-full h-44 object-cover"
                      />
                      <div className="p-5">
                        <p className="text-xs text-teal-300 mb-2">
                          {character?.id === item.id
                            ? "הדמות שבחרתי"
                            : "אפשרות להתבוננות"}
                        </p>
                        <h2 className="text-xl font-bold mb-2">{item.name}</h2>
                        <p className="text-sm leading-6 text-slate-300">
                          {session.isYouthMode && item.youthDescription
                            ? item.youthDescription
                            : item.description}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
            {phase === 2 && (
              <div className="mt-7 mx-auto max-w-3xl rounded-3xl border border-white/15 bg-[#111e30] p-6 md:p-8">
                <div className="mb-5 flex items-center gap-4">
                  {character?.imageUrl && (
                    <img
                      src={character.imageUrl}
                      alt=""
                      onError={fallbackImage}
                      className="w-16 h-20 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm text-teal-300">
                      {character?.name || "בחרתי להתבונן בלי דמות"}
                    </p>
                    <button
                      disabled={saving}
                      onClick={() => save({ phase: 1 })}
                      className="mt-2 text-xs text-slate-400 underline"
                    >
                      בחירת דמות אחרת
                    </button>
                  </div>
                </div>
                <p className="text-sm text-teal-300 mb-3">
                  {character
                    ? `${character.name} יכולה להיות דימוי למחסום`
                    : "אפשר להתבונן במחסום גם בלי דמות"}
                </p>
                <h2 className="text-2xl font-bold mb-2">מה קרה במציאות?</h2>
                <p className="text-slate-400 text-sm mb-5">
                  אירוע אחד כפי שקרה. הדוגמאות רק עוזרות להתחיל.
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {(
                    mechanism?.scenarios.map((item) => item.title) ||
                    (character
                      ? session.isYouthMode
                        ? character.youthTriggers || character.triggers
                        : character.triggers
                      : [])
                  ).map((event) => (
                    <button
                      key={event}
                      disabled={saving}
                      aria-pressed={session.trigger === event}
                      className={selectedClass(session.trigger === event)}
                      onClick={() =>
                        save({
                          trigger: event,
                          [`answers.${phases[1].id}`]: event,
                        })
                      }
                    >
                      {event}
                    </button>
                  ))}
                </div>
                <label
                  className="block mt-5 text-sm text-slate-300"
                  htmlFor="event-own"
                >
                  או אירוע במילים שלי
                </label>
                <textarea
                  id="event-own"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="מה נאמר או נעשה? מי היה שם?"
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 p-4"
                />
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    disabled={!draft.trim() || saving}
                    onClick={() =>
                      save({
                        trigger: draft.trim(),
                        [`answers.${phases[1].id}`]: draft.trim(),
                      })
                    }
                    className="rounded-xl border border-white/20 px-4 py-3"
                  >
                    שמירת האירוע שלי
                  </button>
                  <button
                    disabled={!session.trigger || saving}
                    onClick={() => save({ phase: 3 })}
                    className={buttonClass}
                  >
                    נברר יחד
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      save({
                        trigger: "עוד לא ברור לי איזה אירוע מתאים",
                        [`answers.${phases[1].id}`]:
                          "עוד לא ברור לי איזה אירוע מתאים",
                        phase: 3,
                      })
                    }
                    className="text-sm text-slate-400 underline"
                  >
                    עוד לא ברור לי
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {phase >= 3 && !complete && step && (
          <section className="grid lg:grid-cols-[240px_1fr] gap-7">
            <aside className="hidden lg:block">
              <div className="sticky top-6 rounded-3xl border border-white/10 overflow-hidden bg-white/[0.03]">
                {character ? (
                  <img
                    src={character.imageUrl || "/images/guardian.webp"}
                    onError={fallbackImage}
                    alt=""
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="p-7 bg-teal-300/5">
                    <Compass className="h-12 w-12 text-teal-300" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs text-teal-300 mb-2">
                    {character
                      ? "דימוי למחסום · אפשר לשנות את משמעותו"
                      : "התבוננות באירוע · בלי דמות"}
                  </p>
                  <p className="font-bold text-lg">
                    {character?.name || "הרגע שבחרתי"}
                  </p>
                  <p className="text-slate-400 text-sm mt-3 leading-6">
                    {session.trigger}
                  </p>
                  {resource && (
                    <div className="mt-5 pt-4 border-t border-white/10 text-sm">
                      <span className="text-slate-400">המשאב שבחרתי</span>
                      <p className="text-teal-200 mt-1">{resource.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
            <motion.div
              key={step.id}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-white/10 bg-[#111e30]/95 p-6 md:p-9"
            >
              <p className="text-xs text-teal-300 mb-4">
                שאלה אחת · המשמעות שלך
              </p>
              <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-3">
                {title}
              </h1>
              <p className="text-sm text-slate-400 mb-7">
                אין תשובה נכונה. אפשר לבחור ניסוח קרוב ולדייק אותו עם המנחה.
              </p>
              {step.uiType === "meditation" ? (
                <div className="rounded-2xl border border-indigo-300/20 bg-indigo-300/5 p-5">
                  <Shield className="h-8 w-8 text-indigo-200 mb-4" />
                  <h2 className="font-bold text-xl mb-3">
                    רק עם המנחה, ורק כשמתאים לך
                  </h2>
                  <p className="text-slate-300 leading-7">
                    אפשר להשאיר עיניים פתוחות, לדבר בלי דימוי או להישאר
                    בהתבוננות. אין צורך לחפש זיכרון או להרגיש דבר מסוים. אם משהו
                    לא מתאים, נעצור ונחזור לחדר.
                  </p>
                  {answers.meditation_permission ===
                  "מתאים לי להמשיך עם המנחה" ? (
                    <>
                      <p role="status" className="my-5 text-teal-200">
                        המנחה יוביל את הקצב. אפשר לעצור בכל רגע.
                      </p>
                      <details className="my-4">
                        <summary className="cursor-pointer text-sm">
                          מוזיקת רקע לבחירה
                        </summary>
                        <audio
                          controls
                          loop
                          className="w-full mt-3"
                          src="/audio/528hz.mp3"
                        />
                      </details>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        disabled={saving}
                        className={buttonClass}
                        onClick={() =>
                          writeAnswer(
                            "meditation_permission",
                            "מתאים לי להמשיך עם המנחה",
                          )
                        }
                      >
                        מתאים לי להמשיך עם המנחה
                      </button>
                      <button
                        disabled={saving}
                        onClick={() =>
                          writeAnswer(
                            "meditation_permission",
                            "מעדיף להישאר בשיחה",
                            { participantPause: true },
                          )
                        }
                        className="rounded-xl border border-white/20 p-3"
                      >
                        מעדיף להישאר בשיחה
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {step.uiType === "good-powers" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {goodPowersData.map((power) => (
                        <button
                          key={power.id}
                          disabled={saving}
                          aria-pressed={answer === power.name}
                          className={selectedClass(answer === power.name)}
                          onClick={() =>
                            writeAnswer(step.id, power.name, {
                              resourceArchetype: power.id,
                            })
                          }
                        >
                          <span className="text-2xl block mb-2">
                            {power.icon || "✦"}
                          </span>
                          <span className="font-bold block">{power.name}</span>
                          <span className="block text-xs text-slate-400 mt-2 leading-5">
                            {session.isYouthMode && power.youthDescription
                              ? power.youthDescription
                              : power.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {step.uiType === "structured-dialogue" && (
                    <div className="grid gap-3 md:grid-cols-2 mb-5">
                      {((session.isYouthMode ? step.youthOptions : undefined) ||
                        step.options)?.[
                        session.environment as
                          | "clouds"
                          | "forest"
                          | "arcade"
                          | "fairies"
                      ]?.map((option) => (
                        <button
                          key={option}
                          disabled={saving}
                          aria-pressed={answer === option}
                          onClick={() => writeAnswer(step.id, option)}
                          className={selectedClass(answer === option)}
                        >
                          {option}
                          {answer === option && (
                            <Check className="inline-block h-4 w-4 mr-2 text-teal-300" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <label
                    htmlFor="own-answer"
                    className="block text-sm mb-2 text-slate-300"
                  >
                    במילים שלי
                  </label>
                  <textarea
                    id="own-answer"
                    rows={3}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-black/20 p-4 leading-7"
                    placeholder="אפשר לדייק, לשנות או לכתוב משהו אחר לגמרי"
                  />
                  <button
                    disabled={saving || !draft.trim()}
                    onClick={() => writeAnswer(step.id, draft.trim())}
                    className="mt-3 rounded-xl border border-white/20 px-4 py-2 text-sm"
                  >
                    שליחת התשובה למנחה
                  </button>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={saving}
                      onClick={() => writeAnswer(step.id, "עוד לא ברור לי")}
                      className="text-sm text-slate-400 underline"
                    >
                      עוד לא ברור לי
                    </button>
                    <button
                      disabled={saving}
                      onClick={() =>
                        writeAnswer(
                          step.id,
                          "לא עכשיו — מעדיף לדלג בשיחה עם המנחה",
                        )
                      }
                      className="text-sm text-slate-400 underline"
                    >
                      לא עכשיו
                    </button>
                  </div>
                  {answer && (
                    <div
                      role="status"
                      className="mt-6 rounded-xl border border-teal-300/20 bg-teal-300/5 p-4"
                    >
                      <span className="text-xs text-teal-300 block mb-2">
                        התשובה שנשלחה · אפשר לעדכן
                      </span>
                      {answer}
                    </div>
                  )}
                  <div className="flex justify-end mt-7">
                    <button
                      disabled={!answer || saving}
                      className={buttonClass}
                      onClick={next}
                    >
                      ממשיכים בקצב שלי
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </section>
        )}

        {needsChoice && (
          <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#111e30] p-7 md:p-10">
            <p className="text-sm text-teal-300 mb-3">רגע הבחירה · לא מבחן</p>
            <h1 className="text-3xl font-bold mb-4">
              מה מתאים לי לקחת מהמפגש?
            </h1>
            <p className="text-slate-300 leading-7 mb-6">
              המחסום יכול להישאר נוכח. הבחירה שלך אינה צריכה להוכיח שהשתחרר
              משהו.
            </p>
            {action && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
                <p className="text-xs text-slate-400 mb-2">הצעד שהצעת</p>
                <p className="text-xl">{action}</p>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ...(action ? ["רוצה לנסות את הצעד שבחרתי"] : []),
                "בינתיים רוצה רק להתבונן",
                "רוצה לדייק את הצעד עם המנחה",
                "מספיק לי להיום",
              ].map((choice) => (
                <button
                  disabled={saving}
                  className={selectedClass(false)}
                  key={choice}
                  onClick={() => {
                    if (choice === "רוצה לדייק את הצעד עם המנחה") {
                      setEditingAction(true);
                      setActionDraft(action || "");
                    } else finishChoice(choice);
                  }}
                >
                  {choice}
                  <ArrowLeft className="h-4 w-4 mt-3 text-teal-300" />
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-6">
              אפשר לברר יחד: מה מושך אותי בבחירה הזאת, ומה הפחד מנסה למנוע?
            </p>
            {editingAction && (
              <div className="mt-5 rounded-xl border border-white/15 p-4">
                <label htmlFor="action-edit" className="block mb-2 text-sm">
                  הצעד שמתאים לי עכשיו
                </label>
                <textarea
                  id="action-edit"
                  rows={3}
                  className="w-full rounded-xl border border-white/15 bg-black/20 p-3"
                  value={actionDraft}
                  onChange={(event) => setActionDraft(event.target.value)}
                />
                <button
                  disabled={saving || !actionDraft.trim()}
                  className={`${buttonClass} mt-3`}
                  onClick={() =>
                    writeAnswer("choice_moment", "דייקתי את הצעד עם המנחה", {
                      [`answers.${actionKey}`]: actionDraft.trim(),
                      status: "completed",
                      completedAt: serverTimestamp(),
                    })
                  }
                >
                  זה הניסוח שלי להמשך
                </button>
              </div>
            )}
          </section>
        )}

        {complete && !needsChoice && (
          <section className="mx-auto max-w-3xl">
            <div className="flex items-start justify-between gap-4 mb-7">
              <div>
                <p className="text-teal-300 text-sm mb-3">סגירה · במילים שלך</p>
                <h1 className="text-3xl md:text-4xl font-bold">
                  מה אני לוקח מהמפגש
                </h1>
              </div>
              <button
                aria-label="הדפסת סיכום"
                onClick={() => window.print()}
                className="print:hidden rounded-xl border border-white/15 p-3"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
            <SessionTakeaway
              session={session}
              audience="participant"
              onSave={save}
              saving={saving}
            />
            <div className="mt-5 rounded-3xl border border-white/10 p-6 print:hidden">
              <h2 className="font-bold mb-2">איך זה מרגיש עכשיו?</h2>
              <p className="text-sm text-slate-400 mb-4">
                בדיקה לבחירה, לא ציון להצלחה. כל עוצמה היא מידע לשיחה.
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 10 }, (_, index) => index + 1).map(
                  (value) => (
                    <button
                      aria-label={`עוצמה ${value} מתוך 10`}
                      aria-pressed={session.blockerStrengthAfter === value}
                      disabled={saving}
                      key={value}
                      onClick={() => save({ blockerStrengthAfter: value })}
                      className={`w-10 h-10 rounded-xl border ${session.blockerStrengthAfter === value ? "bg-teal-300/15 border-teal-300" : "border-white/15"}`}
                    >
                      {value}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>כמעט לא מורגש</span>
                <span>מורגש מאוד</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              אפשר לסגור את המסך ולסיים יחד עם המנחה. הסיכום נשאר בקישור המפגש.
            </p>
          </section>
        )}
      </main>

      <Backpack
        resourceArchetype={resource}
        onUseResource={() => setShowResource(true)}
      />
      {showMap && (
        <JourneyMap
          currentPhase={phase}
          phases={phases}
          resolveTitle={replaceTitle}
          onClose={() => setShowMap(false)}
        />
      )}
      {session.coachWhisper &&
        session.coachWhisper !== dismissedWhisper &&
        !session.participantPause && (
          <aside
            role="status"
            className="fixed bottom-6 right-5 max-w-sm z-40 rounded-2xl border border-indigo-300/30 bg-[#18243a] p-5 shadow-xl"
          >
            <p className="text-xs text-indigo-200 mb-2">הודעה מהמנחה</p>
            <p>{session.coachWhisper}</p>
            <button
              onClick={() => setDismissedWhisper(session.coachWhisper || null)}
              className="mt-3 text-sm text-indigo-200 underline"
            >
              קראתי
            </button>
          </aside>
        )}
      {session.coachInjectedResource &&
        session.coachInjectedResource !== dismissedResource &&
        !session.participantPause && (
          <aside className="fixed bottom-24 right-5 max-w-sm z-40 rounded-2xl border border-teal-300/30 bg-[#18243a] p-5 shadow-xl">
            <p className="text-xs text-teal-300 mb-2">המנחה מציע משאב</p>
            <p>
              {goodPowersData.find(
                (item) => item.id === session.coachInjectedResource,
              )?.name || "כלי לשיחה"}
            </p>
            <div className="flex gap-3 mt-3">
              <button
                disabled={saving}
                onClick={async () => {
                  if (
                    await save({
                      resourceArchetype: session.coachInjectedResource,
                    })
                  )
                    setDismissedResource(session.coachInjectedResource || null);
                }}
                className="text-sm text-teal-200 underline"
              >
                מתאים לי לצרף
              </button>
              <button
                onClick={() =>
                  setDismissedResource(session.coachInjectedResource || null)
                }
                className="text-sm text-slate-400 underline"
              >
                לא עכשיו
              </button>
            </div>
          </aside>
        )}
      {(session.participantPause || showResource) && (
        <ParticipantDialog
          labelledBy="pause-title"
          onClose={() => {
            if (session.participantPause) save({ participantPause: false });
            setShowResource(false);
          }}
        >
          <Sparkles className="h-8 w-8 text-teal-300 mb-4" />
          <h2 id="pause-title" className="text-2xl font-bold mb-4">
            {session.participantPause
              ? "יש מקום לעצירה"
              : `רגע עם ${resource?.name || "המשאב שלי"}`}
          </h2>
          <p className="text-slate-300 leading-7">
            אפשר להסתכל סביב, להרגיש את המגע של הרגליים ברצפה או לשתות מים. אין
            צורך לשנות את ההרגשה.{" "}
            {session.participantPause
              ? "המנחה רואה שביקשת לעצור; נחליט יחד איך להמשיך."
              : "מתי המשאב הזה כבר עזר לך? מה ממנו מתאים לרגע הזה?"}
          </p>
          {showResource && (
            <>
              <label
                htmlFor="resource-note"
                className="block text-sm mt-5 mb-2"
              >
                איך אוכל להיעזר בו בפועל?
              </label>
              <textarea
                id="resource-note"
                rows={2}
                className="w-full rounded-xl border border-white/15 bg-black/20 p-3"
                value={resourceDraft}
                onChange={(event) => setResourceDraft(event.target.value)}
              />
              {answers.resource_reflection && (
                <p className="mt-3 text-sm text-teal-200">
                  {answers.resource_reflection}
                </p>
              )}
              <button
                disabled={!resourceDraft.trim() || saving}
                onClick={() =>
                  writeAnswer("resource_reflection", resourceDraft.trim())
                }
                className="mt-3 text-sm underline text-teal-200"
              >
                שמירת התזכורת שלי
              </button>
            </>
          )}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              disabled={saving}
              className={buttonClass}
              onClick={async () => {
                if (
                  !session.participantPause ||
                  (await save({ participantPause: false }))
                )
                  setShowResource(false);
              }}
            >
              {session.participantPause ? "מתאים לי לחזור לשיחה" : "חזרה לשאלה"}
            </button>
          </div>
        </ParticipantDialog>
      )}
      <footer className="relative max-w-6xl mx-auto px-5 mt-10 text-xs text-slate-500">
        מצפן הלב · מרחב לבחירה עם מנחה · ערך עצמי אינו ציון במסע
      </footer>
    </div>
  );
}

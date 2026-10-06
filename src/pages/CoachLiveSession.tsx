import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Plus,
  LayoutDashboard,
  FileText,
  Target,
  Ear,
  HeartPulse,
  AlertTriangle,
  XCircle,
  Zap,
  RotateCcw,
  Music,
} from "lucide-react";
import SessionTakeaway from "../components/SessionTakeaway";
import { getCoachInsight } from "../lib/coachInsight";
import HeartCompassLogo from "../components/HeartCompassLogo";
import { worldsData, goodPowersData } from "../data/worlds";
import {
  journeyPhases,
  stage2Phases,
  stage3Phases,
  stage4Phases,
} from "../data/journey";
import { findMechanism } from "../data/mechanisms";
import { useDialogFocus } from "../lib/useDialogFocus";
import type { GuidedSession } from "../lib/sessionTypes";
import { db } from "../lib/firebase";
import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export default function CoachLiveSession({
  sessionId,
  onBack,
  previewSession,
  onPreviewSave,
}: {
  sessionId: string;
  onBack: () => void;
  previewSession?: GuidedSession;
  onPreviewSave?: (patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const [liveSessionState, setSessionState] = useState<GuidedSession | null>(
    null,
  );
  const previewActive = import.meta.env.DEV && Boolean(previewSession);
  const sessionState = previewActive ? previewSession! : liveSessionState;
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const resourceDialogRef = useRef<HTMLDivElement>(null);
  const endDialogRef = useRef<HTMLDivElement>(null);
  const closeResourceDialog = useCallback(
    () => setIsResourceModalOpen(false),
    [],
  );
  const closeEndDialog = useCallback(() => setShowEndConfirm(false), []);
  useDialogFocus(isResourceModalOpen, resourceDialogRef, closeResourceDialog);
  useDialogFocus(showEndConfirm, endDialogRef, closeEndDialog);
  const [advancingExercise, setAdvancingExercise] = useState(false);
  const [conversationReady, setConversationReady] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const magicLink = `${window.location.origin}/journey/${sessionId}`;

  const persistSession = async (patch: Record<string, unknown>) => {
    if (previewActive) {
      if (!onPreviewSave || !(await onPreviewSave(patch)))
        throw new Error("Preview change not saved");
      return;
    }
    await updateDoc(doc(db, "hc_live_sessions", sessionId), patch);
  };

  const sendWhisper = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    try {
      await persistSession({
        coachWhisper: text,
      });
      setWhisperText("");
    } catch (e) {
      console.error("Error sending whisper", e);
      setConnectionError("ההודעה לא נשלחה. בדקו חיבור ונסו שוב.");
    }
  };

  const showResourceAlert =
    (sessionState?.phase ?? 0) >= 7 && !sessionState?.resourceArchetype;

  const handleEndJourney = async () => {
    try {
      await persistSession({
        status: "completed",
        completedAt: serverTimestamp(),
        phase: activePhases.length + 1,
        "answers.participant_screen": "summary",
      });
    } catch (e) {
      console.error("Error ending journey", e);
      setConnectionError("סיום המפגש לא נשמר. אפשר לנסות שוב.");
      return;
    }
    setShowEndConfirm(false);
    // stay on page so coach can view summary and export PDF
  };

  useEffect(() => {
    if (!sessionId || previewActive) return;
    const docRef = doc(db, "hc_live_sessions", sessionId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSessionState({
            ...docSnap.data(),
            id: sessionId,
          } as GuidedSession);
        } else {
          setConnectionError("המפגש לא נמצא.");
        }
      },
      () =>
        setConnectionError(
          "לא ניתן לקרוא את המפגש. בדקו חיבור והרשאות ופתחו אותו שוב.",
        ),
    );
    return () => unsubscribe();
  }, [sessionId, previewActive]);

  const activeWorld = worldsData.find(
    (w) => w.id === sessionState?.environment,
  );
  const chosenArchetype = activeWorld?.archetypes.find(
    (a) => a.id === sessionState?.archetype,
  );
  const journeyStage = sessionState?.journeyStage || 1;
  const activePhases =
    journeyStage === 4
      ? stage4Phases
      : journeyStage === 3
        ? stage3Phases
        : journeyStage === 2
          ? stage2Phases
          : journeyPhases;
  const participantScreen =
    sessionState?.answers?.participant_screen ||
    (sessionState?.status === "completed"
      ? "summary"
      : (sessionState?.phase ?? 0) === 0
        ? "welcome"
        : sessionState?.phase === 1
          ? "archetype"
          : sessionState?.phase === 2
            ? "event"
            : (sessionState?.phase ?? 0) > activePhases.length
              ? "choice"
              : "question");
  const openingScreen = ["welcome", "world", "archetype", "event"].includes(
    participantScreen,
  );
  const openingTitles: Record<string, string> = {
    welcome: "מה יכול לעזור לך להיות כאן היום?",
    world: "איזה מרחב מתאים לך?",
    archetype: "איזו דמות יכולה לייצג את מה שמעכב?",
    event: "איזה אירוע מתאים לברר יחד?",
  };
  const currentStep =
    sessionState &&
    sessionState.status !== "completed" &&
    sessionState.phase > 0 &&
    sessionState.phase <= activePhases.length
      ? activePhases[sessionState.phase - 1]
      : null;

  const visibleOptions =
    currentStep && sessionState?.environment
      ? (sessionState.isYouthMode
          ? currentStep.youthOptions?.[
              sessionState.environment as keyof typeof currentStep.youthOptions
            ]
          : undefined) ||
        currentStep.options?.[
          sessionState.environment as keyof typeof currentStep.options
        ] ||
        []
      : [];
  const mechanism = findMechanism(sessionState?.mechanismId);
  const selectedResource =
    goodPowersData.find(
      (power) =>
        power.id === sessionState?.resourceArchetype ||
        power.name === sessionState?.resourceArchetype,
    ) ||
    worldsData
      .flatMap((world) => world.archetypes)
      .find(
        (character) =>
          character.id === sessionState?.resourceArchetype ||
          character.name === sessionState?.resourceArchetype,
      );
  const currentAnswer = currentStep
    ? sessionState?.answers?.[currentStep.id]
    : undefined;
  const sessionCompleted = sessionState?.status === "completed";
  const awaitingChoice =
    !sessionCompleted && (sessionState?.phase ?? 0) > activePhases.length;
  const stepTitle = currentStep
    ? (sessionState?.isYouthMode && currentStep.youthTraineeTitle
        ? currentStep.youthTraineeTitle
        : currentStep.traineeTitle
      )
        .replace(/\[ארכיטיפ\]/g, chosenArchetype?.name || "הדמות שנבחרה")
        .replace(/\[משאב\]/g, selectedResource?.name || "המשאב שלי")
        .replace(
          /\[משפט_מטרה\]/g,
          sessionState?.answers?.s4_step_1_what_i_want || "הכיוון שלי",
        )
        .replace(
          /\[חוזה\]/g,
          sessionState?.answers?.s3_step_9_new_contract || "ההצעה שלי",
        )
        .replace(
          /\[רווח\]/g,
          sessionState?.answers?.s3_step_2_secondary_gain ||
            "מה שההגנה מנסה להשיג",
        )
    : "";
  const insight = currentStep
    ? getCoachInsight({
        step: currentStep,
        answer: currentAnswer,
        answers: sessionState?.answers,
        mechanism: findMechanism(sessionState?.answers?.summary_pattern_id),
      })
    : undefined;
  const selectedAction =
    sessionState?.answers?.[
      journeyStage === 4
        ? "s4_step_6_action"
        : journeyStage === 3
          ? "s3_step_9_new_contract"
          : journeyStage === 2
            ? "s2_step_8_new_action"
            : "step_9_resource_action"
    ];
  const conversationPhase = activePhases.reduce(
    (last, step, index) => (step.uiType === "meditation" ? index + 2 : last),
    0,
  );
  const experientialConsent =
    sessionState?.answers?.meditation_permission === "מתאים לי להמשיך עם המנחה";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen bg-[#0a0b10] text-neutral-100 flex flex-col font-sans"
      dir="rtl"
    >
      {/* Header */}
      <header className="min-h-16 flex-wrap gap-3 py-3 border-b border-white/5 flex items-center justify-between px-6 bg-[#11131a] print:hidden">
        <div className="flex items-center gap-2 text-amber-500">
          <HeartCompassLogo size={30} />
          <span className="font-bold text-base tracking-wide">מצפן הלב</span>
          <span className="text-neutral-500 font-normal text-sm">
            | ממשק מאמן
          </span>
          {sessionState?.isYouthMode && (
            <span className="mr-4 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
              שפה לנוער
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {sessionCompleted ? (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-sm hover:bg-amber-500 hover:text-black transition"
              >
                <FileText className="w-4 h-4" /> ייצא סיכום PDF
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-neutral-300 font-bold rounded-lg text-sm hover:bg-white/10 transition"
              >
                חזור לתיק מתאמן
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 font-bold rounded-lg text-sm hover:bg-red-500 hover:text-white transition"
            >
              <XCircle className="w-4 h-4" /> סיים מסע
            </button>
          )}
        </div>
      </header>

      {copyStatus && (
        <p role="status" className="px-6 py-2 text-sm text-teal-200">
          {copyStatus}
        </p>
      )}
      {connectionError && (
        <p role="alert" className="p-4 text-red-300">
          {connectionError}
        </p>
      )}
      {sessionState?.participantPause && (
        <div
          role="alert"
          className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto rounded-2xl bg-[#123e3c] border-2 border-teal-200 text-white p-4 text-center shadow-2xl print:hidden"
        >
          המשתתף ביקש לעצור. עצרו את ההתקדמות, בררו מה מתאים לו וחזרו למשאב או
          לסביבה. ההמשך בידיו.
        </div>
      )}
      {mechanism && (
        <div className="px-6 py-3 text-sm text-teal-200 bg-teal-400/5">
          הצעת המנחה לבירור, טרם אומתה: {mechanism.title} ·{" "}
          {mechanism.openingQuestion} · אפשר לבדוק משמעות אחרת.
        </div>
      )}
      <main className="flex-1 flex p-4 md:p-6 gap-6 lg:h-[calc(100vh-90px)] lg:overflow-hidden print:h-auto print:overflow-visible max-w-7xl mx-auto w-full">
        {/* Right Panel: Answers Map */}
        <section className="hidden lg:flex w-80 flex-col gap-4 overflow-y-auto custom-scrollbar print:hidden">
          <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
              מפת תשובות עד כה
            </h3>
            <div className="space-y-4">
              {Object.keys(sessionState?.answers || {}).length === 0 ? (
                <p className="text-neutral-500 text-sm">
                  המתאמן טרם ענה על שאלות בשלב זה.
                </p>
              ) : (
                Object.entries(sessionState?.answers || {}).map(
                  ([key, value]) => {
                    const phase = activePhases.find((p) => p.id === key);
                    if (!phase) return null;
                    return (
                      <div
                        key={key}
                        className="text-sm border-b border-white/5 pb-3"
                      >
                        <span className="text-neutral-500 block mb-1 text-xs">
                          {phase.traineeTitle
                            .replace(/\[ארכיטיפ\]/g, "הדמות")
                            .replace(/\[משאב\]/g, "המשאב")}
                        </span>
                        <span className="text-white font-medium break-words whitespace-pre-wrap">
                          {value as string}
                        </span>
                      </div>
                    );
                  },
                )
              )}
            </div>
          </div>

          {/* Whisper Panel */}
          <div className="bg-[#11131a] rounded-2xl border border-blue-500/20 shadow-2xl p-5">
            <h3 className="text-blue-400 font-bold mb-3 text-xs tracking-widest uppercase flex items-center gap-2">
              💙 שלח לחישה למתאמן
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                "אפשר לקחת זמן",
                "💙 אני איתך",
                "🤔 ספר עוד",
                "אפשר לבחור אחרת",
              ].map((w) => (
                <button
                  key={w}
                  onClick={() => sendWhisper(w)}
                  className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-500 hover:text-white transition"
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={whisperText}
                onChange={(e) => setWhisperText(e.target.value)}
                placeholder="לחישה מותאמת..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && whisperText.trim())
                    sendWhisper(whisperText);
                }}
              />
              <button
                onClick={() => sendWhisper(whisperText)}
                disabled={!whisperText.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-30 hover:bg-blue-400 transition font-bold text-sm"
              >
                שלח
              </button>
            </div>
          </div>

          {/* Blocker Intensity Meter */}
          {sessionState?.blockerStrengthBefore != null && (
            <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-2xl p-5">
              <h3 className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                📊 עוצמה מדווחת · אינה מדד להצלחה
              </h3>
              <div className="flex items-center justify-center gap-5">
                <div className="text-center">
                  <span className="block text-xs text-neutral-500 mb-1">
                    לפני
                  </span>
                  <span className="text-4xl font-black text-red-400">
                    {sessionState.blockerStrengthBefore}
                  </span>
                  <span className="block text-xs text-neutral-600 mt-1">
                    /10
                  </span>
                </div>
                {sessionState?.blockerStrengthAfter != null && (
                  <>
                    <span className="text-amber-500 text-2xl">→</span>
                    <div className="text-center">
                      <span className="block text-xs text-neutral-500 mb-1">
                        אחרי
                      </span>
                      <span className="text-4xl font-black text-teal-200">
                        {sessionState.blockerStrengthAfter}
                      </span>
                      <span className="block text-xs text-neutral-600 mt-1">
                        /10
                      </span>
                    </div>
                    <div className="text-center bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2">
                      <span className="block text-xs text-neutral-500 mb-1">
                        שינוי
                      </span>
                      <span className={`text-2xl font-black text-teal-200`}>
                        {sessionState.blockerStrengthBefore -
                          sessionState.blockerStrengthAfter >
                        0
                          ? "−"
                          : "+"}
                        {Math.abs(
                          sessionState.blockerStrengthBefore -
                            sessionState.blockerStrengthAfter,
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Coach prompt for the chosen archetype — psychological guidance from the card data */}
          {chosenArchetype?.coachPrompt && (
            <div className="bg-blue-500/5 rounded-2xl border border-blue-500/20 shadow-2xl p-5">
              <h3 className="text-blue-400 font-bold mb-2 text-xs tracking-widest uppercase flex items-center gap-2">
                🧭 הנחיה למאמן — {chosenArchetype.name}
              </h3>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {chosenArchetype.coachPrompt}
              </p>
            </div>
          )}

          {/* Blocker / Goal Map — live sidebar */}
          <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h3 className="text-amber-500 font-bold mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
              {journeyStage === 4 ? "🎯 מפת המטרה" : "🔄 מעגל החסם"}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-neutral-500 block mb-1">
                  {journeyStage === 4
                    ? "המטרה"
                    : journeyStage === 3
                      ? "הטריגר שהעיר את התגובה"
                      : "מחשבה (פרשנות)"}
                </span>
                <span className="text-white text-sm font-medium break-words">
                  {journeyStage === 4
                    ? sessionState?.answers?.["s4_step_1_what_i_want"] || "—"
                    : journeyStage === 3
                      ? sessionState?.answers?.["s3_step_1_trigger"] ||
                        sessionState?.trigger ||
                        "—"
                      : sessionState?.answers?.["step_6_thought"] ||
                        sessionState?.answers?.["s2_step_3_interpretation"] ||
                        sessionState?.trigger ||
                        "—"}
                </span>
              </div>
              <div className="text-amber-500 text-center text-lg">↓</div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-neutral-500 block mb-1">
                  {journeyStage === 4
                    ? "כוחות"
                    : journeyStage === 3
                      ? "מה ניסתה התגובה להשיג"
                      : "רגש / נקודה רגישה"}
                </span>
                <span className="text-white text-sm font-medium break-words">
                  {journeyStage === 4
                    ? sessionState?.answers?.["s4_step_2_capability"] || "—"
                    : journeyStage === 3
                      ? sessionState?.answers?.["s3_step_2_secondary_gain"] ||
                        "—"
                      : sessionState?.answers?.["step_3_feeling"] ||
                        sessionState?.answers?.["s2_step_4_sensitive_spot"] ||
                        "—"}
                </span>
              </div>
              <div className="text-amber-500 text-center text-lg">↓</div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-neutral-500 block mb-1">
                  {journeyStage === 4
                    ? "חסם"
                    : journeyStage === 3
                      ? "הצורך במילים שלו"
                      : "תגובה אוטומטית"}
                </span>
                <span className="text-white text-sm font-medium break-words">
                  {journeyStage === 4
                    ? sessionState?.answers?.["s4_step_4_secondary_gain"] || "—"
                    : journeyStage === 3
                      ? sessionState?.answers?.["s3_step_3_need"] || "—"
                      : sessionState?.answers?.["step_5_urge"] ||
                        sessionState?.answers?.["s2_step_5_reaction"] ||
                        "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Center Panel: Live Flow */}
        <section className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar print:overflow-visible">
          <div className="bg-[#11131a] rounded-2xl p-6 border border-white/5 shadow-2xl flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-bold mb-1 text-white">
                שליטה וסנכרון סשן חי
              </h2>
              <p className="text-sm text-neutral-400">
                המסך שלך מסונכרן בזמן אמת למסך הנער.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
              <div className="flex gap-4 items-center">
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition border border-white/10"
                  title="חזור לתיק מתאמן"
                >
                  חזור לתיק
                </button>
                <div className="text-amber-500 font-mono text-sm tracking-wider">
                  {magicLink}
                </div>
                <button
                  aria-label="העתק קישור למשתתף"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(magicLink);
                      setCopyStatus("הקישור הועתק");
                    } catch {
                      setCopyStatus(
                        "העתקה לא זמינה. אפשר לסמן ולהעתיק את הקישור.",
                      );
                    }
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                  title="העתק קישור"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <Link
                to={new URL(magicLink).pathname}
                target="_blank"
                className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-3 py-2 rounded-lg hover:bg-amber-500/30 transition"
              >
                פתח מתאמן עכשיו
              </Link>
            </div>
          </div>

          {!magicLink ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 print:hidden">
              <LayoutDashboard className="w-16 h-16 mb-4" />
              <p>צור סשן כדי להתחיל מעקב</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-20">
              {/* Pre-session panel: shown while trainee hasn't chosen a world yet */}
              {(sessionState?.phase ?? 0) <= 1 &&
                sessionState?.previousAgreement && (
                  <div className="print:hidden bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <p className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-3">
                      המסע הקודם — נקודת פתיחה לסשן זה
                    </p>
                    <p className="text-neutral-400 text-sm mb-2">
                      הצעד שנבחר במפגש הקודם:
                    </p>
                    <p className="text-white font-bold text-lg mb-4">
                      "{sessionState.previousAgreement}"
                    </p>
                    <p className="text-neutral-500 text-sm">
                      שאל בפתיחה:{" "}
                      <span className="text-neutral-300 italic">
                        מה שמתי לב שקרה מאז? האם הצעד עדיין מתאים לי?
                      </span>
                    </p>
                  </div>
                )}

              {/* Recurring archetype alert */}
              {sessionState?.archetype &&
                sessionState?.previousArchetype &&
                sessionState.archetype === sessionState.previousArchetype && (
                  <div className="print:hidden flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                    <RotateCcw className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-bold text-sm mb-1">
                        דמות חוזרת —{" "}
                        {worldsData
                          .flatMap((w) => w.archetypes)
                          .find((a) => a.id === sessionState.archetype)?.name ||
                          sessionState.archetype}
                      </p>
                      <p className="text-neutral-300 text-sm">
                        אותה דמות הופיעה גם בסשן הקודם. שאל:{" "}
                        <span className="italic text-white">
                          "מה השתנה מאז הפגישה האחרונה עם הדמות הזו? מה היא מנסה
                          לשמור עכשיו, ומה מתאים לך לברר היום?"
                        </span>
                      </p>
                    </div>
                  </div>
                )}

              {!sessionState ? (
                /* ── LOADING: snapshot not yet received ── */
                <div className="flex-1 flex flex-col items-center justify-center py-24 opacity-50">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500/40 border-t-amber-500 animate-spin mb-4" />
                  <p className="text-neutral-400 text-sm">טוען נתוני סשן...</p>
                </div>
              ) : awaitingChoice ? (
                <section
                  role="status"
                  className="rounded-2xl border border-teal-300/30 bg-teal-400/5 p-8"
                >
                  <h3 className="text-2xl font-bold text-teal-200 mb-3">
                    ממתינים לבחירה המסכמת של המשתתף
                  </h3>
                  <p className="text-neutral-300 leading-relaxed">
                    השאלות הסתיימו, והמשתתף בוחר מה מתאים לו לקחת — צעד,
                    התבוננות או סיום. המפגש יושלם והסיכום יוצג לאחר שיאשר את
                    בחירתו.
                  </p>
                  {selectedAction && (
                    <div className="mt-5 rounded-xl border border-white/10 p-4">
                      <p className="text-xs text-neutral-400 mb-2">
                        הצעת הפעולה האחרונה · טרם אושרה בבחירה המסכמת
                      </p>
                      <p className="whitespace-pre-wrap text-white">
                        {selectedAction}
                      </p>
                    </div>
                  )}
                  {selectedResource && (
                    <p className="mt-4 text-white">
                      המשאב שבחר: {selectedResource.name}
                    </p>
                  )}
                </section>
              ) : sessionCompleted ? (
                <SessionTakeaway
                  session={sessionState}
                  audience="coach"
                  onSave={async (patch) => {
                    try {
                      await persistSession(patch);
                      return true;
                    } catch {
                      setConnectionError(
                        "השינוי בסיכום לא נשמר. אפשר לנסות שוב.",
                      );
                      return false;
                    }
                  }}
                />
              ) : (
                <div className="print:hidden flex flex-col gap-8">
                  {openingScreen && (
                    <section
                      aria-label="המסך הנוכחי של המשתתף"
                      className="rounded-3xl border border-teal-200/40 bg-[#183e43] p-6 md:p-8"
                    >
                      <p className="text-xs text-teal-100 mb-3">
                        פתיחת המפגש · מסך המשתתף מסונכרן
                      </p>
                      <h2 className="text-2xl font-bold text-white mb-3">
                        {openingTitles[participantScreen]}
                      </h2>
                      <p className="text-sm text-teal-50 mb-5">
                        הבחירה בידיו. המסך הזה מציג את מה שהוא רואה ואת הבחירות
                        שנשלחו, בלי לקדם אותו אוטומטית.
                      </p>
                      {participantScreen === "welcome" && (
                        <>
                          <p className="mb-5 text-white">
                            אפשר לבחור משאב להתחלה. אין צורך להרגיש אותו מיד.
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {goodPowersData.map((power) => (
                              <article
                                key={power.id}
                                className={`rounded-xl border p-3 text-center ${selectedResource?.id === power.id ? "border-teal-200 bg-teal-200/20" : "border-white/25 bg-black/15"}`}
                              >
                                <span className="text-2xl">{power.icon}</span>
                                <h3 className="font-bold text-white mt-2">
                                  {power.name}
                                </h3>
                                <p className="text-xs text-teal-50 mt-1">
                                  {power.role}
                                </p>
                                {selectedResource?.id === power.id && (
                                  <p className="text-xs text-white font-bold mt-2">
                                    נבחר בידי המשתתף
                                  </p>
                                )}
                              </article>
                            ))}
                          </div>
                          {!selectedResource && (
                            <p className="text-sm text-teal-50 mt-4">
                              עדיין לא נבחר משאב; אפשר לבחור בהמשך.
                            </p>
                          )}
                        </>
                      )}
                      {participantScreen === "world" && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {worldsData.map((world) => (
                            <article
                              key={world.id}
                              className={`rounded-xl border p-4 ${activeWorld?.id === world.id ? "border-teal-200 bg-teal-200/20" : "border-white/25 bg-black/15"}`}
                            >
                              <span className="text-3xl">
                                {
                                  {
                                    clouds: "☁️",
                                    forest: "🌿",
                                    arcade: "◈",
                                    fairies: "✦",
                                  }[world.theme]
                                }
                              </span>
                              <h3 className="font-bold mt-3 text-white">
                                {world.title}
                              </h3>
                              <p className="text-xs text-teal-50 mt-2">
                                בחירת סגנון, לא אבחון
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                      {participantScreen === "archetype" && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {activeWorld?.archetypes
                            .filter(
                              (character) => character.kind !== "resource",
                            )
                            .map((character) => (
                              <article
                                key={character.id}
                                className={`rounded-xl overflow-hidden border ${chosenArchetype?.id === character.id ? "border-teal-200 bg-teal-200/20" : "border-white/25 bg-black/15"}`}
                              >
                                {character.imageUrl && (
                                  <img
                                    src={character.imageUrl}
                                    alt={character.name}
                                    className="w-full h-36 object-cover"
                                  />
                                )}
                                <h3 className="font-bold p-3 text-white">
                                  {character.name}
                                </h3>
                                <p className="px-3 pb-3 text-sm text-teal-50">
                                  {sessionState.isYouthMode &&
                                  character.youthDescription
                                    ? character.youthDescription
                                    : character.description}
                                </p>
                              </article>
                            ))}
                        </div>
                      )}
                      {participantScreen === "event" && (
                        <div className="rounded-xl border border-white/25 bg-black/15 p-4">
                          <p className="text-sm text-teal-50 mb-2">
                            {chosenArchetype?.name || "אפשר להתבונן בלי דמות"}
                          </p>
                          <p className="text-white whitespace-pre-wrap">
                            {sessionState.trigger ||
                              "ממתינים לאירוע שהמשתתף יבחר או ינסח."}
                          </p>
                          <p className="mt-3 text-sm text-teal-50">
                            נבחר רגע אחד ונפריד בין מה שנאמר או נעשה לבין
                            המשמעות שניתנה לו.
                          </p>
                        </div>
                      )}
                    </section>
                  )}
                  {/* Archetype Card Display */}
                  <div className="flex flex-col md:flex-row justify-center gap-6">
                    {chosenArchetype && (
                      <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col items-center p-8 w-full md:w-72">
                        <div className="text-xs font-bold tracking-widest text-neutral-500 mb-6 uppercase">
                          מנגנון אפשרי / {chosenArchetype.name}
                        </div>
                        <div className="w-40 h-64 rounded-2xl border-4 border-amber-500/20 overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
                          {chosenArchetype.imageUrl ? (
                            <img
                              src={chosenArchetype.imageUrl}
                              alt={chosenArchetype.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center text-4xl">
                              🔮
                            </div>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white mt-6 text-center">
                          {chosenArchetype.name}
                        </h2>
                        <p className="text-amber-500 text-sm mt-2 text-center">
                          "
                          {sessionState?.trigger || chosenArchetype.description}
                          "
                        </p>
                      </div>
                    )}

                    {selectedResource && (
                      <div className="bg-[#11131a] rounded-2xl border border-teal-300/20 p-6 w-full md:w-72 flex flex-col items-center">
                        <p className="text-xs text-teal-200 mb-4">
                          משאב שבחר המשתתף
                        </p>
                        {selectedResource.imageUrl ? (
                          <img
                            src={selectedResource.imageUrl}
                            alt={selectedResource.name}
                            className="w-32 h-44 object-cover rounded-xl"
                          />
                        ) : (
                          <span className="text-4xl">
                            {selectedResource.icon}
                          </span>
                        )}
                        <h2 className="text-xl font-bold mt-4">
                          {selectedResource.name}
                        </h2>
                        <p className="text-sm text-neutral-300 mt-2 text-center">
                          {selectedResource.role}
                        </p>
                        {sessionState.answers?.resource_reflection && (
                          <p className="mt-4 text-teal-100 whitespace-pre-wrap">
                            {sessionState.answers.resource_reflection}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* The Active Question (Mirrors Trainee UI) — hidden when journey is complete */}
                  {!openingScreen &&
                    currentStep &&
                    sessionState?.phase <= activePhases.length && (
                      <div className="bg-[#11131a] rounded-2xl border border-blue-500/20 shadow-lg p-8">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            {stepTitle}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                            {`שלב ${sessionState?.phase ?? 0} מתוך ${activePhases.length}`}
                          </div>
                        </div>

                        {currentStep.uiType === "good-powers" && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                            {goodPowersData.map((power) => (
                              <div
                                key={power.id}
                                className={`rounded-xl border p-3 text-center ${selectedResource?.id === power.id ? "border-teal-300 bg-teal-300/10" : "border-white/10 bg-black/20"}`}
                              >
                                {power.imageUrl && (
                                  <img
                                    src={power.imageUrl}
                                    alt={power.name}
                                    className="h-24 w-20 rounded-lg object-cover mx-auto mb-2"
                                  />
                                )}
                                <p className="font-bold text-sm">
                                  {power.name}
                                </p>
                                <p className="text-xs text-neutral-400 mt-1">
                                  {power.role}
                                </p>
                                {selectedResource?.id === power.id && (
                                  <p className="text-xs text-teal-200 mt-2">
                                    נבחר בידי המשתתף
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {currentAnswer &&
                          currentStep.uiType !== "structured-dialogue" && (
                            <div
                              role="status"
                              className="rounded-xl border border-teal-300/20 bg-teal-300/5 p-4 mb-5"
                            >
                              <p className="text-xs text-teal-200 mb-2">
                                תשובת המשתתף כעת
                              </p>
                              <p className="text-white whitespace-pre-wrap">
                                {currentAnswer}
                              </p>
                            </div>
                          )}
                        {/* Options Mirror */}
                        {currentStep.uiType === "structured-dialogue" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {visibleOptions.map((option, idx) => {
                              const traineeAnswer =
                                sessionState?.answers?.[currentStep.id];
                              const isSelected = traineeAnswer === option;
                              const letter = String.fromCharCode(65 + idx);

                              return (
                                <div
                                  key={idx}
                                  className={`p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                                    isSelected
                                      ? "bg-amber-500/10 border-amber-500"
                                      : "bg-black/30 border-white/10"
                                  }`}
                                >
                                  <span
                                    className={`w-8 h-8 shrink-0 rounded-md border flex items-center justify-center text-sm font-bold ${isSelected ? "bg-amber-500/20 text-amber-500 border-amber-500" : "bg-white/5 text-neutral-400 border-white/10"}`}
                                  >
                                    {letter}
                                  </span>
                                  <span
                                    className={`flex-1 text-right ${isSelected ? "text-white font-bold" : "text-neutral-300"}`}
                                  >
                                    {option}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs text-blue-400 font-bold tracking-widest uppercase shrink-0">
                                      ✦ נבחרה
                                    </span>
                                  )}
                                </div>
                              );
                            })}

                            {/* Handle Custom Text in Mirror */}
                            {sessionState?.answers?.[currentStep.id] &&
                              !visibleOptions.includes(
                                sessionState.answers[currentStep.id],
                              ) && (
                                <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border bg-amber-500/10 border-amber-500 flex items-center gap-4">
                                  <span className="w-8 h-8 shrink-0 rounded-md border bg-amber-500/20 text-amber-500 border-amber-500 flex items-center justify-center text-sm font-bold">
                                    ✎
                                  </span>
                                  <span className="flex-1 text-white font-bold text-right">
                                    "{sessionState.answers[currentStep.id]}"
                                  </span>
                                  <span className="text-xs text-blue-400 font-bold tracking-widest uppercase shrink-0">
                                    טקסט חופשי
                                  </span>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                  {!openingScreen && insight && (
                    <section
                      className="rounded-2xl border-2 border-indigo-200/50 bg-[#263954] shadow-lg p-6"
                      aria-label="הבנה מקצועית לבירור"
                    >
                      <p className="text-xs text-indigo-200 mb-2">
                        {insight.kind === "hypothesis"
                          ? "השערה לבירור, לא מסקנה"
                          : insight.kind === "readiness"
                            ? "מוכנות וקצב"
                            : "מה עדיין צריך להתברר"}
                      </p>
                      <h3 className="font-bold text-xl mb-3">
                        {insight.title}
                      </h3>
                      <p className="text-white leading-relaxed">
                        {insight.explanation}
                      </p>
                      {insight.evidence && (
                        <p className="mt-3 text-sm text-indigo-50 whitespace-pre-wrap">
                          מתוך התשובות שנמסרו: {insight.evidence}
                        </p>
                      )}
                      <p className="mt-4 text-sm text-indigo-200">
                        <strong>מה לברר עכשיו: </strong>
                        {insight.nextFocus}
                      </p>
                    </section>
                  )}
                  {/* Coach Clinical Deep Dive (Only visible if step is active) */}
                  {!openingScreen &&
                    currentStep &&
                    sessionState?.phase <= activePhases.length && (
                      <div className="bg-[#11131a] rounded-2xl border border-amber-500/20 shadow-lg p-8">
                        <div className="flex items-center mb-6 border-b border-white/5 pb-4">
                          <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>{" "}
                            למאמן - בזמן אמת
                          </span>
                        </div>

                        <div className="space-y-8">
                          {/* Framing */}
                          {currentStep.coachFraming && (
                            <div>
                              <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                                <Target className="w-4 h-4" /> מסגור
                              </h4>
                              <p className="text-neutral-300 text-lg leading-relaxed">
                                {currentStep.coachFraming}
                              </p>
                            </div>
                          )}

                          {/* Deepening */}
                          {currentStep.coachDeepeningQuestions && (
                            <div>
                              <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                                <Ear className="w-4 h-4" /> שאלות להעמקה עכשיו
                              </h4>
                              <ul className="space-y-3">
                                {currentStep.coachDeepeningQuestions.map(
                                  (q, i) => (
                                    <li
                                      key={i}
                                      className="text-white font-medium text-lg flex items-start gap-2"
                                    >
                                      <span className="text-amber-500 mt-1">
                                        ›
                                      </span>{" "}
                                      {q}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Warning / Anchor */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                            {currentStep.coachWarning && (
                              <div>
                                <h4 className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3 uppercase tracking-widest">
                                  <AlertTriangle className="w-4 h-4" /> שים לב
                                </h4>
                                <p className="text-neutral-300 text-base">
                                  {currentStep.coachWarning}
                                </p>
                              </div>
                            )}
                            <div>
                              <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                                <HeartPulse className="w-4 h-4" /> עוגן גופני
                              </h4>
                              <p className="text-neutral-300 text-base mb-6">
                                שאל איפה בגוף הוא מרגיש את התשובה הזו. אם מתאים
                                לו, אפשר גם להתבונן בתחושה בלי לשנות אותה.
                              </p>

                              {showResourceAlert && (
                                <div className="mb-3 flex items-center gap-3 bg-amber-500/15 border border-amber-500/50 rounded-xl px-4 py-3 animate-pulse">
                                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                                  <p className="text-amber-300 font-bold text-sm">
                                    טרם נבחר משאב. בדקו יחד מה יכול לתמוך בו;
                                    אין חובה להעמיק עכשיו.
                                  </p>
                                </div>
                              )}
                              <button
                                onClick={() => setIsResourceModalOpen(true)}
                                className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl font-bold transition ${
                                  showResourceAlert
                                    ? "bg-amber-500 text-black border-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500 hover:text-black"
                                }`}
                              >
                                <Plus className="w-4 h-4" /> פתח חפיסת משאבים
                                ושלח למתאמן
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Coach Controls for Meditation & Audio */}
                        {currentStep.uiType === "meditation" && (
                          <div className="mt-8 border-t border-white/10 pt-6">
                            <h4 className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm mb-4 uppercase tracking-widest">
                              <Music className="w-4 h-4" /> שליטת מאמן: נגן
                              מוזיקה ומעבר מסכים
                            </h4>

                            {!experientialConsent && (
                              <p className="mb-3 text-sm text-fuchsia-200">
                                ממתינים לרצון מפורש של המשתתף להמשיך עם המנחה.
                                אפשר להישאר בשיחה או לסיים בלי התרגיל.
                              </p>
                            )}
                            <div className="flex flex-col gap-4">
                              <label className="flex items-start gap-3 rounded-xl border border-white/15 p-3 text-sm text-neutral-300">
                                <input
                                  type="checkbox"
                                  checked={conversationReady}
                                  onChange={(event) =>
                                    setConversationReady(event.target.checked)
                                  }
                                  className="mt-1"
                                />
                                <span>
                                  ביררנו יחד שמתאים להמשיך בשיחה ולבחור תמיכה,
                                  בלי התרגיל החווייתי.
                                </span>
                              </label>
                              <button
                                type="button"
                                disabled={
                                  sessionState?.participantPause ||
                                  !conversationReady ||
                                  advancingExercise
                                }
                                onClick={async () => {
                                  if (
                                    !sessionState ||
                                    sessionState.participantPause ||
                                    !conversationReady ||
                                    advancingExercise
                                  )
                                    return;
                                  setAdvancingExercise(true);
                                  try {
                                    await persistSession({
                                      phase: conversationPhase,
                                      "answers.participant_screen":
                                        conversationPhase > activePhases.length
                                          ? "choice"
                                          : "question",
                                      "answers.experiential_path":
                                        "בחרנו להמשיך בשיחה ולבחור תמיכה, בלי התרגיל החווייתי",
                                    });
                                  } catch {
                                    setConnectionError(
                                      "המעבר לשיחה לא נשמר. אפשר לנסות שוב.",
                                    );
                                  } finally {
                                    setAdvancingExercise(false);
                                  }
                                }}
                                className="w-full rounded-xl border border-teal-300/30 p-4 text-teal-200 font-bold hover:bg-teal-300/10 disabled:opacity-40"
                              >
                                נישאר בשיחה ונדלג על התרגיל
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    sessionId &&
                                    !sessionState?.participantPause &&
                                    experientialConsent &&
                                    !advancingExercise
                                  ) {
                                    setAdvancingExercise(true);
                                    try {
                                      await persistSession({
                                        phase: sessionState.phase + 1,
                                        "answers.participant_screen":
                                          sessionState.phase + 1 >
                                          activePhases.length
                                            ? "choice"
                                            : "question",
                                      });
                                    } catch (e) {
                                      console.error("Error advancing phase", e);
                                      setConnectionError(
                                        "המעבר לא נשמר. בדקו חיבור ונסו שוב.",
                                      );
                                    } finally {
                                      setAdvancingExercise(false);
                                    }
                                  }
                                }}
                                disabled={
                                  sessionState?.participantPause ||
                                  !experientialConsent ||
                                  advancingExercise
                                }
                                className="disabled:opacity-40 w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-lg rounded-xl transition shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2"
                              >
                                העבר מתאמן למסך הבא (שליטת מאמן)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="h-9 border-t border-white/5 flex items-center justify-center print:hidden">
        <span className="text-neutral-700 text-xs tracking-wide">
          © {new Date().getFullYear()} יוסי מדלסי — מצפן הלב | כל הזכויות
          שמורות
        </span>
      </footer>

      {/* End Journey Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div
            ref={endDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="סיום מפגש"
            className="bg-[#11131a] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(239,68,68,0.15)]"
          >
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3">
              לסיים את המסע?
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              המסע יסומן כ"הושלם" וכבר לא ניתן יהיה להמשיך אותו. המתאמן יועבר
              למסך סיכום המסע.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-neutral-300 font-bold rounded-xl hover:bg-white/10 transition"
              >
                ביטול
              </button>
              <button
                onClick={handleEndJourney}
                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                כן, סיים מסע
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Selection Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div
            ref={resourceDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="בחירת משאב"
            className="bg-[#11131a] border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[85vh] flex flex-col relative"
          >
            <button
              onClick={() => setIsResourceModalOpen(false)}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white"
            >
              ✕ סגור
            </button>
            <h2 className="text-2xl font-bold text-amber-500 mb-2">
              שלח קלף משאב / דמות חכמה
            </h2>
            <p className="text-neutral-400 mb-6">
              בחר דמות מתוך החפיסה. הקלף יקפוץ מיד במסך של המתאמן ויציע לו עזרה
              ותמיכה.
            </p>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {goodPowersData.map((power) => (
                <button
                  type="button"
                  key={power.id}
                  className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:border-amber-500/50 cursor-pointer transition"
                  onClick={async () => {
                    if (sessionId) {
                      try {
                        await persistSession({
                          coachInjectedResource: power.id,
                        });
                      } catch (e) {
                        console.error("Error injecting resource", e);
                        setConnectionError("המשאב לא נשלח. אפשר לנסות שוב.");
                        return;
                      }
                    }
                    setIsResourceModalOpen(false);
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-[#171a23] mb-3 overflow-hidden border border-white/10 flex items-center justify-center text-4xl">
                    {power.imageUrl ? (
                      <img
                        src={power.imageUrl}
                        alt={power.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      power.icon
                    )}
                  </div>
                  <span className="text-white font-bold block">
                    {power.name}
                  </span>
                  <span className="text-neutral-500 text-xs mt-1 block">
                    {power.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .bg-\\[\\#11131a\\] { background: white !important; border: 1px solid #ddd !important; box-shadow: none !important; }
          .text-white, .text-neutral-100, .text-neutral-300, .text-neutral-400 { color: black !important; }
          .border-white\\/5, .border-white\\/10 { border-color: #e5e7eb !important; }
          .bg-black\\/30 { background: #f9fafb !important; }
          .bg-amber-500\\/10 { background: #fffbeb !important; }
          * { direction: rtl !important; }
          body::after {
            content: "© יוסי מדלסי — מצפן הלב | כל הזכויות שמורות";
            display: block;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}

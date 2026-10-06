import { useState, useEffect, useRef, useCallback } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";
import type { GuidedSession, Trainee } from "../lib/sessionTypes";
import type { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import {
  Plus,
  User as UserIcon,
  Calendar,
  ArrowRight,
  LogOut,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import CoachPauseAlert from "../components/CoachPauseAlert";
import CoachLiveSession from "./CoachLiveSession";
import HeartCompassLogo from "../components/HeartCompassLogo";
import MechanismLibrary from "../components/MechanismLibrary";
import { findMechanism } from "../data/mechanisms";
import { worldsData } from "../data/worlds";

export default function CoachDashboard({ user }: { user: User }) {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTraineeName, setNewTraineeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [traineeSessions, setTraineeSessions] = useState<GuidedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const [showStageModal, setShowStageModal] = useState(false);
  const stageDialogRef = useRef<HTMLDivElement>(null);
  const closeStageDialog = useCallback(() => setShowStageModal(false), []);
  useDialogFocus(showStageModal, stageDialogRef, closeStageDialog);
  const [selectedStage, setSelectedStage] = useState(1);
  const [isYouthMode, setIsYouthMode] = useState(true);
  const [selectedMechanismId, setSelectedMechanismId] = useState<string>();
  const [readinessConfirmed, setReadinessConfirmed] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [startingSession, setStartingSession] = useState(false);
  const [observedSessions, setObservedSessions] = useState<GuidedSession[]>([]);
  const [pauseWatchError, setPauseWatchError] = useState(false);

  useEffect(() => {
    const traineesQuery = query(
      collection(db, "trainees"),
      where("coachId", "==", user.uid),
    );
    return onSnapshot(
      traineesQuery,
      (snapshot) => {
        const list = snapshot.docs.map(
          (entry) => ({ ...entry.data(), id: entry.id }) as Trainee,
        );
        list.sort(
          (a, b) =>
            (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
        );
        setTrainees(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setSessionError("לא ניתן לטעון את המשתתפים כרגע.");
      },
    );
  }, [user.uid]);

  useEffect(() => {
    // One owner filter avoids composite indexes and keeps pause requests visible
    // while the coach is browsing the dashboard or another participant's file.
    const ownerSessions = query(
      collection(db, "hc_live_sessions"),
      where("coachId", "==", user.uid),
    );
    return onSnapshot(
      ownerSessions,
      (snapshot) => {
        setObservedSessions(
          snapshot.docs.map(
            (entry) => ({ ...entry.data(), id: entry.id }) as GuidedSession,
          ),
        );
        setPauseWatchError(false);
      },
      () => setPauseWatchError(true),
    );
  }, [user.uid]);

  const handleCreateTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraineeName.trim()) return;
    setIsCreating(true);
    try {
      const newRef = doc(collection(db, "trainees"));
      await setDoc(newRef, {
        coachId: user.uid,
        name: newTraineeName.trim(),
        createdAt: serverTimestamp(),
      });
      setNewTraineeName("");
    } catch (e) {
      console.error("Error creating trainee", e);
      setSessionError("המשתתף לא נשמר. בדקו חיבור ונסו שוב.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectTrainee = async (trainee: Trainee) => {
    setSelectedTrainee(trainee);
    setTraineeSessions([]);
    setSessionError("");
    setLoadingSessions(true);
    try {
      const q = query(
        collection(db, "hc_live_sessions"),
        where("coachId", "==", user.uid),
        where("traineeId", "==", trainee.id),
      );
      const querySnapshot = await getDocs(q);
      const list: GuidedSession[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as GuidedSession);
      });
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
      );
      setTraineeSessions(list);
    } catch (e) {
      console.error("Error fetching sessions", e);
      setSessionError("לא ניתן לטעון את היסטוריית המפגשים כרגע.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const openStartSessionModal = () => {
    if (!selectedTrainee) return;
    setSelectedStage(1);
    setReadinessConfirmed(false);
    setSessionError("");
    setShowStageModal(true);
  };

  const startNewSession = async () => {
    if (
      !selectedTrainee ||
      startingSession ||
      (selectedStage === 3 && !readinessConfirmed)
    )
      return;
    setStartingSession(true);
    setSessionError("");
    const completedSessions = traineeSessions.filter(
      (s) => s.status === "completed",
    );
    const lastSession = completedSessions[0];
    const randomId = crypto.randomUUID();

    try {
      await setDoc(doc(db, "hc_live_sessions", randomId), {
        coachId: user.uid,
        traineeId: selectedTrainee.id,
        phase: 0,
        status: "active",
        journeyStage: selectedStage,
        mechanismId: selectedMechanismId || null,
        participantPause: false,
        experientialReadinessConfirmed:
          selectedStage === 3 && readinessConfirmed,
        isYouthMode: isYouthMode,
        createdAt: serverTimestamp(),
        sessionNumber: traineeSessions.length + 1,
        previousAgreement:
          lastSession?.answers?.["step_9_resource_action"] ||
          lastSession?.answers?.["s2_step_9_agreement"] ||
          lastSession?.answers?.["s3_step_9_new_contract"] ||
          lastSession?.answers?.["s4_step_6_action"] ||
          null,
        previousArchetype: lastSession?.archetype || null,
        previousEnvironment: lastSession?.environment || null,
      });
      setShowStageModal(false);
      setActiveSessionId(randomId);
    } catch (e) {
      console.error("Error creating session", e);
      setSessionError("לא ניתן לפתוח את המפגש כרגע. בדקו חיבור ונסו שוב.");
    } finally {
      setStartingSession(false);
    }
  };

  const resumeSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  if (activeSessionId) {
    return (
      <CoachLiveSession
        sessionId={activeSessionId}
        onBack={() => {
          setActiveSessionId(null);
          if (selectedTrainee) void handleSelectTrainee(selectedTrainee);
        }}
      />
    );
  }

  const stageLabels: Record<number, string> = {
    1: "מיפוי — היכרות עם אירוע ומנגנון",
    2: "מיפוי — העמקה וכוונת ההגנה",
    3: "סילוק — עבודה חווייתית מונחית",
    4: "עצמאות — כיוון וצעד מתוך תשוקה",
  };

  const envLabels: Record<string, string> = {
    clouds: "ממלכת העננים",
    forest: "היער הפנימי",
    arcade: "עיר הניאון",
    fairies: "יער הפיות והשדונים",
  };

  return (
    <div
      className="min-h-screen bg-[#0d0f14] text-white p-6 relative"
      dir="rtl"
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="text-amber-500">
            <HeartCompassLogo size={44} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
              יוסי מדלסי — מצפן הלב
            </h1>
            <p className="text-sm text-neutral-400">
              שלום, {user.displayName || "מאמן"}
            </p>
          </div>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> התנתק
        </button>
      </header>

      {sessionError && !showStageModal && (
        <p role="alert" className="max-w-6xl mx-auto mb-4 text-red-300">
          {sessionError}
        </p>
      )}
      {pauseWatchError && (
        <p
          role="alert"
          className="max-w-6xl mx-auto mb-4 rounded-xl border border-red-300/30 bg-red-400/10 p-4 text-red-200"
        >
          מעקב בקשות העצירה אינו מחובר כרגע. בדקו חיבור והרשאות; עד לחידוש
          החיבור אין אישור לקבלת בקשות חדשות.
        </p>
      )}
      <CoachPauseAlert
        sessions={observedSessions}
        trainees={trainees}
        onOpen={setActiveSessionId}
      />
      <MechanismLibrary
        selectedId={selectedMechanismId}
        onSelect={(mechanism) => setSelectedMechanismId(mechanism?.id)}
      />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Sidebar: Trainees List */}
        <div className="w-full md:w-1/3 bg-[#171a23] rounded-2xl border border-white/5 p-6 md:h-[80vh] flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-500" /> המתאמנים שלי
          </h2>

          <form onSubmit={handleCreateTrainee} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="שם מתאמן חדש..."
              value={newTraineeName}
              onChange={(e) => setNewTraineeName(e.target.value)}
              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
            />
            <button
              disabled={isCreating || !newTraineeName.trim()}
              className="bg-amber-500 text-black p-2 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {loading ? (
              <p className="text-center text-neutral-500 mt-10">
                טוען רשימה...
              </p>
            ) : trainees.length === 0 ? (
              <p className="text-center text-neutral-500 mt-10">
                אין לך עדיין מתאמנים.
                <br />
                צור את המתאמן הראשון שלך!
              </p>
            ) : (
              trainees.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTrainee(t)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition border text-right ${selectedTrainee?.id === t.id ? "bg-amber-500/10 border-amber-500/50 text-amber-400" : "bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5 text-neutral-300"}`}
                >
                  <span className="font-bold">{t.name}</span>
                  <ArrowRight
                    className={`w-4 h-4 ${selectedTrainee?.id === t.id ? "opacity-100" : "opacity-0"}`}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Area: Trainee Profile */}
        <div className="w-full md:w-2/3 bg-[#171a23] rounded-2xl border border-white/5 p-6 md:h-[80vh] flex flex-col relative overflow-hidden">
          {!selectedTrainee ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
              <p>בחר מתאמן מהרשימה כדי לראות את ההיסטוריה שלו</p>
              <p>או להתחיל מסע חדש.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    {selectedTrainee.name}
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    הצטרף בתאריך{" "}
                    {selectedTrainee.createdAt
                      ? new Date(
                          selectedTrainee.createdAt.toMillis(),
                        ).toLocaleDateString("he-IL")
                      : "לא ידוע"}
                  </p>
                </div>
                <button
                  onClick={openStartSessionModal}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <Plus className="w-5 h-5" /> פתח מסע חדש
                </button>
              </div>

              {traineeSessions.find((s) => s.status === "completed") &&
                (() => {
                  const last = traineeSessions.find(
                    (s) => s.status === "completed",
                  )!;
                  const agreement =
                    last.answers?.["step_9_resource_action"] ||
                    last.answers?.["s2_step_9_agreement"] ||
                    last.answers?.["s3_step_9_new_contract"] ||
                    last.answers?.["s4_step_6_action"];
                  return (
                    <div className="mb-5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-right">
                      <p className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">
                        סיכום מסע אחרון
                      </p>
                      <p className="text-neutral-400 text-xs mb-1">
                        {last.createdAt
                          ? new Date(
                              last.createdAt.toMillis(),
                            ).toLocaleDateString("he-IL")
                          : ""}{" "}
                        ·{" "}
                        {envLabels[last.environment || ""] || last.environment}
                      </p>
                      {agreement && (
                        <p className="text-white text-sm font-bold">
                          "{agreement}"
                        </p>
                      )}
                    </div>
                  );
                })()}

              {/* Creatures Album: every archetype this trainee has met across journeys */}
              {(() => {
                const allArchetypes = worldsData.flatMap((w) => w.archetypes);
                const met: Record<
                  string,
                  {
                    count: number;
                    completed: number;
                    strengthDrop: number | null;
                  }
                > = {};
                traineeSessions.forEach((s) => {
                  if (!s.archetype) return;
                  if (!met[s.archetype])
                    met[s.archetype] = {
                      count: 0,
                      completed: 0,
                      strengthDrop: null,
                    };
                  met[s.archetype].count++;
                  if (s.status === "completed") met[s.archetype].completed++;
                  if (
                    s.blockerStrengthBefore != null &&
                    s.blockerStrengthAfter != null
                  ) {
                    met[s.archetype].strengthDrop =
                      s.blockerStrengthBefore - s.blockerStrengthAfter;
                  }
                });
                const entries = Object.entries(met);
                if (entries.length === 0) return null;
                return (
                  <div className="mb-5">
                    <h3 className="font-bold text-neutral-300 mb-3 text-sm flex items-center gap-2">
                      🏆 אלבום היצורים — דמויות שהמתאמן פגש
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {entries.map(([archId, info]) => {
                        const card = allArchetypes.find((a) => a.id === archId);
                        if (!card) return null;
                        const status =
                          info.completed >= 2
                            ? "🌕 בעל ברית"
                            : info.completed === 1
                              ? "🌓 זוהה"
                              : "🌑 התעורר";
                        return (
                          <div
                            key={archId}
                            className="shrink-0 w-28 bg-black/30 border border-white/10 rounded-xl p-3 text-center"
                          >
                            <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-amber-500/30 mb-2 bg-black">
                              {card.imageUrl ? (
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  🔮
                                </div>
                              )}
                            </div>
                            <p className="text-white text-xs font-bold truncate">
                              {card.name}
                            </p>
                            <p className="text-amber-500 text-[10px] mt-1">
                              {status}
                            </p>
                            {info.strengthDrop != null &&
                              info.strengthDrop !== 0 && (
                                <p
                                  className={`text-[10px] font-bold mt-0.5 ${info.strengthDrop > 0 ? "text-green-400" : "text-red-400"}`}
                                >
                                  עוצמה {info.strengthDrop > 0 ? "−" : "+"}
                                  {Math.abs(info.strengthDrop)}
                                </p>
                              )}
                            {info.count > 1 && (
                              <p className="text-neutral-500 text-[10px]">
                                {info.count} מפגשים
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <h3 className="font-bold text-neutral-300 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> היסטוריית מסעות
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3">
                {loadingSessions ? (
                  <p className="text-center text-neutral-500 mt-10">
                    טוען מסעות...
                  </p>
                ) : traineeSessions.length === 0 ? (
                  <div className="bg-black/30 rounded-xl p-8 text-center border border-dashed border-white/10">
                    <p className="text-neutral-400 mb-4">
                      עדיין לא התחלתם אף מסע יחד.
                    </p>
                  </div>
                ) : (
                  traineeSessions.map((session) => {
                    const isCompleted = session.status === "completed";
                    const isExpanded = expandedSession === session.id;
                    const agreement =
                      session.answers?.["step_9_resource_action"] ||
                      session.answers?.["s2_step_9_agreement"] ||
                      session.answers?.["s3_step_9_new_contract"] ||
                      session.answers?.["s4_step_6_action"];

                    return (
                      <div
                        key={session.id}
                        className={`border rounded-xl transition-all ${isCompleted ? "bg-black/40 border-amber-500/20" : "bg-black/40 border-white/5 hover:border-white/10"}`}
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-amber-500 font-bold">
                                {session.createdAt
                                  ? new Date(
                                      session.createdAt.toMillis(),
                                    ).toLocaleDateString("he-IL")
                                  : "תאריך חסר"}
                              </span>
                              {isCompleted ? (
                                <span className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> הושלם
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <Clock className="w-3 h-3" /> שלב{" "}
                                  {session.phase}
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-sm truncate">
                              {session.environment
                                ? envLabels[session.environment] ||
                                  session.environment
                                : "טרם נבחר עולם"}
                              {session.archetype && ` · ${session.archetype}`}
                              {session.trigger && ` · "${session.trigger}"`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mr-4">
                            {(agreement || session.trigger) && (
                              <button
                                onClick={() =>
                                  setExpandedSession(
                                    isExpanded ? null : session.id,
                                  )
                                }
                                className="p-2 hover:bg-white/5 rounded-lg transition text-neutral-500 hover:text-white"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => resumeSession(session.id)}
                              className="px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg transition font-bold text-sm"
                            >
                              {isCompleted ? "צפה בסיכום" : "המשך מסע"}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                            {session.trigger && (
                              <div>
                                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">
                                  טריגר
                                </p>
                                <p className="text-neutral-200 text-sm">
                                  "{session.trigger}"
                                </p>
                              </div>
                            )}
                            {agreement && (
                              <div>
                                <p className="text-xs text-amber-500 uppercase tracking-widest mb-1">
                                  ההסכם החדש
                                </p>
                                <p className="text-white font-bold text-sm">
                                  "{agreement}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showStageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div
            ref={stageDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-setup-title"
            className="bg-[#11131a] border border-white/10 rounded-3xl p-6 pt-14 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowStageModal(false)}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white"
            >
              ✕ סגור
            </button>
            <h2
              id="session-setup-title"
              className="text-2xl font-bold text-amber-500 mb-4"
            >
              מה מתאים למפגש היום?
            </h2>
            <p className="text-neutral-400 mb-6 text-sm">
              בחרו יחד לפי המטרה, האמון והמוכנות עכשיו. כיוון ומטרות יכולים
              להתחיל לצד המיפוי; אין התקדמות אוטומטית לפי מספר מפגשים.
            </p>

            <div className="space-y-3 mb-8">
              {[1, 2, 3, 4].map((stageNum) => (
                <button
                  key={stageNum}
                  aria-pressed={selectedStage === stageNum}
                  onClick={() => setSelectedStage(stageNum)}
                  className={`w-full p-4 rounded-xl border text-right transition-all flex items-center justify-between ${
                    selectedStage === stageNum
                      ? "bg-amber-500/10 border-amber-500 text-amber-400"
                      : "bg-black/30 border-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <span className="font-bold">{stageLabels[stageNum]}</span>
                  {selectedStage === stageNum && (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl mb-8">
              <div>
                <span className="text-white font-bold text-sm">מצב נוער</span>
                <span className="text-neutral-500 text-xs block">
                  שפה ישירה לנוער · הדמות מייצגת מנגנון אפשרי
                </span>
              </div>
              <button
                role="switch"
                aria-checked={isYouthMode}
                aria-label="שפה לנוער"
                onClick={() => setIsYouthMode(!isYouthMode)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative ${isYouthMode ? "bg-amber-500" : "bg-neutral-700"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-300 ${isYouthMode ? "right-1" : "left-1"}`}
                />
              </button>
            </div>

            {selectedMechanismId && (
              <p className="text-sm text-teal-200 mb-4">
                הצעה לפתיחה: {findMechanism(selectedMechanismId)?.title}. המשתתף
                יכול לבחור אחרת.
              </p>
            )}
            {selectedStage === 3 && (
              <label className="flex items-start gap-3 text-sm text-neutral-200 mb-5 bg-fuchsia-400/10 border border-fuchsia-300/20 rounded-xl p-4">
                <input
                  type="checkbox"
                  checked={readinessConfirmed}
                  onChange={(e) => setReadinessConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  ביררנו יחד רצון ומוכנות לעבודה חווייתית, יש משאב לחזרה לכאן
                  ועכשיו, והמשתתף יודע שאפשר לעצור או לבחור דרך אחרת בכל רגע.
                </span>
              </label>
            )}
            {sessionError && (
              <p role="alert" className="text-red-300 mb-3">
                {sessionError}
              </p>
            )}
            <button
              disabled={
                startingSession || (selectedStage === 3 && !readinessConfirmed)
              }
              onClick={startNewSession}
              className="w-full py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 transition shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              {startingSession ? "פותח מפגש…" : "פתח מפגש משותף"}
            </button>
          </div>
        </div>
      )}

      <footer className="mt-8 pb-6 text-center">
        <span className="text-neutral-700 text-xs tracking-wide">
          © {new Date().getFullYear()} יוסי מדלסי — מצפן הלב | כל הזכויות
          שמורות
        </span>
      </footer>
    </div>
  );
}

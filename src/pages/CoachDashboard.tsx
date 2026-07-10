import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Plus, User as UserIcon, Calendar, ArrowRight, LogOut, FolderOpen, ChevronDown, ChevronUp, CheckCircle2, Clock } from "lucide-react";
import CoachLiveSession from "./CoachLiveSession";
import HeartCompassLogo from "../components/HeartCompassLogo";
import { worldsData } from "../data/worlds";

export default function CoachDashboard({ user }: { user: User }) {
  const [trainees, setTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTraineeName, setNewTraineeName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedTrainee, setSelectedTrainee] = useState<any | null>(null);
  const [traineeSessions, setTraineeSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(1);

  useEffect(() => {
    fetchTrainees();
  }, [user.uid]);

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "trainees"), where("coachId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setTrainees(list);
    } catch (e) {
      console.error("Error fetching trainees", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrainee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraineeName.trim()) return;
    setIsCreating(true);
    try {
      const newRef = doc(collection(db, "trainees"));
      await setDoc(newRef, {
        coachId: user.uid,
        name: newTraineeName.trim(),
        createdAt: serverTimestamp()
      });
      setNewTraineeName("");
      fetchTrainees();
    } catch (e) {
      console.error("Error creating trainee", e);
    } finally {
      setIsCreating(false);
    }
  };

  // Round 5 age layer: coach tags each trainee once as "נער" (teen) or
  // "מבוגר" (adult) on their card. Steps with an optionsAdult split read
  // this via the session's own `ageGroup` field (copied at session
  // creation below) to decide which option list to show.
  const handleSetAgeGroup = async (e: React.MouseEvent, traineeId: string, ageGroup: "teen" | "adult") => {
    e.stopPropagation();
    setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, ageGroup } : t));
    setSelectedTrainee((prev: any) => prev && prev.id === traineeId ? { ...prev, ageGroup } : prev);
    try {
      await updateDoc(doc(db, "trainees", traineeId), { ageGroup });
    } catch (e) {
      console.error("Error updating trainee age group", e);
    }
  };

  const handleSelectTrainee = async (trainee: any) => {
    setSelectedTrainee(trainee);
    setLoadingSessions(true);
    try {
      const q = query(
        collection(db, "hc_live_sessions"),
        where("coachId", "==", user.uid),
        where("traineeId", "==", trainee.id)
      );
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setTraineeSessions(list);
    } catch (e) {
      console.error("Error fetching sessions", e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const openStartSessionModal = () => {
    if (!selectedTrainee) return;
    const completedSessions = traineeSessions.filter(s => s.status === "completed");

    let nextStage = 1;
    if (completedSessions.length === 1) nextStage = 2;
    if (completedSessions.length === 2) nextStage = 3;
    if (completedSessions.length >= 3) nextStage = 4;

    setSelectedStage(nextStage);
    setShowStageModal(true);
  };

  const startNewSession = async () => {
    if (!selectedTrainee) return;
    const completedSessions = traineeSessions.filter(s => s.status === "completed");
    const lastSession = completedSessions[0];
    const randomId = crypto.randomUUID();

    try {
      await setDoc(doc(db, "hc_live_sessions", randomId), {
        coachId: user.uid,
        traineeId: selectedTrainee.id,
        phase: 0,
        status: "active",
        journeyStage: selectedStage,
        ageGroup: selectedTrainee.ageGroup === "teen" ? "teen" : "adult",
        createdAt: serverTimestamp(),
        sessionNumber: traineeSessions.length + 1,
        previousAgreement: lastSession?.answers?.['step_10_integration'] || lastSession?.answers?.['s2_step_9_agreement'] || lastSession?.answers?.['s3_step_9_new_contract'] || lastSession?.answers?.['s4_step_6_action'] || null,
        previousArchetype: lastSession?.archetype || null,
        previousEnvironment: lastSession?.environment || null,
      });
      setShowStageModal(false);
      setActiveSessionId(randomId);
    } catch(e) {
      console.error("Error creating session", e);
    }
  };

  const resumeSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  if (activeSessionId) {
    return <CoachLiveSession sessionId={activeSessionId} onBack={() => setActiveSessionId(null)} />;
  }

  const stageLabels: Record<number, string> = {
    1: "מסע עומק שלב 1",
    2: "מסע עומק שלב 2",
    3: "מסע עומק שלב 3",
    4: "מסע עומק שלב 4 — מטרות וצמיחה",
  };

  const envLabels: Record<string, string> = {
    clouds: 'ממלכת העננים',
    forest: 'היער הפנימי',
    arcade: 'עיר הניאון',
    fairies: 'יער הפיות והשדונים',
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white p-6 relative" dir="rtl">

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
            <p className="text-sm text-neutral-400">שלום, {user.displayName || "מאמן"}</p>
          </div>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" /> התנתק
        </button>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Left Sidebar: Trainees List */}
        <div className="w-full md:w-1/3 bg-[#171a23] rounded-2xl border border-white/5 p-6 h-[80vh] flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-amber-500" /> המתאמנים שלי
          </h2>

          <form onSubmit={handleCreateTrainee} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="שם מתאמן חדש..."
              value={newTraineeName}
              onChange={(e) => setNewTraineeName(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
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
              <p className="text-center text-neutral-500 mt-10">טוען רשימה...</p>
            ) : trainees.length === 0 ? (
              <p className="text-center text-neutral-500 mt-10">אין לך עדיין מתאמנים.<br/>צור את המתאמן הראשון שלך!</p>
            ) : (
              trainees.map(t => {
                const traineeAgeGroup: "teen" | "adult" = t.ageGroup === "teen" ? "teen" : "adult";
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrainee(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSelectTrainee(t); }}
                    className={`w-full flex items-center justify-between gap-2 p-4 rounded-xl transition border text-right cursor-pointer ${selectedTrainee?.id === t.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5 text-neutral-300'}`}
                  >
                    <span className="font-bold truncate">{t.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex rounded-full overflow-hidden border border-white/10 text-[10px] font-bold">
                        <button
                          onClick={(e) => handleSetAgeGroup(e, t.id, "teen")}
                          title="נער"
                          className={`px-2 py-1 transition ${traineeAgeGroup === "teen" ? "bg-amber-500 text-black" : "bg-black/30 text-neutral-500 hover:text-white"}`}
                        >
                          נער
                        </button>
                        <button
                          onClick={(e) => handleSetAgeGroup(e, t.id, "adult")}
                          title="מבוגר"
                          className={`px-2 py-1 transition ${traineeAgeGroup === "adult" ? "bg-amber-500 text-black" : "bg-black/30 text-neutral-500 hover:text-white"}`}
                        >
                          מבוגר
                        </button>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${selectedTrainee?.id === t.id ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Trainee Profile */}
        <div className="w-full md:w-2/3 bg-[#171a23] rounded-2xl border border-white/5 p-6 h-[80vh] flex flex-col relative overflow-hidden">
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
                  <h2 className="text-3xl font-black text-white">{selectedTrainee.name}</h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    הצטרף בתאריך {selectedTrainee.createdAt ? new Date(selectedTrainee.createdAt.toMillis()).toLocaleDateString('he-IL') : 'לא ידוע'}
                  </p>
                </div>
                <button
                  onClick={openStartSessionModal}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <Plus className="w-5 h-5" /> פתח מסע חדש
                </button>
              </div>

              {traineeSessions.find(s => s.status === "completed") && (() => {
                const last = traineeSessions.find(s => s.status === "completed")!;
                const agreement = last.answers?.['step_10_integration'] || last.answers?.['s2_step_9_agreement'] || last.answers?.['s3_step_9_new_contract'] || last.answers?.['s4_step_6_action'];
                return (
                  <div className="mb-5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-right">
                    <p className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">סיכום מסע אחרון</p>
                    <p className="text-neutral-400 text-xs mb-1">
                      {last.createdAt ? new Date(last.createdAt.toMillis()).toLocaleDateString('he-IL') : ''} · {envLabels[last.environment] || last.environment}
                    </p>
                    {agreement && (
                      <p className="text-white text-sm font-bold">"{agreement}"</p>
                    )}
                  </div>
                );
              })()}

              {/* Creatures Album: every archetype this trainee has met across journeys */}
              {(() => {
                const allArchetypes = worldsData.flatMap(w => w.archetypes);
                const met: Record<string, { count: number; completed: number; strengthDrop: number | null }> = {};
                traineeSessions.forEach(s => {
                  if (!s.archetype) return;
                  if (!met[s.archetype]) met[s.archetype] = { count: 0, completed: 0, strengthDrop: null };
                  met[s.archetype].count++;
                  if (s.status === "completed") met[s.archetype].completed++;
                  if (s.blockerStrengthBefore != null && s.blockerStrengthAfter != null) {
                    met[s.archetype].strengthDrop = s.blockerStrengthBefore - s.blockerStrengthAfter;
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
                        const card = allArchetypes.find(a => a.id === archId);
                        if (!card) return null;
                        const status = info.completed >= 2 ? '🌕 בעל ברית' : info.completed === 1 ? '🌓 זוהה' : '🌑 התעורר';
                        return (
                          <div key={archId} className="shrink-0 w-28 bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                            <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-amber-500/30 mb-2 bg-black">
                              {card.imageUrl ? (
                                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🔮</div>
                              )}
                            </div>
                            <p className="text-white text-xs font-bold truncate">{card.name}</p>
                            <p className="text-amber-500 text-[10px] mt-1">{status}</p>
                            {info.strengthDrop != null && info.strengthDrop !== 0 && (
                              <p className={`text-[10px] font-bold mt-0.5 ${info.strengthDrop > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                עוצמה {info.strengthDrop > 0 ? '−' : '+'}{Math.abs(info.strengthDrop)}
                              </p>
                            )}
                            {info.count > 1 && <p className="text-neutral-500 text-[10px]">{info.count} מפגשים</p>}
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
                  <p className="text-center text-neutral-500 mt-10">טוען מסעות...</p>
                ) : traineeSessions.length === 0 ? (
                  <div className="bg-black/30 rounded-xl p-8 text-center border border-dashed border-white/10">
                    <p className="text-neutral-400 mb-4">עדיין לא התחלתם אף מסע יחד.</p>
                  </div>
                ) : (
                  traineeSessions.map(session => {
                    const isCompleted = session.status === "completed";
                    const isExpanded = expandedSession === session.id;
                    const agreement = session.answers?.['step_10_integration'] || session.answers?.['s2_step_9_agreement'] || session.answers?.['s3_step_9_new_contract'] || session.answers?.['s4_step_6_action'];

                    return (
                      <div key={session.id} className={`border rounded-xl transition-all ${isCompleted ? 'bg-black/40 border-amber-500/20' : 'bg-black/40 border-white/5 hover:border-white/10'}`}>
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-amber-500 font-bold">
                                {session.createdAt ? new Date(session.createdAt.toMillis()).toLocaleDateString('he-IL') : 'תאריך חסר'}
                              </span>
                              {isCompleted ? (
                                <span className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> הושלם
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                  <Clock className="w-3 h-3" /> שלב {session.phase}
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-sm truncate">
                              {session.environment ? envLabels[session.environment] || session.environment : 'טרם נבחר עולם'}
                              {session.archetype && ` · ${session.archetype}`}
                              {session.trigger && ` · "${session.trigger}"`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mr-4">
                            {(agreement || session.trigger) && (
                              <button
                                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                className="p-2 hover:bg-white/5 rounded-lg transition text-neutral-500 hover:text-white"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => resumeSession(session.id)}
                              className="px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-lg transition font-bold text-sm"
                            >
                              {isCompleted ? 'צפה בסיכום' : 'המשך מסע'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                            {session.trigger && (
                              <div>
                                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">טריגר</p>
                                <p className="text-neutral-200 text-sm">"{session.trigger}"</p>
                              </div>
                            )}
                            {agreement && (
                              <div>
                                <p className="text-xs text-amber-500 uppercase tracking-widest mb-1">ההסכם החדש</p>
                                <p className="text-white font-bold text-sm">"{agreement}"</p>
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
          <div className="bg-[#11131a] border border-white/10 rounded-3xl p-8 max-w-md w-full relative">
            <button onClick={() => setShowStageModal(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white">✕ סגור</button>
            <h2 className="text-2xl font-bold text-amber-500 mb-4">בחר את סוג המסע</h2>
            <p className="text-neutral-400 mb-6 text-sm">המערכת המליצה על מסע {selectedStage} בהתאם להיסטוריה של המתאמן, אבל אתה יכול לשנות זאת בהתאם לצורך שלו כעת.</p>

            <div className="space-y-3 mb-8">
              {[1, 2, 3, 4].map(stageNum => (
                <button
                  key={stageNum}
                  onClick={() => setSelectedStage(stageNum)}
                  className={`w-full p-4 rounded-xl border text-right transition-all flex items-center justify-between ${
                    selectedStage === stageNum
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-black/30 border-white/5 text-neutral-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold">{stageLabels[stageNum]}</span>
                  {selectedStage === stageNum && <CheckCircle2 className="w-5 h-5" />}
                </button>
              ))}
            </div>

            <button
              onClick={startNewSession}
              className="w-full py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 transition shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              התחל מסע עכשיו
            </button>
          </div>
        </div>
      )}

      <footer className="mt-8 pb-6 text-center">
        <span className="text-neutral-700 text-xs tracking-wide">
          © {new Date().getFullYear()} יוסי מדלסי — מצפן הלב | כל הזכויות שמורות
        </span>
      </footer>
    </div>
  );
}

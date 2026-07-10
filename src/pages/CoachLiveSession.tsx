import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Plus, LayoutDashboard, FileText, Target, Ear, HeartPulse, CalendarDays, AlertTriangle, XCircle, Zap, RotateCcw, Music } from "lucide-react";
import HeartCompassLogo from "../components/HeartCompassLogo";
import BlockerCircle from "../components/BlockerCircle";
import { worldsData, goodPowersData } from "../data/worlds";
import { journeyPhases, stage2Phases, stage3Phases, stage4Phases, homeworkPlans } from "../data/journey";
import { db } from "../lib/firebase";
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function CoachLiveSession({ sessionId, onBack }: { sessionId: string, onBack: () => void }) {
  const [sessionState, setSessionState] = useState<any>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const [syncError, setSyncError] = useState(false);
  const [isTraineeOnline, setIsTraineeOnline] = useState(false);
  const magicLink = `${window.location.origin}/journey/${sessionId}`;

  const sendWhisper = async (text: string) => {
    if (!text.trim() || !sessionId) return;
    try {
      await updateDoc(doc(db, "hc_live_sessions", sessionId), { coachWhisper: text });
      setWhisperText("");
    } catch (e) {
      console.error("Error sending whisper", e);
    }
  };

  const handleEndJourney = async () => {
    try {
      await updateDoc(doc(db, "hc_live_sessions", sessionId), {
        status: "completed",
        completedAt: serverTimestamp(),
        phase: activePhases.length + 1
      });
    } catch (e) {
      console.error("Error ending journey", e);
    }
    setShowEndConfirm(false);
    // stay on page so coach can view summary and export PDF
  };


  useEffect(() => {
    if (!sessionId) return;
    const docRef = doc(db, "hc_live_sessions", sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setSessionState(docSnap.data());
        setSyncError(false);
      } else {
      }
    }, (e) => {
      console.error("Error listening to session:", e);
      setSyncError(true);
    });
    return () => unsubscribe();
  }, [sessionId]);

  // Recompute the presence indicator every 10s (not only on snapshot updates)
  // so "מנותק" kicks in even if the trainee's tab silently died mid-session.
  useEffect(() => {
    const recompute = () => {
      const lastSeenMs = sessionState?.traineeLastSeen?.toMillis
        ? sessionState.traineeLastSeen.toMillis()
        : null;
      setIsTraineeOnline(lastSeenMs != null && Date.now() - lastSeenMs < 45000);
    };
    recompute();
    const interval = setInterval(recompute, 10000);
    return () => clearInterval(interval);
  }, [sessionState?.traineeLastSeen]);

  const activeWorld = worldsData.find(w => w.id === sessionState?.environment);
  const chosenArchetype = activeWorld?.archetypes.find(a => a.id === sessionState?.archetype);
  const journeyStage = sessionState?.journeyStage || 1;
  const activePhases = journeyStage === 4 ? stage4Phases : journeyStage === 3 ? stage3Phases : journeyStage === 2 ? stage2Phases : journeyPhases;
  const currentStep = sessionState?.phase > 0 ? activePhases[Math.min(sessionState.phase - 1, activePhases.length - 1)] : null;
  // Round 5 age layer: mirror the same options the adult-tagged trainee is
  // actually seeing (optionsAdult), instead of always showing the teen list.
  const activeOptions = (sessionState?.ageGroup === "adult" && currentStep?.optionsAdult) ? currentStep.optionsAdult : currentStep?.options;

  const resourceIdx = activePhases.findIndex(p => p.uiType === "good-powers");
  const showResourceAlert =
    resourceIdx !== -1 &&
    (sessionState?.phase ?? 0) >= resourceIdx + 1 &&
    !sessionState?.resourceArchetype;

  // Resolved resource card + the answer key holding the weekly agreement —
  // shared by the BlockerCircle in the live sidebar and the summary panel.
  const resourceCard = sessionState?.resourceArchetype
    ? (goodPowersData.find(p => p.id === sessionState.resourceArchetype) || worldsData.flatMap(w => w.archetypes).find(a => a.id === sessionState.resourceArchetype))
    : null;
  const agreementAnswerKey = journeyStage === 4
    ? 's4_step_6_action'
    : journeyStage === 3
    ? 's3_step_9_new_contract'
    : journeyStage === 2
    ? 's2_step_9_agreement'
    : 'step_10_integration';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-neutral-100 flex flex-col font-sans" dir="rtl">
      {syncError && (
        <div className="w-full bg-red-600 text-white text-center text-sm font-bold py-1.5 px-4 print:hidden">
          החיבור לסשן נכשל — רענן את הדף
        </div>
      )}
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#11131a] print:hidden">
        <div className="flex items-center gap-2 text-amber-500">
          <HeartCompassLogo size={30} />
          <span className="font-bold text-base tracking-wide">מצפן הלב</span>
          <span className="text-neutral-500 font-normal text-sm">| ממשק מאמן</span>
          <span className="flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isTraineeOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-neutral-500'}`}></span>
            <span className={`text-xs font-bold ${isTraineeOnline ? 'text-green-400' : 'text-neutral-500'}`}>
              {isTraineeOnline ? 'מתאמן מחובר' : 'מנותק / ממתין'}
            </span>
          </span>
        </div>
        <div className="flex gap-3">
          {sessionState?.phase > activePhases.length ? (
            <>
              <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold rounded-lg text-sm hover:bg-amber-500 hover:text-black transition">
                <FileText className="w-4 h-4" /> ייצא סיכום PDF
              </button>
              <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-neutral-300 font-bold rounded-lg text-sm hover:bg-white/10 transition">
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

      <main className="flex-1 flex p-6 gap-6 h-[calc(100vh-64px)] overflow-hidden print:h-auto print:overflow-visible max-w-7xl mx-auto w-full">

        {/* Right Panel: Answers Map */}
        <section className="hidden lg:flex w-80 flex-col gap-4 overflow-y-auto custom-scrollbar print:hidden">
          <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h3 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
              מפת תשובות עד כה
            </h3>
            {sessionState?.draft?.text && sessionState.draft.stepId === currentStep?.id && (
              <div className="mb-4 p-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5">
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block mb-1.5 animate-pulse">
                  ✎ מקליד עכשיו...
                </span>
                <span className="text-neutral-300 text-sm break-words whitespace-pre-wrap">
                  {sessionState.draft.text}
                </span>
              </div>
            )}
            <div className="space-y-4">
              {Object.keys(sessionState?.answers || {}).length === 0 ? (
                <p className="text-neutral-500 text-sm">המתאמן טרם ענה על שאלות בשלב זה.</p>
              ) : (
                Object.entries(sessionState?.answers || {}).map(([key, value]) => {
                  const phase = activePhases.find((p: any) => p.id === key);
                  if (!phase) return null;
                  return (
                    <div key={key} className="text-sm border-b border-white/5 pb-3">
                      <span className="text-neutral-500 block mb-1 text-xs">
                        {phase.traineeTitle.replace(/\[ארכיטיפ\]/g, 'הדמות').replace(/\[משאב\]/g, 'המשאב')}
                      </span>
                      <span className="text-white font-medium break-words whitespace-pre-wrap">{value as string}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Whisper Panel */}
          <div className="bg-[#11131a] rounded-2xl border border-blue-500/20 shadow-2xl p-5">
            <h3 className="text-blue-400 font-bold mb-3 text-xs tracking-widest uppercase flex items-center gap-2">
              💙 שלח לחישה למתאמן
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {["🔥 תשובה אמיצה", "💙 אני איתך", "🤔 ספר עוד", "✨ אתה על הדרך"].map(w => (
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
                onKeyDown={(e) => { if (e.key === 'Enter' && whisperText.trim()) sendWhisper(whisperText); }}
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
                📊 עוצמת החוסם
              </h3>
              <div className="flex items-center justify-center gap-5">
                <div className="text-center">
                  <span className="block text-xs text-neutral-500 mb-1">לפני</span>
                  <span className="text-4xl font-black text-red-400">{sessionState.blockerStrengthBefore}</span>
                  <span className="block text-xs text-neutral-600 mt-1">/10</span>
                </div>
                {sessionState?.blockerStrengthAfter != null && (
                  <>
                    <span className="text-amber-500 text-2xl">→</span>
                    <div className="text-center">
                      <span className="block text-xs text-neutral-500 mb-1">אחרי</span>
                      <span className="text-4xl font-black text-green-400">{sessionState.blockerStrengthAfter}</span>
                      <span className="block text-xs text-neutral-600 mt-1">/10</span>
                    </div>
                    <div className="text-center bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                      <span className="block text-xs text-neutral-500 mb-1">שינוי</span>
                      <span className={`text-2xl font-black ${sessionState.blockerStrengthBefore - sessionState.blockerStrengthAfter > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {sessionState.blockerStrengthBefore - sessionState.blockerStrengthAfter > 0 ? '−' : '+'}{Math.abs(sessionState.blockerStrengthBefore - sessionState.blockerStrengthAfter)}
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
              <p className="text-neutral-300 text-sm leading-relaxed">{chosenArchetype.coachPrompt}</p>
            </div>
          )}

          {/* Blocker / Goal Map — live sidebar */}
          <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-2xl p-6">
            <h3 className="text-amber-500 font-bold mb-4 text-sm tracking-widest uppercase flex items-center gap-2">
              {journeyStage === 4 ? '🎯 מפת המטרה' : '🔄 מעגל החסם'}
            </h3>
            <BlockerCircle
              journeyStage={journeyStage}
              answers={sessionState?.answers || {}}
              trigger={sessionState?.trigger ?? undefined}
              resourceName={resourceCard?.name ?? null}
              agreementText={sessionState?.answers?.[agreementAnswerKey] ?? null}
              variant="live"
            />
          </div>
        </section>

        {/* Center Panel: Live Flow */}
        <section className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar print:overflow-visible">

          <div className="bg-[#11131a] rounded-2xl p-6 border border-white/5 shadow-2xl flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-bold mb-1 text-white">שליטה וסנכרון סשן חי</h2>
              <p className="text-sm text-neutral-400">המסך שלך מסונכרן בזמן אמת למסך הנער.</p>
            </div>
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
              <div className="flex gap-4 items-center">
                <button onClick={onBack} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition border border-white/10" title="חזור לתיק מתאמן">
                  חזור לתיק
                </button>
                <div className="text-amber-500 font-mono text-sm tracking-wider">
                  {magicLink}
                </div>
                <button onClick={() => navigator.clipboard.writeText(magicLink)} className="p-2 hover:bg-white/10 rounded-lg transition" title="העתק קישור">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <Link to={new URL(magicLink).pathname} target="_blank" className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-3 py-2 rounded-lg hover:bg-amber-500/30 transition">
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
              {(sessionState?.phase ?? 0) <= 1 && sessionState?.previousAgreement && (
                <div className="print:hidden bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                  <p className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-3">המסע הקודם — נקודת פתיחה לסשן זה</p>
                  <p className="text-neutral-400 text-sm mb-2">ההסכם שהמתאמן לקח על עצמו:</p>
                  <p className="text-white font-bold text-lg mb-4">"{sessionState.previousAgreement}"</p>
                  <p className="text-neutral-500 text-sm">שאל בפתיחה: <span className="text-neutral-300 italic">האם הצלחת לקיים את ההסכם? מה קרה מאז?</span></p>
                </div>
              )}

              {/* Recurring archetype alert */}
              {sessionState?.archetype && sessionState?.previousArchetype &&
               sessionState.archetype === sessionState.previousArchetype && (
                <div className="print:hidden flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                  <RotateCcw className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-orange-400 font-bold text-sm mb-1">
                      דמות חוזרת — {worldsData.flatMap(w => w.archetypes).find(a => a.id === sessionState.archetype)?.name || sessionState.archetype}
                    </p>
                    <p className="text-neutral-300 text-sm">
                      אותה דמות הופיעה גם בסשן הקודם. שאל: <span className="italic text-white">"מה השתנה מאז הפגישה האחרונה עם הדמות הזו? האם היא חזקה יותר או חלשה יותר?"</span>
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
              ) : sessionState?.phase > activePhases.length ? (
              /* ── JOURNEY COMPLETE: show summary only ── */
              <div className="bg-[#11131a] rounded-2xl border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] p-8">
                  <div className="flex items-center mb-6">
                    <h3 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                      <Target className="w-6 h-6" /> תכנית עבודה להמשך
                    </h3>
                  </div>

                  <p className="text-xl text-white font-medium mb-6 pb-6 border-b border-white/10">
                    {journeyStage === 4
                      ? `התמה המרכזית: מיפוי המטרה וצעד מעשי. ${chosenArchetype?.name} מלווה את המסע.`
                      : `התמה המרכזית: זיהוי החלק השומר (${chosenArchetype?.name}) וחיבורו למשאבים.`}
                  </p>

                  {/* Blocker/Goal Map in Summary */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-8">
                    <h4 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-4">
                      {journeyStage === 4 ? 'מפת המטרה שסוכמה' : 'מעגל החסם שזוהה'}
                    </h4>
                    <BlockerCircle
                      journeyStage={journeyStage}
                      answers={sessionState?.answers || {}}
                      trigger={sessionState?.trigger ?? undefined}
                      resourceName={resourceCard?.name ?? null}
                      agreementText={sessionState?.answers?.[agreementAnswerKey] ?? null}
                      variant="summary"
                    />
                  </div>

                  <div className="space-y-10">
                    <div>
                      <h4 className="flex items-center gap-2 text-neutral-400 font-bold text-sm mb-4 tracking-widest">
                        <CalendarDays className="w-4 h-4" /> 72 השעות הקרובות
                      </h4>
                      <ul className="space-y-4 pr-6 border-r-2 border-amber-500/20">
                        {homeworkPlans[sessionState?.journeyStage || 1]?.[sessionState?.environment as "clouds"|"forest"|"arcade"|"fairies"]?.next72?.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-white text-lg">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-neutral-400 font-bold text-sm mb-4 tracking-widest">
                        <CalendarDays className="w-4 h-4" /> השבוע הקרוב
                      </h4>
                      <ul className="space-y-4 pr-6 border-r-2 border-amber-500/20">
                        {homeworkPlans[sessionState?.journeyStage || 1]?.[sessionState?.environment as "clouds"|"forest"|"arcade"|"fairies"]?.nextWeek?.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-white text-lg">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-neutral-400 font-bold text-sm mb-4 tracking-widest">
                        <CalendarDays className="w-4 h-4" /> 30 הימים הקרובים (מעקב קליני)
                      </h4>
                      <ul className="space-y-4 pr-6 border-r-2 border-amber-500/20">
                        {homeworkPlans[sessionState?.journeyStage || 1]?.[sessionState?.environment as "clouds"|"forest"|"arcade"|"fairies"]?.next30?.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-white text-lg">
                            <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0"></span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
              <div className="print:hidden flex flex-col gap-8">
                {/* Archetype Card Display */}
                <div className="flex flex-col md:flex-row justify-center gap-6">
                  {chosenArchetype && (
                    <div className="bg-[#11131a] rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col items-center p-8 w-full md:w-72">
                      <div className="text-xs font-bold tracking-widest text-neutral-500 mb-6 uppercase">מצב המחבא / {chosenArchetype.name}</div>
                      <div className="w-40 h-64 rounded-2xl border-4 border-amber-500/20 overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
                        {chosenArchetype.imageUrl ? (
                          <img src={chosenArchetype.imageUrl} alt="Card" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center text-4xl">🔮</div>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-white mt-6 text-center">{chosenArchetype.name}</h2>
                      <p className="text-amber-500 text-sm mt-2 text-center">"{sessionState?.trigger || chosenArchetype.description}"</p>
                    </div>
                  )}

                  {sessionState?.resourceArchetype && (goodPowersData.find(p => p.id === sessionState.resourceArchetype) || worldsData.flatMap(w => w.archetypes).find(a => a.id === sessionState.resourceArchetype)) && (() => {
                    const resCard = goodPowersData.find(p => p.id === sessionState.resourceArchetype) || worldsData.flatMap(w => w.archetypes).find(a => a.id === sessionState.resourceArchetype);
                    return (
                      <div className="bg-[#11131a] rounded-2xl border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col items-center p-8 w-full md:w-72 relative">
                        <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">משאב פעיל</div>
                        <div className="text-xs font-bold tracking-widest text-blue-400 mb-6 uppercase">כוח מלווה / {resCard?.name}</div>
                        <div className="w-40 h-64 rounded-2xl border-4 border-blue-500/40 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.2)] relative">
                          {resCard?.imageUrl ? (
                            <img src={resCard.imageUrl} alt="Resource Card" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-blue-900 flex items-center justify-center text-4xl">✨</div>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white mt-6 text-center">{resCard?.name}</h2>
                      </div>
                    );
                  })()}
                </div>

              {/* Consent-ramp critical flag (round 4) — persists from the choice step
                  through every meditation phase whenever the trainee declined
                  release twice in a row. The coach guides the meditation's content
                  by voice, so this is the signal to keep it to grounding/soothing,
                  not release work. */}
              {journeyStage === 3 && currentStep && sessionState?.phase <= activePhases.length &&
                sessionState?.answers?.s3_ramp_choice === "not_yet_final" &&
                (currentStep.uiType === "meditation" || currentStep.id === "s3_ramp_choice") && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 font-bold text-sm md:text-base leading-relaxed">
                    ⚠️ המתאמן לא נתן הסכמה לשחרור — הנחה מדיטציית היכרות/הרגעה בלבד, לא שחרור
                  </p>
                </div>
              )}

              {/* Consent given — calm confirmation with the opener quote for the meditation. */}
              {journeyStage === 3 && currentStep && sessionState?.phase <= activePhases.length &&
                sessionState?.answers?.s3_ramp_choice === "ready" &&
                sessionState?.answers?.s3_ramp_consent &&
                currentStep.uiType === "meditation" && (
                <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                  <span className="text-green-400 text-xl shrink-0">🟢</span>
                  <div>
                    <p className="text-green-300 font-bold text-sm mb-1 tracking-widest uppercase">הסכמה ניתנה — פתיח למדיטציה</p>
                    <p className="text-white text-lg font-medium leading-relaxed">"{sessionState.answers.s3_ramp_consent}"</p>
                  </div>
                </div>
              )}

              {/* The Active Question (Mirrors Trainee UI) — hidden when journey is complete */}
              {currentStep && sessionState?.phase <= activePhases.length && (
                <div className="bg-[#11131a] rounded-2xl border border-blue-500/20 shadow-lg p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {currentStep.traineeTitle.replace(/\[ארכיטיפ\]/g, `"${chosenArchetype?.name || ''}"`).replace(/\[משאב\]/g, `"${sessionState?.resourceArchetype ? worldsData.flatMap(w => w.archetypes).find(a => a.id === sessionState.resourceArchetype)?.name : 'הכוח החדש'}"`)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> {`שלב ${sessionState?.phase ?? 0} מתוך ${activePhases.length}`}
                    </div>
                  </div>

                  {/* Options Mirror */}
                  {currentStep.uiType === "structured-dialogue" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeOptions?.[sessionState?.environment as keyof typeof activeOptions]?.map((option, idx) => {
                      const traineeAnswer = sessionState?.answers?.[currentStep.id];
                      const isSelected = traineeAnswer === option;
                      const letter = String.fromCharCode(65 + idx);

                      return (
                        <div key={idx} className={`p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                          isSelected ? 'bg-amber-500/10 border-amber-500' : 'bg-black/30 border-white/10'
                        }`}>
                          <span className={`w-8 h-8 shrink-0 rounded-md border flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-amber-500/20 text-amber-500 border-amber-500' : 'bg-white/5 text-neutral-400 border-white/10'}`}>{letter}</span>
                          <span className={`flex-1 text-right ${isSelected ? 'text-white font-bold' : 'text-neutral-300'}`}>{option}</span>
                          {isSelected && <span className="text-xs text-blue-400 font-bold tracking-widest uppercase shrink-0">✦ נבחרה</span>}
                        </div>
                      );
                    })}

                    {/* Handle Custom Text in Mirror */}
                    {sessionState?.answers?.[currentStep.id] && !activeOptions?.[sessionState?.environment as keyof typeof activeOptions]?.includes(sessionState.answers[currentStep.id]) && (
                      <div className="col-span-1 md:col-span-2 p-5 rounded-2xl border bg-amber-500/10 border-amber-500 flex items-center gap-4">
                        <span className="w-8 h-8 shrink-0 rounded-md border bg-amber-500/20 text-amber-500 border-amber-500 flex items-center justify-center text-sm font-bold">✎</span>
                        <span className="flex-1 text-white font-bold text-right">"{sessionState.answers[currentStep.id]}"</span>
                        <span className="text-xs text-blue-400 font-bold tracking-widest uppercase shrink-0">טקסט חופשי</span>
                      </div>
                    )}

                    {/* Pattern Revealed (Mirror of what the trainee sees) */}
                    {sessionState?.answers?.[currentStep.id] && currentStep.patternRevealed && (
                      <div className="col-span-1 md:col-span-2 mt-2 p-5 rounded-2xl border bg-blue-500/10 border-blue-500/20 flex items-start gap-4">
                        <span className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">💧</span>
                        <div>
                          <h4 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">תובנה קלינית על התשובה (לשימוש המאמן)</h4>
                          <p className="text-blue-100 font-medium text-lg">
                            {(() => {
                              const answer = sessionState.answers[currentStep.id];
                              const optionsArray = activeOptions?.[sessionState.environment as keyof typeof activeOptions] || [];
                              const answerIdx = optionsArray.indexOf(answer);
                              if (answerIdx !== -1) {
                                const patterns = currentStep.patternRevealed?.[sessionState.environment as keyof typeof currentStep.patternRevealed];
                                return patterns ? patterns[answerIdx] : "";
                              }
                              return "מדהים שהצלחת לנסח את זה בעצמך. הדפוס מנסה להגן עליך, אבל עכשיו אתה מתחיל לראות אותו מבחוץ.";
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Choice Mirror — the consent-ramp "מוכן / עוד לא" moment (s3_ramp_choice) */}
                  {currentStep.uiType === "choice" && currentStep.choiceConfig && (() => {
                    const choiceState = sessionState?.answers?.[currentStep.id];
                    const fearAnswer = sessionState?.answers?.["s3_ramp_notyet_fear"];
                    const trustAnswer = sessionState?.answers?.["s3_ramp_notyet_trust"];
                    const notYetSelected = choiceState === "not_yet_1" || choiceState === "not_yet_final";
                    return (
                      <div className="flex flex-col gap-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-5 rounded-2xl border text-center transition-all ${choiceState === "ready" ? "bg-amber-500/10 border-amber-500" : "bg-black/30 border-white/10"}`}>
                            <span className={choiceState === "ready" ? "text-white font-bold" : "text-neutral-300"}>{currentStep.choiceConfig.yes}</span>
                          </div>
                          <div className={`p-5 rounded-2xl border text-center transition-all ${notYetSelected ? "bg-amber-500/10 border-amber-500" : "bg-black/30 border-white/10"}`}>
                            <span className={notYetSelected ? "text-white font-bold" : "text-neutral-300"}>{currentStep.choiceConfig.notYet}</span>
                          </div>
                        </div>
                        <p className="text-xs text-blue-300 font-bold text-center tracking-wide">
                          {!choiceState && "המתאמן טרם בחר."}
                          {choiceState === "not_yet_1" && !fearAnswer && "בלולאת \"עוד לא\" — ממתין לתשובה: מה הכי מפחיד בלחיות בלעדיו?"}
                          {choiceState === "not_yet_1" && !!fearAnswer && !trustAnswer && "בלולאת \"עוד לא\" — ממתין לתשובה: מה הוא צריך לדעת עליך היום כדי להרשות לעצמו לנוח?"}
                          {choiceState === "not_yet_1" && !!fearAnswer && !!trustAnswer && "שתי השאלות נענו — הבחירה מוצעת שוב למתאמן."}
                          {choiceState === "ready" && "✓ המתאמן בחר להיפרד — עובר למשפט ההסכמה."}
                          {choiceState === "not_yet_final" && "⚠️ \"עוד לא\" נבחר פעמיים ברציפות — אין הסכמה לשחרור."}
                        </p>
                        {(fearAnswer || trustAnswer) && (
                          <div className="flex flex-col gap-3">
                            {fearAnswer && (
                              <div className="p-4 rounded-xl border border-white/10 bg-black/20">
                                <span className="text-neutral-500 text-xs block mb-1">מה הכי מפחיד בלחיות בלעדיו?</span>
                                <span className="text-white break-words whitespace-pre-wrap">{fearAnswer}</span>
                              </div>
                            )}
                            {trustAnswer && (
                              <div className="p-4 rounded-xl border border-white/10 bg-black/20">
                                <span className="text-neutral-500 text-xs block mb-1">מה הוא צריך לדעת עליך היום כדי להרשות לעצמו לנוח?</span>
                                <span className="text-white break-words whitespace-pre-wrap">{trustAnswer}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Scale Mirror — the excitement slider (1-100) */}
                  {currentStep.uiType === "scale" && (
                    <div className="flex flex-col items-center gap-3 py-8">
                      {sessionState?.answers?.[currentStep.id] != null ? (
                        <>
                          <span className="text-8xl font-black text-amber-400 tabular-nums leading-none">
                            {sessionState.answers[currentStep.id]}
                          </span>
                          <span className="text-neutral-500 text-sm">מתוך {currentStep.scaleConfig?.max ?? 100}</span>
                        </>
                      ) : (
                        <span className="text-neutral-500 text-sm">המתאמן טרם הזיז את המחוון</span>
                      )}
                      {sessionState?.answers?.[`${currentStep.id}_refine`] && (
                        <div className="mt-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-bold">
                          מסך דיוק — המתאמן בחר: "{sessionState.answers[`${currentStep.id}_refine`]}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Coach Clinical Deep Dive (Only visible if step is active) */}
              {currentStep && sessionState?.phase <= activePhases.length && (
                <div className="bg-[#11131a] rounded-2xl border border-amber-500/20 shadow-lg p-8">
                  <div className="flex items-center mb-6 border-b border-white/5 pb-4">
                     <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-amber-500"></span> למאמן - בזמן אמת
                     </span>
                  </div>

                  <div className="space-y-8">
                    {/* Framing */}
                    {currentStep.coachFraming && (
                      <div>
                        <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                          <Target className="w-4 h-4" /> מסגור
                        </h4>
                        <p className="text-neutral-300 text-lg leading-relaxed">{currentStep.coachFraming}</p>
                      </div>
                    )}

                    {/* Deepening */}
                    {currentStep.coachDeepeningQuestions && (
                      <div>
                        <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                          <Ear className="w-4 h-4" /> שאלות להעמקה עכשיו
                        </h4>
                        <ul className="space-y-3">
                          {currentStep.coachDeepeningQuestions.map((q, i) => (
                            <li key={i} className="text-white font-medium text-lg flex items-start gap-2">
                               <span className="text-amber-500 mt-1">›</span> {q}
                            </li>
                          ))}
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
                          <p className="text-neutral-300 text-base">{currentStep.coachWarning}</p>
                        </div>
                      )}
                      <div>
                        <h4 className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-3 uppercase tracking-widest">
                          <HeartPulse className="w-4 h-4" /> עוגן גופני
                        </h4>
                        <p className="text-neutral-300 text-base mb-6">שאל איפה בגוף הוא מרגיש את התשובה הזו. חזק את ההכרה.</p>

                        {showResourceAlert && (
                          <div className="mb-3 flex items-center gap-3 bg-amber-500/15 border border-amber-500/50 rounded-xl px-4 py-3 animate-pulse">
                            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                            <p className="text-amber-300 font-bold text-sm">
                              עכשיו הזמן! המתאמן הגיע לשלב שבו כוח חיצוני יכול לעשות את ההבדל. שלח קלף משאב.
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
                          <Plus className="w-4 h-4" /> פתח חפיסת משאבים ושלח למתאמן
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coach Controls for Meditation & Audio */}
                  {currentStep.uiType === "meditation" && (
                    <div className="mt-8 border-t border-white/10 pt-6">
                      <h4 className="flex items-center gap-2 text-fuchsia-400 font-bold text-sm mb-4 uppercase tracking-widest">
                        <Music className="w-4 h-4" /> שליטת מאמן: נגן מוזיקה ומעבר מסכים
                      </h4>

                      <div className="flex flex-col gap-4">
                        <button
                          onClick={async () => {
                            if (sessionId) {
                              try {
                                await updateDoc(doc(db, "hc_live_sessions", sessionId), {
                                  phase: sessionState.phase + 1
                                });
                              } catch (e) {
                                console.error("Error advancing phase", e);
                              }
                            }
                          }}
                          className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-lg rounded-xl transition shadow-[0_0_20px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2"
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
          © {new Date().getFullYear()} יוסי מדלסי — מצפן הלב | כל הזכויות שמורות
        </span>
      </footer>

      {/* End Journey Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#11131a] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(239,68,68,0.15)]">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3">לסיים את המסע?</h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              המסע יסומן כ"הושלם" וכבר לא ניתן יהיה להמשיך אותו. המתאמן יועבר למסך סיכום המסע.
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
          <div className="bg-[#11131a] border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[85vh] flex flex-col relative">
            <button onClick={() => setIsResourceModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white">✕ סגור</button>
            <h2 className="text-2xl font-bold text-amber-500 mb-2">שלח קלף משאב / דמות חכמה</h2>
            <p className="text-neutral-400 mb-6">בחר דמות מתוך החפיסה. הקלף יקפוץ מיד במסך של המתאמן ויציע לו עזרה ותמיכה.</p>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {goodPowersData.map(power => (
                  <div key={power.id} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center hover:border-amber-500/50 cursor-pointer transition"
                    onClick={async () => {
                      if (sessionId) {
                        try {
                          await updateDoc(doc(db, "hc_live_sessions", sessionId), {
                            coachInjectedResource: power.id
                          });
                        } catch (e) {
                          console.error("Error injecting resource", e);
                        }
                      }
                      setIsResourceModalOpen(false);
                    }}
                  >
                    <div className="w-20 h-20 rounded-full bg-[#171a23] mb-3 overflow-hidden border border-white/10 flex items-center justify-center text-4xl">
                      {power.imageUrl ? (
                        <img src={power.imageUrl} alt={power.name} className="w-full h-full object-cover" />
                      ) : (
                        power.icon
                      )}
                    </div>
                    <span className="text-white font-bold block">{power.name}</span>
                    <span className="text-neutral-500 text-xs mt-1 block">{power.role}</span>
                  </div>
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

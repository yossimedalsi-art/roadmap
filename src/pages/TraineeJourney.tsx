import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, TreePine, Gamepad2, ArrowLeft, Droplet, Download, Compass } from "lucide-react";
import Backpack from "../components/Backpack";
import { useParams } from "react-router-dom";
import { worldsData } from "../data/worlds";
import { journeyPhases, homeworkPlans } from "../data/journey";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

export default function TraineeJourney() {
  const { sessionId } = useParams();
  
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<number>(0); 
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [structuredAnswers, setStructuredAnswers] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState<string>("");
  const [injectedResource, setInjectedResource] = useState<string | null>(null);
  const [activeResourceCard, setActiveResourceCard] = useState<string | null>(null);
  const [resourcePowerUsed, setResourcePowerUsed] = useState(false);
  const injectedResourceRef = useRef<string | null>(null);
  injectedResourceRef.current = injectedResource;

  const activeWorld = worldsData.find(w => w.id === selectedEnv);
  const chosenArchetype = activeWorld?.archetypes.find(a => a.id === activeCard);
  
  // Find resource archetype from ALL worlds
  let resourceArchetype: any = null;
  if (activeResourceCard) {
    worldsData.forEach(w => {
      const found = w.archetypes.find(a => a.id === activeResourceCard);
      if (found) resourceArchetype = found;
    });
  }

  // Persistence
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        const docRef = doc(db, "live_sessions", sessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && currentPhase === 0) {
          const parsed = docSnap.data();
          if (parsed.phase > 0) {
            setCurrentPhase(parsed.phase);
            setSelectedEnv(parsed.environment);
            setActiveCard(parsed.archetype);
            setActiveResourceCard(parsed.resourceArchetype || null);
            setSelectedTrigger(parsed.trigger);
            setStructuredAnswers(parsed.answers || {});
          }
        }
      } catch (e) {
        console.error("Error loading session:", e);
      }
    };
    fetchSession();
  }, [sessionId, currentPhase]);

  useEffect(() => {
    if (currentPhase > 0 && sessionId) {
      const saveState = async () => {
        try {
          const docRef = doc(db, "live_sessions", sessionId);
          await setDoc(docRef, {
            phase: currentPhase,
            environment: selectedEnv,
            archetype: activeCard,
            resourceArchetype: activeResourceCard,
            trigger: selectedTrigger,
            answers: structuredAnswers
          }, { merge: true });
        } catch (e) {
          console.error("Error saving state:", e);
        }
      };
      saveState();
    }
  }, [sessionId, currentPhase, selectedEnv, activeCard, activeResourceCard, selectedTrigger, structuredAnswers]);

  // Listen for Coach Commands
  // injectedResourceRef is used instead of injectedResource in deps to avoid recreating
  // the listener on every dismiss — which would trigger a stale Firestore snapshot and
  // reopen the modal before updateDoc clears the field (race condition).
  useEffect(() => {
    if (!sessionId) return;
    const docRef = doc(db, "live_sessions", sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const parsed = docSnap.data();
        if (parsed.coachInjectedResource && parsed.coachInjectedResource !== injectedResourceRef.current) {
          setInjectedResource(parsed.coachInjectedResource);
        }
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleDialogueSelect = (stepId: string, option: string) => {
    setStructuredAnswers(prev => ({ ...prev, [stepId]: option }));
  };

  const getReplacedTitle = (title: string) => {
    let replaced = title.replace(/\[ארכיטיפ\]/g, chosenArchetype?.name || "הדמות");
    replaced = replaced.replace(/\[משאב\]/g, resourceArchetype?.name || "הכוח החדש");
    return replaced;
  };

  const environments = [
    { id: "clouds", title: "ממלכת העננים", icon: Cloud, color: "text-blue-400" },
    { id: "forest", title: "היער הפנימי", icon: TreePine, color: "text-emerald-400" },
    { id: "arcade", title: "עיר הניאון", icon: Gamepad2, color: "text-fuchsia-400" }
  ];

  // Find the injected resource archetype if it exists
  let injectedArchetype: any = null;
  if (injectedResource) {
    worldsData.forEach(w => {
      const found = w.archetypes.find(a => a.id === injectedResource);
      if (found) injectedArchetype = found;
    });
  }

  const handleUseResource = () => {
    setResourcePowerUsed(true);
    setTimeout(() => setResourcePowerUsed(false), 2500);
  };

  const renderResourcePowerFlash = () => (
    <AnimatePresence>
      {resourcePowerUsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-24 left-6 z-[60] bg-amber-500 text-black font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm"
        >
          ✨ הכוח פועל! {resourceArchetype?.name} מחזק אותך
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderInjectedModal = () => {
    return (
      <AnimatePresence>
        {injectedResource && injectedArchetype && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0d0f14]/95 backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}
              className="bg-[#171a23] border border-amber-500/50 shadow-[0_0_80px_rgba(245,158,11,0.2)] rounded-3xl p-8 max-w-lg w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none"></div>
              
              <span className="text-amber-500 font-bold tracking-widest text-xs mb-6 block uppercase">המאמן שלח לך משאב חדש</span>
              
              <div className="w-full h-64 rounded-2xl border-2 border-amber-500/30 overflow-hidden relative mb-6">
                {injectedArchetype.imageUrl ? (
                  <img src={injectedArchetype.imageUrl} alt={injectedArchetype.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center text-6xl">✨</div>
                )}
              </div>
              
              <h2 className="text-3xl font-black mb-4 text-white">{injectedArchetype.name}</h2>
              <p className="text-neutral-300 text-lg leading-relaxed mb-8">
                {injectedArchetype.description}
              </p>
              
              <button 
                onClick={async () => {
                  setActiveResourceCard(injectedResource);
                  setInjectedResource(null);
                  if (sessionId) {
                    try {
                      const docRef = doc(db, "live_sessions", sessionId);
                      await updateDoc(docRef, { coachInjectedResource: null });
                    } catch (e) {
                      console.error("Error clearing coach injected resource", e);
                    }
                  }
                }}
                className="w-full py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 transition shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              >
                צרף למסע שלי
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (currentPhase === 0) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 relative" dir="rtl">
        <h1 className="text-5xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
          לאן נכנסים היום?
        </h1>
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
          {environments.map(env => (
            <motion.button 
              key={env.id} 
              onClick={() => { setSelectedEnv(env.id); setCurrentPhase(1); }} 
              whileHover={{ y: -5 }} 
              className="p-10 rounded-3xl border border-white/5 bg-[#171a23] shadow-xl hover:border-amber-500/50 transition-all flex flex-col items-center"
            >
              <env.icon className={`w-16 h-16 mb-6 ${env.color}`} />
              <h2 className="text-2xl font-bold">{env.title}</h2>
            </motion.button>
          ))}
        </div>
        {renderInjectedModal()}
        <Backpack resourceArchetype={resourceArchetype} onUseResource={handleUseResource} />
        {renderResourcePowerFlash()}
      </div>
    );
  }

  if (currentPhase === 1 || currentPhase === 2) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white p-6 relative overflow-x-hidden" dir="rtl">
        
        {/* BACK TO WORLDS BUTTON */}
        <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={() => {
              setCurrentPhase(0);
              setSelectedEnv(null);
              setActiveCard(null);
              setSelectedTrigger(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition text-sm text-neutral-400 hover:text-white"
          >
            → חזור לבחירת עולם
          </button>
        </div>

        <header className="mb-12 text-center mt-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">מי חסם לך את הדרך היום?</h1>
          <p className="text-neutral-400">הפוך את הקלף של היצור שהכי מזדהה עם איך שאתה מרגיש עכשיו.</p>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-1000 pb-20">
          {activeWorld?.archetypes.map(arc => {
            const isFlipped = activeCard === arc.id;

            return (
              <div key={arc.id} className="relative h-[500px] [perspective:1000px]">
                <motion.div
                  className="w-full h-full relative preserve-3d cursor-pointer"
                  onClick={() => !isFlipped && setActiveCard(arc.id)}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-[#171a23] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col items-center text-center shadow-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all group">
                    <div className="w-full h-64 bg-black relative">
                      {arc.imageUrl ? (
                        <img src={arc.imageUrl} alt={arc.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🔮</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#171a23] to-transparent h-20"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-start w-full relative -mt-6">
                      <div className="text-amber-500 text-xs font-bold tracking-widest mb-1">הקלף הנוכחי</div>
                      <h3 className="text-2xl font-black mb-2 text-white">{arc.name}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{arc.description}</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 bg-[#171a23] border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] rounded-[2rem] p-6 flex flex-col" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveCard(null); setSelectedTrigger(null); }} className="text-neutral-500 text-sm hover:text-white mb-6 text-right">✕ חזור לקלפים</button>
                    <h4 className="font-bold text-xl mb-6 text-white text-center">מה העיר את {arc.name}?</h4>
                    
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                      {arc.triggers.map((trigger, idx) => (
                        <button 
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setSelectedTrigger(trigger); }}
                          className={`text-right p-4 rounded-xl border text-sm transition-all ${selectedTrigger === trigger ? 'bg-amber-500/10 text-amber-400 border-amber-500 font-bold' : 'bg-black/20 border-white/5 hover:border-white/20 text-neutral-300'}`}
                        >
                          {trigger}
                        </button>
                      ))}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className={`p-4 rounded-xl border flex flex-col transition-all ${selectedTrigger === customInput && customInput.trim().length > 0 ? 'bg-amber-500/10 border-amber-500' : 'bg-black/20 border-white/5'}`}
                      >
                        <div className="text-xs text-neutral-500 mb-2 flex items-center gap-2">✎ אחר - נסח במילים שלך</div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="במילים שלי..." 
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            className="bg-transparent flex-1 outline-none text-sm text-white"
                          />
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (customInput.trim()) setSelectedTrigger(customInput); 
                            }}
                            className="text-xs bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded hover:bg-amber-500 hover:text-black transition"
                          >
                            שמור
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <motion.button 
                        initial={{ opacity: 0 }} animate={{ opacity: selectedTrigger ? 1 : 0.3 }}
                        disabled={!selectedTrigger}
                        onClick={(e) => { e.stopPropagation(); setCurrentPhase(3); }}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 text-black font-bold rounded-xl transition-all"
                      >
                        התחל חקירה <ArrowLeft className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
        {renderInjectedModal()}
        <Backpack resourceArchetype={resourceArchetype} onUseResource={handleUseResource} />
        {renderResourcePowerFlash()}
      </div>
    );
  }

  // Phases 3 to 8
  if (currentPhase >= 3 && currentPhase <= journeyPhases.length) {
    const currentStep = journeyPhases[currentPhase - 1];
    const answer = structuredAnswers[currentStep.id];
    const isAnswered = !!answer;

    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center p-6 relative overflow-hidden" dir="rtl">
        <header className="w-full max-w-4xl flex justify-between items-center mt-6 mb-12">
          <span className="text-amber-500 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> שלב {currentPhase} מתוך {journeyPhases.length}
          </span>
          <span className="text-neutral-500 text-sm">חקירה עם {chosenArchetype?.name}</span>
        </header>

        <main className="flex-1 w-full max-w-3xl flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.div key={currentPhase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full bg-[#171a23] rounded-3xl border border-white/5 shadow-2xl p-8 md:p-12 relative">
              
              {/* Card display */}
              <div className="flex justify-center gap-6 mb-8 mt-2">
                {/* Original Archetype */}
                <div className="w-32 h-48 md:w-40 md:h-64 rounded-2xl border-4 border-amber-500/20 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)] relative">
                  {chosenArchetype?.imageUrl ? (
                    <img src={chosenArchetype.imageUrl} alt="Card" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center text-4xl">🔮</div>
                  )}
                  <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm p-2 text-center text-white font-bold text-sm">
                    {chosenArchetype?.name}
                  </div>
                </div>

                {/* Resource Archetype (if any) */}
                {resourceArchetype && (
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                    className="w-32 h-48 md:w-40 md:h-64 rounded-2xl border-4 border-blue-500/40 overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.2)] relative"
                  >
                    {resourceArchetype.imageUrl ? (
                      <img src={resourceArchetype.imageUrl} alt="Resource Card" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-900 flex items-center justify-center text-4xl">✨</div>
                    )}
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">משאב מחזק</div>
                    <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm p-2 text-center text-white font-bold text-sm">
                      {resourceArchetype.name}
                    </div>
                  </motion.div>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black mb-10 text-center text-white/90 leading-relaxed">
                {getReplacedTitle(currentStep.traineeTitle)}
              </h2>

              {currentStep.uiType === "structured-dialogue" && currentStep.options && selectedEnv && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {currentStep.options[selectedEnv as keyof typeof currentStep.options]?.map((option, idx) => {
                    const isSelected = answer === option;
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    
                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleDialogueSelect(currentStep.id, option)}
                        className={`p-5 rounded-2xl border text-right transition-all duration-300 flex items-center justify-between ${
                          isSelected 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                          : 'bg-black/30 border-white/5 hover:border-white/20 text-neutral-300'
                        }`}
                      >
                        <span className="leading-snug">{option}</span>
                        <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs ml-4 ${isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-neutral-500'}`}>
                          {letter}
                        </span>
                      </motion.button>
                    );
                  })}
                  
                  {/* Custom Option for structured questions too! */}
                  <div 
                    className={`p-5 rounded-2xl border col-span-1 md:col-span-2 transition-all duration-300 flex flex-col ${
                      answer === customInput && customInput.trim().length > 0
                      ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'bg-black/30 border-white/5'
                    }`}
                  >
                    <div className="text-xs text-neutral-500 mb-2 flex items-center gap-2">✎ אחר - נסח במילים שלך</div>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="text" 
                        placeholder="הקלד תשובה אחרת..." 
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="bg-transparent flex-1 outline-none text-sm text-white placeholder-neutral-600"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customInput.trim()) {
                            handleDialogueSelect(currentStep.id, customInput);
                          }
                        }}
                      />
                      <button 
                        onClick={() => { 
                          if (customInput.trim()) handleDialogueSelect(currentStep.id, customInput); 
                        }}
                        className="bg-amber-500/20 text-amber-500 px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-500 hover:text-black transition"
                      >
                        שמור
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pattern Revealed Block (Only shows after answering) */}
              <AnimatePresence>
                {isAnswered && currentStep.patternRevealed && selectedEnv && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }} 
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex gap-4 text-blue-100">
                      <Droplet className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                      <div>
                        <h4 className="text-blue-400 font-bold text-sm tracking-widest mb-2 uppercase">דפוס שנחשף</h4>
                        <p className="text-lg">
                          {(() => {
                            const optionsArray = currentStep.options?.[selectedEnv as keyof typeof currentStep.options] || [];
                            const answerIdx = optionsArray.indexOf(answer);
                            if (answerIdx !== -1) {
                              const patterns = currentStep.patternRevealed?.[selectedEnv as keyof typeof currentStep.patternRevealed];
                              return patterns ? patterns[answerIdx] : "";
                            }
                            // Custom input fallback
                            return "מדהים שהצלחת לנסח את זה בעצמך. הדפוס מנסה להגן עליך, אבל עכשיו אתה מתחיל לראות אותו מבחוץ.";
                          })()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="w-full max-w-3xl mt-8 flex justify-between items-center">
            <span className="text-neutral-500 text-sm tracking-widest uppercase">HEART COMPASS</span>
            <AnimatePresence>
              {isAnswered && (
                <motion.button 
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setCustomInput(""); // clear custom input for next screen
                    setCurrentPhase(prev => prev + 1);
                  }}
                  className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-full transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  שלב הבא
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </main>
        {renderInjectedModal()}
        <Backpack resourceArchetype={resourceArchetype} onUseResource={handleUseResource} />
        {renderResourcePowerFlash()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 text-center relative" dir="rtl">

      <div className="absolute top-6 right-6 print:hidden">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full hover:bg-amber-500 hover:text-black font-bold transition text-sm">
          <Download className="w-4 h-4" /> הורד סיכום מסע (PDF)
        </button>
      </div>

      <div className="w-full max-w-2xl bg-[#171a23] border border-white/5 shadow-2xl rounded-3xl p-10 mt-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Compass className="w-12 h-12 text-amber-500 mb-6" />
          <h1 className="text-3xl md:text-4xl font-black mb-8 text-white tracking-wide">
            סיום המסע: המצפן הפנימי
          </h1>

          <div className="w-full text-right bg-black/40 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-4 border-b border-white/5 pb-2">מה גילינו היום</h3>
            <p className="text-neutral-300 leading-relaxed mb-4 text-lg">
              התחלנו את המסע במצב של סערה, ופגשנו את השומר שהתעורר כדי להגן עליך: <strong className="text-white text-xl ml-1">{chosenArchetype?.name}</strong>.
            </p>
            <p className="text-neutral-300 leading-relaxed text-lg">
              הבנו שהתפקיד האמיתי שלו הוא לא לפגוע בך, אלא לשמור עליך מתוך פחד עמוק. 
              הבאנו אליו את המשאב הפנימי שלך, והגענו להסכם חשוב לקראת השבוע הקרוב:
            </p>
          </div>

          <div className="w-full text-right bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
            <h3 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
              ההסכם החדש שלנו <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </h3>
            <p className="text-xl font-bold text-white leading-relaxed">
              "{structuredAnswers['step_10_integration'] || 'אקח נשימה במקום להגיב מיד'}"
            </p>
          </div>

          <div className="w-full text-right bg-[#11131a] border border-white/5 rounded-2xl p-6 mb-8 print:border-neutral-200 print:bg-transparent">
            <h3 className="text-amber-500 font-bold text-sm tracking-widest uppercase mb-6 border-b border-white/5 pb-2">תכנית עבודה: שיעורי בית</h3>
            
            <div className="mb-6">
              <h4 className="text-neutral-400 font-bold text-sm mb-3">72 השעות הקרובות:</h4>
              <ul className="space-y-3 pr-4 border-r-2 border-amber-500/20 list-none">
                {selectedEnv && homeworkPlans[selectedEnv as keyof typeof homeworkPlans]?.next72.map((item, idx) => (
                  <li key={idx} className="text-neutral-300 text-base relative before:content-[''] before:absolute before:right-[-22px] before:top-2 before:w-1.5 before:h-1.5 before:bg-amber-500 before:rounded-full">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-neutral-400 font-bold text-sm mb-3">השבוע הקרוב:</h4>
              <ul className="space-y-3 pr-4 border-r-2 border-amber-500/20 list-none">
                {selectedEnv && homeworkPlans[selectedEnv as keyof typeof homeworkPlans]?.nextWeek.map((item, idx) => (
                  <li key={idx} className="text-neutral-300 text-base relative before:content-[''] before:absolute before:right-[-22px] before:top-2 before:w-1.5 before:h-1.5 before:bg-amber-500 before:rounded-full">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-neutral-500 text-sm max-w-sm mx-auto">
            המאמן שלך קיבל את תובנות המסע ואת תכנית העבודה המלאה. <br />
            מומלץ להוריד עותק של הסיכום ולשמור לעצמך.
          </p>

          <div className="mt-10 mb-4 print:hidden">
            <button 
              onClick={() => {
                if (sessionId) localStorage.removeItem(`session_${sessionId}`);
                setCurrentPhase(0);
                setSelectedEnv(null);
                setActiveCard(null);
                setSelectedTrigger(null);
                setStructuredAnswers({});
                setCustomInput("");
                window.scrollTo(0, 0);
              }}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white font-bold transition text-sm text-neutral-400"
            >
              סיום והתחלת מסע חדש
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .bg-\\[\\#171a23\\] { background: white !important; border: 2px solid #ddd !important; box-shadow: none !important; }
          .text-white, .text-neutral-100, .text-neutral-300, .text-neutral-500 { color: black !important; }
          .bg-black\\/40 { background: #f9fafb !important; }
          .bg-amber-500\\/10 { background: #fffbeb !important; }
          .text-amber-500 { color: #d97706 !important; }
          * { direction: rtl !important; }
        }
      `}</style>
    </div>
  );
}

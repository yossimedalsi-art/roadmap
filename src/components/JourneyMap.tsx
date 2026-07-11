import { motion } from "framer-motion";
import { Check, Compass, Lock, Star } from "lucide-react";
import type { JourneyStep } from "../data/journey";

interface JourneyMapProps {
  currentPhase: number;
  phases: JourneyStep[];
  onClose: () => void;
  // Resolves raw placeholder tokens ([ארכיטיפ], [משאב], [משפט_מטרה], [חוזה],
  // [רווח]) in a phase's traineeTitle into the trainee's actual answers —
  // TraineeJourney already has getReplacedTitle for this. Defaults to
  // identity so callers that don't pass it still render (just with the raw
  // tokens, same as before this prop existed).
  resolveTitle?: (title: string) => string;
}

export default function JourneyMap({ currentPhase, phases, onClose, resolveTitle = (title) => title }: JourneyMapProps) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black"></div>
      
      <div className="relative w-full max-w-4xl bg-[#11131a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 text-neutral-400 hover:text-white transition bg-white/5 p-2 rounded-full"
        >
          ✕
        </button>
        
        <div className="text-center mb-12">
          <Compass className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white tracking-tight">מפת המסע שלך</h2>
          <p className="text-neutral-400 mt-2">כל תחנה מקרבת אותך לגילוי המשאב הפנימי</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-white/5 -translate-y-1/2 hidden md:block rounded-full"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
            {phases.map((phase, index) => {
              const isCompleted = currentPhase > phase.order;
              const isCurrent = currentPhase === phase.order;
              const isLocked = currentPhase < phase.order;

              return (
                <div key={phase.id} className="flex flex-col items-center relative group w-full md:w-auto">
                  {/* Connecting line for mobile */}
                  {index < phases.length - 1 && (
                    <div className="w-1 h-12 bg-white/5 md:hidden my-2"></div>
                  )}

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10
                      ${isCompleted ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 
                        isCurrent ? 'bg-[#1a1d27] border-amber-500 text-amber-500 scale-110 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 
                        'bg-black/50 border-white/10 text-neutral-600'}`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : 
                     isLocked ? <Lock className="w-5 h-5" /> : 
                     <Star className="w-6 h-6 fill-amber-500/20" />}

                    {/* Ping animation for current step */}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-20"></span>
                    )}
                  </motion.div>
                  
                  <div className={`mt-4 text-center md:absolute md:top-full md:mt-6 md:w-32 transition-colors duration-300
                    ${isCurrent ? 'text-amber-500 font-bold' : isCompleted ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    <div className="text-xs uppercase tracking-widest opacity-50 mb-1">תחנה {phase.order}</div>
                    <div className="text-sm line-clamp-2 leading-tight">{resolveTitle(phase.traineeTitle).split('/')[0]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wind, CheckCircle2 } from "lucide-react";

interface BreathingGameProps {
  onComplete: () => void;
}

export default function BreathingGame({ onComplete }: BreathingGameProps) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "done">("inhale");
  const [cycles, setCycles] = useState(0);
  const targetCycles = 3;

  useEffect(() => {
    if (phase === "done") return;

    let timer: number;
    
    if (phase === "inhale") {
      timer = window.setTimeout(() => setPhase("hold"), 4000);
    } else if (phase === "hold") {
      timer = window.setTimeout(() => setPhase("exhale"), 2000);
    } else if (phase === "exhale") {
      timer = window.setTimeout(() => {
        if (cycles + 1 >= targetCycles) {
          setPhase("done");
          setTimeout(() => onComplete(), 2000); // Complete after 2 seconds
        } else {
          setCycles(c => c + 1);
          setPhase("inhale");
        }
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [phase, cycles, onComplete]);

  const getInstructions = () => {
    switch(phase) {
      case "inhale": return "שאף אוויר לאט...";
      case "hold": return "החזק...";
      case "exhale": return "נשוף לאט החוצה...";
      case "done": return "מעולה. הראייה התבהרה.";
    }
  };

  const getScale = () => {
    switch(phase) {
      case "inhale": return 1.5;
      case "hold": return 1.5;
      case "exhale": return 1;
      case "done": return 1;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded-3xl border border-white/5 my-8">
      <div className="text-center mb-12">
        <Wind className="w-8 h-8 text-cyan-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-bold text-white mb-2">לפני שממשיכים, בוא ננקה את הערפל</h3>
        <p className="text-neutral-400 text-sm">נשום יחד עם המעגל {targetCycles} פעמים</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        {/* Breathing Circle */}
        <motion.div
          animate={{ scale: getScale() }}
          transition={{ duration: phase === "hold" ? 2 : 4, ease: "easeInOut" }}
          className="absolute inset-0 bg-cyan-500/20 rounded-full border border-cyan-400/30 shadow-[0_0_40px_rgba(34,211,238,0.2)]"
        />
        
        {/* Core */}
        <div className="w-24 h-24 bg-[#11131a] rounded-full z-10 flex items-center justify-center border border-white/10 shadow-xl">
          {phase === "done" ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </motion.div>
          ) : (
            <span className="text-cyan-400 font-bold text-2xl">{cycles + 1}/{targetCycles}</span>
          )}
        </div>
      </div>

      <motion.div 
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white tracking-wider"
      >
        {getInstructions()}
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { Heart, Trash2, Zap } from "lucide-react";

interface Thought {
  id: string;
  text: string;
  isPositive: boolean;
}

const defaultThoughts: Thought[] = [
  { id: "1", text: "אני תמיד הורס הכל", isPositive: false },
  { id: "2", text: "יש לי את היכולת ללמוד מזה", isPositive: true },
  { id: "3", text: "אף אחד לא באמת מבין אותי", isPositive: false },
  { id: "4", text: "מותר לי לבקש עזרה", isPositive: true },
  { id: "5", text: "הפחד הזה בא להגן עליי", isPositive: true },
];

interface ThoughtSorterProps {
  onComplete: () => void;
}

export default function ThoughtSorter({ onComplete }: ThoughtSorterProps) {
  const [thoughts] = useState<Thought[]>(defaultThoughts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();

  const handleDragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Swipe Right (Positive)
    if (offset > 100 || velocity > 500) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      handleNextThought();
    } 
    // Swipe Left (Negative)
    else if (offset < -100 || velocity < -500) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      handleNextThought();
    }
    // Return to center
    else {
      controls.start({ x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const handleNextThought = () => {
    if (currentIndex < thoughts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      controls.set({ x: 0, opacity: 1 });
    } else {
      onComplete();
    }
  };

  if (currentIndex >= thoughts.length) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#11131a] rounded-3xl border border-white/5 my-8 relative overflow-hidden" dir="rtl">
      
      <div className="text-center mb-8">
        <Zap className="w-8 h-8 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">מיון מחשבות</h3>
        <p className="text-neutral-400 text-sm">החלק ימינה מחשבות מקדמות, שמאלה מחשבות מעכבות</p>
      </div>

      <div className="relative w-full max-w-sm h-48 flex items-center justify-center perspective-1000">
        
        {/* Background Indicators */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none opacity-50">
          <div className="flex flex-col items-center text-red-400">
            <Trash2 className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">לפח</span>
          </div>
          <div className="flex flex-col items-center text-emerald-400">
            <Heart className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider">לשמור</span>
          </div>
        </div>

        {/* Draggable Card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={controls}
          className="absolute z-10 w-64 h-32 bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center p-6 cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          <p className="text-lg font-bold text-white text-center leading-snug">
            "{thoughts[currentIndex].text}"
          </p>
        </motion.div>
        
        {/* Next Card Preview */}
        {currentIndex < thoughts.length - 1 && (
          <div className="absolute z-0 w-64 h-32 bg-[#1a1d27]/50 border border-white/5 rounded-2xl shadow-inner scale-95 translate-y-4"></div>
        )}
      </div>
      
      <div className="mt-8 text-neutral-500 font-mono text-sm">
        {currentIndex + 1} / {thoughts.length}
      </div>
    </div>
  );
}

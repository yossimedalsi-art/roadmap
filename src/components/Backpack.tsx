import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Backpack as BackpackIcon, X, Shield, Sparkles } from "lucide-react";

interface BackpackProps {
  resourceArchetype: any;
  onUseResource: () => void;
}

export default function Backpack({ resourceArchetype, onUseResource }: BackpackProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Backpack Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[60] bg-[#11131a] border border-white/10 shadow-2xl p-4 rounded-full text-white hover:bg-[#1a1d27] transition hover:scale-110 group"
      >
        <BackpackIcon className="w-6 h-6 text-amber-500 group-hover:rotate-12 transition" />
        {resourceArchetype && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-[#11131a]"></span>
        )}
      </button>

      {/* Backpack Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#11131a] border-r border-white/10 shadow-2xl z-[60] p-6 flex flex-col"
              dir="rtl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BackpackIcon className="w-5 h-5 text-amber-500" />
                  תרמיל כלים
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {resourceArchetype ? (
                  <div className="bg-black/30 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-xs text-amber-500 font-bold mb-2">נאסף במסע</div>
                    <div className="w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-amber-500/20 mb-4 relative">
                      {resourceArchetype.imageUrl ? (
                        <img src={resourceArchetype.imageUrl} alt={resourceArchetype.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#1a1d27] flex items-center justify-center text-4xl">🌟</div>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-white text-center mb-2">{resourceArchetype.name}</h4>
                    
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        onUseResource();
                      }}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      השתמש בכוח
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-neutral-500 border-2 border-dashed border-white/10 rounded-2xl">
                    <Shield className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">התרמיל ריק כרגע</p>
                    <p className="text-xs mt-1">אסוף כוחות במהלך המסע</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

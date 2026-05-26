import { motion } from "framer-motion";
import { Compass, Sparkles, Headset } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-[#0a0a0a] to-[#0a0a0a] -z-10" />
      
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm tracking-[0.3em] uppercase text-neutral-400">
          <Compass className="h-4 w-4 text-emerald-500" />
          <span>מצפן הלב</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-xs uppercase tracking-[0.4em] text-emerald-500/80 mb-6"
        >
          כלי מקצועי לעבודה רגשית
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}
          className="font-black text-5xl md:text-7xl tracking-tight mb-6"
        >
          מסע של סקרנות <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            לגילוי הקולות שבפנים
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}
          className="max-w-2xl text-lg text-neutral-400 mb-12"
        >
          המאמן שלך מחכה לך בפנים. כדי להיכנס למסע, יש ללחוץ על הלינק הייחודי שקיבלת בוואטסאפ או בזום.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        >
          <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 text-center max-w-sm mx-auto">
            <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">ממתינים ללינק</h3>
            <p className="text-sm text-neutral-500">
              אין צורך להזין סיסמה. הלינק שקיבלת יכניס אותך אוטומטית לסביבת העבודה שלך.
            </p>
          </div>
        </motion.div>

        <div className="absolute bottom-6 flex flex-col items-center gap-4">
          <Link to="/coach" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-400 transition-colors">
            <Headset className="h-3 w-3" />
            כניסת מאמנים
          </Link>
        </div>
      </main>
    </div>
  );
}

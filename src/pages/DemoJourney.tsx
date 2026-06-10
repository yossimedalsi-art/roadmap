import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, TreePine, Gamepad2, Sparkles, ArrowLeft, MessageCircle, Compass, Lock } from "lucide-react";
import { worldsData } from "../data/worlds";
import { journeyPhases } from "../data/journey";
import HeartCompassLogo from "../components/HeartCompassLogo";

// ── Standalone demo: no Firebase, no persistence. ──────────────────────
// A 5-step teaser of the full journey, ending with a WhatsApp CTA.

const WHATSAPP_LINK =
  "https://wa.me/972544580285?text=" +
  encodeURIComponent("היי יוסי, ניסיתי את הדמו של מצפן הלב ואני רוצה לשמוע עוד על המסע המלא");

const MAIN_SITE = "https://heartcompass.vercel.app/";

const FALLBACK_IMAGE = "/images/guardian.png";
const safeImage = (src?: string) => (!src || src.trim() === "" ? FALLBACK_IMAGE : src);
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (!target.src.includes(FALLBACK_IMAGE)) target.src = FALLBACK_IMAGE;
};

const demoThemes: Record<string, { bg: string; radial: string; accentText: string }> = {
  clouds: { bg: "bg-[#06091a]", radial: "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.18) 0%, transparent 60%)", accentText: "text-indigo-400" },
  forest: { bg: "bg-[#030d07]", radial: "radial-gradient(ellipse at 15% 10%, rgba(34,197,94,0.14) 0%, transparent 55%)", accentText: "text-emerald-400" },
  arcade: { bg: "bg-[#0a0214]", radial: "radial-gradient(ellipse at 50% 0%, rgba(217,70,239,0.18) 0%, transparent 55%)", accentText: "text-fuchsia-400" },
  fairies: { bg: "bg-[#0a0710]", radial: "radial-gradient(ellipse at 30% 10%, rgba(236,72,153,0.14) 0%, transparent 55%)", accentText: "text-pink-400" },
};

const environments = [
  { id: "clouds", title: "ממלכת העננים", icon: Cloud, color: "text-blue-400" },
  { id: "forest", title: "היער הפנימי", icon: TreePine, color: "text-emerald-400" },
  { id: "arcade", title: "עיר הניאון", icon: Gamepad2, color: "text-fuchsia-400" },
  { id: "fairies", title: "יער הפיות והשדונים", icon: Sparkles, color: "text-pink-400" },
];

export default function DemoJourney() {
  const [step, setStep] = useState(0);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [feelingIdx, setFeelingIdx] = useState<number | null>(null);
  const [urge, setUrge] = useState<string | null>(null);
  const [urgeIdx, setUrgeIdx] = useState<number | null>(null);

  const theme = selectedEnv ? demoThemes[selectedEnv] : { bg: "bg-[#0d0f14]", radial: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)", accentText: "text-amber-500" };
  const activeWorld = worldsData.find(w => w.id === selectedEnv);
  const chosenArchetype = activeWorld?.archetypes.find(a => a.id === activeCard);

  const feelingStep = journeyPhases.find(p => p.id === "step_3_feeling");
  const urgeStep = journeyPhases.find(p => p.id === "step_5_urge");

  const envKey = selectedEnv as "clouds" | "forest" | "arcade" | "fairies";

  const demoBadge = (
    <div className="fixed top-4 left-4 z-50 bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-full shadow-lg tracking-wide">
      🎮 דמו — טעימה מהמסע
    </div>
  );

  const ctaFooter = (
    <p className="text-neutral-600 text-xs mt-8 text-center relative z-10">
      © {new Date().getFullYear()} יוסי מדלסי — מצפן הלב | כל הזכויות שמורות
    </p>
  );

  // ── STEP 0: World select ──
  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
        {demoBadge}
        <div className="absolute inset-0 pointer-events-none" style={{ background: theme.radial }} />
        <div className="text-amber-500 mb-6"><HeartCompassLogo size={56} /></div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500 text-center">
          מסע אל מצפן הלב
        </h1>
        <p className="text-neutral-400 mb-2 text-lg text-center max-w-xl">
          בעולמות האלה חיים יצורי הנפש — הדמויות שמפעילות אותנו מבפנים.
        </p>
        <p className="text-neutral-500 mb-12 text-center">בחר את העולם שמושך אותך עכשיו, ובוא נפגוש את היצור שלך.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl">
          {environments.map(env => (
            <motion.button
              key={env.id}
              onClick={() => { setSelectedEnv(env.id); setStep(1); }}
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group p-6 md:p-10 rounded-3xl border border-white/5 bg-[#171a23] shadow-xl transition-all duration-300 flex flex-col items-center hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 md:mb-6 transition-all group-hover:scale-110">
                <env.icon className={`w-8 h-8 md:w-10 md:h-10 ${env.color}`} />
              </div>
              <h2 className="text-lg md:text-2xl font-bold text-center">{env.title}</h2>
            </motion.button>
          ))}
        </div>
        {ctaFooter}
      </div>
    );
  }

  // ── STEP 1: Card flip + trigger ──
  if (step === 1) {
    return (
      <div className={`min-h-screen ${theme.bg} text-white p-6 relative overflow-x-hidden`} dir="rtl">
        {demoBadge}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ background: theme.radial }} />
        <header className="mb-10 text-center mt-14 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">מי חסם לך את הדרך היום?</h1>
          <p className="text-neutral-400">הפוך את הקלף של היצור שהכי מזדהה עם איך שאתה מרגיש עכשיו.</p>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 relative z-10">
          {activeWorld?.archetypes.map(arc => {
            const isFlipped = activeCard === arc.id;
            return (
              <div key={arc.id} className="relative h-[480px] [perspective:1000px]">
                <motion.div
                  className="w-full h-full relative cursor-pointer"
                  onClick={() => { if (!isFlipped) setActiveCard(arc.id); }}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front */}
                  <div className="absolute inset-0 bg-[#171a23] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col items-center text-center shadow-2xl hover:border-amber-500/50 transition-all group" style={{ backfaceVisibility: "hidden" }}>
                    <div className="w-full h-60 bg-black relative">
                      {arc.imageUrl ? (
                        <img src={safeImage(arc.imageUrl)} alt={arc.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" onError={handleImageError} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🔮</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#171a23] to-transparent h-20"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-start w-full relative -mt-6">
                      <div className="text-amber-500 text-xs font-bold tracking-widest mb-1">לחץ להפוך את הקלף</div>
                      <h3 className="text-2xl font-black mb-2 text-white">{arc.name}</h3>
                      <p className="text-neutral-400 text-sm leading-relaxed">{arc.description}</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 bg-[#171a23] border border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.1)] rounded-[2rem] p-6 flex flex-col" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                    <button onClick={(e) => { e.stopPropagation(); setActiveCard(null); setSelectedTrigger(null); }} className="text-neutral-500 text-sm hover:text-white mb-4 text-right">✕ חזור לקלפים</button>
                    <h4 className="font-bold text-lg mb-4 text-white text-center">מה העיר את {arc.name}?</h4>
                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                      {arc.triggers.map((trigger, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setSelectedTrigger(trigger); }}
                          className={`text-right p-3.5 rounded-xl border text-sm transition-all ${selectedTrigger === trigger ? 'bg-amber-500/10 text-amber-400 border-amber-500 font-bold' : 'bg-black/20 border-white/5 hover:border-white/20 text-neutral-300'}`}
                        >
                          {trigger}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <motion.button
                        animate={{ opacity: selectedTrigger ? 1 : 0.3 }}
                        disabled={!selectedTrigger}
                        onClick={(e) => { e.stopPropagation(); setStep(2); }}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 text-black font-bold rounded-xl transition-all"
                      >
                        המשך <ArrowLeft className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── STEP 2 + 3: feeling / urge questions ──
  if (step === 2 || step === 3) {
    const isFeeling = step === 2;
    const qStep = isFeeling ? feelingStep : urgeStep;
    const options = qStep?.options?.[envKey] || [];
    const patterns = qStep?.patternRevealed?.[envKey] || [];
    const selected = isFeeling ? feeling : urge;
    const selectedIdx = isFeeling ? feelingIdx : urgeIdx;

    return (
      <div className={`min-h-screen ${theme.bg} text-white flex flex-col items-center p-6 relative overflow-hidden`} dir="rtl">
        {demoBadge}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ background: theme.radial }} />

        <header className="w-full max-w-3xl flex justify-between items-center mt-14 mb-10 relative z-10">
          <span className={`${theme.accentText} font-bold tracking-widest text-xs uppercase`}>
            צעד {step} מתוך 4
          </span>
          <span className="text-neutral-500 text-sm">חקירה עם {chosenArchetype?.name}</span>
        </header>

        <main className="flex-1 w-full max-w-3xl flex flex-col items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-[#171a23]/90 backdrop-blur-sm rounded-3xl border border-white/5 shadow-2xl p-8 md:p-12">
            <div className="flex justify-center mb-8">
              <div className="w-28 h-44 rounded-2xl border-4 border-amber-500/20 overflow-hidden relative">
                {chosenArchetype?.imageUrl ? (
                  <img src={safeImage(chosenArchetype.imageUrl)} alt="Card" className="w-full h-full object-cover" onError={handleImageError} />
                ) : (
                  <div className="w-full h-full bg-black flex items-center justify-center text-4xl">🔮</div>
                )}
                <div className="absolute bottom-0 w-full bg-black/60 backdrop-blur-sm p-1.5 text-center text-white font-bold text-xs">
                  {chosenArchetype?.name}
                </div>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-8 text-center text-white/90 leading-relaxed">
              {qStep?.traineeTitle}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {options.map((option: string, idx: number) => {
                const isSelected = selected === option;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => {
                      if (isFeeling) { setFeeling(option); setFeelingIdx(idx); }
                      else { setUrge(option); setUrgeIdx(idx); }
                    }}
                    className={`p-5 rounded-2xl border text-right transition-all duration-300 flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                        : 'bg-black/30 border-white/5 hover:border-white/20 text-neutral-300'
                    }`}
                  >
                    <span className="leading-snug">{option}</span>
                    <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs ml-4 ${isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-neutral-500'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Insight — the "wow" moment of the demo */}
            <AnimatePresence>
              {selected && selectedIdx !== null && patterns[selectedIdx] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-2 p-5 rounded-2xl border bg-blue-500/10 border-blue-500/20 flex items-start gap-4"
                >
                  <span className="w-8 h-8 shrink-0 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">💧</span>
                  <div>
                    <h4 className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-1">תובנה</h4>
                    <p className="text-blue-100 font-medium">{patterns[selectedIdx]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="w-full max-w-3xl mt-8 flex justify-between items-center relative z-10">
            <span className="text-neutral-600 text-xs tracking-widest">© מצפן הלב | יוסי מדלסי</span>
            <AnimatePresence>
              {selected && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-full transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  {isFeeling ? 'שלב הבא' : 'גלה את הדפוס שלך'}
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // ── STEP 4: Teaser summary + CTA ──
  return (
    <div className={`min-h-screen ${theme.bg} text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden`} dir="rtl">
      {demoBadge}
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: theme.radial }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-[#171a23]/90 backdrop-blur-sm border border-white/5 shadow-2xl rounded-3xl p-8 md:p-10 mt-10 relative overflow-hidden z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <Compass className="w-12 h-12 text-amber-500 mb-5" />
          <h1 className="text-2xl md:text-3xl font-black mb-3 text-white">זיהינו את תחילת הדפוס שלך</h1>
          <p className="text-neutral-400 mb-8">תוך 3 דקות בלבד — תראה מה גילינו:</p>

          {/* Mini blocker cycle */}
          <div className="w-full bg-[#11131a] border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="text-amber-500 font-bold text-xs tracking-widest uppercase mb-5 text-center">מעגל החסם שהתחיל להיחשף</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center">
              <div className="flex flex-col items-center bg-black/40 p-4 rounded-xl border border-white/5 flex-1 w-full">
                <span className="text-xs text-neutral-500 mb-2">הטריגר</span>
                <span className="text-white font-bold text-sm">{selectedTrigger}</span>
              </div>
              <div className="text-amber-500">→</div>
              <div className="flex flex-col items-center bg-black/40 p-4 rounded-xl border border-white/5 flex-1 w-full">
                <span className="text-xs text-neutral-500 mb-2">הרגש</span>
                <span className="text-white font-bold text-sm">{feeling}</span>
              </div>
              <div className="text-amber-500">→</div>
              <div className="flex flex-col items-center bg-black/40 p-4 rounded-xl border border-white/5 flex-1 w-full">
                <span className="text-xs text-neutral-500 mb-2">התגובה האוטומטית</span>
                <span className="text-white font-bold text-sm">{urge}</span>
              </div>
            </div>
          </div>

          {/* Locked content teaser */}
          <div className="w-full bg-black/30 border border-dashed border-white/15 rounded-2xl p-6 mb-8 relative">
            <div className="absolute inset-0 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center bg-black/50">
              <Lock className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-white font-bold">החלק הזה נפתח רק במסע המלא</p>
            </div>
            <div className="opacity-40 text-right space-y-2">
              <p className="text-neutral-300 text-sm">🔍 הפרשנות הנסתרת שיוצרת את הרגש</p>
              <p className="text-neutral-300 text-sm">🛡️ על מה {chosenArchetype?.name} באמת מנסה לשמור</p>
              <p className="text-neutral-300 text-sm">✨ קלפי המשאבים והכוחות שלך</p>
              <p className="text-neutral-300 text-sm">🤝 ההסכם החדש שישבור את הדפוס</p>
              <p className="text-neutral-300 text-sm">📋 תכנית עבודה אישית ל-30 יום</p>
            </div>
          </div>

          <p className="text-neutral-300 text-lg font-medium mb-2">
            הדפוס הזה לא נולד היום — והוא לא חייב להמשיך לנהל אותך.
          </p>
          <p className="text-neutral-500 text-sm mb-8">
            במסע המלא, בליווי אישי של יוסי, נמשיך בדיוק מהנקודה הזו.
          </p>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-5 bg-green-500 hover:bg-green-400 text-black font-black text-lg rounded-2xl transition shadow-[0_0_30px_rgba(34,197,94,0.3)] mb-4"
          >
            <MessageCircle className="w-6 h-6" /> דברו עם יוסי בוואטסאפ
          </a>

          <a
            href={MAIN_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 text-sm font-bold transition"
          >
            או בקרו באתר מצפן הלב ←
          </a>

          <button
            onClick={() => {
              setStep(0); setSelectedEnv(null); setActiveCard(null);
              setSelectedTrigger(null); setFeeling(null); setFeelingIdx(null);
              setUrge(null); setUrgeIdx(null);
            }}
            className="mt-8 text-neutral-600 hover:text-neutral-400 text-xs transition"
          >
            ↻ נסה שוב עם עולם אחר
          </button>
        </div>
      </motion.div>
      {ctaFooter}
    </div>
  );
}

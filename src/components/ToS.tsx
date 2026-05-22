import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeartCompassLogo from "./HeartCompassLogo";

const TOS_KEY = "mazpen-tos-v1";

export default function ToSGate({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOS_KEY);
    setAccepted(stored === "true");
  }, []);

  const handleAccept = () => {
    localStorage.setItem(TOS_KEY, "true");
    setAccepted(true);
  };

  if (accepted === null) return null;

  return (
    <>
      {children}
      <AnimatePresence>
        {!accepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#06070d]/95 backdrop-blur-md flex items-center justify-center p-6"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.92, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
              className="w-full max-w-lg bg-[#11131a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-b from-amber-500/10 to-transparent px-8 pt-8 pb-6 text-center border-b border-white/5">
                <div className="flex justify-center mb-4 text-amber-500">
                  <HeartCompassLogo size={52} />
                </div>
                <h2 className="text-xl font-black text-white">יוסי מדלסי — מצפן הלב</h2>
                <p className="text-neutral-400 text-sm mt-1">תנאי שימוש והגנת זכויות יוצרים</p>
              </div>

              {/* Body */}
              <div className="px-8 py-6 space-y-4 text-sm text-neutral-300 max-h-72 overflow-y-auto custom-scrollbar">
                <Section title="© זכויות יוצרים">
                  כל התוכן, המתודולוגיה, ארכיטיפי הקלפים, מבנה המסע הטיפולי והממשק הם קניינו הבלעדי של
                  {" "}<strong className="text-white">יוסי מדלסי — מצפן הלב</strong>.
                  חל איסור מוחלט על העתקה, שכפול, הפצה או שימוש מסחרי ללא אישור בכתב.
                </Section>

                <Section title="שימוש מקצועי בלבד">
                  הכלי מיועד לשימוש מאמנים מוסמכים ומטפלים בלבד, בסביבה טיפולית מבוקרת.
                  הכלי אינו תחליף לטיפול פסיכולוגי מקצועי ואינו מהווה אבחון קליני.
                </Section>

                <Section title="פרטיות">
                  המידע הנאסף במסגרת המסע מאוחסן באופן מוצפן ומשמש לצורכי המפגש הטיפולי בלבד.
                  אין שיתוף מידע עם צדדים שלישיים.
                </Section>

                <Section title="הגבלת אחריות">
                  השימוש בכלי הוא באחריות המשתמש בלבד. יוסי מדלסי אינו אחראי לכל נזק שייגרם
                  כתוצאה מהפעלת הכלי שלא בהתאם להוראות השימוש.
                </Section>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8 pt-4 border-t border-white/5">
                <button
                  onClick={handleAccept}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-base rounded-xl transition shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  קראתי ומאשר/ת את תנאי השימוש
                </button>
                <p className="text-center text-neutral-600 text-xs mt-3">
                  © 2025 יוסי מדלסי — מצפן הלב. כל הזכויות שמורות.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-amber-500 font-bold text-xs uppercase tracking-widest mb-1">{title}</h4>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

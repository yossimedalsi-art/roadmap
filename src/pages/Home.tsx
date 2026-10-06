import {
  ArrowLeft,
  Headset,
  Leaf,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import HeartCompassLogo from "../components/HeartCompassLogo";

const landmarks = [
  { label: "מיפוי", text: "להכיר את מה שפועל ברגע הזה", icon: Route },
  { label: "סילוק", text: "לפנות מקום לבחירה, בקצב שלך", icon: Leaf },
  { label: "עצמאות", text: "לבחור כיוון וצעד שמתאימים לך", icon: Sparkles },
];

export default function Home() {
  return (
    <div className="hc-shell" dir="rtl">
      <header className="hc-site-header">
        <Link
          to="/"
          aria-label="מצפן הלב — דף הבית"
          className="flex items-center gap-3 text-amber-200"
        >
          <HeartCompassLogo size={36} />
          <span className="font-bold text-white">
            מצפן הלב <span className="text-slate-400 font-normal">/ מ.ס.ע</span>
          </span>
        </Link>
        <Link to="/coach" className="hc-link">
          <Headset size={17} /> מרחב המנחה
        </Link>
      </header>
      <main className="hc-home-grid">
        <section className="py-8 lg:py-16">
          <p className="hc-kicker mb-6">יש מקום גם לפחד. יש מקום גם לבחירה.</p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.15] tracking-tight">
            יותר מקום
            <br />
            <span className="text-amber-200">לבחירה שלך.</span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-xl mt-7">
            לפעמים מנגנון שניסה לשמור עלינו חוסם את הדרך. יחד עם המנחה, אפשר
            להכיר אותו, להבין מה חשוב לנו ולבחור איך להתקדם.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-9">
            <Link className="hc-button" to="/demo">
              להכיר את המשחק <ArrowLeft size={19} />
            </Link>
            <span className="text-sm text-slate-400">
              למפגש אישי נכנסים דרך הקישור מהמנחה.
            </span>
          </div>
          <div className="flex gap-3 text-sm leading-relaxed text-slate-400 mt-8 max-w-lg">
            <ShieldCheck className="shrink-0 text-emerald-300" size={20} />
            <p>
              הדמויות מייצגות מנגנונים אפשריים. הן אינן מגדירות אותך, ואין תשובה
              שצריך לנחש כדי להצליח.
            </p>
          </div>
        </section>
        <section
          aria-label="מפת המסע"
          className="hc-map-art hc-panel relative p-7 sm:p-10"
        >
          <div className="flex items-center justify-between mb-10">
            <span className="hc-kicker">מפת המסע</span>
            <span className="hc-badge">בקצב שלך</span>
          </div>
          <div className="space-y-7 relative z-10">
            {landmarks.map(({ label, text, icon: Icon }, index) => (
              <div key={label} className="flex items-center gap-5">
                <div className="hc-map-node">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">0{index + 1}</p>
                  <h2 className="font-bold text-xl">{label}</h2>
                  <p className="text-sm text-slate-300 mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-10 pt-6">
            <p className="text-amber-200 text-lg font-medium">
              לבחור מתוך תשוקה, לא מתוך פחד.
            </p>
            <p className="text-sm text-slate-400 mt-2">
              המסלול אינו מרוץ. אפשר לשנות כיוון, להישאר ולהתבונן.
            </p>
          </div>
        </section>
      </main>
      <footer className="hc-site-header border-t border-white/10 text-xs text-slate-400">
        <span>מצפן הלב · יוסי מדלסי</span>
        <span>מנגנון הוא משהו שפועל בי. הוא לא מי שאני.</span>
      </footer>
    </div>
  );
}

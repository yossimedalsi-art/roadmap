import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Leaf,
  Search,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { findMechanism, searchMechanisms } from "../data/mechanisms";
import { goodPowersData, worldsData } from "../data/worlds";
import HeartCompassLogo from "../components/HeartCompassLogo";
import ParticipantDialog from "../components/ParticipantDialog";

const stepNames = [
  "כוח להתחלה",
  "מחסום בסיפור",
  "אירוע",
  "משמעות",
  "אפשרות",
  "מה לקחתי",
];
const actionOptions = [
  "לעצור לרגע ולהתבונן",
  "לשאול שאלה במקום להניח",
  "לנסות צעד קטן",
  "לבקש תמיכה",
  "עדיין לא לבחור פעולה",
];
const motiveOptions = [
  "משהו שחשוב לאורי",
  "ניסיון למנוע משהו מפחיד",
  "גם רצון וגם פחד",
  "עדיין לא ברור",
];
function characterFor(id?: string) {
  return worldsData
    .flatMap((world) => world.archetypes)
    .find((item) => item.id === id);
}

export default function DemoJourney() {
  const [step, setStep] = useState(0);
  const [resourceId, setResourceId] = useState("");
  const [mechanismId, setMechanismId] = useState("");
  const [query, setQuery] = useState("");
  const [event, setEvent] = useState("");
  const [meaning, setMeaning] = useState("");
  const [action, setAction] = useState("");
  const [motive, setMotive] = useState("");
  const [paused, setPaused] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const mechanism = findMechanism(mechanismId);
  const character = characterFor(mechanism?.archetypeId);
  const resource = goodPowersData.find((item) => item.id === resourceId);
  const results = searchMechanisms(query);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);
  function restart() {
    setStep(0);
    setResourceId("");
    setMechanismId("");
    setQuery("");
    setEvent("");
    setMeaning("");
    setAction("");
    setMotive("");
    setPaused(false);
  }
  const selected = (yes: boolean) =>
    "rounded-2xl border p-4 text-right transition " +
    (yes
      ? "border-amber-200 bg-amber-200/10"
      : "border-white/10 bg-white/[0.03] hover:border-white/30");
  return (
    <div className="hc-shell" dir="rtl">
      <header className="hc-site-header border-b border-white/10">
        <Link
          to="/"
          className="flex items-center gap-3 text-amber-200"
          aria-label="מצפן הלב — דף הבית"
        >
          <HeartCompassLogo size={32} />
          <span className="text-white font-bold">מצפן הלב</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hc-badge">היכרות דרך סיפור</span>
          <button className="hc-link" onClick={() => setPaused(true)}>
            רגע לעצמי
          </button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <div
          className="flex flex-wrap gap-2 mb-8 text-xs text-slate-400"
          aria-label="תחנות ההיכרות"
        >
          {stepNames.map((name, index) => (
            <span
              key={name}
              aria-current={index === step ? "step" : undefined}
              className={
                index === step
                  ? "hc-badge text-amber-200 border-amber-200/40"
                  : "px-3 py-1"
              }
            >
              {index + 1} · {name}
            </span>
          ))}
        </div>
        <div className="grid lg:grid-cols-[1fr_270px] gap-8 items-start">
          <section>
            <p className="hc-kicker mb-3">סקרנות, בקצב שלך</p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-3xl sm:text-4xl font-black leading-tight mb-4"
            >
              {
                [
                  "מה יכול לתמוך בדרך?",
                  "איזה מחסום נבדוק בסיפור של אורי?",
                  "מה קרה לאורי, לפני הפרשנות?",
                  "איזו משמעות יכולה להיות לרגע הזה?",
                  "מה עוד אפשרי כאן?",
                  "מה לקחתי מההיכרות?",
                ][step]
              }
            </h1>
            {step === 0 && (
              <>
                <p className="text-slate-300 max-w-2xl mb-7 leading-relaxed">
                  נפגוש סיפור דמיוני על אורי. הדמות שנבחר תייצג מחסום בדרך שלו,
                  ותישאר נפרדת ממנו. נתחיל בכוח שיוכל לתמוך באורי. זו היכרות קצרה;
                  מסע העומק מתקיים עם מנחה.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {goodPowersData.map((power) => (
                    <button
                      key={power.id}
                      aria-pressed={resourceId === power.id}
                      onClick={() => setResourceId(power.id)}
                      className={selected(resourceId === power.id)}
                    >
                      <span className="text-xl mr-1">{power.icon || "✦"}</span>
                      <strong className="block text-lg mt-1">
                        {power.name}
                      </strong>
                      <span className="text-sm text-slate-300">
                        {power.youthDescription || power.description}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="hc-button mt-7"
                  disabled={!resourceId}
                  onClick={() => setStep(1)}
                >
                  עם הכוח הזה, נמשיך <ArrowLeft size={18} />
                </button>
              </>
            )}
            {step === 1 && (
              <>
                <p className="text-slate-300 mb-6">
                  הדמות מייצגת דרך אפשרית להגן או להימנע. היא אינה האדם שבסיפור,
                  וההצעה אינה אבחון. נבדוק מה היא עשויה לעשות באירוע.
                </p>
                <label htmlFor="demo-search" className="block text-sm mb-2">
                  חיפוש לפי מנגנון או ביטוי יומיומי
                </label>
                <div className="relative mb-5">
                  <Search
                    size={19}
                    className="absolute right-4 top-4 text-slate-400"
                  />
                  <input
                    id="demo-search"
                    type="search"
                    className="hc-input pr-12"
                    placeholder="למשל: לא מצליח להגיד לא"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <p role="status" className="text-xs text-slate-400 mb-4">
                  {results.length === 1 ? "כיוון אחד אפשרי" : `${results.length} כיוונים אפשריים`}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {results.map((item) => {
                    const image = characterFor(item.archetypeId);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMechanismId(item.id);
                          setEvent("");
                          setMeaning("");
                          setAction("");
                          setMotive("");
                          setStep(2);
                        }}
                        className={selected(false) + " flex gap-4 items-center"}
                      >
                        {image?.imageUrl && (
                          <img
                            src={image.imageUrl}
                            loading="lazy"
                            alt=""
                            className="w-16 h-20 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <span>
                          <strong className="block text-lg">
                            {item.title}
                          </strong>
                          <span className="text-sm text-slate-300">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {results.length === 0 && (
                  <div className="hc-panel p-6">
                    לא נמצא כיוון. אפשר לנסות ביטוי אחר או למחוק את החיפוש
                    ולבחור מתוך המאגר.
                  </div>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-slate-300 mb-7">
                  אורי מספר את האירוע במילים שלו. נבחר סיפור אחד לבדיקה;
                  אותה סיטואציה יכולה לעורר משמעויות ומנגנונים שונים.
                </p>
                <div className="space-y-3">
                  {mechanism?.scenarios.map((scenario) => (
                    <button
                      className={
                        selected(event === scenario.title) + " block w-full"
                      }
                      key={scenario.id}
                      onClick={() => setEvent(scenario.title)}
                      aria-pressed={event === scenario.title}
                    >
                      {scenario.title}
                    </button>
                  ))}
                </div>
                <button
                  className="hc-button mt-7"
                  disabled={!event}
                  onClick={() => setStep(3)}
                >
                  נבדוק את המשמעות <ArrowLeft size={18} />
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <blockquote className="hc-panel p-5 mb-6 text-slate-200">
                  {event}
                </blockquote>
                <p className="text-slate-300 mb-5">
                  מה אורי עשוי להבין מהאירוע? הוא נפרד מדמות המחסום.
                  אין משמעות אחת שחייבת להתאים.
                </p>
                <label htmlFor="demo-meaning" className="block text-sm mb-2">
                  אפשרות אחת למשמעות
                </label>
                <textarea
                  id="demo-meaning"
                  className="hc-input min-h-32"
                  value={meaning}
                  maxLength={500}
                  placeholder="אפשר לכתוב משפט, או להמשיך בלי תשובה."
                  onChange={(e) => setMeaning(e.target.value)}
                />
                <div className="flex flex-wrap gap-3 mt-6">
                  <button className="hc-button" onClick={() => setStep(4)}>
                    {meaning.trim()
                      ? "נמשיך לבדוק אפשרויות"
                      : "נמשיך בלי לקבוע משמעות"}{" "}
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <p className="text-slate-300 mb-5">
                  מה היית מציע לאורי לנסות? אפשר גם לבחור להתבונן בלבד. השומר
                  יכול להישאר נוכח בלי להחליט לבדו.
                </p>
                <div className="space-y-2">
                  {actionOptions.map((option) => (
                    <button
                      key={option}
                      aria-pressed={action === option}
                      className={selected(action === option) + " w-full"}
                      onClick={() => setAction(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <fieldset className="mt-7">
                  <legend className="text-sm mb-3 text-slate-200">
                    מאיזה מקום עשויה לבוא ההצעה הזאת?
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {motiveOptions.map((option) => (
                      <button
                        key={option}
                        aria-pressed={motive === option}
                        className={selected(motive === option) + " text-sm"}
                        onClick={() => setMotive(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <button
                  className="hc-button mt-7"
                  disabled={!action || !motive}
                  onClick={() => setStep(5)}
                >
                  לסגירת ההיכרות <ArrowLeft size={18} />
                </button>
              </>
            )}
            {step === 5 && (
              <>
                <p className="text-slate-300 mb-7">
                  זה מה שבחרת לבדוק בסיפור. ההיכרות אינה קובעת מה נכון עבורך,
                  ואינה מוכיחה שמנגנון השתנה.
                </p>
                <dl className="hc-panel p-6 space-y-5">
                  {[
                    ["האירוע", event],
                    ["משמעות אפשרית", meaning.trim() || "לא נקבעה משמעות"],
                    ["אפשרות לאורי", action],
                    ["מקור הבחירה האפשרי", motive],
                    ["כוח לתמיכה", resource?.name],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="hc-kicker mb-1">{label}</dt>
                      <dd className="text-lg text-slate-200">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-7 rounded-2xl border border-emerald-200/20 bg-emerald-200/5 p-5">
                  <Leaf className="text-emerald-200 mb-2" size={22} />
                  <p className="font-bold mb-2">נחזור לרגע הזה.</p>
                  <p className="text-sm text-slate-300">
                    אפשר להסתכל סביב ולשים לב לתמיכה של הכיסא או הרצפה, אם זה
                    נעים. אין משימה שצריך להשלים עכשיו.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 mt-7">
                  <button
                    className="hc-button hc-button-secondary"
                    onClick={restart}
                  >
                    <RotateCcw size={18} /> סיפור נוסף
                  </button>
                  <Link className="hc-button" to="/">
                    חזרה למצפן הלב <ArrowLeft size={18} />
                  </Link>
                </div>
              </>
            )}
            {step > 0 && step < 5 && (
              <button
                className="hc-link mt-6"
                onClick={() => setStep(step - 1)}
              >
                <ArrowRight size={17} />
                חזרה לתחנה הקודמת
              </button>
            )}
          </section>
          <aside className="hc-panel p-6 lg:sticky lg:top-6 space-y-6">
            <div>
              <Compass className="text-amber-200 mb-3" size={26} />
              <h2 className="font-bold text-lg">הבחירה נשארת פתוחה</h2>
              <p className="text-sm text-slate-300 mt-2">
                אפשר לשנות כיוון או לעצור. אין ציון ואין תשובה שצריך לנחש.
              </p>
            </div>
            {resource && (
              <div className="border-t border-white/10 pt-5">
                <p className="hc-kicker mb-2">הכוח שבחרת</p>
                <p className="font-bold">{resource.name}</p>
                <p className="text-sm text-slate-300 mt-1">
                  {resource.description}
                </p>
              </div>
            )}
            {character && (
              <div className="border-t border-white/10 pt-5">
                {character.imageUrl && (
                  <img
                    src={character.imageUrl}
                    alt=""
                    className="w-24 h-28 object-cover rounded-xl mb-3"
                  />
                )}
                <p className="hc-kicker mb-1">דמות למחסום אפשרי בדרך של אורי</p>
                <p className="font-bold">{character.name}</p>
              </div>
            )}
            <p className="text-xs text-slate-400 border-t border-white/10 pt-5">
              התשובות בהיכרות הזאת נשארות בזיכרון הדפדפן עד יציאה או רענון. הן
              אינן נשלחות למנחה ואינן נשמרות במערכת.
            </p>
          </aside>
        </div>
      </main>
      {paused && (
        <ParticipantDialog
          labelledBy="pause-title"
          onClose={() => setPaused(false)}
        >
          <h2 id="pause-title" className="text-2xl font-bold mb-4">
            אפשר לעצור כאן.
          </h2>
          <p className="text-slate-300 mb-7">
            אין צורך להגיע לתשובה. אפשר לקחת רגע, להמשיך בסיפור או לחזור לדף
            הבית.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="hc-button" onClick={() => setPaused(false)}>
              להמשיך בקצב שלי
            </button>
            <Link className="hc-button hc-button-secondary" to="/">
              לסיים כאן
            </Link>
          </div>
        </ParticipantDialog>
      )}
    </div>
  );
}

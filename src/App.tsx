import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import Home from "./pages/Home";
import ToSGate from "./components/ToS";
import ErrorBoundary from "./components/ErrorBoundary";

const TraineeJourney = lazy(() => import("./pages/TraineeJourney"));
const CoachAccess = lazy(() => import("./components/CoachAccess"));
const DemoJourney = lazy(() => import("./pages/DemoJourney"));
const MechanismLibrary = import.meta.env.DEV
  ? lazy(() => import("./components/MechanismLibrary"))
  : null;

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="hc-shell grid place-items-center" role="status">
                <p className="text-slate-300">מכינים את המרחב…</p>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/demo" element={<DemoJourney />} />
              <Route
                path="/journey/:sessionId"
                element={
                  <ToSGate participant>
                    <TraineeJourney />
                  </ToSGate>
                }
              />
              <Route path="/coach" element={<CoachAccess />} />
              <Route path="/login" element={<CoachAccess />} />
              {import.meta.env.DEV && MechanismLibrary && (
                <Route
                  path="/preview/library"
                  element={
                    <div className="hc-shell p-5 sm:p-10">
                      <p className="hc-kicker mb-6">
                        תצוגת פיתוח · ללא מידע אישי וללא חיבור למפגש
                      </p>
                      <MechanismLibrary />
                    </div>
                  }
                />
              )}
              {import.meta.env.DEV && (
                <Route
                  path="/preview/journey"
                  element={<TraineeJourney preview />}
                />
              )}
              <Route
                path="*"
                element={
                  <div className="hc-shell grid place-items-center p-6 text-center">
                    <div>
                      <h1 className="text-3xl font-bold mb-4">
                        העמוד הזה לא נמצא
                      </h1>
                      <Link className="hc-button" to="/">
                        חזרה למצפן הלב
                      </Link>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </MotionConfig>
  );
}
export default App;

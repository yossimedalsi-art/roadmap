import { lazy, useEffect, useState, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "../lib/firebase";
import ToSGate from "./ToS";

const CoachDashboard = lazy(() => import("../pages/CoachDashboard"));
const AuthPage = lazy(() => import("../pages/AuthPage"));

export default function CoachAccess() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      }),
    [],
  );
  if (loading)
    return (
      <div className="hc-shell grid place-items-center" role="status">
        בודקים את הכניסה למרחב המנחה…
      </div>
    );
  if (!user && location.pathname === "/coach")
    return <Navigate to="/login" replace />;
  if (user && location.pathname === "/login")
    return <Navigate to="/coach" replace />;
  return (
    <ToSGate>
      <Suspense
        fallback={
          <div role="status" className="hc-shell grid place-items-center">
            מכינים את המרחב…
          </div>
        }
      >
        {user ? <CoachDashboard user={user} /> : <AuthPage onLogin={setUser} />}
      </Suspense>
    </ToSGate>
  );
}

import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./lib/firebase";
import TraineeJourney from "./pages/TraineeJourney";
import CoachDashboard from "./pages/CoachDashboard";
import DemoJourney from "./pages/DemoJourney";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import ToSGate from "./components/ToS";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing demo — no ToS gate, no Firebase */}
        <Route path="/demo" element={<DemoJourney />} />

        <Route path="/" element={<ToSGate><Home /></ToSGate>} />
        <Route path="/journey/:sessionId" element={<ToSGate><TraineeJourney /></ToSGate>} />

        {/* Protected Coach Route */}
        <Route
          path="/coach"
          element={user ? <ToSGate><CoachDashboard user={user} /></ToSGate> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/coach" /> : <ToSGate><AuthPage onLogin={setUser} /></ToSGate>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

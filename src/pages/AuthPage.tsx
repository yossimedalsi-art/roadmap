import { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      onLogin(result.user);
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("ההתחברות נכשלה. אנא נסה שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md bg-[#171a23]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
            <Compass className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-l from-amber-200 to-amber-500">
          Heart Compass
        </h1>
        <p className="text-neutral-400 mb-10">כניסת מאמנים - ניהול קליניקה</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              התחבר עם גוגל
            </>
          )}
        </button>

        <p className="text-xs text-neutral-500 mt-8">
          על ידי התחברות אתה מאשר את תנאי השימוש ומדיניות הפרטיות.
        </p>
      </motion.div>
    </div>
  );
}

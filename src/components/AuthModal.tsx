import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setError("");
    if (!email || password.length < 6) {
      setError("Введи email и пароль (минимум 6 символов)");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25 }}
          className="bg-white w-full max-w-sm"
        >
          <div className="flex items-center justify-between px-8 pt-8 pb-6">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              {mode === "login" ? "Войти в Vibe" : "Создать аккаунт"}
            </h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <Icon name="X" size={20} />
            </button>
          </div>

          <div className="px-8 pb-8 flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex border border-neutral-200">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 py-2.5 text-xs uppercase tracking-wide transition-all duration-200 ${
                    mode === m ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {m === "login" ? "Войти" : "Регистрация"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-neutral-500">Email</label>
              <input
                type="email"
                className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-neutral-500">Пароль</label>
              <input
                type="password"
                className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`py-3 text-sm uppercase tracking-wide transition-all duration-200 mt-1 ${
                loading ? "bg-neutral-100 text-neutral-300 cursor-not-allowed" : "bg-neutral-900 text-white hover:bg-neutral-700"
              }`}
            >
              {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

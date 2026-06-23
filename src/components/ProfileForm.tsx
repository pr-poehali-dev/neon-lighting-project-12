import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/hooks/useAuth";
import PhotoUpload from "@/components/PhotoUpload";

const API_URL = "https://functions.poehali.dev/77d88eb3-0fde-4a35-9125-70a743929c55";

interface ProfileFormProps {
  onClose: () => void;
}

const INTERESTS = [
  "Музыка", "Кино", "Спорт", "Путешествия", "Чтение",
  "Игры", "Готовка", "Искусство", "Природа", "Технологии",
  "Фотография", "Танцы", "Йога", "Волонтёрство", "Кофе"
];

const STEPS = ["Основное", "О себе", "Интересы"];

export default function ProfileForm({ onClose }: ProfileFormProps) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    city: "",
    gender: "",
    lookingFor: "",
    bio: "",
    interests: [] as string[],
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : prev.interests.length < 5
        ? [...prev.interests, interest]
        : prev.interests,
    }));
  };

  const canNext = () => {
    if (step === 0) return form.name && form.age && form.city && form.gender;
    if (step === 1) return form.bio.length >= 10;
    return form.interests.length >= 1;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: parseInt(form.age), token: getToken() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сервера");
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Что-то пошло не так");
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
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white w-full max-w-lg rounded-none shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">
                Шаг {step + 1} из {STEPS.length} — {STEPS[step]}
              </p>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {step === 0 && "Расскажи о себе"}
                {step === 1 && "Твоя история"}
                {step === 2 && "Что тебе интересно?"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-8 mb-6">
            <div className="h-0.5 bg-neutral-100 w-full">
              <motion.div
                className="h-full bg-neutral-900"
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Success screen */}
          {success && (
            <div className="px-8 pb-12 pt-4 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
                <Icon name="Check" size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Анкета создана!</h3>
              <p className="text-sm text-neutral-500">Теперь тебя могут найти другие пользователи</p>
            </div>
          )}

          {/* Steps */}
          <div className={`px-8 pb-8 ${success ? "hidden" : ""}`}>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {getToken() && (
                    <div className="flex justify-center py-2">
                      <PhotoUpload
                        token={getToken()}
                        currentPhoto={photoUrl}
                        onUploaded={(url) => setPhotoUrl(url)}
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Имя</label>
                    <input
                      className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                      placeholder="Как тебя зовут?"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs uppercase tracking-wide text-neutral-500">Возраст</label>
                      <input
                        className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                        placeholder="Лет"
                        type="number"
                        min={18}
                        max={99}
                        value={form.age}
                        onChange={(e) => set("age", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs uppercase tracking-wide text-neutral-500">Город</label>
                      <input
                        className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors"
                        placeholder="Где живёшь?"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Я</label>
                    <div className="flex gap-3">
                      {["Мужчина", "Женщина", "Другое"].map((g) => (
                        <button
                          key={g}
                          onClick={() => set("gender", g)}
                          className={`flex-1 py-3 text-sm border transition-all duration-200 ${
                            form.gender === g
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">Ищу</label>
                    <div className="flex gap-3">
                      {["Девушку", "Парня", "Не важно"].map((l) => (
                        <button
                          key={l}
                          onClick={() => set("lookingFor", l)}
                          className={`flex-1 py-3 text-sm border transition-all duration-200 ${
                            form.lookingFor === l
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wide text-neutral-500">О себе</label>
                    <textarea
                      className="border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:border-neutral-900 transition-colors resize-none h-40"
                      placeholder="Расскажи, кто ты и что ищешь. Будь собой — это работает лучше всего."
                      value={form.bio}
                      onChange={(e) => set("bio", e.target.value)}
                    />
                    <p className="text-xs text-neutral-400 text-right">{form.bio.length} / 300</p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-sm text-neutral-500">Выбери до 5 интересов</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => {
                      const selected = form.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          onClick={() => toggleInterest(interest)}
                          className={`px-4 py-2 text-sm border transition-all duration-200 ${
                            selected
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Выбрано: {form.interests.length} / 5
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 py-3 text-sm border border-neutral-200 text-neutral-700 hover:border-neutral-400 transition-colors uppercase tracking-wide"
                >
                  Назад
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => canNext() && setStep((s) => s + 1)}
                  disabled={!canNext()}
                  className={`flex-1 py-3 text-sm uppercase tracking-wide transition-all duration-200 ${
                    canNext()
                      ? "bg-neutral-900 text-white hover:bg-neutral-700"
                      : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                  }`}
                >
                  Далее
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canNext() || loading}
                  className={`flex-1 py-3 text-sm uppercase tracking-wide transition-all duration-200 ${
                    canNext() && !loading
                      ? "bg-neutral-900 text-white hover:bg-neutral-700"
                      : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Сохраняем..." : "Создать анкету"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
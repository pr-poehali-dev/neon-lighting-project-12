import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ProfileForm from "@/components/ProfileForm";
import Icon from "@/components/ui/icon";
import { motion } from "framer-motion";

export default function Cabinet() {
  const { user, loading, logout } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white/30">
        <Icon name="Loader2" size={32} className="animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const profile = user.profile;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <a href="/" className="text-white text-sm uppercase tracking-widest font-bold">Vibe</a>
        <div className="flex items-center gap-4">
          <a href="/search" className="text-white/50 hover:text-white text-xs uppercase tracking-wide transition-colors">
            Поиск
          </a>
          <button
            onClick={async () => { await logout(); window.location.href = "/"; }}
            className="text-white/30 hover:text-white text-xs uppercase tracking-wide transition-colors flex items-center gap-1.5"
          >
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Личный кабинет</p>
          <h1 className="text-3xl font-bold mb-1">{profile ? profile.name : "Привет!"}</h1>
          <p className="text-white/40 text-sm mb-10">{user.email}</p>

          {profile ? (
            <div className="flex flex-col gap-6">
              {/* Profile card */}
              <div className="border border-white/10 p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-white/30">Моя анкета</p>
                  <button
                    onClick={() => setFormOpen(true)}
                    className="text-xs uppercase tracking-wide text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="Pencil" size={12} />
                    Редактировать
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/30 text-xs mb-1">Возраст</p>
                    <p className="text-white text-sm">{profile.age} лет</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Город</p>
                    <p className="text-white text-sm">{profile.city}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Я</p>
                    <p className="text-white text-sm">{profile.gender}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Ищу</p>
                    <p className="text-white text-sm">{profile.lookingFor}</p>
                  </div>
                </div>

                <div>
                  <p className="text-white/30 text-xs mb-1">О себе</p>
                  <p className="text-white/80 text-sm leading-relaxed">{profile.bio}</p>
                </div>

                {profile.interests.length > 0 && (
                  <div>
                    <p className="text-white/30 text-xs mb-2">Интересы</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((tag) => (
                        <span key={tag} className="text-xs px-3 py-1 bg-white/10 text-white/60">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <a
                href="/search"
                className="flex items-center justify-between px-6 py-4 border border-white/10 hover:border-white/30 transition-colors group"
              >
                <div>
                  <p className="text-white text-sm font-medium">Найти людей</p>
                  <p className="text-white/30 text-xs mt-0.5">Смотреть анкеты других пользователей</p>
                </div>
                <Icon name="ArrowRight" size={16} className="text-white/30 group-hover:text-white transition-colors" />
              </a>
            </div>
          ) : (
            <div className="border border-white/10 p-8 flex flex-col items-center gap-4 text-center">
              <Icon name="UserCircle" size={40} className="text-white/20" />
              <p className="text-white/60">Анкета ещё не заполнена</p>
              <p className="text-white/30 text-sm">Создай анкету, чтобы тебя могли найти другие пользователи</p>
              <button
                onClick={() => setFormOpen(true)}
                className="mt-2 bg-white text-black text-xs uppercase tracking-wide px-6 py-3 hover:bg-white/80 transition-colors"
              >
                Создать анкету
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {formOpen && (
        <ProfileForm
          onClose={() => { setFormOpen(false); setRefreshKey((k) => k + 1); window.location.reload(); }}
        />
      )}
      <span className="hidden">{refreshKey}</span>
    </div>
  );
}

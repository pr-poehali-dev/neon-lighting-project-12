import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import ProfileForm from "@/components/ProfileForm";
import { useAuth } from "@/hooks/useAuth";

const API_URL = "https://functions.poehali.dev/77d88eb3-0fde-4a35-9125-70a743929c55";
const LIKES_URL = "https://functions.poehali.dev/71b1b5bc-bda1-41de-8bf2-579822b3ceaf";

interface Profile {
  id: number;
  name: string;
  age: number;
  city: string;
  gender: string;
  lookingFor: string;
  bio: string;
  interests: string[];
  createdAt: string;
  photoUrl?: string;
}

export default function Search() {
  const { user, getToken } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [likingId, setLikingId] = useState<number | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (gender) params.set("gender", gender);
    const res = await fetch(`${API_URL}?${params.toString()}`);
    const data = await res.json();
    setProfiles(data.profiles || []);
    setLoading(false);
  };

  const fetchLikedIds = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`${LIKES_URL}?mode=check&token=${token}`);
    const data = await res.json();
    if (data.likedIds) setLikedIds(new Set(data.likedIds));
  }, [getToken]);

  useEffect(() => {
    fetchProfiles();
    fetchLikedIds();
  }, []);

  const handleLike = async (e: React.MouseEvent, profileId: number) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) { window.location.href = "/"; return; }
    if (likingId !== null) return;

    setLikingId(profileId);
    const res = await fetch(LIKES_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, profileId }),
    });
    const data = await res.json();
    if (res.ok) {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (data.liked) { next.add(profileId); } else { next.delete(profileId); }
        return next;
      });
    }
    setLikingId(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <a href="/" className="text-white text-sm uppercase tracking-widest font-bold">Vibe</a>
        <div className="flex items-center gap-4">
          {user && (
            <a href="/cabinet" className="text-white/50 hover:text-white text-xs uppercase tracking-wide transition-colors">
              Кабинет
            </a>
          )}
          <button
            onClick={() => setFormOpen(true)}
            className="bg-white text-black text-xs uppercase tracking-wide px-5 py-2.5 hover:bg-white/80 transition-colors"
          >
            + Моя анкета
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-6 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Фильтры</p>
        <div className="flex flex-wrap gap-3">
          <input
            className="bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 transition-colors w-48"
            placeholder="Город"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProfiles()}
          />
          {["", "Мужчина", "Женщина"].map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`px-4 py-2.5 text-sm border transition-all duration-200 ${
                gender === g ? "bg-white text-black border-white" : "border-white/10 text-white/60 hover:border-white/30"
              }`}
            >
              {g === "" ? "Все" : g === "Мужчина" ? "Парни" : "Девушки"}
            </button>
          ))}
          <button
            onClick={fetchProfiles}
            className="bg-white text-black text-sm px-5 py-2.5 hover:bg-white/80 transition-colors uppercase tracking-wide"
          >
            Найти
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24 text-white/30">
            <Icon name="Loader2" size={32} className="animate-spin" />
            <p className="text-sm uppercase tracking-wide">Загружаем анкеты...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Icon name="Users" size={40} className="text-white/20" />
            <p className="text-white/40 text-sm uppercase tracking-wide">Анкет не найдено</p>
            <p className="text-white/25 text-xs">Попробуй изменить фильтры или стань первым</p>
            <button
              onClick={() => setFormOpen(true)}
              className="mt-2 bg-white text-black text-xs uppercase tracking-wide px-6 py-3 hover:bg-white/80 transition-colors"
            >
              Создать анкету
            </button>
          </div>
        ) : (
          <>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-6">
              {profiles.length} {profiles.length === 1 ? "анкета" : profiles.length < 5 ? "анкеты" : "анкет"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profiles.map((p, i) => {
                const isLiked = likedIds.has(p.id);
                const isLiking = likingId === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(p)}
                    className="bg-white/5 border border-white/10 p-5 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-200 group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.name} className="w-10 h-10 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white/60">
                          {p.name[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-white/30 text-xs uppercase tracking-wide">{p.city}</span>
                    </div>
                    <h3 className="text-white font-semibold text-base mb-0.5">{p.name}, {p.age}</h3>
                    <p className="text-white/40 text-xs mb-3">{p.gender} · ищет: {p.lookingFor}</p>
                    <p className="text-white/60 text-sm line-clamp-3 leading-relaxed">{p.bio}</p>
                    {p.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.interests.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 text-white/50">{tag}</span>
                        ))}
                        {p.interests.length > 3 && (
                          <span className="text-xs px-2 py-0.5 text-white/25">+{p.interests.length - 3}</span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/20 group-hover:text-white/50 transition-colors text-xs uppercase tracking-wide">
                        <span>Открыть</span>
                        <Icon name="ArrowRight" size={12} />
                      </div>
                      <button
                        onClick={(e) => handleLike(e, p.id)}
                        disabled={isLiking}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all duration-200 border ${
                          isLiked
                            ? "border-pink-500/60 text-pink-400 bg-pink-500/10"
                            : "border-white/10 text-white/30 hover:border-pink-500/40 hover:text-pink-400"
                        }`}
                      >
                        <Icon name={isLiking ? "Loader2" : "Heart"} size={12} className={isLiking ? "animate-spin" : ""} />
                        {isLiked ? "Нравится" : "Лайк"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="bg-neutral-900 border border-white/10 w-full max-w-md p-8"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {selected.photoUrl ? (
                    <img src={selected.photoUrl} alt={selected.name} className="w-14 h-14 object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white/50">
                      {selected.name[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{selected.name}, {selected.age}</h2>
                    <p className="text-white/40 text-sm">{selected.city} · {selected.gender}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors">
                  <Icon name="X" size={20} />
                </button>
              </div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Ищет</p>
              <p className="text-white/80 text-sm mb-5">{selected.lookingFor}</p>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">О себе</p>
              <p className="text-white/80 text-sm leading-relaxed mb-5">{selected.bio}</p>
              {selected.interests.length > 0 && (
                <>
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Интересы</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selected.interests.map((tag) => (
                      <span key={tag} className="text-xs px-3 py-1 bg-white/10 text-white/60">{tag}</span>
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={(e) => { handleLike(e, selected.id); }}
                disabled={likingId === selected.id}
                className={`w-full py-3 text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
                  likedIds.has(selected.id)
                    ? "bg-pink-500/20 border border-pink-500/40 text-pink-400"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                }`}
              >
                <Icon name="Heart" size={14} />
                {likedIds.has(selected.id) ? "Уже нравится" : "Лайкнуть"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {formOpen && <ProfileForm onClose={() => { setFormOpen(false); fetchProfiles(); }} />}
    </div>
  );
}
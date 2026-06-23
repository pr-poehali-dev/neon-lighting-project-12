import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className={`absolute top-0 left-0 right-0 z-10 p-6 ${className ?? ""}`}>
        <div className="flex justify-between items-center">
          <div className="text-white text-sm uppercase tracking-wide">vibe</div>
          <nav className="flex gap-6 items-center">
            <a
              href="/search"
              className="text-white hover:text-neutral-400 transition-colors duration-300 uppercase text-sm"
            >
              Найти людей
            </a>
            {!loading && (
              user ? (
                <a
                  href="/cabinet"
                  className="text-white border border-white/40 px-4 py-1.5 text-xs uppercase tracking-wide hover:bg-white/10 transition-colors"
                >
                  Кабинет
                </a>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="text-white border border-white/40 px-4 py-1.5 text-xs uppercase tracking-wide hover:bg-white/10 transition-colors"
                >
                  Войти
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => { setAuthOpen(false); window.location.href = "/cabinet"; }}
        />
      )}
    </>
  );
}

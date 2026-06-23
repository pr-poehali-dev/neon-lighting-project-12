import { useState, useEffect } from "react";

const AUTH_URL = "https://functions.poehali.dev/eb44cb16-f31a-4717-a0f7-96011f332d69";

export interface UserProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  gender: string;
  lookingFor: string;
  bio: string;
  interests: string[];
}

export interface AuthUser {
  userId: number;
  email: string;
  profile?: UserProfile;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("vibe_token") || "";

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me", token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.userId) setUser(data);
        else localStorage.removeItem("vibe_token");
      })
      .catch(() => localStorage.removeItem("vibe_token"))
      .finally(() => setLoading(false));
  }, []);

  const register = async (email: string, password: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("vibe_token", data.token);
    setUser({ userId: data.userId, email });
    return data;
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem("vibe_token", data.token);
    setUser({ userId: data.userId, email, profile: data.profile });
    return data;
  };

  const logout = async () => {
    const token = getToken();
    await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout", token }),
    });
    localStorage.removeItem("vibe_token");
    setUser(null);
  };

  return { user, loading, getToken, register, login, logout };
}

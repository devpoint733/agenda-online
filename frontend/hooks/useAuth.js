import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("userData");
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  const login = useCallback((token, userPayload) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userPayload));
    setUser(userPayload);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    setUser(null);
  }, []);

  return { user, loading, login, logout, sync };
}

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
} | null;

type SessionContextType = {
  data: { user: User } | null;
  isPending: boolean;
  refresh: () => void;
};

const SessionContext = createContext<SessionContextType>({
  data: null,
  isPending: true,
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ user: User } | null>(null);
  const [isPending, setIsPending] = useState(true);

  const fetchSession = async () => {
    try {
      setIsPending(true);
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          setData({ user: json.user });
        } else {
          setData(null);
        }
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ data, isPending, refresh: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

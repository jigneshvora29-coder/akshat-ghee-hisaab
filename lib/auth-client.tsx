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
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

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
    fetchSession().then(() => {
      // If we are on a protected route and fetchSession didn't find a user (e.g. user was deleted in DB), force redirect to login
      if (typeof window !== 'undefined') {
        const publicRoutes = ["/login", "/forgot-password"];
        const isPublicRoute = publicRoutes.some((route) => window.location.pathname.startsWith(route));
        
        // Wait a tick to see if data was set
        setTimeout(() => {
          setData((currentData) => {
            if (!currentData && !isPublicRoute) {
              window.location.href = "/login";
            }
            return currentData;
          });
        }, 100);
      }
    });
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

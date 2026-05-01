"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface UserProfile {
  username: string;
  email: string;
  timezone?: string | null;
}

const UserContext = createContext<UserProfile | null>(null);
const DisplayNameContext = createContext<string>("");
const RefreshUserContext = createContext<() => void>(() => {});

export function useUser() {
  return useContext(UserContext);
}

export function useDisplayName() {
  return useContext(DisplayNameContext);
}

export function useRefreshUser() {
  return useContext(RefreshUserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .get<UserProfile>("/auth/me")
      .then((data) => {
        setUser(data);
        setReady(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace("/login");
      });
  }, [router]);

  const refreshUser = () => {
    api.get<UserProfile>("/auth/me").then(setUser).catch(() => {});
  };

  const displayName = user?.username ?? "";

  if (!ready) return null;

  return (
    <UserContext.Provider value={user}>
      <DisplayNameContext.Provider value={displayName}>
        <RefreshUserContext.Provider value={refreshUser}>
          {children}
        </RefreshUserContext.Provider>
      </DisplayNameContext.Provider>
    </UserContext.Provider>
  );
}
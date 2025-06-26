"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import axios from "@/lib/axios";
import type { UserProfileData } from "@/lib/commonInterfaces";

interface UserContextType {
  user: UserProfileData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isPhotographer: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const apiResponse = await axios.get<UserProfileData>("/user/light-profile-data");
      setUser(apiResponse.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = () => {
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isOwner = useMemo(() => user?.type === "owner", [user]);
  const isPhotographer = useMemo(() => user?.type === "seller", [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        clearUser,
        isAdmin,
        isOwner,
        isPhotographer,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error(
      "useUser trebuie să fie folosit într-un context UserProvider"
    );
  return ctx;
}

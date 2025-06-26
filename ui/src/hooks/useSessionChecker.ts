"use client";

import { useEffect, useRef } from "react";
import axios from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-toastify";

export function useSessionChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const cancelledRef = useRef(false);
  const { user, loading } = useUser();

  useEffect(() => {
    cancelledRef.current = false;

    if (pathname === "/logout") return;

    const checkSession = async () => {
      if (loading || !user) return;

      try {
        await axios.get("/auth/check-session");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (!cancelledRef.current && err?.response?.status === 403) {
          toast.error(
            "Sesiunea a expirat. Veți fi deconectat automat în 5 secunde.",
            { autoClose: 5000 }
          );
          setTimeout(() => {
            router.push("/logout");
          }, 5000);
        }
      }
    };

    checkSession();

    return () => {
      cancelledRef.current = true;
    };
  }, [pathname, router, user, loading]);
}

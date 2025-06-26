"use client";
import { useEffect } from "react";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Spinner } from "react-bootstrap";

export default function LogoutPage() {
  const { clearUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await axios.post(
          "/auth/logout",
          {},
        );
        clearUser()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
      } finally {
        router.push("/");
      }
    };

    doLogout();
  }, [router, clearUser]);

  return (
    <div className="container text-center py-5">
      <p>Se deconectează…</p>
      <Spinner
        animation="border"
        role="status"
        style={{ width: "2rem", height: "2rem" }}
      >
        <span className="visually-hidden">Se încarcă...</span>
      </Spinner>
    </div>
  );
}

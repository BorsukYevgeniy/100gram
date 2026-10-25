"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatPanel from "./components/chat-panel";
import { isUnauthenticatedStatus } from "./auth-session";

export default function Home() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        if (!active) return;

        if (isUnauthenticatedStatus(response.status)) {
          router.replace("/login");
          return;
        }
        if (!response.ok) {
          setSessionError(`Не вдалося перевірити сесію (${response.status}).`);
          setSessionChecked(true);
          return;
        }

        setSessionChecked(true);
      } catch (error) {
        if (!active) return;
        setSessionError(
          error instanceof Error
            ? error.message
            : "Не вдалося перевірити сесію.",
        );
        setSessionChecked(true);
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  if (!sessionChecked) {
    return (
      <main className="messenger-loading" role="status">
        Перевіряємо сесію…
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="messenger-loading" role="alert">
        {sessionError}
      </main>
    );
  }

  return <ChatPanel />;
}

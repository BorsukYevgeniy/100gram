"use client";

import { FormEvent, Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyEmail({
  params,
}: {
  params: Promise<{ verificationCode: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="verify-page">
          <section className="verify-card">Завантаження…</section>
        </main>
      }
    >
      <VerifyEmailForm params={params} />
    </Suspense>
  );
}

function VerifyEmailForm({
  params,
}: {
  params: Promise<{ verificationCode: string }>;
}) {
  const router = useRouter();
  const { verificationCode: code } = use(params);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setMessage(null);
    setError(false);
    try {
      const response = await fetch(
        `/api/auth/verify/${encodeURIComponent(code)}`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const serverMessage =
          payload &&
          typeof payload === "object" &&
          typeof payload.message === "string"
            ? payload.message
            : `Помилка сервера (${response.status}).`;
        throw new Error(serverMessage);
      }
      router.replace("/");
    } catch (verificationError) {
      setError(true);
      setMessage(
        verificationError instanceof Error
          ? verificationError.message
          : "Не вдалося підтвердити пошту.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="verify-page">
      <section className="verify-card">
        <Link className="brand" href="/">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        <div className="verify-icon" aria-hidden="true">
          {message && !error ? "✓" : "✉"}
        </div>
        <div className="eyebrow">ПІДТВЕРДЖЕННЯ ПОШТИ</div>
        <h1>{message && !error ? "Готово!" : "Майже на місці"}</h1>
        <p>
          {message ??
            "Підтвердьте електронну адресу, щоб завершити створення акаунта."}
        </p>
        {message && (
          <div className={error ? "verify-message error" : "verify-message"}>
            {message}
          </div>
        )}
        {!message || error ? (
          <form onSubmit={verify}>
            <button className="button button-primary full-width" disabled={busy}>
              {busy ? "Перевіряємо…" : "Підтвердити електронну пошту"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        ) : null}
        {message && !error && (
          <Link className="button button-primary full-width verify-link" href="/">
            Перейти до входу <span aria-hidden="true">→</span>
          </Link>
        )}
        <Link className="back-link" href="/">
          Повернутися на головну
        </Link>
      </section>
    </main>
  );
}

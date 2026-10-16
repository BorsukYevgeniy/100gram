"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notice = {
  kind: "success" | "error";
  text: string;
};

type ApiError = {
  message?: string | string[];
  error?: string;
};

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ApiError).message;
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as ApiError).error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

export default function AuthPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        if (!active) return;
        setHasSession(response.ok);
        if (response.ok) {
          router.replace("/");
          return;
        }
        if (!response.ok && response.status !== 401 && response.status !== 403) {
          setNotice({
            kind: "error",
            text: `Не вдалося перевірити сесію (${response.status}).`,
          });
        }
      } catch (error) {
        if (!active) return;
        setHasSession(false);
        setNotice({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Не вдалося перевірити сесію.",
        });
      }
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  async function request(
    key: string,
    path: string,
    body?: Record<string, string | number>,
    successMessage?: string,
    redirectTo?: string,
  ) {
    setBusy(key);
    setNotice(null);

    try {
      const response = await fetch(`/api/auth/${path}`, {
        method: "POST",
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });
      const rawResponse = await response.text();
      let payload: unknown = null;
      if (rawResponse) {
        try {
          payload = JSON.parse(rawResponse);
        } catch {
          payload = rawResponse;
        }
      }

      if (!response.ok) {
        throw new Error(
          errorMessage(payload, `Запит завершився з помилкою ${response.status}.`),
        );
      }

      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : successMessage ?? "Запит успішно виконано.";
      setNotice({ kind: "success", text: successMessage ?? message });
      if (redirectTo) router.replace(redirectTo);
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося зв’язатися із сервером.",
      });
    } finally {
      setBusy(null);
    }
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authMode === "register") {
      void request(
        "auth",
        "register",
        { email, nickname, password },
        "Акаунт створено. Перевірте пошту, щоб підтвердити адресу.",
        "/",
      );
    } else {
      void request("auth", "login", { email, password }, "Вхід виконано.", "/");
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/login" aria-label="100gram — до входу">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        {hasSession && (
          <Link className="docs-link" href="/user">
            Профіль користувача <span aria-hidden="true">↘</span>
          </Link>
        )}
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            AUTHENTICATION · API CONSOLE
          </div>
          <h1>
            Ваш простір.
            <br />
            <span>Ваші правила.</span>
          </h1>
          <p>
            Увійдіть або створіть акаунт, щоб отримати доступ до 100gram.
          </p>
          <div className="hero-meta">
            <span className="meta-icon">↗</span>
            <span>Безпечна авторизація через HttpOnly cookies</span>
          </div>
        </div>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="card-kicker">ПОЧНІМО</div>
          <h2 id="auth-title">
            {authMode === "login" ? "Раді бачити знову" : "Створіть акаунт"}
          </h2>
          <p className="card-subtitle">
            {authMode === "login"
              ? "Увійдіть, щоб продовжити."
              : "Це займе лише хвилину."}
          </p>

          <div className="mode-switch" role="tablist" aria-label="Режим входу">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === "login"}
              className={authMode === "login" ? "selected" : ""}
              onClick={() => setAuthMode("login")}
            >
              Увійти
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === "register"}
              className={authMode === "register" ? "selected" : ""}
              onClick={() => setAuthMode("register")}
            >
              Реєстрація
            </button>
          </div>

          <form className="stack-form" onSubmit={handleAuthSubmit}>
            <label>
              Електронна пошта
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            {authMode === "register" && (
              <label>
                Нікнейм
                <input
                  type="text"
                  name="nickname"
                  placeholder="Ваше ім’я в 100gram"
                  minLength={3}
                  maxLength={25}
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  required
                />
              </label>
            )}
            <label>
              Пароль
              <input
                type="password"
                name="password"
                placeholder="Щонайменше 6 символів"
                minLength={6}
                maxLength={16}
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              className="button button-primary full-width"
              type="submit"
              disabled={busy !== null}
            >
              {busy === "auth"
                ? "Зачекайте…"
                : authMode === "login"
                  ? "Увійти в акаунт"
                  : "Створити акаунт"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="divider">
            <span>або продовжити з</span>
          </div>
          <form action="/api/auth/google/login" method="get">
            <button className="button button-google full-width" type="submit">
              <span className="google-g" aria-hidden="true">
                G
              </span>
              Google
              <span className="button-spacer" />
            </button>
          </form>
          <p className="privacy-note">
            Продовжуючи, ви погоджуєтесь на безпечну обробку даних акаунта.
          </p>
        </section>
      </section>

      {notice && (
        <div
          className={`notice notice-${notice.kind}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span className="notice-symbol" aria-hidden="true">
            {notice.kind === "success" ? "✓" : "!"}
          </span>
          {notice.text}
          <button
            type="button"
            className="notice-close"
            aria-label="Закрити повідомлення"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}

      <footer className="footer">
        <Link className="brand footer-brand" href="/login">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        <span>Ваш акаунт — у надійних руках.</span>
        <span className="footer-status">
          <span className="live-dot" /> API console
        </span>
      </footer>
    </main>
  );
}

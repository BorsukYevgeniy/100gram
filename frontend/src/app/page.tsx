"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

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

export default function Home() {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function request(
    key: string,
    path: string,
    body?: Record<string, string | number>,
    successMessage?: string,
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
      void request("auth", "register", { email, nickname, password }, "Акаунт створено. Перевірте пошту, щоб підтвердити адресу.");
    } else {
      void request("auth", "login", { email, password }, "Вхід виконано.");
    }
  }

  function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request(
      "verify",
      `verify/${encodeURIComponent(verificationCode.trim())}`,
      undefined,
      "Електронну пошту підтверджено.",
    );
  }

  function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void request("reset", "reset-password", {
      code: Number(otpCode),
      newPassword,
    }, "Пароль успішно змінено.");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="100gram — на головну">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        <a className="docs-link" href="#auth-tools">
          Інструменти акаунта <span aria-hidden="true">↘</span>
        </a>
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
            Увійдіть або створіть акаунт, а потім керуйте безпекою та
            підтвердженням пошти в одному місці.
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

      <section className="tools-section" id="auth-tools">
        <div className="section-heading">
          <div>
            <div className="eyebrow">КЕРУВАННЯ ПРОФІЛЕМ</div>
            <h2>Усе під контролем</h2>
          </div>
          <p>
            Увійдіть, щоб виконати захищені дії. Сесія зберігається у cookie —
            токени не потрапляють у JavaScript.
          </p>
        </div>

        <div className="tools-grid">
          <article className="tool-card">
            <div className="tool-icon icon-violet">01</div>
            <h3>Сесія та пристрої</h3>
            <p>Оновіть сесію або завершіть один чи всі активні входи.</p>
            <div className="button-row">
              <button
                className="button button-soft"
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void request("refresh", "refresh", undefined, "Сесію оновлено.")
                }
              >
                {busy === "refresh" ? "Оновлення…" : "Оновити сесію"}
              </button>
              <button
                className="button button-quiet"
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void request("logout", "logout", undefined, "Ви вийшли з акаунта.")
                }
              >
                Вийти
              </button>
              <button
                className="text-button"
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void request(
                    "logout-all",
                    "logout-all",
                    undefined,
                    "Ви вийшли з усіх пристроїв.",
                  )
                }
              >
                Вийти з усіх пристроїв ↗
              </button>
            </div>
          </article>

          <article className="tool-card">
            <div className="tool-icon icon-green">02</div>
            <h3>Підтвердження пошти</h3>
            <p>Підтвердьте акаунт за кодом або надішліть лист повторно.</p>
            <form className="inline-form" onSubmit={handleVerify}>
              <label className="sr-only" htmlFor="verification-code">
                Код підтвердження UUID
              </label>
              <input
                id="verification-code"
                type="text"
                placeholder="UUID із листа"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                required
              />
              <button
                className="button button-soft"
                type="submit"
                disabled={busy !== null}
              >
                {busy === "verify" ? "Перевірка…" : "Підтвердити"}
              </button>
            </form>
            <button
              className="text-button"
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void request(
                  "resend",
                  "resend-verification-email",
                  undefined,
                  "Лист для підтвердження надіслано.",
                )
              }
            >
              {busy === "resend" ? "Надсилання…" : "Надіслати лист повторно ↗"}
            </button>
          </article>

          <article className="tool-card">
            <div className="tool-icon icon-orange">03</div>
            <h3>Новий пароль</h3>
            <p>Отримайте одноразовий код на пошту та задайте новий пароль.</p>
            <button
              className="button button-soft"
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void request(
                  "send-otp",
                  "send-otp-email",
                  undefined,
                  "Якщо пошта прив’язана до локального акаунта, на неї надіслано код.",
                )
              }
            >
              {busy === "send-otp" ? "Надсилання…" : "Надіслати код на пошту"}
            </button>
            <form
              className="stack-form compact-form"
              onSubmit={handleResetPassword}
            >
              <label>
                Код із листа
                <input
                  type="number"
                  inputMode="numeric"
                  min={100000}
                  max={1000000}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  required
                />
              </label>
              <label>
                Новий пароль
                <input
                  type="password"
                  minLength={6}
                  maxLength={16}
                  autoComplete="new-password"
                  placeholder="6–16 символів"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </label>
              <button
                className="button button-primary"
                type="submit"
                disabled={busy !== null}
              >
                {busy === "reset" ? "Оновлення…" : "Змінити пароль"}
              </button>
            </form>
          </article>
        </div>
      </section>

      <footer className="footer">
        <Link className="brand footer-brand" href="/">
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

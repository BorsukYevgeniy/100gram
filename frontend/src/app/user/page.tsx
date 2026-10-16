"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserControllerPanel from "../components/user-controller-panel";

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

export default function UserPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "verified" | "unverified" | "error"
  >("loading");
  const [verificationStatusError, setVerificationStatusError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function loadVerificationStatus() {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
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
            errorMessage(
              payload,
              `Не вдалося завантажити профіль (${response.status}).`,
            ),
          );
        }
        if (
          !payload ||
          typeof payload !== "object" ||
          !("isVerified" in payload) ||
          typeof payload.isVerified !== "boolean"
        ) {
          throw new Error("Сервер повернув некоректний статус верифікації.");
        }
        if (active) {
          setVerificationStatus(payload.isVerified ? "verified" : "unverified");
        }
      } catch (error) {
        if (active) {
          setVerificationStatus("error");
          setVerificationStatusError(
            error instanceof Error
              ? error.message
              : "Не вдалося перевірити статус верифікації.",
          );
        }
      }
    }

    void loadVerificationStatus();
    return () => {
      active = false;
    };
  }, []);

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
      if (key === "verify") setVerificationStatus("verified");
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
    void request(
      "reset",
      "reset-password",
      { code: Number(otpCode), newPassword },
      "Пароль успішно змінено.",
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="100gram — на головну">
          <span className="brand-mark">1</span>
          <span>100gram</span>
        </Link>
        <Link className="docs-link" href="/">
          До входу <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className="user-page-intro">
        <div className="eyebrow">
          <span className="live-dot" />
          USER ACCOUNT
        </div>
        <h1>Ваш профіль</h1>
        <p>
          Переглядайте профіль і керуйте сесією, підтвердженням пошти та
          паролем.
        </p>
      </section>

      {notice && (
        <div
          className={`notice notice-${notice.kind} user-page-notice`}
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

      <UserControllerPanel />

      <section className="tools-section" id="user-auth-tools">
        <div className="section-heading">
          <div>
            <div className="eyebrow">БЕЗПЕКА АКАУНТА</div>
            <h2>Сесія та безпека</h2>
          </div>
          <p>
            Захищені дії використовують сесію у cookie — токени не потрапляють
            у JavaScript.
          </p>
        </div>

        <div className="tools-grid">
          <article className="tool-card">
            <div className="tool-icon icon-violet">01</div>
            <h3>Сесія та пристрої</h3>
            <p>Завершіть поточний або всі активні входи.</p>
            <div className="button-row">
              <button
                className="button button-quiet"
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  void request(
                    "logout",
                    "logout",
                    undefined,
                    "Ви вийшли з акаунта.",
                    "/",
                  )
                }
              >
                {busy === "logout" ? "Вихід…" : "Вийти"}
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
                    "/",
                  )
                }
              >
                {busy === "logout-all"
                  ? "Завершення сеансів…"
                  : "Вийти з усіх пристроїв ↗"}
              </button>
            </div>
          </article>

          <article className="tool-card">
            <div className="tool-icon icon-green">02</div>
            <h3>Підтвердження пошти</h3>
            {verificationStatus === "verified" ? (
              <p className="verify-message">
                Користувач уже верифікований.
              </p>
            ) : (
              <>
                <p>
                  Підтвердьте акаунт за кодом із листа або надішліть лист
                  повторно.
                </p>
                {verificationStatus === "loading" && (
                  <p className="verify-message">Перевіряємо статус…</p>
                )}
                {verificationStatus === "error" && (
                  <p className="verify-message error">
                    {verificationStatusError}
                  </p>
                )}
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
                  {busy === "resend"
                    ? "Надсилання…"
                    : "Надіслати лист повторно ↗"}
                </button>
              </>
            )}
          </article>

          <article className="tool-card">
            <div className="tool-icon icon-orange">03</div>
            <h3>Зміна пароля</h3>
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
          <span className="live-dot" /> USER ACCOUNT
        </span>
      </footer>
    </main>
  );
}

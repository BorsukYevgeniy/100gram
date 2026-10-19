"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

type UserProfile = {
  id: number;
  nickname: string;
  avatarName: string | null;
  role: "ADMIN" | "USER";
  isVerified: boolean;
  createdAt: string;
  description: string | null;
};

type UserSearchResult = {
  users: UserProfile[];
  nextCursor: number | null;
  hasMore: boolean;
};

type Notice = {
  kind: "success" | "error";
  text: string;
};

type ApiError = {
  message?: string | string[];
  error?: string;
};

function fileProxyUrl(fileName: string, kind: "users" | "chats") {
	const fileKey = fileName.startsWith("avatars/")
		? fileName
		: `avatars/${kind}/${fileName}`;
	return `/api/files?key=${encodeURIComponent(fileKey)}`;
}

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

function isUserProfile(payload: unknown): payload is UserProfile {
  if (!payload || typeof payload !== "object") return false;
  const user = payload as Partial<UserProfile>;
  return (
    typeof user.id === "number" &&
    typeof user.nickname === "string" &&
    (typeof user.avatarName === "string" || user.avatarName === null) &&
    (user.role === "ADMIN" || user.role === "USER") &&
    typeof user.isVerified === "boolean" &&
    typeof user.createdAt === "string" &&
    (typeof user.description === "string" || user.description === null)
  );
}

function ProfileDetails({ profile }: { profile: UserProfile }) {
  return (
    <dl className="profile-details">
      <div>
        <dt>ID</dt>
        <dd>{profile.id}</dd>
      </div>
      <div>
        <dt>Нікнейм</dt>
        <dd>{profile.nickname}</dd>
      </div>
      <div>
        <dt>Роль</dt>
        <dd>{profile.role === "ADMIN" ? "Адміністратор" : "Користувач"}</dd>
      </div>
      <div>
        <dt>Статус</dt>
        <dd>{profile.isVerified ? "Підтверджено" : "Не підтверджено"}</dd>
      </div>
      <div>
        <dt>Створено</dt>
        <dd>{new Date(profile.createdAt).toLocaleDateString("uk-UA")}</dd>
      </div>
      {profile.description && (
        <div>
          <dt>Опис</dt>
          <dd>{profile.description}</dd>
        </div>
      )}
    </dl>
  );
}

export default function UserControllerPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<
    "loading" | "authenticated" | "unauthenticated" | "error"
  >("loading");
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarPreviewUrls = useRef(new Set<string>());
  const [searchNickname, setSearchNickname] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchCursor, setSearchCursor] = useState<number | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);

  useEffect(() => {
    const previewUrls = avatarPreviewUrls.current;
    return () => {
      for (const previewUrl of previewUrls) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          if (active) {
            setProfileStatus(
              response.status === 401 || response.status === 403
                ? "unauthenticated"
                : "error",
            );
            if (response.status !== 401 && response.status !== 403) {
              setNotice({
                kind: "error",
                text: errorMessage(
                  payload,
                  `Не вдалося завантажити профіль (${response.status}).`,
                ),
              });
            }
          }
          return;
        }
        if (!isUserProfile(payload)) {
          throw new Error("Сервер повернув некоректні дані профілю.");
        }
        if (active) {
          setProfile(payload);
          setProfileNickname(payload.nickname);
          setProfileStatus("authenticated");
        }
      } catch (error) {
        if (!active) return;
        setProfileStatus("error");
        setNotice({
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "Не вдалося завантажити профіль.",
        });
      }
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  async function request(
    key: string,
    path: string,
    method: "GET" | "PATCH" | "DELETE",
    successMessage: string,
    profileResult: "current" | "target" | null = null,
    body?: Record<string, string>,
  ) {
    setBusy(key);
    setNotice(null);

    try {
      const response = await fetch(`/api/users/${path}`, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
        cache: "no-store",
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

      if (profileResult) {
        if (!isUserProfile(payload)) {
          throw new Error("Сервер повернув некоректні дані профілю.");
        }
        if (profileResult === "current") {
          setProfile(payload);
          setProfileStatus("authenticated");
        }
        else setTargetProfile(payload);
        if (profileResult === "current") {
          setProfileNickname(payload.nickname);
        }
      } else if (method === "DELETE" && path === "me") {
        setProfile(null);
      } else if (
        method === "DELETE" &&
        targetProfile?.id === Number(path)
      ) {
        setTargetProfile(null);
      }

      setNotice({ kind: "success", text: successMessage });
      return payload;
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося зв’язатися із сервером.",
      });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function searchUsers(
    event?: FormEvent<HTMLFormElement>,
    cursor?: number,
  ) {
    event?.preventDefault();
    const nickname = searchNickname.trim();
    if (nickname.length < 3 || nickname.length > 25) {
      setNotice({
        kind: "error",
        text: "Пошуковий нікнейм має містити від 3 до 25 символів.",
      });
      return;
    }

    setBusy("search-users");
    setNotice(null);
    try {
      const query = new URLSearchParams({
        nickname,
        limit: "20",
        ...(cursor ? { cursor: String(cursor) } : {}),
      });
      const response = await fetch(`/api/users/search?${query}`, {
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          errorMessage(payload, `Пошук завершився помилкою ${response.status}.`),
        );
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("users" in payload) ||
        !Array.isArray(payload.users) ||
        !payload.users.every(isUserProfile) ||
        !("nextCursor" in payload) ||
        (typeof payload.nextCursor !== "number" &&
          payload.nextCursor !== null) ||
        !("hasMore" in payload) ||
        typeof payload.hasMore !== "boolean"
      ) {
        throw new Error("Сервер повернув некоректні результати пошуку.");
      }

      const result = payload as UserSearchResult;
      setSearchResults((current) =>
        cursor ? [...current, ...result.users] : result.users,
      );
      setSearchCursor(result.nextCursor);
      setSearchHasMore(result.hasMore);
      setNotice({
        kind: "success",
        text: cursor
          ? "Наступні результати завантажено."
          : `Знайдено користувачів: ${result.users.length}.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося виконати пошук користувачів.",
      });
    } finally {
      setBusy(null);
    }
  }

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = profileNickname.trim();
    if (nickname.length < 3 || nickname.length > 25) {
      setNotice({
        kind: "error",
        text: "Нікнейм має містити від 3 до 25 символів.",
      });
      return;
    }
    void request(
      "update-profile",
      "me",
      "PATCH",
      "Профіль оновлено.",
      "current",
      { nickname },
    );
  }

  function selectAvatar(file: File | null) {
    if (file && !file.type.startsWith("image/")) {
      setNotice({ kind: "error", text: "Оберіть файл зображення для аватару." });
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    setNotice(null);
    setAvatarFile(file);
    if (!file) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    avatarPreviewUrls.current.add(previewUrl);
    setAvatarPreview(previewUrl);
  }

  async function updateAvatar() {
    if (!avatarFile || busy !== null) return;
    setBusy("update-avatar");
    setNotice(null);
    try {
      const form = new FormData();
      form.append("avatar", avatarFile);
      const response = await fetch("/api/users/me/avatar", {
        method: "PATCH",
        body: form,
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          errorMessage(
            payload,
            `Не вдалося оновити аватар (${response.status}).`,
          ),
        );
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("avatarUrl" in payload) ||
        typeof payload.avatarUrl !== "string"
      ) {
        throw new Error("Сервер повернув некоректні дані аватару.");
      }
      const avatarName = payload.avatarUrl;
      setProfile((current) => (current ? { ...current, avatarName } : current));
      setAvatarFile(null);
      setAvatarPreview(null);
      setNotice({ kind: "success", text: "Аватар оновлено." });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося оновити аватар.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function deleteAvatar() {
    if (busy !== null) return;
    setBusy("delete-avatar");
    setNotice(null);
    try {
      const response = await fetch("/api/users/me/avatar", {
        method: "DELETE",
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          errorMessage(
            payload,
            `Не вдалося видалити аватар (${response.status}).`,
          ),
        );
      }
      setProfile((current) =>
        current ? { ...current, avatarName: null } : current,
      );
      selectAvatar(null);
      setNotice({ kind: "success", text: "Аватар видалено." });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Не вдалося видалити аватар.",
      });
    } finally {
      setBusy(null);
    }
  }

  function handleFindUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = Number(targetUserId);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      setNotice({ kind: "error", text: "Введіть коректний ID користувача." });
      return;
    }
    void request(
      "find-user",
      String(userId),
      "GET",
      "Профіль користувача завантажено.",
      "target",
    );
  }

  function assignAdmin() {
    const userId = Number(targetUserId);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      setNotice({ kind: "error", text: "Введіть коректний ID користувача." });
      return;
    }
    void request(
      "assign-admin",
      `assign-admin/${userId}`,
      "PATCH",
      "Роль адміністратора призначено.",
      targetProfile?.id === userId ? "target" : null,
    );
  }

  function deleteCurrentUser() {
    if (!window.confirm("Видалити акаунт? Цю дію не можна скасувати.")) return;
    void request("delete-me", "me", "DELETE", "Акаунт видалено.");
  }

  function deleteTargetUser() {
    const userId = Number(targetUserId);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      setNotice({ kind: "error", text: "Введіть коректний ID користувача." });
      return;
    }
    if (!window.confirm(`Видалити користувача з ID ${userId}?`)) return;
    void request("delete-user", String(userId), "DELETE", "Користувача видалено.");
  }

  return (
    <section className="tools-section user-section" id="user-tools">
      <div className="section-heading">
        <div>
          <div className="eyebrow">USER CONTROLLER</div>
          <h2>Налаштування та користувачі</h2>
        </div>
        <p>
          Оновлюйте власний нікнейм, шукайте користувачів за нікнеймом або ID.
          Адмінські операції доступні лише адміністраторам.
        </p>
      </div>

      {notice && (
        <div
          className={`notice notice-${notice.kind} user-notice`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          <span className="notice-symbol" aria-hidden="true">
            {notice.kind === "success" ? "✓" : "!"}
          </span>
          {notice.text}
        </div>
      )}

      <div className="user-tools-grid">
        <article className="tool-card user-tool-card">
          <div className="tool-icon icon-green">01</div>
          <h3>Налаштування профілю</h3>
          <p>Змініть аватар і нікнейм або видаліть акаунт.</p>
          <div className="button-row">
            <button
              className="button button-soft"
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void request(
                  "get-me",
                  "me",
                  "GET",
                  "Ваш профіль завантажено.",
                  "current",
                )
              }
            >
              {busy === "get-me" ? "Завантаження…" : "Мій профіль"}
            </button>
            {profile && (
              <button
                className="button button-danger"
                type="button"
                disabled={busy !== null}
                onClick={deleteCurrentUser}
              >
                {busy === "delete-me" ? "Видалення…" : "Видалити акаунт"}
              </button>
            )}
          </div>
          {profileStatus === "loading" && (
            <p className="profile-auth-message">Завантажуємо налаштування…</p>
          )}
          {profileStatus === "unauthenticated" && (
            <p className="profile-auth-message">
              Увійдіть, щоб змінити нікнейм або аватар.{" "}
              <Link href="/login">Увійти</Link>
            </p>
          )}
          {profileStatus === "error" && !profile && (
            <p className="profile-auth-message">
              Не вдалося завантажити налаштування профілю.
            </p>
          )}
          {profileStatus === "authenticated" && profile && (
            <>
              <div className="profile-avatar-settings">
                <span className="profile-avatar-preview">
                  {avatarPreview || profile.avatarName ? (
                    <Image
                      src={
                        avatarPreview ??
                        fileProxyUrl(profile.avatarName ?? "", "users")
                      }
                      alt={
                        avatarPreview
                          ? "Попередній перегляд нового аватара"
                          : "Аватар користувача"
                      }
                      width={72}
                      height={72}
                      unoptimized
                    />
                  ) : (
                    profile.nickname.slice(0, 1).toLocaleUpperCase("uk-UA")
                  )}
                </span>
                <div className="profile-avatar-controls">
                  <label htmlFor="profile-avatar">Аватар користувача</label>
                  <input
                    id="profile-avatar"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      selectAvatar(event.target.files?.[0] ?? null)
                    }
                    disabled={busy !== null}
                  />
                  <div className="button-row">
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => void updateAvatar()}
                      disabled={!avatarFile || busy !== null}
                    >
                      {busy === "update-avatar" ? "Завантаження…" : "Зберегти аватар"}
                    </button>
                    {profile.avatarName && (
                      <button
                        className="button button-quiet"
                        type="button"
                        onClick={() => void deleteAvatar()}
                        disabled={busy !== null}
                      >
                        {busy === "delete-avatar" ? "Видалення…" : "Видалити"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <ProfileDetails profile={profile} />
              <form className="profile-edit-form" onSubmit={updateProfile}>
                <label htmlFor="profile-nickname">Нікнейм</label>
                <div className="inline-form">
                  <input
                    id="profile-nickname"
                    value={profileNickname}
                    minLength={3}
                    maxLength={25}
                    onChange={(event) =>
                      setProfileNickname(event.target.value)
                    }
                    required
                  />
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={busy !== null}
                  >
                    {busy === "update-profile" ? "Збереження…" : "Зберегти"}
                  </button>
                </div>
              </form>
            </>
          )}
        </article>

        <article className="tool-card user-tool-card">
          <div className="tool-icon icon-violet">02</div>
          <h3>Пошук користувача</h3>
          <p>Знайдіть користувача за нікнеймом або завантажте його за ID.</p>
          <form
            className="inline-form user-search-form"
            onSubmit={(event) => void searchUsers(event)}
          >
            <input
              aria-label="Нікнейм для пошуку"
              value={searchNickname}
              minLength={3}
              maxLength={25}
              placeholder="Частина нікнейму"
              onChange={(event) => {
                setSearchNickname(event.target.value);
                setSearchResults([]);
                setSearchCursor(null);
                setSearchHasMore(false);
              }}
              required
            />
            <button
              className="button button-soft"
              type="submit"
              disabled={busy !== null}
            >
              {busy === "search-users" ? "Пошук…" : "Знайти"}
            </button>
          </form>
          {searchResults.length > 0 && (
            <ul className="user-search-results">
              {searchResults.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetUserId(String(user.id));
                      setTargetProfile(user);
                    }}
                  >
                    <strong>{user.nickname}</strong>
                    <span>ID {user.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchHasMore && searchCursor !== null && (
            <button
              className="button button-quiet"
              type="button"
              disabled={busy !== null}
              onClick={() => void searchUsers(undefined, searchCursor)}
            >
              {busy === "search-users" ? "Завантаження…" : "Ще користувачі"}
            </button>
          )}
          <form className="inline-form" onSubmit={handleFindUser}>
            <label className="sr-only" htmlFor="user-id">
              ID користувача
            </label>
            <input
              id="user-id"
              type="number"
              min={1}
              step={1}
              placeholder="ID користувача"
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              required
            />
            <button
              className="button button-soft"
              type="submit"
              disabled={busy !== null}
            >
              {busy === "find-user" ? "Пошук…" : "Знайти"}
            </button>
          </form>
          {targetProfile && (
            <div className="target-profile">
              <div className="card-kicker">ЗНАЙДЕНИЙ ПРОФІЛЬ</div>
              <ProfileDetails profile={targetProfile} />
            </div>
          )}
        </article>

        {profile?.role === "ADMIN" && (
          <article className="tool-card user-tool-card">
            <div className="tool-icon icon-orange">03</div>
            <h3>Адміністрування</h3>
            <p>Призначте роль адміністратора або видаліть користувача за ID.</p>
            <div className="button-row">
              <button
                className="button button-soft"
                type="button"
                disabled={busy !== null || !targetUserId}
                onClick={assignAdmin}
              >
                {busy === "assign-admin" ? "Призначення…" : "Призначити адміна"}
              </button>
              <button
                className="button button-danger"
                type="button"
                disabled={busy !== null || !targetUserId}
                onClick={deleteTargetUser}
              >
                {busy === "delete-user" ? "Видалення…" : "Видалити"}
              </button>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

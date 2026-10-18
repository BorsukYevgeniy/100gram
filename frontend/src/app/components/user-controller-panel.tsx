"use client";

import { FormEvent, useState } from "react";

type UserProfile = {
  id: number;
  nickname: string;
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
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [targetUserId, setTargetUserId] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [searchNickname, setSearchNickname] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchCursor, setSearchCursor] = useState<number | null>(null);
  const [searchHasMore, setSearchHasMore] = useState(false);

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
        if (profileResult === "current") setProfile(payload);
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
          <h2>Профіль і користувачі</h2>
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
          <h3>Мій профіль</h3>
          <p>Переглядайте та оновлюйте нікнейм або видаліть акаунт.</p>
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
            <button
              className="button button-danger"
              type="button"
              disabled={busy !== null}
              onClick={deleteCurrentUser}
            >
              {busy === "delete-me" ? "Видалення…" : "Видалити акаунт"}
            </button>
          </div>
          {profile && (
            <>
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

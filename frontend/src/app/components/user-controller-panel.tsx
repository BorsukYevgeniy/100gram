"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import UserAdminCard from "./user-controller/user-admin-card";
import ProfileSettingsCard from "./user-controller/profile-settings-card";
import type {
  Notice,
  ProfileStatus,
  UserProfile,
  UserSearchResult,
} from "./user-controller/types";
import { errorMessage, isUserProfile } from "./user-controller/utils";
import UserSearchCard from "./user-controller/user-search-card";

export default function UserControllerPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
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
        <ProfileSettingsCard
          busy={busy}
          profile={profile}
          profileStatus={profileStatus}
          profileNickname={profileNickname}
          avatarFile={avatarFile}
          avatarPreview={avatarPreview}
          onGetProfile={() =>
            void request(
              "get-me",
              "me",
              "GET",
              "Ваш профіль завантажено.",
              "current",
            )
          }
          onDeleteCurrentUser={deleteCurrentUser}
          onSelectAvatar={selectAvatar}
          onUpdateAvatar={() => void updateAvatar()}
          onDeleteAvatar={() => void deleteAvatar()}
          onNicknameChange={setProfileNickname}
          onUpdateProfile={updateProfile}
        />
        <UserSearchCard
          busy={busy}
          searchNickname={searchNickname}
          searchResults={searchResults}
          searchCursor={searchCursor}
          searchHasMore={searchHasMore}
          targetUserId={targetUserId}
          targetProfile={targetProfile}
          onSearchUsers={(event) => void searchUsers(event)}
          onSearchNicknameChange={(nickname) => {
            setSearchNickname(nickname);
            setSearchResults([]);
            setSearchCursor(null);
            setSearchHasMore(false);
          }}
          onSelectUser={(user) => {
            setTargetUserId(String(user.id));
            setTargetProfile(user);
          }}
          onLoadMore={() => {
            if (searchCursor !== null) void searchUsers(undefined, searchCursor);
          }}
          onFindUser={handleFindUser}
          onTargetUserIdChange={setTargetUserId}
        />
        {profile?.role === "ADMIN" && (
          <UserAdminCard
            busy={busy}
            hasTargetUserId={Boolean(targetUserId)}
            onAssignAdmin={assignAdmin}
            onDeleteUser={deleteTargetUser}
          />
        )}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import type { ProfileStatus, UserProfile } from "./types";
import { fileProxyUrl } from "./utils";
import ProfileDetails from "./profile-details";

type ProfileSettingsCardProps = {
  busy: string | null;
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  profileNickname: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  onGetProfile: () => void;
  onDeleteCurrentUser: () => void;
  onSelectAvatar: (file: File | null) => void;
  onUpdateAvatar: () => void;
  onDeleteAvatar: () => void;
  onNicknameChange: (nickname: string) => void;
  onUpdateProfile: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileSettingsCard({
  busy,
  profile,
  profileStatus,
  profileNickname,
  avatarFile,
  avatarPreview,
  onGetProfile,
  onDeleteCurrentUser,
  onSelectAvatar,
  onUpdateAvatar,
  onDeleteAvatar,
  onNicknameChange,
  onUpdateProfile,
}: ProfileSettingsCardProps) {
  return (
    <article className="tool-card user-tool-card">
      <div className="tool-icon icon-green">01</div>
      <h3>Налаштування профілю</h3>
      <p>Змініть аватар і нікнейм або видаліть акаунт.</p>
      <div className="button-row">
        <button
          className="button button-soft"
          type="button"
          disabled={busy !== null}
          onClick={onGetProfile}
        >
          {busy === "get-me" ? "Завантаження…" : "Мій профіль"}
        </button>
        {profile && (
          <button
            className="button button-danger"
            type="button"
            disabled={busy !== null}
            onClick={onDeleteCurrentUser}
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
                  onSelectAvatar(event.target.files?.[0] ?? null)
                }
                disabled={busy !== null}
              />
              <div className="button-row">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={onUpdateAvatar}
                  disabled={!avatarFile || busy !== null}
                >
                  {busy === "update-avatar"
                    ? "Завантаження…"
                    : "Зберегти аватар"}
                </button>
                {profile.avatarName && (
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={onDeleteAvatar}
                    disabled={busy !== null}
                  >
                    {busy === "delete-avatar" ? "Видалення…" : "Видалити"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <ProfileDetails profile={profile} />
          <form className="profile-edit-form" onSubmit={onUpdateProfile}>
            <label htmlFor="profile-nickname">Нікнейм</label>
            <div className="inline-form">
              <input
                id="profile-nickname"
                value={profileNickname}
                minLength={3}
                maxLength={25}
                onChange={(event) => onNicknameChange(event.target.value)}
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
  );
}

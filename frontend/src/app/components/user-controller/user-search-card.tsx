"use client";

import type { FormEvent } from "react";
import type { UserProfile } from "./types";
import ProfileDetails from "./profile-details";

type UserSearchCardProps = {
  busy: string | null;
  searchNickname: string;
  searchResults: UserProfile[];
  searchCursor: number | null;
  searchHasMore: boolean;
  targetUserId: string;
  targetProfile: UserProfile | null;
  onSearchUsers: (event: FormEvent<HTMLFormElement>) => void;
  onSearchNicknameChange: (nickname: string) => void;
  onSelectUser: (user: UserProfile) => void;
  onLoadMore: () => void;
  onFindUser: (event: FormEvent<HTMLFormElement>) => void;
  onTargetUserIdChange: (userId: string) => void;
};

export default function UserSearchCard({
  busy,
  searchNickname,
  searchResults,
  searchCursor,
  searchHasMore,
  targetUserId,
  targetProfile,
  onSearchUsers,
  onSearchNicknameChange,
  onSelectUser,
  onLoadMore,
  onFindUser,
  onTargetUserIdChange,
}: UserSearchCardProps) {
  return (
    <article className="tool-card user-tool-card">
      <div className="tool-icon icon-violet">02</div>
      <h3>Пошук користувача</h3>
      <p>Знайдіть користувача за нікнеймом або завантажте його за ID.</p>
      <form className="inline-form user-search-form" onSubmit={onSearchUsers}>
        <input
          aria-label="Нікнейм для пошуку"
          value={searchNickname}
          minLength={3}
          maxLength={25}
          placeholder="Частина нікнейму"
          onChange={(event) => onSearchNicknameChange(event.target.value)}
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
              <button type="button" onClick={() => onSelectUser(user)}>
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
          onClick={onLoadMore}
        >
          {busy === "search-users" ? "Завантаження…" : "Ще користувачі"}
        </button>
      )}
      <form className="inline-form" onSubmit={onFindUser}>
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
          onChange={(event) => onTargetUserIdChange(event.target.value)}
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
  );
}

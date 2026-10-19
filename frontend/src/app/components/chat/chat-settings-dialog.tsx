"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  ChatMember,
  GroupChannelChatSummary,
  ChatVisibility,
  GroupUserOption,
  Reaction,
  ReactionOption,
} from "./chat-types";
import { fileProxyUrl } from "./chat-utils";

type ChatSettingsDialogProps = {
  chat: GroupChannelChatSummary;
  chatTitle: string;
  titleDraft: string;
  descriptionDraft: string;
  visibilityDraft: ChatVisibility;
  allowedReactions: Reaction[];
  members: ChatMember[];
  userSearch: string;
  userResults: GroupUserOption[];
  searchingUsers: boolean;
  addingUserId: number | null;
  avatarFile: File | null;
  avatarPreview: string | null;
  savingChat: boolean;
  savingReactions: boolean;
  savingAvatar: boolean;
  managingChat: boolean;
  inviteToken: string | null;
  reactionOptions: ReactionOption[];
  onClose: () => void;
  onUpdateChat: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onVisibilityChange: (value: ChatVisibility) => void;
  onToggleReaction: (reaction: Reaction) => void;
  onSaveReactions: () => void;
  onSelectAvatar: (file: File | null) => void;
  onUploadAvatar: () => void;
  onDeleteAvatar: () => void;
  onUserSearchChange: (value: string) => void;
  onSearchUsers: () => void;
  onAddUser: (user: GroupUserOption) => void;
  onManageMember: (
    action: "remove" | "role" | "owner",
    memberId: number,
    role?: "MODERATOR" | "MEMBER",
  ) => void;
  onRefreshInviteToken: () => void;
  onClearMessages: () => void;
  onDeleteChat: () => void;
};

export default function ChatSettingsDialog({
  chat,
  chatTitle,
  titleDraft,
  descriptionDraft,
  visibilityDraft,
  allowedReactions,
  members,
  userSearch,
  userResults,
  searchingUsers,
  addingUserId,
  avatarFile,
  avatarPreview,
  savingChat,
  savingReactions,
  savingAvatar,
  managingChat,
  inviteToken,
  reactionOptions,
  onClose,
  onUpdateChat,
  onTitleChange,
  onDescriptionChange,
  onVisibilityChange,
  onToggleReaction,
  onSaveReactions,
  onSelectAvatar,
  onUploadAvatar,
  onDeleteAvatar,
  onUserSearchChange,
  onSearchUsers,
  onAddUser,
  onManageMember,
  onRefreshInviteToken,
  onClearMessages,
  onDeleteChat,
}: ChatSettingsDialogProps) {
  const [openMemberMenuId, setOpenMemberMenuId] = useState<number | null>(null);

  return (
    <div
      className="chat-settings-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="chat-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-settings-title"
      >
        <div className="chat-settings-heading">
          <h2 id="chat-settings-title">Керування чатом</h2>
          <button
            className="notice-close"
            type="button"
            aria-label="Закрити"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form className="chat-settings-form" onSubmit={onUpdateChat}>
          <label>
            Назва
            <input
              value={titleDraft}
              minLength={3}
              maxLength={20}
              onChange={(event) => onTitleChange(event.target.value)}
              required
            />
          </label>
          <label>
            Опис
            <textarea
              value={descriptionDraft}
              minLength={2}
              maxLength={500}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Необов’язковий опис"
              rows={4}
            />
          </label>
          <label>
            Видимість
            <select
              value={visibilityDraft}
              onChange={(event) => {
                if (
                  event.target.value === "PUBLIC" ||
                  event.target.value === "PRIVATE"
                ) {
                  onVisibilityChange(event.target.value);
                }
              }}
            >
              <option value="PRIVATE">Приватний</option>
              <option value="PUBLIC">Публічний</option>
            </select>
          </label>
          <div className="chat-settings-actions">
            <button
              className="button button-quiet"
              type="button"
              onClick={onClose}
              disabled={savingChat}
            >
              Скасувати
            </button>
            <button
              className="button button-primary"
              type="submit"
              disabled={savingChat}
            >
              {savingChat ? "Збереження…" : "Зберегти зміни"}
            </button>
          </div>
        </form>
        <section
          className="chat-settings-section"
          aria-labelledby="chat-avatar-title"
        >
          <h3 id="chat-avatar-title">Аватар чату</h3>
          <div className="chat-avatar-settings-preview">
            <span className="messenger-avatar">
              {avatarPreview || chat.avatarPreview || chat.avatarName ? (
                <Image
                  src={
                    avatarPreview ??
                    chat.avatarPreview ??
                    fileProxyUrl(chat.avatarName ?? "")
                  }
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                />
              ) : (
                chatTitle.slice(0, 1).toLocaleUpperCase("uk-UA")
              )}
            </span>
            <label className="chat-avatar-file">
              Оберіть нове зображення
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  onSelectAvatar(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
          <div className="chat-settings-actions">
            {chat.avatarName && (
              <button
                className="button button-quiet"
                type="button"
                onClick={onDeleteAvatar}
                disabled={savingAvatar}
              >
                Видалити аватар
              </button>
            )}
            <button
              className="button button-primary"
              type="button"
              onClick={onUploadAvatar}
              disabled={!avatarFile || savingAvatar}
            >
              {savingAvatar ? "Завантаження…" : "Зберегти аватар"}
            </button>
          </div>
        </section>
        <section
          className="chat-settings-section"
          aria-labelledby="chat-reactions-title"
        >
          <h3 id="chat-reactions-title">Дозволені реакції</h3>
          <p className="chat-settings-hint">
            Якщо не вибрати жодної, будуть доступні всі реакції.
          </p>
          <div className="chat-allowed-reactions">
            {reactionOptions.map((option) => (
              <label key={option.value}>
                <input
                  type="checkbox"
                  checked={allowedReactions.includes(option.value)}
                  onChange={() => onToggleReaction(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="chat-settings-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={onSaveReactions}
              disabled={savingReactions}
            >
              {savingReactions ? "Збереження…" : "Зберегти реакції"}
            </button>
          </div>
        </section>
        <section
          className="chat-settings-section"
          aria-labelledby="chat-members-title"
        >
          <h3 id="chat-members-title">Учасники чату ({members.length})</h3>
          <ul className="chat-settings-members">
            {members.map((member) => (
              <li key={member.id} className="chat-member-row">
                <span>
                  {member.nickname}{" "}
                  <small>
                    #{member.id} · {member.chatRole}
                  </small>
                </span>
                <button
                  className="chat-menu-trigger"
                  type="button"
                  aria-label={`Дії для ${member.nickname}`}
                  aria-expanded={openMemberMenuId === member.id}
                  onClick={() =>
                    setOpenMemberMenuId((current) =>
                      current === member.id ? null : member.id,
                    )
                  }
                  disabled={managingChat}
                >
                  ⋯
                </button>
                {openMemberMenuId === member.id && (
                  <div className="chat-item-menu chat-member-menu">
                    {member.chatRole !== "MEMBER" && (
                      <button
                        type="button"
                        disabled={managingChat}
                        onClick={() => {
                          onManageMember("role", member.id, "MEMBER");
                          setOpenMemberMenuId(null);
                        }}
                      >
                        Зробити учасником
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={managingChat}
                      onClick={() => {
                        onManageMember("role", member.id, "MODERATOR");
                        setOpenMemberMenuId(null);
                      }}
                    >
                      Зробити модератором
                    </button>
                    <button
                      type="button"
                      disabled={managingChat}
                      onClick={() => {
                        onManageMember("owner", member.id);
                        setOpenMemberMenuId(null);
                      }}
                    >
                      Зробити власником
                    </button>
                    <button
                      className="chat-menu-danger"
                      type="button"
                      disabled={managingChat}
                      onClick={() => {
                        onManageMember("remove", member.id);
                        setOpenMemberMenuId(null);
                      }}
                    >
                      Видалити з чату
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="chat-settings-member-search">
            <label htmlFor="chat-member-search">
              Додати учасника за нікнеймом
            </label>
            <div className="chat-member-search-controls">
              <input
                id="chat-member-search"
                value={userSearch}
                minLength={3}
                maxLength={25}
                onChange={(event) => onUserSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSearchUsers();
                  }
                }}
                placeholder="Введіть нікнейм"
              />
              <button
                className="button button-soft"
                type="button"
                onClick={onSearchUsers}
                disabled={searchingUsers}
              >
                {searchingUsers ? "Пошук…" : "Знайти"}
              </button>
            </div>
          </div>
          {userResults.length > 0 && (
            <ul className="chat-settings-user-results">
              {userResults.map((user) => (
                <li key={user.id}>
                  <span>
                    {user.nickname} <small>#{user.id}</small>
                  </span>
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={() => onAddUser(user)}
                    disabled={addingUserId !== null}
                  >
                    {addingUserId === user.id ? "Додавання…" : "Додати"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          className="chat-settings-section"
          aria-labelledby="chat-management-title"
        >
          <h3 id="chat-management-title">Керування чатом</h3>
          <div className="chat-settings-actions">
            <button
              className="button button-soft"
              type="button"
              onClick={onRefreshInviteToken}
              disabled={managingChat}
            >
              {managingChat ? "Виконується…" : "Оновити токен запрошення"}
            </button>
          </div>
          {inviteToken && (
            <p className="chat-settings-hint">
              Новий токен запрошення: <code>{inviteToken}</code>
            </p>
          )}
          <div className="chat-settings-actions">
            <button
              className="button button-quiet"
              type="button"
              onClick={onClearMessages}
              disabled={managingChat}
            >
              Очистити повідомлення
            </button>
            <button
              className="button button-danger"
              type="button"
              onClick={onDeleteChat}
              disabled={managingChat}
            >
              Видалити чат
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}

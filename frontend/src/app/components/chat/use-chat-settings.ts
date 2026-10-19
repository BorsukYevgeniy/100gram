"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ChatMember,
  ChatMessage,
  ChatSummary,
  GroupUserOption,
  Reaction,
} from "./chat-types";
import {
  fetchChatMembers,
  fetchPayload,
  getErrorMessage,
  reactionOptions,
} from "./chat-utils";

export type ReactionSettings = {
  chatId: number;
  allowedReactions: Reaction[];
};

type UseChatSettingsOptions = {
  selectedChat: ChatSummary | undefined;
  setChats: Dispatch<SetStateAction<ChatSummary[]>>;
  setSelectedChatId: Dispatch<SetStateAction<number | null>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setError: (error: string | null) => void;
  setShowChatSettings: Dispatch<SetStateAction<boolean>>;
  setReactionSettings: Dispatch<SetStateAction<ReactionSettings | null>>;
};

function isVisibility(value: string): value is "PUBLIC" | "PRIVATE" {
  return value === "PUBLIC" || value === "PRIVATE";
}

export function useChatSettings({
  selectedChat,
  setChats,
  setSelectedChatId,
  setMessages,
  setError,
  setShowChatSettings,
  setReactionSettings,
}: UseChatSettingsOptions) {
  const [loadingChatSettings, setLoadingChatSettings] = useState(false);
  const [savingChatSettings, setSavingChatSettings] = useState(false);
  const [chatTitleDraft, setChatTitleDraft] = useState("");
  const [chatDescriptionDraft, setChatDescriptionDraft] = useState("");
  const [chatVisibilityDraft, setChatVisibilityDraft] = useState<
    "PUBLIC" | "PRIVATE"
  >("PRIVATE");
  const [chatAllowedReactions, setChatAllowedReactions] = useState<Reaction[]>(
    [],
  );
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [chatUserSearch, setChatUserSearch] = useState("");
  const [chatUserResults, setChatUserResults] = useState<GroupUserOption[]>([]);
  const [searchingChatUsers, setSearchingChatUsers] = useState(false);
  const [addingChatUserId, setAddingChatUserId] = useState<number | null>(null);
  const [savingAllowedReactions, setSavingAllowedReactions] = useState(false);
  const [chatAvatarFile, setChatAvatarFile] = useState<File | null>(null);
  const [chatAvatarPreview, setChatAvatarPreview] = useState<string | null>(
    null,
  );
  const [savingChatAvatar, setSavingChatAvatar] = useState(false);
  const [managingChat, setManagingChat] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const chatAvatarPreviewUrls = useRef(new Set<string>());

  useEffect(() => {
    const previewUrls = chatAvatarPreviewUrls.current;
    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  async function openChatSettings() {
    if (!selectedChat || selectedChat.chatType === "PRIVATE") return;

    setLoadingChatSettings(true);
    setError(null);
    try {
      const [payload, members] = await Promise.all([
        fetchPayload(`/api/chats/${selectedChat.id}`),
        fetchChatMembers(selectedChat.id),
      ]);

      if (
        !payload ||
        typeof payload !== "object" ||
        !("title" in payload) ||
        typeof payload.title !== "string" ||
        !("description" in payload) ||
        (typeof payload.description !== "string" &&
          payload.description !== null) ||
        !("visibility" in payload) ||
        typeof payload.visibility !== "string" ||
        !isVisibility(payload.visibility) ||
        !("allowedReactions" in payload) ||
        !Array.isArray(payload.allowedReactions) ||
        !payload.allowedReactions.every((reaction) =>
          reactionOptions.some((option) => option.value === reaction),
        )
      ) {
        throw new Error("Сервер повернув некоректну інформацію про чат.");
      }

      setChatTitleDraft(payload.title);
      setChatDescriptionDraft(payload.description ?? "");
      setChatVisibilityDraft(payload.visibility);
      setChatAllowedReactions(payload.allowedReactions);
      setReactionSettings({
        chatId: selectedChat.id,
        allowedReactions: payload.allowedReactions,
      });
      setChatMembers(members);
      setInviteToken(null);
      setChatUserSearch("");
      setChatUserResults([]);
      setChatAvatarFile(null);
      setChatAvatarPreview(null);
      setShowChatSettings(true);
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Не вдалося завантажити інформацію про чат.",
      );
    } finally {
      setLoadingChatSettings(false);
    }
  }

  function toggleChatAllowedReaction(reaction: Reaction) {
    setChatAllowedReactions((current) =>
      current.includes(reaction)
        ? current.filter((item) => item !== reaction)
        : [...current, reaction],
    );
  }

  async function saveAllowedReactions() {
    if (
      !selectedChat ||
      selectedChat.chatType === "PRIVATE" ||
      savingAllowedReactions
    )
      return;

    setSavingAllowedReactions(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/chats/${selectedChat.id}/allowed-reactions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allowedReactions: chatAllowedReactions }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося оновити дозволені реакції (${response.status}).`,
          ),
        );
      }
      setReactionSettings({
        chatId: selectedChat.id,
        allowedReactions: chatAllowedReactions,
      });
    } catch (reactionError) {
      setError(
        reactionError instanceof Error
          ? reactionError.message
          : "Не вдалося оновити дозволені реакції.",
      );
    } finally {
      setSavingAllowedReactions(false);
    }
  }

  async function searchChatUsers() {
    const nickname = chatUserSearch.trim();
    if (nickname.length < 3 || nickname.length > 25) {
      setError("Введіть від 3 до 25 символів нікнейму для пошуку.");
      return;
    }

    setSearchingChatUsers(true);
    setError(null);
    try {
      const query = new URLSearchParams({ nickname, limit: "20" });
      const payload = await fetchPayload(`/api/users/search?${query}`);
      if (
        !payload ||
        typeof payload !== "object" ||
        !("users" in payload) ||
        !Array.isArray(payload.users)
      ) {
        throw new Error("Сервер повернув некоректні результати пошуку.");
      }

      const users: GroupUserOption[] = [];
      for (const user of payload.users) {
        if (
          !user ||
          typeof user !== "object" ||
          !("id" in user) ||
          typeof user.id !== "number" ||
          !("nickname" in user) ||
          typeof user.nickname !== "string"
        ) {
          throw new Error("Сервер повернув некоректні дані користувача.");
        }
        if (!chatMembers.some((member) => member.id === user.id)) {
          users.push({ id: user.id, nickname: user.nickname });
        }
      }
      setChatUserResults(users);
      if (users.length === 0) {
        setError("Користувачів не знайдено або їх уже додано до чату.");
      }
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Не вдалося знайти користувачів.",
      );
    } finally {
      setSearchingChatUsers(false);
    }
  }

  async function addChatUser(user: GroupUserOption) {
    if (
      !selectedChat ||
      selectedChat.chatType === "PRIVATE" ||
      addingChatUserId !== null
    )
      return;

    setAddingChatUserId(user.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/chats/${selectedChat.id}/users/${user.id}`,
        { method: "POST" },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося додати користувача (${response.status}).`,
          ),
        );
      }
      setChatMembers((current) =>
        current.some((member) => member.id === user.id)
          ? current
          : [...current, { ...user, chatRole: "MEMBER" as const }].sort((left, right) =>
              left.nickname.localeCompare(right.nickname, "uk-UA"),
            ),
      );
      setChatUserResults((current) =>
        current.filter((result) => result.id !== user.id),
      );
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Не вдалося додати користувача до чату.",
      );
    } finally {
      setAddingChatUserId(null);
    }
  }

  function selectChatAvatar(file: File | null) {
    if (file && !file.type.startsWith("image/")) {
      setError("Оберіть файл зображення для аватару.");
      setChatAvatarFile(null);
      setChatAvatarPreview(null);
      return;
    }
    setError(null);
    setChatAvatarFile(file);
    if (!file) {
      setChatAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    chatAvatarPreviewUrls.current.add(previewUrl);
    setChatAvatarPreview(previewUrl);
  }

  async function uploadChatAvatar() {
    if (
      !selectedChat ||
      selectedChat.chatType === "PRIVATE" ||
      !chatAvatarFile ||
      savingChatAvatar
    )
      return;

    setSavingChatAvatar(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("avatar", chatAvatarFile);
      const response = await fetch(`/api/chats/${selectedChat.id}/avatar`, {
        method: "PATCH",
        body: form,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося змінити аватар чату (${response.status}).`,
          ),
        );
      }
      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedChat.id
            ? chat.chatType === "PRIVATE"
              ? chat
              : {
                  ...chat,
                  avatarName:
                    payload &&
                    typeof payload === "object" &&
                    "avatarUrl" in payload &&
                    typeof payload.avatarUrl === "string"
                      ? payload.avatarUrl
                      : chat.avatarName,
                  avatarPreview: undefined,
                }
            : chat,
        ),
      );
      setChatAvatarFile(null);
      setChatAvatarPreview(null);
    } catch (avatarError) {
      setError(
        avatarError instanceof Error
          ? avatarError.message
          : "Не вдалося змінити аватар чату.",
      );
    } finally {
      setSavingChatAvatar(false);
    }
  }

  async function deleteChatAvatar() {
    if (
      !selectedChat ||
      selectedChat.chatType === "PRIVATE" ||
      savingChatAvatar
    )
      return;

    setSavingChatAvatar(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/avatar`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося видалити аватар чату (${response.status}).`,
          ),
        );
      }
      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedChat.id
            ? chat.chatType === "PRIVATE"
              ? chat
              : { ...chat, avatarName: null, avatarPreview: undefined }
            : chat,
        ),
      );
      selectChatAvatar(null);
    } catch (avatarError) {
      setError(
        avatarError instanceof Error
          ? avatarError.message
          : "Не вдалося видалити аватар чату.",
      );
    } finally {
      setSavingChatAvatar(false);
    }
  }

  async function handleUpdateChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !selectedChat ||
      selectedChat.chatType === "PRIVATE" ||
      savingChatSettings
    )
      return;

    const title = chatTitleDraft.trim();
    const description = chatDescriptionDraft.trim();
    if (title.length < 3 || title.length > 20) {
      setError("Назва чату має містити від 3 до 20 символів.");
      return;
    }
    if (description.length === 1 || description.length > 500) {
      setError("Опис має бути порожнім або містити від 2 до 500 символів.");
      return;
    }

    setSavingChatSettings(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          visibility: chatVisibilityDraft,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося оновити чат (${response.status}).`,
          ),
        );
      }

      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedChat.id ? { ...chat, title } : chat,
        ),
      );
      setShowChatSettings(false);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Не вдалося оновити інформацію про чат.",
      );
    } finally {
      setSavingChatSettings(false);
    }
  }

  async function manageMember(
    action: "remove" | "role" | "owner",
    memberId: number,
    role?: "MODERATOR" | "MEMBER",
  ) {
    if (!selectedChat || selectedChat.chatType === "PRIVATE" || managingChat) {
      return;
    }

    if (!Number.isSafeInteger(memberId) || memberId < 1) {
      setError("Некоректний учасник чату.");
      return;
    }
    if (action === "role" && role !== "MEMBER" && role !== "MODERATOR") {
      setError("Оберіть коректну роль учасника.");
      return;
    }
    if (
      action === "remove" &&
      !window.confirm("Видалити цього учасника з чату?")
    ) {
      return;
    }
    if (
      action === "owner" &&
      !window.confirm("Передати цьому учаснику права власника чату?")
    ) {
      return;
    }

    setManagingChat(true);
    setError(null);
    try {
      const path =
        action === "owner"
          ? `/api/chats/${selectedChat.id}/owner/${memberId}`
          : `/api/chats/${selectedChat.id}/users/${memberId}${action === "role" ? "/role" : ""}`;
      const response = await fetch(path, {
        method: action === "remove" ? "DELETE" : "PATCH",
        ...(action === "role"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role }),
            }
          : {}),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося виконати дію з учасником (${response.status}).`,
          ),
        );
      }
      if (action === "remove") {
        setChatMembers((current) =>
          current.filter((member) => member.id !== memberId),
        );
      } else if (action === "role" && role) {
        setChatMembers((current) =>
          current.map((member) =>
            member.id === memberId ? { ...member, chatRole: role } : member,
          ),
        );
      } else if (action === "owner") {
        setChatMembers((current) =>
          current.map((member) => ({
            ...member,
            chatRole:
              member.id === memberId
                ? "OWNER"
                : member.chatRole === "OWNER"
                  ? "MEMBER"
                  : member.chatRole,
          })),
        );
      }
    } catch (memberError) {
      setError(
        memberError instanceof Error
          ? memberError.message
          : "Не вдалося виконати дію з учасником.",
      );
    } finally {
      setManagingChat(false);
    }
  }

  async function refreshInviteToken() {
    if (!selectedChat || selectedChat.chatType === "PRIVATE" || managingChat) {
      return;
    }

    setManagingChat(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/chats/${selectedChat.id}/invite-token`,
        { method: "PATCH" },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося оновити токен запрошення (${response.status}).`,
          ),
        );
      }
      if (
        !payload ||
        typeof payload !== "object" ||
        !("inviteToken" in payload) ||
        typeof payload.inviteToken !== "string"
      ) {
        throw new Error("Сервер не повернув новий токен запрошення.");
      }
      setInviteToken(payload.inviteToken);
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Не вдалося оновити токен запрошення.",
      );
    } finally {
      setManagingChat(false);
    }
  }

  async function clearChatMessages() {
    if (!selectedChat || selectedChat.chatType === "PRIVATE" || managingChat) {
      return;
    }
    if (!window.confirm("Видалити всі повідомлення цього чату?")) return;

    setManagingChat(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося очистити повідомлення (${response.status}).`,
          ),
        );
      }
      setMessages([]);
      setChats((current) =>
        current.map((chat) =>
          chat.id === selectedChat.id ? { ...chat, lastMessage: null } : chat,
        ),
      );
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Не вдалося очистити повідомлення чату.",
      );
    } finally {
      setManagingChat(false);
    }
  }

  async function deleteChat() {
    if (!selectedChat || selectedChat.chatType === "PRIVATE" || managingChat) {
      return;
    }
    if (
      !window.confirm(
        "Видалити цей чат? Усі його повідомлення буде втрачено. Цю дію не можна скасувати.",
      )
    ) {
      return;
    }

    setManagingChat(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats/${selectedChat.id}`, {
        method: "DELETE",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            `Не вдалося видалити чат (${response.status}).`,
          ),
        );
      }
      setChats((current) =>
        current.filter((chat) => chat.id !== selectedChat.id),
      );
      setSelectedChatId(null);
      setMessages([]);
      setShowChatSettings(false);
      setReactionSettings(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не вдалося видалити чат.",
      );
    } finally {
      setManagingChat(false);
    }
  }

  return {
    loadingChatSettings,
    savingChatSettings,
    chatTitleDraft,
    setChatTitleDraft,
    chatDescriptionDraft,
    setChatDescriptionDraft,
    chatVisibilityDraft,
    setChatVisibilityDraft,
    chatAllowedReactions,
    chatMembers,
    chatUserSearch,
    setChatUserSearch,
    chatUserResults,
    searchingChatUsers,
    addingChatUserId,
    savingAllowedReactions,
    chatAvatarFile,
    chatAvatarPreview,
    savingChatAvatar,
    managingChat,
    inviteToken,
    openChatSettings,
    toggleChatAllowedReaction,
    saveAllowedReactions,
    searchChatUsers,
    addChatUser,
    selectChatAvatar,
    uploadChatAvatar,
    deleteChatAvatar,
    handleUpdateChat,
    manageMember,
    refreshInviteToken,
    clearChatMessages,
    deleteChat,
  };
}

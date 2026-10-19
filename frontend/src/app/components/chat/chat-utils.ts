import {
  ApiError,
  ChatMember,
  ChatMessage,
  ChatSummary,
  MessageReaction,
  ReactionOption,
} from "./chat-types";

export const reactionOptions: ReactionOption[] = [
  { value: "LIKE", label: "👍" },
  { value: "DISLIKE", label: "👎" },
  { value: "FIRE", label: "🔥" },
  { value: "HEART", label: "❤️" },
  { value: "HEART_WITH_FIRE", label: "❤️‍🔥" },
];

export function fileProxyUrl(
  fileName: string,
  kind: "users" | "chats" = "chats",
) {
  const fileKey = fileName.startsWith("avatars/")
    ? fileName
    : `avatars/${kind}/${fileName}`;
  return `/api/files?key=${encodeURIComponent(fileKey)}`;
}

export function getChatTitle(chat: ChatSummary) {
  return chat.chatType === "PRIVATE" ? chat.participant.nickname : chat.title;
}

export function getChatAvatarName(chat: ChatSummary) {
  return chat.chatType === "PRIVATE"
    ? chat.participant.avatarName
    : chat.avatarName;
}

export function getErrorMessage(payload: unknown, fallback: string) {
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

export async function fetchPayload(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        payload,
        `Запит завершився з помилкою ${response.status}.`,
      ),
    );
  }
  return payload;
}

function isChatSummary(payload: unknown): payload is ChatSummary {
  if (!payload || typeof payload !== "object") return false;
  const chat = payload as Record<string, unknown>;
  const hasValidLastMessage =
    chat.lastMessage === null ||
    (!!chat.lastMessage &&
      typeof chat.lastMessage === "object" &&
      "text" in chat.lastMessage &&
      typeof chat.lastMessage.text === "string" &&
      "createdAt" in chat.lastMessage &&
      typeof chat.lastMessage.createdAt === "string");
  if (
    typeof chat.id !== "number" ||
    typeof chat.isPinned !== "boolean" ||
    !hasValidLastMessage
  ) {
    return false;
  }

  if (chat.chatType === "PRIVATE") {
    return (
      !!chat.participant &&
      typeof chat.participant === "object" &&
      "nickname" in chat.participant &&
      typeof chat.participant.nickname === "string" &&
      "avatarName" in chat.participant &&
      (typeof chat.participant.avatarName === "string" ||
        chat.participant.avatarName === null)
    );
  }

  return (
    (chat.chatType === "GROUP" || chat.chatType === "CHANNEL") &&
    typeof chat.title === "string" &&
    (typeof chat.avatarName === "string" || chat.avatarName === null)
  );
}

export function isChatListPayload(
  payload: unknown,
): payload is { chats: ChatSummary[] } {
  return (
    !!payload &&
    typeof payload === "object" &&
    "chats" in payload &&
    Array.isArray(payload.chats) &&
    payload.chats.every(isChatSummary)
  );
}

export async function fetchChatMembers(chatId: number): Promise<ChatMember[]> {
  const members: ChatMember[] = [];
  const cursors = new Set<number>();
  let cursor: number | null = null;

  while (true) {
    const query = new URLSearchParams({ limit: "50" });
    if (cursor !== null) query.set("cursor", String(cursor));
    const payload = await fetchPayload(`/api/chats/${chatId}/users?${query}`);
    if (
      !payload ||
      typeof payload !== "object" ||
      !("users" in payload) ||
      !Array.isArray(payload.users) ||
      !("hasMore" in payload) ||
      typeof payload.hasMore !== "boolean" ||
      !("nextCursor" in payload) ||
      (payload.nextCursor !== null && typeof payload.nextCursor !== "number")
    ) {
      throw new Error("Сервер повернув некоректний список учасників чату.");
    }
    for (const member of payload.users) {
      if (
        !member ||
        typeof member !== "object" ||
        !("id" in member) ||
        typeof member.id !== "number" ||
        !("nickname" in member) ||
        typeof member.nickname !== "string" ||
        !("chatRole" in member) ||
        (member.chatRole !== "OWNER" &&
          member.chatRole !== "MODERATOR" &&
          member.chatRole !== "MEMBER")
      ) {
        throw new Error("Сервер повернув некоректні дані учасника чату.");
      }
      members.push({
        id: member.id,
        nickname: member.nickname,
        chatRole: member.chatRole,
      });
    }

    if (!payload.hasMore) return members;
    if (
      typeof payload.nextCursor !== "number" ||
      cursors.has(payload.nextCursor)
    ) {
      throw new Error("Сервер повернув некоректний курсор учасників чату.");
    }
    cursor = payload.nextCursor;
    cursors.add(cursor);
  }
}

export function isChatMessage(payload: unknown): payload is ChatMessage {
  if (!payload || typeof payload !== "object") return false;
  const message = payload as Partial<ChatMessage>;
  return (
    typeof message.id === "number" &&
    typeof message.chatId === "number" &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string" &&
    typeof message.userId === "number" &&
    Array.isArray(message.files)
  );
}

export function isMessageReaction(
  payload: unknown,
): payload is MessageReaction {
  if (!payload || typeof payload !== "object") return false;
  const reaction = payload as Partial<MessageReaction>;
  return (
    typeof reaction.messageId === "number" &&
    typeof reaction.userId === "number" &&
    reactionOptions.some((option) => option.value === reaction.reaction)
  );
}

export function upsertMessage(messages: ChatMessage[], message: ChatMessage) {
  return [...messages.filter((item) => item.id !== message.id), message].sort(
    (left, right) => left.id - right.id,
  );
}

export function updateReaction(
  messages: ChatMessage[],
  reaction: MessageReaction,
  remove = false,
) {
  return messages.map((message) => {
    if (message.id !== reaction.messageId) return message;
    const reactions = message.reactions.filter(
      (item) => item.userId !== reaction.userId,
    );
    return {
      ...message,
      reactions: remove ? reactions : [...reactions, reaction],
    };
  });
}

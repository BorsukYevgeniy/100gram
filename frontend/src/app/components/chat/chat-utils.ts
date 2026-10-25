import {
  ApiError,
  ChatMember,
  ChatMessage,
  ChatSummary,
  MessageReaction,
  MessageReactionSummary,
  Reaction,
  ReactionOption,
} from "./chat-types";

export const reactionOptions: ReactionOption[] = [
  { value: "LIKE", label: "👍" },
  { value: "DISLIKE", label: "👎" },
  { value: "FIRE", label: "🔥" },
  { value: "HEART", label: "❤️" },
  { value: "HEART_WITH_FIRE", label: "❤️‍🔥" },
];

export const emptyMessageReactions: MessageReactionSummary = {
  like: { count: 0, isReactedByMe: false },
  dislike: { count: 0, isReactedByMe: false },
  fire: { count: 0, isReactedByMe: false },
  heart: { count: 0, isReactedByMe: false },
  heartWithFire: { count: 0, isReactedByMe: false },
};

const reactionKeys: Record<Reaction, keyof MessageReactionSummary> = {
  LIKE: "like",
  DISLIKE: "dislike",
  FIRE: "fire",
  HEART: "heart",
  HEART_WITH_FIRE: "heartWithFire",
};

function isMessageReactionSummary(
  payload: unknown,
): payload is MessageReactionSummary {
  if (!payload || typeof payload !== "object") return false;
  const reactions = payload as Record<string, unknown>;
  return Object.values(reactionKeys).every((key) => {
    const reaction = reactions[key];
    if (!reaction || typeof reaction !== "object") return false;
    const summary = reaction as Record<string, unknown>;
    return (
      typeof summary.count === "number" &&
      Number.isInteger(summary.count) &&
      summary.count >= 0 &&
      typeof summary.isReactedByMe === "boolean"
    );
  });
}

export function getReactionSummary(
  reactions: MessageReactionSummary,
  reaction: Reaction,
) {
  return reactions[reactionKeys[reaction]];
}

export function getMyReaction(
  reactions: MessageReactionSummary,
): Reaction | null {
  return (
    reactionOptions.find(
      (option) => reactions[reactionKeys[option.value]].isReactedByMe,
    )?.value ?? null
  );
}

export function fileProxyUrl(
  fileName: string,
  kind: "users" | "chats" | "attachments" = "chats",
) {
  const fileKey =
    fileName.startsWith("avatars/") || fileName.startsWith("attachments/")
      ? fileName
      : kind === "attachments"
        ? `attachments/${fileName}`
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
    !!message.user &&
    typeof message.user === "object" &&
    typeof message.user.id === "number" &&
    typeof message.user.nickname === "string" &&
    Array.isArray(message.fileNames) &&
    message.fileNames.every((fileName) => typeof fileName === "string") &&
    (message.reactions === undefined ||
      isMessageReactionSummary(message.reactions))
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
  currentUserId: number | null,
  remove = false,
  updateCounts = true,
) {
  return messages.map((message) => {
    if (message.id !== reaction.messageId) return message;
    const reactions: MessageReactionSummary = {
      like: { ...message.reactions.like },
      dislike: { ...message.reactions.dislike },
      fire: { ...message.reactions.fire },
      heart: { ...message.reactions.heart },
      heartWithFire: { ...message.reactions.heartWithFire },
    };
    const previousReaction =
      reaction.userId === currentUserId
        ? (Object.entries(reactions).find(
            ([, summary]) => summary.isReactedByMe,
          )?.[0] as keyof MessageReactionSummary | undefined)
        : undefined;
    const nextKey = reactionKeys[reaction.reaction];

    if (updateCounts) {
      if (remove) {
        reactions[nextKey].count = Math.max(0, reactions[nextKey].count - 1);
      } else if (previousReaction !== nextKey) {
        if (previousReaction) {
          reactions[previousReaction].count = Math.max(
            0,
            reactions[previousReaction].count - 1,
          );
        }
        reactions[nextKey].count += 1;
      }
    }
    if (reaction.userId === currentUserId) {
      for (const summary of Object.values(reactions)) {
        summary.isReactedByMe = false;
      }
      if (!remove) reactions[nextKey].isReactedByMe = true;
    }

    return {
      ...message,
      reactions,
    };
  });
}

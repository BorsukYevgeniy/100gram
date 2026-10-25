type BaseChatSummary = {
  id: number;
  lastMessage: { text: string; createdAt: string } | null;
  isPinned: boolean;
};

export type PrivateChatSummary = BaseChatSummary & {
  chatType: "PRIVATE";
  participant: {
    id: number;
    nickname: string;
    avatarName: string | null;
  };
};

export type PublicUserProfile = {
  id: number;
  nickname: string;
  description: string | null;
  avatarName: string | null;
  createdAt: string;
};

export type GroupChannelChatSummary = BaseChatSummary & {
  chatType: "GROUP" | "CHANNEL";
  title: string;
  avatarName: string | null;
  avatarPreview?: string;
};

export type ChatSummary = PrivateChatSummary | GroupChannelChatSummary;

export type GroupUserOption = {
  id: number;
  nickname: string;
};

export type ChatMember = {
  id: number;
  nickname: string;
  chatRole: "OWNER" | "MODERATOR" | "MEMBER";
};

export type ChatMessage = {
  id: number;
  chatId: number;
  text: string;
  createdAt: string;
  replyId: number | null;
  user: { id: number; nickname: string; avatarName: string | null };
  isPinned: boolean;
  fileNames: string[];
  reactions: MessageReactionSummary;
};

export type MessageReactionSummary = {
  like: ReactionSummary;
  dislike: ReactionSummary;
  fire: ReactionSummary;
  heart: ReactionSummary;
  heartWithFire: ReactionSummary;
};

export type ReactionSummary = {
  count: number;
  isReactedByMe: boolean;
};

export type MessageReaction = {
  messageId: number;
  userId: number;
  reaction: Reaction;
  createdAt: string;
};

export type Reaction =
  "LIKE" | "DISLIKE" | "FIRE" | "HEART" | "HEART_WITH_FIRE";

export type ConnectionState =
  "loading" | "connecting" | "connected" | "disconnected" | "error";

export type ChatCreationMode = "private" | "group" | "channel";
export type ChatVisibility = "PUBLIC" | "PRIVATE";
export type ReactionOption = { value: Reaction; label: string };

export type ApiError = {
  message?: string | string[];
  error?: string;
};

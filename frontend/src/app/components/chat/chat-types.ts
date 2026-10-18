export type ChatSummary = {
	id: number;
	title: string | null;
	participantName?: string;
	avatarName: string | null;
	avatarPreview?: string;
	lastMessage: { text: string; createdAt: string } | null;
	isPinned: boolean;
};

export type GroupUserOption = {
	id: number;
	nickname: string;
};

export type ChatMember = {
	id: number;
	nickname: string;
};

export type ChatMessage = {
	id: number;
	chatId: number;
	text: string;
	createdAt: string;
	replyId: number | null;
	userId: number;
	isPinned: boolean;
	files: { name: string }[];
	reactions: MessageReaction[];
};

export type MessageReaction = {
	messageId: number;
	userId: number;
	reaction: Reaction;
	createdAt: string;
};

export type Reaction =
	| 'LIKE'
	| 'DISLIKE'
	| 'FIRE'
	| 'HEART'
	| 'HEART_WITH_FIRE';

export type ConnectionState =
	| 'loading'
	| 'connecting'
	| 'connected'
	| 'disconnected'
	| 'error';

export type ChatCreationMode = 'private' | 'group' | 'channel';
export type ChatVisibility = 'PUBLIC' | 'PRIVATE';
export type ReactionOption = { value: Reaction; label: string };

export type ApiError = {
	message?: string | string[];
	error?: string;
};

import {
	ApiError,
	ChatMember,
	ChatMessage,
	ChatSummary,
	MessageReaction,
	ReactionOption,
} from './chat-types';

export const reactionOptions: ReactionOption[] = [
	{ value: 'LIKE', label: '👍' },
	{ value: 'DISLIKE', label: '👎' },
	{ value: 'FIRE', label: '🔥' },
	{ value: 'HEART', label: '❤️' },
	{ value: 'HEART_WITH_FIRE', label: '❤️‍🔥' },
];

export function fileProxyUrl(fileName: string) {
	const fileKey = fileName.startsWith('avatars/')
		? fileName
		: `avatars/chats/${fileName}`;
	return `/api/files?key=${encodeURIComponent(fileKey)}`;
}

export function getErrorMessage(payload: unknown, fallback: string) {
	if (payload && typeof payload === 'object' && 'message' in payload) {
		const message = (payload as ApiError).message;
		if (Array.isArray(message)) return message.join('. ');
		if (typeof message === 'string') return message;
	}
	if (payload && typeof payload === 'object' && 'error' in payload) {
		const error = (payload as ApiError).error;
		if (typeof error === 'string') return error;
	}
	return fallback;
}

export async function fetchPayload(url: string) {
	const response = await fetch(url, { cache: 'no-store' });
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
	if (!payload || typeof payload !== 'object') return false;
	const chat = payload as Partial<ChatSummary>;
	return (
		typeof chat.id === 'number' &&
		(typeof chat.title === 'string' || chat.title === null) &&
		(typeof chat.avatarName === 'string' || chat.avatarName === null) &&
		typeof chat.isPinned === 'boolean' &&
		(chat.lastMessage === null ||
			(typeof chat.lastMessage === 'object' &&
				typeof chat.lastMessage.text === 'string' &&
				typeof chat.lastMessage.createdAt === 'string'))
	);
}

export function isChatListPayload(
	payload: unknown,
): payload is { chats: ChatSummary[] } {
	return (
		!!payload &&
		typeof payload === 'object' &&
		'chats' in payload &&
		Array.isArray(payload.chats) &&
		payload.chats.every(isChatSummary)
	);
}

export async function addPrivateChatParticipantNames(
	chats: ChatSummary[],
	currentUserId: number,
): Promise<ChatSummary[]> {
	return Promise.all(
		chats.map(async (chat) => {
			if (chat.title !== null) return chat;

			const payload = await fetchPayload(
				`/api/chats/${chat.id}/users?limit=50`,
			);
			if (
				!payload ||
				typeof payload !== 'object' ||
				!('users' in payload) ||
				!Array.isArray(payload.users)
			) {
				throw new Error(
					`Сервер повернув некоректний список учасників чату #${chat.id}.`,
				);
			}

			const participant = payload.users.find(
				(user) =>
					!!user &&
					typeof user === 'object' &&
					'id' in user &&
					user.id !== currentUserId &&
					'nickname' in user &&
					typeof user.nickname === 'string',
			);
			if (!participant || !('nickname' in participant)) {
				throw new Error(
					`Не вдалося визначити співрозмовника приватного чату #${chat.id}.`,
				);
			}

			return { ...chat, participantName: participant.nickname };
		}),
	);
}

export async function fetchChatMembers(chatId: number): Promise<ChatMember[]> {
	const members: ChatMember[] = [];
	const cursors = new Set<number>();
	let cursor: number | null = null;

	while (true) {
		const query = new URLSearchParams({ limit: '50' });
		if (cursor !== null) query.set('cursor', String(cursor));
		const payload = await fetchPayload(
			`/api/chats/${chatId}/users?${query}`,
		);
		if (
			!payload ||
			typeof payload !== 'object' ||
			!('users' in payload) ||
			!Array.isArray(payload.users) ||
			!('hasMore' in payload) ||
			typeof payload.hasMore !== 'boolean' ||
			!('nextCursor' in payload) ||
			(payload.nextCursor !== null && typeof payload.nextCursor !== 'number')
		) {
			throw new Error('Сервер повернув некоректний список учасників чату.');
		}
		for (const member of payload.users) {
			if (
				!member ||
				typeof member !== 'object' ||
				!('id' in member) ||
				typeof member.id !== 'number' ||
				!('nickname' in member) ||
				typeof member.nickname !== 'string'
			) {
				throw new Error('Сервер повернув некоректні дані учасника чату.');
			}
			members.push({ id: member.id, nickname: member.nickname });
		}

		if (!payload.hasMore) return members;
		if (
			typeof payload.nextCursor !== 'number' ||
			cursors.has(payload.nextCursor)
		) {
			throw new Error('Сервер повернув некоректний курсор учасників чату.');
		}
		cursor = payload.nextCursor;
		cursors.add(cursor);
	}
}

export function isChatMessage(payload: unknown): payload is ChatMessage {
	if (!payload || typeof payload !== 'object') return false;
	const message = payload as Partial<ChatMessage>;
	return (
		typeof message.id === 'number' &&
		typeof message.chatId === 'number' &&
		typeof message.text === 'string' &&
		typeof message.createdAt === 'string' &&
		typeof message.userId === 'number' &&
		Array.isArray(message.files)
	);
}

export function isMessageReaction(payload: unknown): payload is MessageReaction {
	if (!payload || typeof payload !== 'object') return false;
	const reaction = payload as Partial<MessageReaction>;
	return (
		typeof reaction.messageId === 'number' &&
		typeof reaction.userId === 'number' &&
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

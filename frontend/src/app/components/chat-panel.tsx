'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

type ChatSummary = {
	id: number;
	title: string | null;
	participantName?: string;
	avatarName: string | null;
	lastMessage: { text: string; createdAt: string } | null;
	isPinned: boolean;
};

type ChatMessage = {
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

type MessageReaction = {
	messageId: number;
	userId: number;
	reaction: Reaction;
	createdAt: string;
};

type Reaction = 'LIKE' | 'DISLIKE' | 'FIRE' | 'HEART' | 'HEART_WITH_FIRE';
type ConnectionState =
	| 'loading'
	| 'connecting'
	| 'connected'
	| 'disconnected'
	| 'error';
type ChatCreationMode = 'private' | 'group' | 'channel';

type ApiError = {
	message?: string | string[];
	error?: string;
};

const reactionOptions: { value: Reaction; label: string }[] = [
	{ value: 'LIKE', label: '👍' },
	{ value: 'DISLIKE', label: '👎' },
	{ value: 'FIRE', label: '🔥' },
	{ value: 'HEART', label: '❤️' },
	{ value: 'HEART_WITH_FIRE', label: '❤️‍🔥' },
];

function isChatCreationMode(value: string): value is ChatCreationMode {
	return value === 'private' || value === 'group' || value === 'channel';
}

function isVisibility(value: string): value is 'PUBLIC' | 'PRIVATE' {
	return value === 'PUBLIC' || value === 'PRIVATE';
}

function getErrorMessage(payload: unknown, fallback: string) {
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

async function fetchPayload(url: string) {
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

function isChatListPayload(
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

async function addPrivateChatParticipantNames(
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

function isChatMessage(payload: unknown): payload is ChatMessage {
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

function isMessageReaction(payload: unknown): payload is MessageReaction {
	if (!payload || typeof payload !== 'object') return false;
	const reaction = payload as Partial<MessageReaction>;
	return (
		typeof reaction.messageId === 'number' &&
		typeof reaction.userId === 'number' &&
		reactionOptions.some((option) => option.value === reaction.reaction)
	);
}

function upsertMessage(messages: ChatMessage[], message: ChatMessage) {
	return [...messages.filter((item) => item.id !== message.id), message].sort(
		(left, right) => left.id - right.id,
	);
}

function updateReaction(
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

export default function ChatPanel() {
	const [chats, setChats] = useState<ChatSummary[]>([]);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [pendingReactionMessageIds, setPendingReactionMessageIds] = useState<
		Set<number>
	>(() => new Set());
	const pendingReactionSnapshots = useRef(
		new Map<number, MessageReaction | null>(),
	);
	const [connection, setConnection] = useState<ConnectionState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [messageText, setMessageText] = useState('');
	const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
	const [editText, setEditText] = useState('');
	const [creationMode, setCreationMode] = useState<ChatCreationMode>('group');
	const [creationTitle, setCreationTitle] = useState('');
	const [creationDescription, setCreationDescription] = useState('');
	const [creationUserIds, setCreationUserIds] = useState('');
	const [creationVisibility, setCreationVisibility] = useState<
		'PUBLIC' | 'PRIVATE'
	>('PRIVATE');
	const [creatingChat, setCreatingChat] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [chatSearch, setChatSearch] = useState('');
	const [showChatSettings, setShowChatSettings] = useState(false);
	const [loadingChatSettings, setLoadingChatSettings] = useState(false);
	const [savingChatSettings, setSavingChatSettings] = useState(false);
	const [chatTitleDraft, setChatTitleDraft] = useState('');
	const [chatDescriptionDraft, setChatDescriptionDraft] = useState('');
	const [chatVisibilityDraft, setChatVisibilityDraft] = useState<
		'PUBLIC' | 'PRIVATE'
	>('PRIVATE');
	const [socket, setSocket] = useState<Socket | null>(null);
	const activeChatId = useRef<number | null>(null);
	const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
	const socketConfigError =
		currentUserId !== null &&
		!configuredBackendUrl &&
		process.env.NODE_ENV !== 'development'
			? 'Для чату задайте NEXT_PUBLIC_BACKEND_URL — адресу NestJS API.'
			: null;

	const rollbackPendingReactions = useCallback(() => {
		if (currentUserId === null) return;
		const snapshots = pendingReactionSnapshots.current;
		if (snapshots.size === 0) return;
		setMessages((current) =>
			current.map((message) => {
				if (!snapshots.has(message.id)) return message;
				const previous = snapshots.get(message.id);
				const reactions = message.reactions.filter(
					(item) => item.userId !== currentUserId,
				);
				return {
					...message,
					reactions: previous ? [...reactions, previous] : reactions,
				};
			}),
		);
		snapshots.clear();
		setPendingReactionMessageIds(new Set());
	}, [currentUserId]);

	useEffect(() => {
		let active = true;

		async function loadChats() {
			setConnection('loading');
			setError(null);
			try {
				const [profile, chatPayload] = await Promise.all([
					fetchPayload('/api/users/me'),
					fetchPayload('/api/chats/me?limit=50'),
				]);
				if (
					!profile ||
					typeof profile !== 'object' ||
					!('id' in profile) ||
					typeof profile.id !== 'number'
				) {
					throw new Error('Сервер повернув некоректний профіль користувача.');
				}
				if (!isChatListPayload(chatPayload)) {
					throw new Error('Сервер повернув некоректний список чатів.');
				}
				if (!active) return;
				const chatsWithNames = await addPrivateChatParticipantNames(
					chatPayload.chats,
					profile.id,
				);
				if (!active) return;
				setCurrentUserId(profile.id);
				setChats(chatsWithNames);
				setSelectedChatId((selected) =>
					chatsWithNames.some((chat) => chat.id === selected)
						? selected
						: (chatsWithNames[0]?.id ?? null),
				);
				setConnection('connecting');
			} catch (loadError) {
				if (!active) return;
				setConnection('error');
				setError(
					loadError instanceof Error
						? loadError.message
						: 'Не вдалося завантажити чати.',
				);
			}
		}

		void loadChats();
		return () => {
			active = false;
		};
	}, []);

	useEffect(() => {
		if (currentUserId === null) return;
		const backendUrl = configuredBackendUrl
			? configuredBackendUrl
			: process.env.NODE_ENV === 'development'
				? `${window.location.protocol}//${window.location.hostname}:3000`
				: '';
		if (!backendUrl) {
			return;
		}

		const client = io(backendUrl, {
			autoConnect: false,
			transports: ['websocket'],
			withCredentials: true,
		});
		const handleConnect = () => {
			setConnection('connected');
			setError(null);
			const chatId = activeChatId.current;
			if (chatId !== null) client.emit('joinRoom', { chatId });
		};
		const handleDisconnect = () => {
			rollbackPendingReactions();
			setConnection('disconnected');
		};
		const handleConnectError = (connectError: Error) => {
			rollbackPendingReactions();
			setConnection('error');
			setError(
				`Не вдалося під’єднатися до чату (${backendUrl}): ${connectError.message}. Перевірте, що сервер доступний з цього пристрою та використовується правильна адреса.`,
			);
		};
		const handleException = (payload: unknown) => {
			setError(getErrorMessage(payload, 'Помилка WebSocket-операції.'));
			rollbackPendingReactions();
		};
		const handleCreatedMessage = (payload: unknown) => {
			if (!isChatMessage(payload) || payload.chatId !== activeChatId.current)
				return;
			setMessages((current) =>
				upsertMessage(current, { ...payload, reactions: [] }),
			);
			setChats((current) =>
				current.map((chat) =>
					chat.id === payload.chatId
						? {
								...chat,
								lastMessage: {
									text: payload.text,
									createdAt: payload.createdAt,
								},
							}
						: chat,
				),
			);
		};
		const handleUpdatedMessage = (payload: unknown) => {
			if (!isChatMessage(payload) || payload.chatId !== activeChatId.current)
				return;
			setMessages((current) => {
				const existing = current.find((item) => item.id === payload.id);
				return upsertMessage(current, {
					...payload,
					reactions: existing?.reactions ?? [],
				});
			});
		};
		const handleDeletedMessage = (payload: unknown) => {
			if (!isChatMessage(payload) || payload.chatId !== activeChatId.current)
				return;
			setMessages((current) =>
				current.filter((item) => item.id !== payload.id),
			);
		};
		const handleAddedReaction = (payload: unknown) => {
			if (isMessageReaction(payload)) {
				setMessages((current) => updateReaction(current, payload));
				if (payload.userId === currentUserId) {
					pendingReactionSnapshots.current.delete(payload.messageId);
					setPendingReactionMessageIds((current) => {
						const next = new Set(current);
						next.delete(payload.messageId);
						return next;
					});
				}
			}
		};
		const handleUpdatedReaction = (payload: unknown) => {
			if (isMessageReaction(payload)) {
				setMessages((current) => updateReaction(current, payload));
				if (payload.userId === currentUserId) {
					pendingReactionSnapshots.current.delete(payload.messageId);
					setPendingReactionMessageIds((current) => {
						const next = new Set(current);
						next.delete(payload.messageId);
						return next;
					});
				}
			}
		};
		const handleDeletedReaction = (payload: unknown) => {
			if (isMessageReaction(payload)) {
				setMessages((current) => updateReaction(current, payload, true));
				if (payload.userId === currentUserId) {
					pendingReactionSnapshots.current.delete(payload.messageId);
					setPendingReactionMessageIds((current) => {
						const next = new Set(current);
						next.delete(payload.messageId);
						return next;
					});
				}
			}
		};

		client.on('connect', handleConnect);
		client.on('disconnect', handleDisconnect);
		client.on('connect_error', handleConnectError);
		client.on('exception', handleException);
		client.on('chatCreatedMessage', handleCreatedMessage);
		client.on('chatUpdatedMessage', handleUpdatedMessage);
		client.on('chatDeletedMessage', handleDeletedMessage);
		client.on('chatAddedReaction', handleAddedReaction);
		client.on('chatUpdatedReaction', handleUpdatedReaction);
		client.on('chatDeletedReaction', handleDeletedReaction);
		setSocket(client);
		client.connect();

		return () => {
			client.disconnect();
			client.removeAllListeners();
			setSocket(null);
		};
	}, [configuredBackendUrl, currentUserId, rollbackPendingReactions]);

	useEffect(() => {
		activeChatId.current = selectedChatId;
		if (selectedChatId === null) return;

		let active = true;
		const chatId = selectedChatId;
		async function loadMessages() {
			try {
				const payload = await fetchPayload(
					`/api/chats/${chatId}/messages?limit=50`,
				);
				if (
					!payload ||
					typeof payload !== 'object' ||
					!('messages' in payload) ||
					!Array.isArray(payload.messages) ||
					!payload.messages.every(isChatMessage)
				) {
					throw new Error('Сервер повернув некоректний список повідомлень.');
				}
				if (active) {
					setMessages(
						[...payload.messages]
							.reverse()
							.map((message) => ({ ...message, reactions: [] })),
					);
				}
			} catch (loadError) {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: 'Не вдалося завантажити повідомлення.',
					);
				}
			}
		}

		void loadMessages();
		if (socket?.connected) socket.emit('joinRoom', { chatId });

		return () => {
			active = false;
			if (socket?.connected) socket.emit('leaveRoom', { chatId });
		};
	}, [selectedChatId, socket]);

	function selectChat(chatId: number) {
		setMessages([]);
		setEditingMessageId(null);
		setShowChatSettings(false);
		setError(null);
		setSelectedChatId(chatId);
	}

	async function openChatSettings() {
		if (!selectedChat || selectedChat.title === null) return;

		setLoadingChatSettings(true);
		setError(null);
		try {
			const payload = await fetchPayload(`/api/chats/${selectedChat.id}`);
			console.log(payload);

			if (
				!payload ||
				typeof payload !== 'object' ||
				!('title' in payload) ||
				typeof payload.title !== 'string' ||
				!('description' in payload) ||
				(typeof payload.description !== 'string' &&
					payload.description !== null) ||
				!('visibility' in payload) ||
				typeof payload.visibility !== 'string' ||
				!isVisibility(payload.visibility)
			) {
				throw new Error('Сервер повернув некоректну інформацію про чат.');
			}

			setChatTitleDraft(payload.title);
			setChatDescriptionDraft(payload.description ?? '');
			setChatVisibilityDraft(payload.visibility);
			setShowChatSettings(true);
		} catch (settingsError) {
			setError(
				settingsError instanceof Error
					? settingsError.message
					: 'Не вдалося завантажити інформацію про чат.',
			);
		} finally {
			setLoadingChatSettings(false);
		}
	}

	async function handleUpdateChat(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedChat || savingChatSettings) return;

		const title = chatTitleDraft.trim();
		const description = chatDescriptionDraft.trim();
		if (title.length < 3 || title.length > 20) {
			setError('Назва чату має містити від 3 до 20 символів.');
			return;
		}
		if (description.length === 1 || description.length > 500) {
			setError('Опис має бути порожнім або містити від 2 до 500 символів.');
			return;
		}

		setSavingChatSettings(true);
		setError(null);
		try {
			const response = await fetch(`/api/chats/${selectedChat.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
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
					: 'Не вдалося оновити інформацію про чат.',
			);
		} finally {
			setSavingChatSettings(false);
		}
	}

	function handleSendMessage(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = messageText.trim();
		if (!socket?.connected || selectedChatId === null || !text) return;
		setError(null);
		socket.emit('createMessage', { chatId: selectedChatId, text });
		setMessageText('');
	}

	function handleUpdateMessage(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = editText.trim();
		if (
			!socket?.connected ||
			selectedChatId === null ||
			editingMessageId === null ||
			!text
		) {
			return;
		}
		setError(null);
		socket.emit('updateMessage', {
			chatId: selectedChatId,
			messageId: editingMessageId,
			text,
		});
		setEditingMessageId(null);
		setEditText('');
	}

	function deleteMessage(messageId: number) {
		if (!socket?.connected || selectedChatId === null) return;
		if (!window.confirm('Видалити це повідомлення?')) return;
		setError(null);
		socket.emit('deleteMessage', { chatId: selectedChatId, messageId });
	}

	function toggleReaction(message: ChatMessage, reaction: Reaction) {
		if (
			!socket?.connected ||
			selectedChatId === null ||
			currentUserId === null ||
			pendingReactionMessageIds.has(message.id)
		) {
			return;
		}
		const ownReaction = message.reactions.find(
			(item) => item.userId === currentUserId,
		);
		const method = !ownReaction
			? 'POST'
			: ownReaction.reaction === reaction
				? 'DELETE'
				: 'PATCH';
		pendingReactionSnapshots.current.set(message.id, ownReaction ?? null);
		setPendingReactionMessageIds((current) => new Set(current).add(message.id));
		setError(null);
		const optimisticReaction: MessageReaction = {
			messageId: message.id,
			userId: currentUserId,
			reaction,
			createdAt: new Date().toISOString(),
		};
		setMessages((current) =>
			updateReaction(current, optimisticReaction, method === 'DELETE'),
		);

		if (method === 'POST') {
			socket.emit('addReaction', {
				chatId: selectedChatId,
				messageId: message.id,
				reaction,
			});
		} else if (method === 'PATCH') {
			socket.emit('updateReaction', {
				chatId: selectedChatId,
				messageId: message.id,
				reaction,
			});
		} else {
			socket.emit('deleteReaction', {
				chatId: selectedChatId,
				messageId: message.id,
			});
		}
	}

	async function handleCreateChat(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (creatingChat) return;
		if (currentUserId === null) {
			setError('Не вдалося визначити поточного користувача.');
			return;
		}

		let body: Record<string, string | number | number[] | undefined>;
		if (creationMode === 'private') {
			const userId = Number(creationUserIds.trim());
			if (
				!Number.isSafeInteger(userId) ||
				userId < 1 ||
				userId === currentUserId
			) {
				setError('Введіть коректний ID іншого користувача.');
				return;
			}
			body = { userId };
		} else {
			const rawUserIds = creationUserIds
				.split(',')
				.map((value) => value.trim());
			const userIds = rawUserIds.map(Number);
			if (
				creationMode === 'group' &&
				(!creationUserIds.trim() ||
					rawUserIds.some((value) => value.length === 0) ||
					userIds.some((userId) => !Number.isSafeInteger(userId) || userId < 1))
			) {
				setError('Введіть додатні числові ID учасників через кому.');
				return;
			}
			if (
				creationMode === 'group' &&
				new Set(userIds).size !== userIds.length
			) {
				setError('ID кожного учасника можна вказати лише один раз.');
				return;
			}
			const otherUserIds =
				creationMode === 'group'
					? userIds.filter((userId) => userId !== currentUserId)
					: userIds;
			if (creationMode === 'group' && otherUserIds.length === 0) {
				setError('Вкажіть ID хоча б одного іншого учасника групи.');
				return;
			}
			body = {
				title: creationTitle.trim(),
				description: creationDescription.trim() || undefined,
				visibility: creationVisibility,
				...(creationMode === 'group' ? { userIds: otherUserIds } : {}),
			};
		}

		setCreatingChat(true);
		setError(null);
		try {
			const response = await fetch(`/api/chats/${creationMode}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			const createdPayload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					getErrorMessage(
						createdPayload,
						`Не вдалося створити чат (${response.status}).`,
					),
				);
			}
			if (
				!createdPayload ||
				typeof createdPayload !== 'object' ||
				!('id' in createdPayload) ||
				typeof createdPayload.id !== 'number'
			) {
				throw new Error('Сервер повернув некоректні дані створеного чату.');
			}

			const listPayload = await fetchPayload('/api/chats/me?limit=50');
			if (!isChatListPayload(listPayload)) {
				throw new Error('Сервер повернув некоректний список чатів.');
			}
			const chatsWithNames = await addPrivateChatParticipantNames(
				listPayload.chats,
				currentUserId,
			);
			setChats(chatsWithNames);
			setSelectedChatId(createdPayload.id);
			setMessages([]);
			setCreationTitle('');
			setCreationDescription('');
			setCreationUserIds('');
			setShowCreateForm(false);
		} catch (createError) {
			setError(
				createError instanceof Error
					? createError.message
					: 'Не вдалося створити чат.',
			);
		} finally {
			setCreatingChat(false);
		}
	}

	const selectedChat = chats.find((chat) => chat.id === selectedChatId);
	const displayError = error ?? socketConfigError;
	const displayedConnection = socketConfigError ? 'error' : connection;
	const visibleChats = chats.filter((chat) =>
		(chat.participantName || chat.title || `Чат #${chat.id}`)
			.toLocaleLowerCase('uk-UA')
			.includes(chatSearch.trim().toLocaleLowerCase('uk-UA')),
	);
	const selectedChatTitle =
		selectedChat?.participantName ||
		selectedChat?.title ||
		(selectedChat ? `Чат #${selectedChat.id}` : '');

	return (
		<main
			className={`messenger-shell${selectedChatId !== null ? ' has-selection' : ''}`}
		>
			<header className='messenger-topbar'>
				<Link className='brand' href='/' aria-label='100gram — на головну'>
					<span className='brand-mark'>1</span>
					<span>100gram</span>
				</Link>
				<div className='messenger-topbar-links'>
					<span className={`messenger-connection ${displayedConnection}`}>
						<span className='live-dot' />
						{displayedConnection === 'connected'
							? 'Онлайн'
							: displayedConnection === 'connecting' ||
								  displayedConnection === 'loading'
								? 'Підключення…'
								: displayedConnection === 'disconnected'
									? 'Немає з’єднання'
									: 'Помилка з’єднання'}
					</span>
					<Link className='docs-link' href='/user'>
						Профіль <span aria-hidden='true'>↗</span>
					</Link>
					<Link className='docs-link' href='/controllers'>
						Інструменти <span aria-hidden='true'>↗</span>
					</Link>
				</div>
			</header>
			{displayError && (
				<div className='notice notice-error messenger-error' role='alert'>
					<span className='notice-symbol' aria-hidden='true'>
						!
					</span>
					{displayError}
					<button
						type='button'
						className='notice-close'
						aria-label='Закрити повідомлення'
						onClick={() => setError(null)}
					>
						×
					</button>
				</div>
			)}

			<div className='messenger-layout'>
				<aside className='messenger-sidebar' aria-label='Список чатів'>
					<div className='messenger-sidebar-heading'>
						<h1>Чати</h1>
						<button
							className='messenger-new-chat'
							type='button'
							aria-label={
								showCreateForm ? 'Закрити створення чату' : 'Створити чат'
							}
							title='Створити чат'
							onClick={() => setShowCreateForm((visible) => !visible)}
						>
							{showCreateForm ? '×' : '+'}
						</button>
					</div>
					<label className='messenger-search'>
						<span aria-hidden='true'>⌕</span>
						<input
							aria-label='Пошук чатів'
							placeholder='Пошук'
							value={chatSearch}
							onChange={(event) => setChatSearch(event.target.value)}
						/>
					</label>

					{showCreateForm && (
						<form className='chat-create-form' onSubmit={handleCreateChat}>
							<div className='chat-create-heading'>
								<h2>Новий чат</h2>
								<label>
									<span className='sr-only'>Тип чату</span>
									<select
										value={creationMode}
										onChange={(event) => {
											if (isChatCreationMode(event.target.value)) {
												setCreationMode(event.target.value);
											}
										}}
									>
										<option value='private'>Приватний чат</option>
										<option value='group'>Група</option>
										<option value='channel'>Канал</option>
									</select>
								</label>
							</div>
							{creationMode !== 'private' && (
								<>
									<label>
										Назва
										<input
											value={creationTitle}
											minLength={3}
											maxLength={20}
											onChange={(event) => setCreationTitle(event.target.value)}
											placeholder='3–20 символів'
											required
										/>
									</label>
									<label>
										Опис (необов’язково)
										<input
											value={creationDescription}
											minLength={2}
											maxLength={500}
											onChange={(event) =>
												setCreationDescription(event.target.value)
											}
											placeholder='Короткий опис'
										/>
									</label>
									<label>
										Видимість
										<select
											value={creationVisibility}
											onChange={(event) => {
												if (isVisibility(event.target.value)) {
													setCreationVisibility(event.target.value);
												}
											}}
										>
											<option value='PRIVATE'>Приватний</option>
											<option value='PUBLIC'>Публічний</option>
										</select>
									</label>
								</>
							)}
							{creationMode !== 'channel' && (
								<label>
									{creationMode === 'private'
										? 'ID користувача'
										: 'ID учасників через кому'}
									<input
										type='text'
										inputMode='numeric'
										value={creationUserIds}
										onChange={(event) => setCreationUserIds(event.target.value)}
										placeholder={
											creationMode === 'private' ? 'Наприклад, 12' : '12, 34'
										}
										required
									/>
								</label>
							)}
							<button
								className='button button-primary'
								type='submit'
								disabled={creatingChat}
							>
								{creatingChat
									? 'Створення…'
									: creationMode === 'private'
										? 'Створити чат'
										: creationMode === 'group'
											? 'Створити групу'
											: 'Створити канал'}
							</button>
						</form>
					)}

					<div className='messenger-chat-list'>
						{visibleChats.length === 0 ? (
							<p className='messenger-empty-list'>
								{chats.length === 0
									? 'Тут з’являться ваші чати'
									: 'Чатів не знайдено'}
							</p>
						) : (
							visibleChats.map((chat) => {
								const title =
									chat.participantName || chat.title || `Чат #${chat.id}`;
								return (
									<button
										type='button'
										key={chat.id}
										className={`messenger-chat-item${selectedChatId === chat.id ? ' selected' : ''}`}
										onClick={() => selectChat(chat.id)}
									>
										<span className='messenger-avatar' aria-hidden='true'>
											{title.slice(0, 1).toLocaleUpperCase('uk-UA')}
										</span>
										<span className='messenger-chat-copy'>
											<span className='messenger-chat-title'>
												{chat.isPinned && (
													<span aria-label='Закріплено'>◆ </span>
												)}
												{title}
											</span>
											<span className='messenger-chat-preview'>
												{chat.lastMessage?.text ?? 'Поки немає повідомлень'}
											</span>
										</span>
										{chat.lastMessage && (
											<time className='messenger-chat-time'>
												{new Date(
													chat.lastMessage.createdAt,
												).toLocaleTimeString('uk-UA', {
													hour: '2-digit',
													minute: '2-digit',
												})}
											</time>
										)}
									</button>
								);
							})
						)}
					</div>
				</aside>

				<section
					className='messenger-conversation'
					aria-label='Повідомлення чату'
				>
					{selectedChat ? (
						<>
							<header className='messenger-conversation-heading'>
								<button
									className='messenger-back'
									type='button'
									aria-label='До списку чатів'
									onClick={() => setSelectedChatId(null)}
								>
									←
								</button>
								{selectedChat.title !== null ? (
									<button
										className='messenger-avatar conversation-avatar messenger-chat-avatar-button'
										type='button'
										aria-label='Відкрити інформацію про чат'
										title='Інформація про чат'
										onClick={() => void openChatSettings()}
										disabled={loadingChatSettings}
									>
										{selectedChatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')}
									</button>
								) : (
									<span
										className='messenger-avatar conversation-avatar'
										aria-hidden='true'
									>
										{selectedChatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')}
									</span>
								)}
								<div className='messenger-chat-info'>
									<h2>{selectedChatTitle}</h2>
									<span>
										{displayedConnection === 'connected'
											? 'онлайн'
											: 'статус з’єднання'}
									</span>
								</div>
							</header>
							{showChatSettings && (
								<div
									className='chat-settings-overlay'
									onClick={(event) => {
										if (event.target === event.currentTarget) {
											setShowChatSettings(false);
										}
									}}
								>
									<section
										className='chat-settings-dialog'
										role='dialog'
										aria-modal='true'
										aria-labelledby='chat-settings-title'
									>
										<div className='chat-settings-heading'>
											<h2 id='chat-settings-title'>Інформація про чат</h2>
											<button
												className='notice-close'
												type='button'
												aria-label='Закрити'
												onClick={() => setShowChatSettings(false)}
											>
												×
											</button>
										</div>
										<form
											className='chat-settings-form'
											onSubmit={handleUpdateChat}
										>
											<label>
												Назва
												<input
													value={chatTitleDraft}
													minLength={3}
													maxLength={20}
													onChange={(event) =>
														setChatTitleDraft(event.target.value)
													}
													required
												/>
											</label>
											<label>
												Опис
												<textarea
													value={chatDescriptionDraft}
													minLength={2}
													maxLength={500}
													onChange={(event) =>
														setChatDescriptionDraft(event.target.value)
													}
													placeholder='Необов’язковий опис'
													rows={4}
												/>
											</label>
											<label>
												Видимість
												<select
													value={chatVisibilityDraft}
													onChange={(event) => {
														if (isVisibility(event.target.value)) {
															setChatVisibilityDraft(event.target.value);
														}
													}}
												>
													<option value='PRIVATE'>Приватний</option>
													<option value='PUBLIC'>Публічний</option>
												</select>
											</label>
											<div className='chat-settings-actions'>
												<button
													className='button button-quiet'
													type='button'
													onClick={() => setShowChatSettings(false)}
													disabled={savingChatSettings}
												>
													Скасувати
												</button>
												<button
													className='button button-primary'
													type='submit'
													disabled={savingChatSettings}
												>
													{savingChatSettings
														? 'Збереження…'
														: 'Зберегти зміни'}
												</button>
											</div>
										</form>
									</section>
								</div>
							)}
							<div className='messenger-messages' aria-live='polite'>
								{messages.length === 0 ? (
									<div className='messenger-no-messages'>
										<span aria-hidden='true'>✉</span>
										<p>Повідомлень поки немає</p>
										<span>Напишіть першим</span>
									</div>
								) : (
									messages.map((message) => {
										const isOwnMessage = message.userId === currentUserId;
										return (
											<article
												className={`messenger-message${isOwnMessage ? ' own' : ''}`}
												key={message.id}
											>
												<div className='messenger-message-bubble'>
													{!isOwnMessage && (
														<strong className='messenger-sender'>
															Користувач #{message.userId}
														</strong>
													)}
													{editingMessageId === message.id ? (
														<form
															className='chat-edit-form'
															onSubmit={handleUpdateMessage}
														>
															<input
																aria-label='Текст повідомлення'
																value={editText}
																maxLength={3000}
																onChange={(event) =>
																	setEditText(event.target.value)
																}
																required
															/>
															<button
																className='button button-soft'
																type='submit'
															>
																Зберегти
															</button>
															<button
																className='button button-quiet'
																type='button'
																onClick={() => setEditingMessageId(null)}
															>
																Скасувати
															</button>
														</form>
													) : (
														<p className='messenger-message-text'>
															{message.text}
														</p>
													)}
													{message.files.length > 0 && (
														<p className='chat-muted'>
															Вкладення:{' '}
															{message.files
																.map((file) => file.name)
																.join(', ')}
														</p>
													)}
													<div className='messenger-message-footer'>
														<div className='chat-message-actions'>
															{reactionOptions.map((option) => {
																const count = message.reactions.filter(
																	(item) => item.reaction === option.value,
																).length;
																const selected = message.reactions.some(
																	(item) =>
																		item.userId === currentUserId &&
																		item.reaction === option.value,
																);
																return (
																	<button
																		type='button'
																		key={option.value}
																		className={`chat-reaction${selected ? ' selected' : ''}`}
																		title={option.value}
																		aria-label={`${option.value}: ${count}`}
																		disabled={
																			connection !== 'connected' ||
																			pendingReactionMessageIds.has(message.id)
																		}
																		onClick={() => {
																			void toggleReaction(
																				message,
																				option.value,
																			);
																		}}
																	>
																		{option.label}
																		{count > 0 ? ` ${count}` : ''}
																	</button>
																);
															})}
														</div>
														<time dateTime={message.createdAt}>
															{new Date(message.createdAt).toLocaleTimeString(
																'uk-UA',
																{ hour: '2-digit', minute: '2-digit' },
															)}
														</time>
														{isOwnMessage &&
															editingMessageId !== message.id && (
																<div className='messenger-edit-actions'>
																	<button
																		className='text-button'
																		type='button'
																		disabled={connection !== 'connected'}
																		onClick={() => {
																			setEditingMessageId(message.id);
																			setEditText(message.text);
																		}}
																	>
																		Редагувати
																	</button>
																	<button
																		className='text-button'
																		type='button'
																		disabled={connection !== 'connected'}
																		onClick={() => deleteMessage(message.id)}
																	>
																		Видалити
																	</button>
																</div>
															)}
													</div>
												</div>
											</article>
										);
									})
								)}
							</div>
							<form className='messenger-compose' onSubmit={handleSendMessage}>
								<input
									aria-label='Нове повідомлення'
									placeholder={
										connection === 'connected'
											? 'Повідомлення'
											: 'Підключення до чату…'
									}
									value={messageText}
									maxLength={3000}
									onChange={(event) => setMessageText(event.target.value)}
									disabled={connection !== 'connected'}
									required
								/>
								<button
									className='messenger-send'
									type='submit'
									aria-label='Надіслати повідомлення'
									disabled={connection !== 'connected' || !messageText.trim()}
								>
									↑
								</button>
							</form>
						</>
					) : (
						<div className='messenger-welcome'>
							<span aria-hidden='true'>✉</span>
							<h2>100gram</h2>
							<p>Оберіть чат, щоб почати спілкування</p>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}

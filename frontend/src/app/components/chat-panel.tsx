'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import ChatConversation from './chat/chat-conversation';
import ChatSidebar from './chat/chat-sidebar';
import UserProfileDialog from './chat/user-profile-dialog';
import {
	ChatMessage,
	ChatSummary,
	ConnectionState,
	MessageReaction,
	PrivateChatSummary,
	Reaction,
} from './chat/chat-types';
import {
	fetchPayload,
	emptyMessageReactions,
	getMyReaction,
	getChatTitle,
	getErrorMessage,
	isChatListPayload,
	isChatMessage,
	isMessageReaction,
	reactionOptions,
	updateReaction,
	upsertMessage,
} from './chat/chat-utils';
import { useChatCreation } from './chat/use-chat-creation';
import { ReactionSettings, useChatSettings } from './chat/use-chat-settings';

export default function ChatPanel() {
	const [chats, setChats] = useState<ChatSummary[]>([]);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
	const [profileUserId, setProfileUserId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [messageScrollTrigger, setMessageScrollTrigger] = useState(0);
	const [pendingReactionMessageIds, setPendingReactionMessageIds] = useState<
		Set<number>
	>(() => new Set());
	const [pendingPinnedMessageIds, setPendingPinnedMessageIds] = useState<
		Set<number>
	>(() => new Set());
	const pendingReactionSnapshots = useRef(new Map<number, Reaction | null>());
	const [connection, setConnection] = useState<ConnectionState>('loading');
	const [error, setError] = useState<string | null>(null);
	const [messageText, setMessageText] = useState('');
	const [messageFiles, setMessageFiles] = useState<File[]>([]);
	const [sendingMessage, setSendingMessage] = useState(false);
	const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
	const [editText, setEditText] = useState('');
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [chatSearch, setChatSearch] = useState('');
	const [showChatSettings, setShowChatSettings] = useState(false);
	const [pinningChatId, setPinningChatId] = useState<number | null>(null);
	const [reactionSettings, setReactionSettings] =
		useState<ReactionSettings | null>(null);
	const [socket, setSocket] = useState<Socket | null>(null);
	const activeChatId = useRef<number | null>(null);
	const selectedChat = chats.find((chat) => chat.id === selectedChatId);
	const chatCreation = useChatCreation({
		currentUserId,
		setChats,
		setSelectedChatId,
		setMessages,
		setShowCreateForm,
		setError,
	});
	const chatSettings = useChatSettings({
		socket,
		selectedChat,
		setChats,
		setSelectedChatId,
		setMessages,
		setError,
		setShowChatSettings,
		setReactionSettings,
	});

	const rollbackPendingReactions = useCallback(() => {
		if (currentUserId === null) return;
		const snapshots = pendingReactionSnapshots.current;
		if (snapshots.size === 0) return;
		setMessages((current) =>
			current.map((message) => {
				if (!snapshots.has(message.id)) return message;
				const previous = snapshots.get(message.id);
				const currentReaction = getMyReaction(message.reactions);
				if (previous !== null && previous !== undefined) {
					return updateReaction(
						[message],
						{
							messageId: message.id,
							userId: currentUserId,
							reaction: previous,
							createdAt: new Date().toISOString(),
						},
						currentUserId,
					)[0];
				}
				return currentReaction
					? updateReaction(
							[message],
							{
								messageId: message.id,
								userId: currentUserId,
								reaction: currentReaction,
								createdAt: new Date().toISOString(),
							},
							currentUserId,
							true,
						)[0]
					: message;
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
				setCurrentUserId(profile.id);
				setChats(chatPayload.chats);
				setSelectedChatId((selected) =>
					chatPayload.chats.some((chat) => chat.id === selected)
						? selected
						: (chatPayload.chats[0]?.id ?? null),
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
		const socketUrl = window.location.origin;

		const client = io(socketUrl, {
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
				`Не вдалося під’єднатися до чату (${socketUrl}): ${connectError.message}. Перевірте, що сервер доступний з цього пристрою та використовується правильна адреса.`,
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
				upsertMessage(current, {
					...payload,
					reactions: emptyMessageReactions,
				}),
			);
			if (payload.user.id === currentUserId) {
				setMessageScrollTrigger((current) => current + 1);
			}
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
					reactions:
						existing?.reactions ?? payload.reactions ?? emptyMessageReactions,
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
				const isOptimisticAck =
					payload.userId === currentUserId &&
					pendingReactionSnapshots.current.has(payload.messageId);
				setMessages((current) =>
					updateReaction(
						current,
						payload,
						currentUserId,
						false,
						!isOptimisticAck,
					),
				);
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
		async function refreshMessageReactions(messageId: number) {
			const chatId = activeChatId.current;
			if (chatId === null) return;
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
				const updatedMessage = payload.messages.find(
					(message) => message.id === messageId,
				);
				if (!updatedMessage || activeChatId.current !== chatId) return;
				setMessages((current) =>
					current.map((message) =>
						message.id === messageId
							? { ...message, reactions: updatedMessage.reactions }
							: message,
					),
				);
			} catch (reactionError) {
				setError(
					reactionError instanceof Error
						? reactionError.message
						: 'Не вдалося оновити реакції повідомлення.',
				);
			}
		}
		const handleUpdatedReaction = (payload: unknown) => {
			if (isMessageReaction(payload)) {
				setMessages((current) =>
					updateReaction(current, payload, currentUserId, false, false),
				);
				void refreshMessageReactions(payload.messageId);
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
				const isOptimisticAck =
					payload.userId === currentUserId &&
					pendingReactionSnapshots.current.has(payload.messageId);
				setMessages((current) =>
					updateReaction(
						current,
						payload,
						currentUserId,
						true,
						!isOptimisticAck,
					),
				);
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
	}, [currentUserId, rollbackPendingReactions]);

	useEffect(() => {
		activeChatId.current = selectedChatId;
		if (selectedChatId === null) return;

		let active = true;
		const chatId = selectedChatId;
		async function loadAllowedReactions() {
			try {
				const payload = await fetchPayload(`/api/chats/${chatId}`);
				if (!payload || typeof payload !== 'object') {
					throw new Error('Сервер повернув некоректні налаштування реакцій.');
				}

				let allowedReactions: Reaction[];
				if ('allowedReactions' in payload) {
					if (
						!Array.isArray(payload.allowedReactions) ||
						!payload.allowedReactions.every((reaction) =>
							reactionOptions.some((option) => option.value === reaction),
						)
					) {
						throw new Error(
							'Сервер повернув некоректний список дозволених реакцій.',
						);
					}
					allowedReactions = payload.allowedReactions;
				} else if ('chatType' in payload && payload.chatType === 'PRIVATE') {
					allowedReactions = [];
				} else {
					throw new Error(
						'Сервер не повернув налаштування дозволених реакцій.',
					);
				}
				if (active) setReactionSettings({ chatId, allowedReactions });
			} catch (settingsError) {
				if (!active) return;
				setReactionSettings(null);
				setError(
					settingsError instanceof Error
						? settingsError.message
						: 'Не вдалося завантажити дозволені реакції.',
				);
			}
		}

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
						[...payload.messages].reverse().map((message) => ({
							...message,
							reactions: message.reactions ?? emptyMessageReactions,
						})),
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

		void loadAllowedReactions();
		void loadMessages();
		if (socket?.connected) socket.emit('joinRoom', { chatId });

		return () => {
			active = false;
			if (socket?.connected) socket.emit('leaveRoom', { chatId });
		};
	}, [selectedChatId, socket]);

	function selectChat(chatId: number) {
		setMessages([]);
		setMessageFiles([]);
		setEditingMessageId(null);
		setShowChatSettings(false);
		setError(null);
		setSelectedChatId(chatId);
	}

	async function startPrivateChat(userId: number) {
		if (currentUserId === null || userId === currentUserId) {
			throw new Error('Неможливо почати приватний чат із цим користувачем.');
		}

		const existingChat = chats.find(
			(chat) =>
				chat.chatType === 'PRIVATE' && chat.participant.id === userId,
		);
		if (existingChat) {
			selectChat(existingChat.id);
			setProfileUserId(null);
			return;
		}

		const response = await fetch('/api/chats/private', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId }),
		});
		const payload: unknown = await response.json().catch(() => null);
		if (!response.ok) {
			throw new Error(
				getErrorMessage(
					payload,
					`Не вдалося почати приватний чат (${response.status}).`,
				),
			);
		}
		if (
			!payload ||
			typeof payload !== 'object' ||
			!('id' in payload) ||
			typeof payload.id !== 'number' ||
			!('participant' in payload) ||
			!payload.participant ||
			typeof payload.participant !== 'object' ||
			!('nickname' in payload.participant) ||
			typeof payload.participant.nickname !== 'string' ||
			!('avatarName' in payload.participant) ||
			(payload.participant.avatarName !== null &&
				typeof payload.participant.avatarName !== 'string')
		) {
			throw new Error('Сервер повернув некоректні дані приватного чату.');
		}

		const newChat: PrivateChatSummary = {
			id: payload.id,
			chatType: 'PRIVATE',
			participant: {
				id: userId,
				nickname: payload.participant.nickname,
				avatarName: payload.participant.avatarName,
			},
			lastMessage: null,
			isPinned: false,
			currentUserRole: 'OWNER',
		};
		setChats((current) => [
			newChat,
			...current.filter((chat) => chat.id !== newChat.id),
		]);
		setMessages([]);
		setSelectedChatId(newChat.id);
		setProfileUserId(null);
	}

	async function toggleChatPin(chatId: number) {
		const chat = chats.find((item) => item.id === chatId);
		if (!chat || pinningChatId !== null) return;

		setPinningChatId(chatId);
		setError(null);
		try {
			const action = chat.isPinned ? 'unpin' : 'pin';
			const response = await fetch(`/api/chats/${chatId}/${action}`, {
				method: 'PATCH',
			});
			const payload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					getErrorMessage(
						payload,
						`Не вдалося ${chat.isPinned ? 'відкріпити' : 'закріпити'} чат (${response.status}).`,
					),
				);
			}
			setChats((current) =>
				current.map((item) =>
					item.id === chatId ? { ...item, isPinned: !chat.isPinned } : item,
				),
			);
		} catch (pinError) {
			setError(
				pinError instanceof Error
					? pinError.message
					: 'Не вдалося змінити закріплення чату.',
			);
		} finally {
			setPinningChatId(null);
		}
	}

	async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = messageText.trim();
		if (
			!socket?.connected ||
			selectedChatId === null ||
			!text ||
			sendingMessage
		) {
			return;
		}

		const chatId = selectedChatId;
		setError(null);
		setSendingMessage(true);
		try {
			let filenames: string[] = [];
			if (messageFiles.length > 0) {
				const formData = new FormData();
				for (const file of messageFiles) {
					formData.append('files', file);
				}

				const uploadFiles = () =>
					fetch('/api/controller-api/files/upload', {
						method: 'POST',
						body: formData,
						cache: 'no-store',
					});
				let response = await uploadFiles();
				if (response.status === 401) {
					const refreshResponse = await fetch('/api/auth/refresh', {
						method: 'POST',
						cache: 'no-store',
					});
					if (refreshResponse.ok) response = await uploadFiles();
				}
				const payload: unknown = await response.json().catch(() => null);
				if (!response.ok) {
					throw new Error(
						getErrorMessage(
							payload,
							`Не вдалося завантажити вкладення (${response.status}).`,
						),
					);
				}
				if (
					!Array.isArray(payload) ||
					!payload.every(
						(file) =>
							!!file &&
							typeof file === 'object' &&
							'name' in file &&
							typeof file.name === 'string',
					)
				) {
					throw new Error('Сервер повернув некоректні дані вкладень.');
				}
				filenames = payload.map((file) => file.name);
			}

			if (!socket.connected || selectedChatId !== chatId) {
				throw new Error(
					'Чат змінився або з’єднання перервано. Повідомлення не надіслано.',
				);
			}
			socket.emit('createMessage', {
				chatId,
				text,
				...(filenames.length > 0 ? { filenames } : {}),
			});
			setMessageText('');
			setMessageFiles([]);
		} catch (sendError) {
			setError(
				sendError instanceof Error
					? sendError.message
					: 'Не вдалося надіслати повідомлення.',
			);
		} finally {
			setSendingMessage(false);
		}
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
		if (!window.confirm('Видалити це повідомлення для всіх?')) return;
		setError(null);
		socket.emit('deleteMessage', { chatId: selectedChatId, messageId });
	}

	async function deleteMessageForMe(messageId: number) {
		try {
			const response = await fetch(
				`/api/controller-api/messages/${messageId}/deleted-for-me`,
				{ method: 'PATCH' },
			);
			const payload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					getErrorMessage(
						payload,
						`Не вдалося прибрати повідомлення (${response.status}).`,
					),
				);
			}
			setMessages((current) =>
				current.filter((message) => message.id !== messageId),
			);
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Не вдалося прибрати повідомлення для себе.',
			);
		}
	}

	async function toggleMessagePin(message: ChatMessage) {
		if (pendingPinnedMessageIds.has(message.id)) return;

		setPendingPinnedMessageIds((current) => new Set(current).add(message.id));
		try {
			const action = message.isPinned ? 'unpin' : 'pin';
			const response = await fetch(
				`/api/controller-api/messages/${message.id}/${action}`,
				{ method: 'PATCH' },
			);
			const payload: unknown = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(
					getErrorMessage(
						payload,
						`Не вдалося ${message.isPinned ? 'відкріпити' : 'закріпити'} повідомлення (${response.status}).`,
					),
				);
			}
			setMessages((current) =>
				current.map((item) =>
					item.id === message.id
						? { ...item, isPinned: !message.isPinned }
						: item,
				),
			);
		} catch (pinError) {
			setError(
				pinError instanceof Error
					? pinError.message
					: 'Не вдалося змінити закріплення повідомлення.',
			);
		} finally {
			setPendingPinnedMessageIds((current) => {
				const next = new Set(current);
				next.delete(message.id);
				return next;
			});
		}
	}

	function toggleReaction(message: ChatMessage, reaction: Reaction) {
		if (
			!socket?.connected ||
			selectedChatId === null ||
			currentUserId === null ||
			pendingReactionMessageIds.has(message.id) ||
			reactionSettings?.chatId !== selectedChatId ||
			(reactionSettings.allowedReactions.length > 0 &&
				!reactionSettings.allowedReactions.includes(reaction))
		) {
			return;
		}
		const ownReaction = getMyReaction(message.reactions);
		const method = !ownReaction
			? 'POST'
			: ownReaction === reaction
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
			updateReaction(
				current,
				optimisticReaction,
				currentUserId,
				method === 'DELETE',
			),
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

	const availableReactionOptions =
		reactionSettings?.chatId !== selectedChatId
			? []
			: reactionSettings.allowedReactions.length === 0
				? reactionOptions
				: reactionOptions.filter((option) =>
						reactionSettings.allowedReactions.includes(option.value),
					);
	const displayError = error;
	const displayedConnection = connection;
	const selectedChatTitle = selectedChat
		? getChatTitle(selectedChat) || `Чат #${selectedChat.id}`
		: '';

	return (
		<main
			className={`messenger-shell${selectedChatId !== null ? ' has-selection' : ''}`}
		>
			<header className="messenger-topbar">
				<Link className="brand" href="/" aria-label="100gram — на головну">
					<span className="brand-mark">1</span>
					<span>100gram</span>
				</Link>
				<div className="messenger-topbar-links">
					<span className={`messenger-connection ${displayedConnection}`}>
						<span className="live-dot" />
						{displayedConnection === 'connected'
							? 'Онлайн'
							: displayedConnection === 'connecting' ||
								  displayedConnection === 'loading'
								? 'Підключення…'
								: displayedConnection === 'disconnected'
									? 'Немає з’єднання'
									: 'Помилка з’єднання'}
					</span>
					<Link className="docs-link" href="/user">
						Профіль <span aria-hidden="true">↗</span>
					</Link>
				</div>
			</header>
			{displayError && (
				<div className="notice notice-error messenger-error" role="alert">
					<span className="notice-symbol" aria-hidden="true">
						!
					</span>
					{displayError}
					<button
						type="button"
						className="notice-close"
						aria-label="Закрити повідомлення"
						onClick={() => setError(null)}
					>
						×
					</button>
				</div>
			)}

			<div className="messenger-layout">
				<ChatSidebar
					chats={chats}
					selectedChatId={selectedChatId}
					showCreateForm={showCreateForm}
					chatSearch={chatSearch}
					creationMode={chatCreation.creationMode}
					creationTitle={chatCreation.creationTitle}
					creationDescription={chatCreation.creationDescription}
					creationUserId={chatCreation.creationUserIds}
					groupUserSearch={chatCreation.groupUserSearch}
					groupUserResults={chatCreation.groupUserResults}
					selectedGroupUsers={chatCreation.selectedGroupUsers}
					searchingGroupUsers={chatCreation.searchingGroupUsers}
					creationVisibility={chatCreation.creationVisibility}
					creatingChat={chatCreation.creatingChat}
					onToggleCreateForm={() => setShowCreateForm((visible) => !visible)}
					onChatSearchChange={setChatSearch}
					onCreateChat={chatCreation.handleCreateChat}
					onCreationModeChange={chatCreation.setCreationMode}
					onCreationTitleChange={chatCreation.setCreationTitle}
					onCreationDescriptionChange={chatCreation.setCreationDescription}
					onCreationUserIdChange={chatCreation.setCreationUserIds}
					onGroupUserSearchChange={chatCreation.changeGroupUserSearch}
					onSearchGroupUsers={() => void chatCreation.searchGroupUsers()}
					onSelectGroupUser={chatCreation.selectGroupUser}
					onRemoveGroupUser={chatCreation.removeGroupUser}
					onCreationVisibilityChange={chatCreation.setCreationVisibility}
					onSelectChat={selectChat}
					onToggleChatPin={(chatId) => void toggleChatPin(chatId)}
					onLeaveChat={(chatId) => void chatSettings.leaveChat(chatId)}
				/>
				<ChatConversation
					chat={selectedChat}
					chatTitle={selectedChatTitle}
					connection={displayedConnection}
					showSettings={showChatSettings}
					loadingSettings={chatSettings.loadingChatSettings}
					titleDraft={chatSettings.chatTitleDraft}
					descriptionDraft={chatSettings.chatDescriptionDraft}
					visibilityDraft={chatSettings.chatVisibilityDraft}
					allowedReactions={chatSettings.chatAllowedReactions}
					members={chatSettings.chatMembers}
					userSearch={chatSettings.chatUserSearch}
					userResults={chatSettings.chatUserResults}
					searchingUsers={chatSettings.searchingChatUsers}
					addingUserId={chatSettings.addingChatUserId}
					avatarFile={chatSettings.chatAvatarFile}
					avatarPreview={chatSettings.chatAvatarPreview}
					savingSettings={chatSettings.savingChatSettings}
					savingReactions={chatSettings.savingAllowedReactions}
					savingAvatar={chatSettings.savingChatAvatar}
					managingChat={chatSettings.managingChat}
					canLeaveChat={
						currentUserId !== null &&
						chatSettings.chatMembers.some(
							(member) =>
								member.id === currentUserId && member.chatRole !== 'OWNER',
						)
					}
					isChatOwner={
						currentUserId !== null &&
						chatSettings.chatMembers.some(
							(member) =>
								member.id === currentUserId && member.chatRole === 'OWNER',
						)
					}
					inviteToken={chatSettings.inviteToken}
					reactionOptions={reactionOptions}
					messages={messages}
					messageScrollTrigger={messageScrollTrigger}
					currentUserId={currentUserId}
					editingMessageId={editingMessageId}
					editText={editText}
					pendingReactionMessageIds={pendingReactionMessageIds}
					pendingPinnedMessageIds={pendingPinnedMessageIds}
					availableReactionOptions={availableReactionOptions}
					messageText={messageText}
					messageFiles={messageFiles}
					sendingMessage={sendingMessage}
					onMessageFilesChange={(files) => {
						if (files.length > 5) {
							setError('До одного повідомлення можна додати не більше 5 файлів.');
							return;
						}
						setError(null);
						setMessageFiles(files);
					}}
					onClearMessageFiles={() => setMessageFiles([])}
					onBack={() => setSelectedChatId(null)}
					onOpenSettings={() => void chatSettings.openChatSettings()}
					onCloseSettings={() => setShowChatSettings(false)}
					onUpdateChat={chatSettings.handleUpdateChat}
					onTitleChange={chatSettings.setChatTitleDraft}
					onDescriptionChange={chatSettings.setChatDescriptionDraft}
					onVisibilityChange={chatSettings.setChatVisibilityDraft}
					onToggleAllowedReaction={chatSettings.toggleChatAllowedReaction}
					onSaveAllowedReactions={() =>
						void chatSettings.saveAllowedReactions()
					}
					onSelectAvatar={chatSettings.selectChatAvatar}
					onUploadAvatar={() => void chatSettings.uploadChatAvatar()}
					onDeleteAvatar={() => void chatSettings.deleteChatAvatar()}
					onUserSearchChange={chatSettings.setChatUserSearch}
					onSearchUsers={() => void chatSettings.searchChatUsers()}
					onAddUser={(user) => void chatSettings.addChatUser(user)}
					onManageMember={(action, memberId, role) =>
						void chatSettings.manageMember(action, memberId, role)
					}
					onRefreshInviteToken={() => void chatSettings.refreshInviteToken()}
					onClearMessages={() => void chatSettings.clearChatMessages()}
					onDeleteChat={() => void chatSettings.deleteChat()}
					onLeaveChat={() => void chatSettings.leaveChat()}
					onUpdateMessage={handleUpdateMessage}
					onEditTextChange={setEditText}
					onCancelEdit={() => setEditingMessageId(null)}
					onStartEdit={(message) => {
						setEditingMessageId(message.id);
						setEditText(message.text);
					}}
					onDeleteMessage={deleteMessage}
					onDeleteForMe={(messageId) => void deleteMessageForMe(messageId)}
					onTogglePinMessage={(message) => void toggleMessagePin(message)}
					onToggleReaction={(message, reaction) =>
						void toggleReaction(message, reaction)
					}
					onOpenUserProfile={setProfileUserId}
					onMessageTextChange={setMessageText}
					onSendMessage={handleSendMessage}
				/>
			</div>
			{profileUserId !== null && (
				<UserProfileDialog
					key={profileUserId}
					userId={profileUserId}
					currentUserId={currentUserId}
					onClose={() => setProfileUserId(null)}
					onStartPrivateChat={startPrivateChat}
				/>
			)}
		</main>
	);
}

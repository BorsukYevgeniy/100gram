'use client';

import { FormEvent, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ChatCreationMode, ChatMessage, ChatSummary, GroupUserOption } from './chat-types';
import {
	fetchPayload,
	getErrorMessage,
	isChatListPayload,
} from './chat-utils';

type UseChatCreationOptions = {
	currentUserId: number | null;
	setChats: Dispatch<SetStateAction<ChatSummary[]>>;
	setSelectedChatId: Dispatch<SetStateAction<number | null>>;
	setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
	setShowCreateForm: Dispatch<SetStateAction<boolean>>;
	setError: (error: string | null) => void;
};

export function useChatCreation({
	currentUserId,
	setChats,
	setSelectedChatId,
	setMessages,
	setShowCreateForm,
	setError,
}: UseChatCreationOptions) {
	const [creationMode, setCreationMode] = useState<ChatCreationMode>('group');
	const [creationTitle, setCreationTitle] = useState('');
	const [creationDescription, setCreationDescription] = useState('');
	const [creationUserIds, setCreationUserIds] = useState('');
	const [groupUserSearch, setGroupUserSearch] = useState('');
	const [groupUserResults, setGroupUserResults] = useState<GroupUserOption[]>(
		[],
	);
	const [selectedGroupUsers, setSelectedGroupUsers] = useState<
		GroupUserOption[]
	>([]);
	const [searchingGroupUsers, setSearchingGroupUsers] = useState(false);
	const [creationVisibility, setCreationVisibility] = useState<
		'PUBLIC' | 'PRIVATE'
	>('PRIVATE');
	const [creatingChat, setCreatingChat] = useState(false);

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
			const otherUserIds = selectedGroupUsers
				.map((user) => user.id)
				.filter((userId) => userId !== currentUserId);
			if (creationMode === 'group' && otherUserIds.length === 0) {
				setError('Знайдіть і додайте хоча б одного учасника групи.');
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
			setChats(listPayload.chats);
			setSelectedChatId(createdPayload.id);
			setMessages([]);
			setCreationTitle('');
			setCreationDescription('');
			setCreationUserIds('');
			setGroupUserSearch('');
			setGroupUserResults([]);
			setSelectedGroupUsers([]);
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

	async function searchGroupUsers() {
		const nickname = groupUserSearch.trim();
		if (nickname.length < 3 || nickname.length > 25) {
			setError('Введіть від 3 до 25 символів нікнейму для пошуку.');
			return;
		}

		setSearchingGroupUsers(true);
		setError(null);
		try {
			const query = new URLSearchParams({ nickname, limit: '20' });
			const payload = await fetchPayload(`/api/users/search?${query}`);
			if (
				!payload ||
				typeof payload !== 'object' ||
				!('users' in payload) ||
				!Array.isArray(payload.users)
			) {
				throw new Error('Сервер повернув некоректні результати пошуку.');
			}

			const users: GroupUserOption[] = [];
			for (const user of payload.users) {
				if (
					!user ||
					typeof user !== 'object' ||
					!('id' in user) ||
					typeof user.id !== 'number' ||
					!('nickname' in user) ||
					typeof user.nickname !== 'string'
				) {
					throw new Error('Сервер повернув некоректні дані користувача.');
				}
				if (
					user.id !== currentUserId &&
					(creationMode !== 'group' ||
						!selectedGroupUsers.some((selected) => selected.id === user.id))
				) {
					users.push({ id: user.id, nickname: user.nickname });
				}
			}
			setGroupUserResults(users);
			if (users.length === 0) {
				setError(
					creationMode === 'group'
						? 'Користувачів не знайдено або їх уже додано до групи.'
						: 'Користувачів не знайдено.',
				);
			}
		} catch (searchError) {
			setError(
				searchError instanceof Error
					? searchError.message
					: 'Не вдалося знайти користувачів.',
			);
		} finally {
			setSearchingGroupUsers(false);
		}
	}

	function selectGroupUser(user: GroupUserOption) {
		if (creationMode === 'private') {
			setCreationUserIds(String(user.id));
			setGroupUserResults([]);
			return;
		}

		setSelectedGroupUsers((current) =>
			current.some((selected) => selected.id === user.id)
				? current
				: [...current, user],
		);
		setGroupUserResults((current) =>
			current.filter((result) => result.id !== user.id),
		);
	}

	function removeGroupUser(userId: number) {
		setSelectedGroupUsers((current) =>
			current.filter((user) => user.id !== userId),
		);
	}

	function changeGroupUserSearch(value: string) {
		setGroupUserSearch(value);
		setGroupUserResults([]);
	}

	return {
		creationMode,
		setCreationMode,
		creationTitle,
		setCreationTitle,
		creationDescription,
		setCreationDescription,
		creationUserIds,
		setCreationUserIds,
		groupUserSearch,
		groupUserResults,
		selectedGroupUsers,
		searchingGroupUsers,
		creationVisibility,
		setCreationVisibility,
		creatingChat,
		handleCreateChat,
		searchGroupUsers,
		selectGroupUser,
		removeGroupUser,
		changeGroupUserSearch,
	};
}

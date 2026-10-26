'use client';

import { FormEvent } from 'react';
import {
	ChatCreationMode,
	ChatSummary,
	ChatVisibility,
	GroupUserOption,
} from './chat-types';
import ChatCreationForm from './chat-creation-form';
import ChatList from './chat-list';
import { getChatTitle } from './chat-utils';

type ChatSidebarProps = {
	chats: ChatSummary[];
	selectedChatId: number | null;
	showCreateForm: boolean;
	chatSearch: string;
	creationMode: ChatCreationMode;
	creationTitle: string;
	creationDescription: string;
	creationUserId: string;
	groupUserSearch: string;
	groupUserResults: GroupUserOption[];
	selectedGroupUsers: GroupUserOption[];
	searchingGroupUsers: boolean;
	creationVisibility: ChatVisibility;
	creatingChat: boolean;
	onToggleCreateForm: () => void;
	onChatSearchChange: (value: string) => void;
	onCreateChat: (event: FormEvent<HTMLFormElement>) => void;
	onCreationModeChange: (mode: ChatCreationMode) => void;
	onCreationTitleChange: (value: string) => void;
	onCreationDescriptionChange: (value: string) => void;
	onCreationUserIdChange: (value: string) => void;
	onGroupUserSearchChange: (value: string) => void;
	onSearchGroupUsers: () => void;
	onSelectGroupUser: (user: GroupUserOption) => void;
	onRemoveGroupUser: (userId: number) => void;
	onCreationVisibilityChange: (visibility: ChatVisibility) => void;
	onSelectChat: (chatId: number) => void;
	onToggleChatPin: (chatId: number) => void;
	onLeaveChat: (chatId: number) => void;
};

export default function ChatSidebar({
	chats,
	selectedChatId,
	showCreateForm,
	chatSearch,
	creationMode,
	creationTitle,
	creationDescription,
	creationUserId,
	groupUserSearch,
	groupUserResults,
	selectedGroupUsers,
	searchingGroupUsers,
	creationVisibility,
	creatingChat,
	onToggleCreateForm,
	onChatSearchChange,
	onCreateChat,
	onCreationModeChange,
	onCreationTitleChange,
	onCreationDescriptionChange,
	onCreationUserIdChange,
	onGroupUserSearchChange,
	onSearchGroupUsers,
	onSelectGroupUser,
	onRemoveGroupUser,
	onCreationVisibilityChange,
	onSelectChat,
	onToggleChatPin,
	onLeaveChat,
}: ChatSidebarProps) {
	const search = chatSearch.trim().toLocaleLowerCase('uk-UA');
	const filteredChats = chats
		.filter((chat) =>
			(getChatTitle(chat) || `Чат #${chat.id}`)
				.toLocaleLowerCase('uk-UA')
				.includes(search),
		)
		.sort((left, right) => Number(right.isPinned) - Number(left.isPinned));

	return (
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
					onClick={onToggleCreateForm}
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
					onChange={(event) => onChatSearchChange(event.target.value)}
				/>
			</label>
			{showCreateForm && (
				<ChatCreationForm
					mode={creationMode}
					title={creationTitle}
					description={creationDescription}
					userId={creationUserId}
					groupUserSearch={groupUserSearch}
					groupUserResults={groupUserResults}
					selectedGroupUsers={selectedGroupUsers}
					searchingGroupUsers={searchingGroupUsers}
					visibility={creationVisibility}
					creating={creatingChat}
					onSubmit={onCreateChat}
					onModeChange={onCreationModeChange}
					onTitleChange={onCreationTitleChange}
					onDescriptionChange={onCreationDescriptionChange}
					onUserIdChange={onCreationUserIdChange}
					onGroupUserSearchChange={onGroupUserSearchChange}
					onSearchGroupUsers={onSearchGroupUsers}
					onSelectGroupUser={onSelectGroupUser}
					onRemoveGroupUser={onRemoveGroupUser}
					onVisibilityChange={onCreationVisibilityChange}
				/>
			)}
			<ChatList
				chats={filteredChats}
				selectedChatId={selectedChatId}
				emptyMessage={
					chats.length === 0
						? 'Тут з’являться ваші чати'
						: 'Чатів не знайдено'
				}
				onSelectChat={onSelectChat}
				onTogglePin={onToggleChatPin}
				onLeaveChat={onLeaveChat}
			/>
		</aside>
	);
}

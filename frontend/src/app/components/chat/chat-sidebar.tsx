'use client';

import { FormEvent, useState } from 'react';
import {
	ChatFolder,
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
	folders: ChatFolder[];
	selectedFolderId: number | null;
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
	onSelectFolder: (folderId: number | null) => void;
	onCreateFolder: (name: string) => void;
	onRenameFolder: (folderId: number, name: string) => void;
	onDeleteFolder: (folderId: number) => void;
	onAddChatToFolder: (folderId: number, chatId: number) => void;
	onRemoveChatFromFolder: (folderId: number, chatId: number) => void;
};

export default function ChatSidebar({
	chats,
	folders,
	selectedFolderId,
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
	onSelectFolder,
	onCreateFolder,
	onRenameFolder,
	onDeleteFolder,
	onAddChatToFolder,
	onRemoveChatFromFolder,
}: ChatSidebarProps) {
	const [showFolderForm, setShowFolderForm] = useState(false);
	const [folderName, setFolderName] = useState('');
	const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
	const [editingFolderName, setEditingFolderName] = useState('');
	const search = chatSearch.trim().toLocaleLowerCase('uk-UA');
	const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
	const filteredChats = chats
		.filter(
			(chat) =>
				!selectedFolder || selectedFolder.chatIds.includes(chat.id),
		)
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
			<nav className='messenger-folder-tabs' aria-label='Папки чатів'>
				<button
					type='button'
					className={`messenger-folder-tab${selectedFolderId === null ? ' active' : ''}`}
					aria-pressed={selectedFolderId === null}
					onClick={() => {
						setEditingFolderId(null);
						onSelectFolder(null);
					}}
				>
					Усі
				</button>
				{folders.map((folder) => (
					<button
						type='button'
						key={folder.id}
						className={`messenger-folder-tab${folder.id === selectedFolderId ? ' active' : ''}`}
						aria-pressed={folder.id === selectedFolderId}
						onClick={() => {
							setEditingFolderId(null);
							onSelectFolder(folder.id);
						}}
					>
						{folder.name}
					</button>
				))}
				<button
					type='button'
					className='messenger-folder-add'
					aria-label='Створити папку'
					title='Створити папку'
					onClick={() => setShowFolderForm((show) => !show)}
				>
					+
				</button>
			</nav>
			{selectedFolder &&
				(editingFolderId === selectedFolder.id ? (
					<form
						className='messenger-folder-form'
						onSubmit={(event) => {
							event.preventDefault();
							const name = editingFolderName.trim();
							if (!name) return;
							onRenameFolder(selectedFolder.id, name);
							setEditingFolderId(null);
						}}
					>
						<label htmlFor='messenger-folder-rename'>Нова назва папки</label>
						<div>
							<input
								id='messenger-folder-rename'
								maxLength={50}
								value={editingFolderName}
								onChange={(event) => setEditingFolderName(event.target.value)}
								autoFocus
							/>
							<button type='submit' disabled={!editingFolderName.trim()}>
								Зберегти
							</button>
							<button
								type='button'
								className='messenger-folder-cancel'
								onClick={() => setEditingFolderId(null)}
							>
								Скасувати
							</button>
						</div>
					</form>
				) : (
					<div className='messenger-folder-management'>
						<span>{selectedFolder.name}</span>
						<div>
							<button
								type='button'
								onClick={() => {
									setEditingFolderName(selectedFolder.name);
									setEditingFolderId(selectedFolder.id);
								}}
							>
								Змінити назву
							</button>
							<button
								type='button'
								className='messenger-folder-delete'
								onClick={() => {
									if (
										window.confirm(
											`Видалити папку «${selectedFolder.name}»? Чати залишаться.`,
										)
									) {
										onDeleteFolder(selectedFolder.id);
									}
								}}
							>
								Видалити
							</button>
						</div>
					</div>
				))}
			{showFolderForm && (
				<form
					className='messenger-folder-form'
					onSubmit={(event) => {
						event.preventDefault();
						const name = folderName.trim();
						if (!name) return;
						onCreateFolder(name);
						setFolderName('');
						setShowFolderForm(false);
					}}
				>
					<label htmlFor='messenger-folder-name'>Нова папка</label>
					<div>
						<input
							id='messenger-folder-name'
							maxLength={50}
							placeholder='Назва папки'
							value={folderName}
							onChange={(event) => setFolderName(event.target.value)}
						/>
						<button type='submit' disabled={!folderName.trim()}>
							Створити
						</button>
					</div>
				</form>
			)}
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
				folders={folders}
				selectedFolderId={selectedFolderId}
				selectedChatId={selectedChatId}
				emptyMessage={
					chats.length === 0
						? 'Тут з’являться ваші чати'
						: selectedFolderId !== null && filteredChats.length === 0
							? 'У цій папці поки немає чатів'
							: 'Чатів не знайдено'
				}
				onSelectChat={onSelectChat}
				onTogglePin={onToggleChatPin}
				onLeaveChat={onLeaveChat}
				onAddChatToFolder={onAddChatToFolder}
				onRemoveChatFromFolder={onRemoveChatFromFolder}
			/>
		</aside>
	);
}

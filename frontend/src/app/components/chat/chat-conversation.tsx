'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import {
	ChatMember,
	ChatMessage,
	ChatSummary,
	ConnectionState,
	GroupUserOption,
	Reaction,
	ReactionOption,
	ChatVisibility,
} from './chat-types';
import { fileProxyUrl } from './chat-utils';
import ChatMessageList from './chat-message-list';
import ChatSettingsDialog from './chat-settings-dialog';

type ChatConversationProps = {
	chat: ChatSummary | undefined;
	chatTitle: string;
	connection: ConnectionState;
	showSettings: boolean;
	loadingSettings: boolean;
	titleDraft: string;
	descriptionDraft: string;
	visibilityDraft: ChatVisibility;
	allowedReactions: Reaction[];
	members: ChatMember[];
	userSearch: string;
	userResults: GroupUserOption[];
	searchingUsers: boolean;
	addingUserId: number | null;
	avatarFile: File | null;
	avatarPreview: string | null;
	savingSettings: boolean;
	savingReactions: boolean;
	savingAvatar: boolean;
	reactionOptions: ReactionOption[];
	messages: ChatMessage[];
	currentUserId: number | null;
	editingMessageId: number | null;
	editText: string;
	pendingReactionMessageIds: Set<number>;
	availableReactionOptions: ReactionOption[];
	messageText: string;
	onBack: () => void;
	onOpenSettings: () => void;
	onCloseSettings: () => void;
	onUpdateChat: (event: FormEvent<HTMLFormElement>) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onVisibilityChange: (value: ChatVisibility) => void;
	onToggleAllowedReaction: (reaction: Reaction) => void;
	onSaveAllowedReactions: () => void;
	onSelectAvatar: (file: File | null) => void;
	onUploadAvatar: () => void;
	onDeleteAvatar: () => void;
	onUserSearchChange: (value: string) => void;
	onSearchUsers: () => void;
	onAddUser: (user: GroupUserOption) => void;
	onUpdateMessage: (event: FormEvent<HTMLFormElement>) => void;
	onEditTextChange: (value: string) => void;
	onCancelEdit: () => void;
	onStartEdit: (message: ChatMessage) => void;
	onDeleteMessage: (messageId: number) => void;
	onToggleReaction: (message: ChatMessage, reaction: Reaction) => void;
	onMessageTextChange: (value: string) => void;
	onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ChatConversation({
	chat,
	chatTitle,
	connection,
	showSettings,
	loadingSettings,
	titleDraft,
	descriptionDraft,
	visibilityDraft,
	allowedReactions,
	members,
	userSearch,
	userResults,
	searchingUsers,
	addingUserId,
	avatarFile,
	avatarPreview,
	savingSettings,
	savingReactions,
	savingAvatar,
	reactionOptions,
	messages,
	currentUserId,
	editingMessageId,
	editText,
	pendingReactionMessageIds,
	availableReactionOptions,
	messageText,
	onBack,
	onOpenSettings,
	onCloseSettings,
	onUpdateChat,
	onTitleChange,
	onDescriptionChange,
	onVisibilityChange,
	onToggleAllowedReaction,
	onSaveAllowedReactions,
	onSelectAvatar,
	onUploadAvatar,
	onDeleteAvatar,
	onUserSearchChange,
	onSearchUsers,
	onAddUser,
	onUpdateMessage,
	onEditTextChange,
	onCancelEdit,
	onStartEdit,
	onDeleteMessage,
	onToggleReaction,
	onMessageTextChange,
	onSendMessage,
}: ChatConversationProps) {
	if (!chat) {
		return (
			<section
				className='messenger-conversation'
				aria-label='Повідомлення чату'
			>
				<div className='messenger-welcome'>
					<span aria-hidden='true'>✉</span>
					<h2>100gram</h2>
					<p>Оберіть чат, щоб почати спілкування</p>
				</div>
			</section>
		);
	}

	return (
		<section className='messenger-conversation' aria-label='Повідомлення чату'>
			<header className='messenger-conversation-heading'>
				<button
					className='messenger-back'
					type='button'
					aria-label='До списку чатів'
					onClick={onBack}
				>
					←
				</button>
				{chat.title !== null ? (
					<button
						className='messenger-avatar conversation-avatar messenger-chat-avatar-button'
						type='button'
						aria-label='Відкрити інформацію про чат'
						title='Інформація про чат'
						onClick={onOpenSettings}
						disabled={loadingSettings}
					>
						{chat.avatarPreview || chat.avatarName ? (
							<Image
								src={chat.avatarPreview ?? fileProxyUrl(chat.avatarName ?? '')}
								alt=''
								width={48}
								height={48}
								unoptimized
							/>
						) : (
							chatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')
						)}
					</button>
				) : (
					<span
						className='messenger-avatar conversation-avatar'
						aria-hidden='true'
					>
						{chatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')}
					</span>
				)}
				<div className='messenger-chat-info'>
					<h2>{chatTitle}</h2>
					<span>
						{connection === 'connected' ? 'онлайн' : 'статус з’єднання'}
					</span>
				</div>
			</header>
			{showSettings && (
				<ChatSettingsDialog
					chat={chat}
					chatTitle={chatTitle}
					titleDraft={titleDraft}
					descriptionDraft={descriptionDraft}
					visibilityDraft={visibilityDraft}
					allowedReactions={allowedReactions}
					members={members}
					userSearch={userSearch}
					userResults={userResults}
					searchingUsers={searchingUsers}
					addingUserId={addingUserId}
					avatarFile={avatarFile}
					avatarPreview={avatarPreview}
					savingChat={savingSettings}
					savingReactions={savingReactions}
					savingAvatar={savingAvatar}
					reactionOptions={reactionOptions}
					onClose={onCloseSettings}
					onUpdateChat={onUpdateChat}
					onTitleChange={onTitleChange}
					onDescriptionChange={onDescriptionChange}
					onVisibilityChange={onVisibilityChange}
					onToggleReaction={onToggleAllowedReaction}
					onSaveReactions={onSaveAllowedReactions}
					onSelectAvatar={onSelectAvatar}
					onUploadAvatar={onUploadAvatar}
					onDeleteAvatar={onDeleteAvatar}
					onUserSearchChange={onUserSearchChange}
					onSearchUsers={onSearchUsers}
					onAddUser={onAddUser}
				/>
			)}
			<ChatMessageList
				messages={messages}
				currentUserId={currentUserId}
				connection={connection}
				editingMessageId={editingMessageId}
				editText={editText}
				pendingReactionMessageIds={pendingReactionMessageIds}
				availableReactionOptions={availableReactionOptions}
				onUpdateMessage={onUpdateMessage}
				onEditTextChange={onEditTextChange}
				onCancelEdit={onCancelEdit}
				onStartEdit={onStartEdit}
				onDelete={onDeleteMessage}
				onToggleReaction={onToggleReaction}
			/>
			<form className='messenger-compose' onSubmit={onSendMessage}>
				<input
					aria-label='Нове повідомлення'
					placeholder={
						connection === 'connected'
							? 'Повідомлення'
							: 'Підключення до чату…'
					}
					value={messageText}
					maxLength={3000}
					onChange={(event) => onMessageTextChange(event.target.value)}
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
		</section>
	);
}

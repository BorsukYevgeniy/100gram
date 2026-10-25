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
import { fileProxyUrl, getChatAvatarName } from './chat-utils';
import ChatMessageList from './chat-message-list';
import ChatSettingsDialog from './chat-settings-dialog';
import ChatAttachmentPreview from './chat-attachment-preview';

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
	managingChat: boolean;
	canLeaveChat: boolean;
	inviteToken: string | null;
	reactionOptions: ReactionOption[];
	messages: ChatMessage[];
	messageScrollTrigger: number;
	currentUserId: number | null;
	editingMessageId: number | null;
	editText: string;
	pendingReactionMessageIds: Set<number>;
	availableReactionOptions: ReactionOption[];
	messageText: string;
	messageFiles: File[];
	sendingMessage: boolean;
	onMessageFilesChange: (files: File[]) => void;
	onClearMessageFiles: () => void;
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
	onManageMember: (
		action: 'remove' | 'role' | 'owner',
		memberId: number,
		role?: 'MODERATOR' | 'MEMBER',
	) => void;
	onRefreshInviteToken: () => void;
	onClearMessages: () => void;
	onDeleteChat: () => void;
	onLeaveChat: () => void;
	onUpdateMessage: (event: FormEvent<HTMLFormElement>) => void;
	onEditTextChange: (value: string) => void;
	onCancelEdit: () => void;
	onStartEdit: (message: ChatMessage) => void;
	onDeleteMessage: (messageId: number) => void;
	onToggleReaction: (message: ChatMessage, reaction: Reaction) => void;
	onOpenUserProfile: (userId: number) => void;
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
	managingChat,
	canLeaveChat,
	inviteToken,
	reactionOptions,
	messages,
	messageScrollTrigger,
	currentUserId,
	editingMessageId,
	editText,
	pendingReactionMessageIds,
	availableReactionOptions,
	messageText,
	messageFiles,
	sendingMessage,
	onMessageFilesChange,
	onClearMessageFiles,
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
	onManageMember,
	onRefreshInviteToken,
	onClearMessages,
	onDeleteChat,
	onLeaveChat,
	onUpdateMessage,
	onEditTextChange,
	onCancelEdit,
	onStartEdit,
	onDeleteMessage,
	onToggleReaction,
	onOpenUserProfile,
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

	const avatarName = getChatAvatarName(chat);

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
				{chat.chatType !== 'PRIVATE' ? (
					<button
						className='messenger-avatar conversation-avatar messenger-chat-avatar-button'
						type='button'
						aria-label='Керування чатом'
						title='Керування чатом'
						onClick={onOpenSettings}
						disabled={loadingSettings}
					>
						{chat.avatarPreview || avatarName ? (
							<Image
								src={chat.avatarPreview ?? fileProxyUrl(avatarName ?? '')}
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
						{avatarName ? (
							<Image
								src={fileProxyUrl(avatarName, 'users')}
								alt=''
								width={48}
								height={48}
								unoptimized
							/>
						) : (
							chatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')
						)}
					</span>
				)}
				<div className='messenger-chat-info'>
					<h2>{chatTitle}</h2>
					<span>
						{connection === 'connected' ? 'онлайн' : 'статус з’єднання'}
					</span>
				</div>
			</header>
			{showSettings && chat.chatType !== 'PRIVATE' && (
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
					managingChat={managingChat}
					canLeaveChat={canLeaveChat}
					inviteToken={inviteToken}
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
					onManageMember={onManageMember}
					onRefreshInviteToken={onRefreshInviteToken}
					onClearMessages={onClearMessages}
					onDeleteChat={onDeleteChat}
					onLeaveChat={onLeaveChat}
				/>
			)}
			<ChatMessageList
				messages={messages}
				messageScrollTrigger={messageScrollTrigger}
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
				onOpenUserProfile={onOpenUserProfile}
			/>
			<form className='messenger-compose' onSubmit={onSendMessage}>
				{messageFiles.length > 0 && (
					<div className='messenger-attachments'>
						<div className='messenger-attachment-list'>
							{messageFiles.map((file) => (
								<ChatAttachmentPreview
									key={`${file.name}-${file.lastModified}-${file.size}`}
									file={file}
								/>
							))}
						</div>
						<button
							className='text-button'
							type='button'
							onClick={onClearMessageFiles}
							disabled={sendingMessage}
						>
							Очистити
						</button>
					</div>
				)}
				<div className='messenger-compose-main'>
					<label
						className='messenger-attach'
						title='Додати до 5 файлів'
						aria-label='Додати до 5 файлів'
					>
						📎
						<input
							type='file'
							multiple
							aria-label='Вибрати вкладення'
							disabled={connection !== 'connected' || sendingMessage}
							onChange={(event) => {
								onMessageFilesChange(
									Array.from(event.currentTarget.files ?? []),
								);
								event.currentTarget.value = '';
							}}
						/>
					</label>
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
						disabled={connection !== 'connected' || sendingMessage}
						required
					/>
					<button
						className='messenger-send'
						type='submit'
						aria-label='Надіслати повідомлення'
						disabled={
							connection !== 'connected' ||
							!messageText.trim() ||
							sendingMessage
						}
					>
						{sendingMessage ? '…' : '↑'}
					</button>
				</div>
			</form>
		</section>
	);
}

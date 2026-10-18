'use client';

import { FormEvent } from 'react';
import Image from 'next/image';
import {
	ChatMember,
	ChatSummary,
	ChatVisibility,
	GroupUserOption,
	Reaction,
	ReactionOption,
} from './chat-types';
import { fileProxyUrl } from './chat-utils';

type ChatSettingsDialogProps = {
	chat: ChatSummary;
	chatTitle: string;
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
	savingChat: boolean;
	savingReactions: boolean;
	savingAvatar: boolean;
	reactionOptions: ReactionOption[];
	onClose: () => void;
	onUpdateChat: (event: FormEvent<HTMLFormElement>) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onVisibilityChange: (value: ChatVisibility) => void;
	onToggleReaction: (reaction: Reaction) => void;
	onSaveReactions: () => void;
	onSelectAvatar: (file: File | null) => void;
	onUploadAvatar: () => void;
	onDeleteAvatar: () => void;
	onUserSearchChange: (value: string) => void;
	onSearchUsers: () => void;
	onAddUser: (user: GroupUserOption) => void;
};

export default function ChatSettingsDialog({
	chat,
	chatTitle,
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
	savingChat,
	savingReactions,
	savingAvatar,
	reactionOptions,
	onClose,
	onUpdateChat,
	onTitleChange,
	onDescriptionChange,
	onVisibilityChange,
	onToggleReaction,
	onSaveReactions,
	onSelectAvatar,
	onUploadAvatar,
	onDeleteAvatar,
	onUserSearchChange,
	onSearchUsers,
	onAddUser,
}: ChatSettingsDialogProps) {
	return (
		<div
			className='chat-settings-overlay'
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
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
						onClick={onClose}
					>
						×
					</button>
				</div>
				<form className='chat-settings-form' onSubmit={onUpdateChat}>
					<label>
						Назва
						<input
							value={titleDraft}
							minLength={3}
							maxLength={20}
							onChange={(event) => onTitleChange(event.target.value)}
							required
						/>
					</label>
					<label>
						Опис
						<textarea
							value={descriptionDraft}
							minLength={2}
							maxLength={500}
							onChange={(event) => onDescriptionChange(event.target.value)}
							placeholder='Необов’язковий опис'
							rows={4}
						/>
					</label>
					<label>
						Видимість
						<select
							value={visibilityDraft}
							onChange={(event) => {
								if (
									event.target.value === 'PUBLIC' ||
									event.target.value === 'PRIVATE'
								) {
									onVisibilityChange(event.target.value);
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
							onClick={onClose}
							disabled={savingChat}
						>
							Скасувати
						</button>
						<button
							className='button button-primary'
							type='submit'
							disabled={savingChat}
						>
							{savingChat ? 'Збереження…' : 'Зберегти зміни'}
						</button>
					</div>
				</form>
				<section
					className='chat-settings-section'
					aria-labelledby='chat-avatar-title'
				>
					<h3 id='chat-avatar-title'>Аватар чату</h3>
					<div className='chat-avatar-settings-preview'>
						<span className='messenger-avatar'>
							{avatarPreview || chat.avatarPreview || chat.avatarName ? (
								<Image
									src={
										avatarPreview ??
										chat.avatarPreview ??
										fileProxyUrl(chat.avatarName ?? '')
									}
									alt=''
									width={64}
									height={64}
									unoptimized
								/>
							) : (
								chatTitle.slice(0, 1).toLocaleUpperCase('uk-UA')
							)}
						</span>
						<label className='chat-avatar-file'>
							Оберіть нове зображення
							<input
								type='file'
								accept='image/*'
								onChange={(event) =>
									onSelectAvatar(event.target.files?.[0] ?? null)
								}
							/>
						</label>
					</div>
					<div className='chat-settings-actions'>
						{chat.avatarName && (
							<button
								className='button button-quiet'
								type='button'
								onClick={onDeleteAvatar}
								disabled={savingAvatar}
							>
								Видалити аватар
							</button>
						)}
						<button
							className='button button-primary'
							type='button'
							onClick={onUploadAvatar}
							disabled={!avatarFile || savingAvatar}
						>
							{savingAvatar ? 'Завантаження…' : 'Зберегти аватар'}
						</button>
					</div>
				</section>
				<section
					className='chat-settings-section'
					aria-labelledby='chat-reactions-title'
				>
					<h3 id='chat-reactions-title'>Дозволені реакції</h3>
					<p className='chat-settings-hint'>
						Якщо не вибрати жодної, будуть доступні всі реакції.
					</p>
					<div className='chat-allowed-reactions'>
						{reactionOptions.map((option) => (
							<label key={option.value}>
								<input
									type='checkbox'
									checked={allowedReactions.includes(option.value)}
									onChange={() => onToggleReaction(option.value)}
								/>
								<span>{option.label}</span>
							</label>
						))}
					</div>
					<div className='chat-settings-actions'>
						<button
							className='button button-primary'
							type='button'
							onClick={onSaveReactions}
							disabled={savingReactions}
						>
							{savingReactions ? 'Збереження…' : 'Зберегти реакції'}
						</button>
					</div>
				</section>
				<section
					className='chat-settings-section'
					aria-labelledby='chat-members-title'
				>
					<h3 id='chat-members-title'>Учасники чату ({members.length})</h3>
					<ul className='chat-settings-members'>
						{members.map((member) => (
							<li key={member.id}>
								<span>{member.nickname}</span>
								<small>#{member.id}</small>
							</li>
						))}
					</ul>
					<div className='chat-settings-member-search'>
						<label htmlFor='chat-member-search'>
							Додати учасника за нікнеймом
						</label>
						<div className='chat-member-search-controls'>
							<input
								id='chat-member-search'
								value={userSearch}
								minLength={3}
								maxLength={25}
								onChange={(event) => onUserSearchChange(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										event.preventDefault();
										onSearchUsers();
									}
								}}
								placeholder='Введіть нікнейм'
							/>
							<button
								className='button button-soft'
								type='button'
								onClick={onSearchUsers}
								disabled={searchingUsers}
							>
								{searchingUsers ? 'Пошук…' : 'Знайти'}
							</button>
						</div>
					</div>
					{userResults.length > 0 && (
						<ul className='chat-settings-user-results'>
							{userResults.map((user) => (
								<li key={user.id}>
									<span>
										{user.nickname} <small>#{user.id}</small>
									</span>
									<button
										className='button button-quiet'
										type='button'
										onClick={() => onAddUser(user)}
										disabled={addingUserId !== null}
									>
										{addingUserId === user.id ? 'Додавання…' : 'Додати'}
									</button>
								</li>
							))}
						</ul>
					)}
				</section>
			</section>
		</div>
	);
}

'use client';

import { FormEvent } from 'react';
import {
	ChatCreationMode,
	ChatVisibility,
	GroupUserOption,
} from './chat-types';

type ChatCreationFormProps = {
	mode: ChatCreationMode;
	title: string;
	description: string;
	userId: string;
	groupUserSearch: string;
	groupUserResults: GroupUserOption[];
	selectedGroupUsers: GroupUserOption[];
	searchingGroupUsers: boolean;
	visibility: ChatVisibility;
	creating: boolean;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onModeChange: (mode: ChatCreationMode) => void;
	onTitleChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onUserIdChange: (value: string) => void;
	onGroupUserSearchChange: (value: string) => void;
	onSearchGroupUsers: () => void;
	onSelectGroupUser: (user: GroupUserOption) => void;
	onRemoveGroupUser: (userId: number) => void;
	onVisibilityChange: (visibility: ChatVisibility) => void;
};

export default function ChatCreationForm({
	mode,
	title,
	description,
	userId,
	groupUserSearch,
	groupUserResults,
	selectedGroupUsers,
	searchingGroupUsers,
	visibility,
	creating,
	onSubmit,
	onModeChange,
	onTitleChange,
	onDescriptionChange,
	onUserIdChange,
	onGroupUserSearchChange,
	onSearchGroupUsers,
	onSelectGroupUser,
	onRemoveGroupUser,
	onVisibilityChange,
}: ChatCreationFormProps) {
	const userSearch = (
		<div className='group-user-picker'>
			<div className='group-user-search'>
				<label htmlFor='group-user-nickname'>
					{mode === 'private'
						? 'Знайти користувача за нікнеймом'
						: 'Знайти учасників за нікнеймом'}
				</label>
				<div className='group-user-search-controls'>
					<input
						id='group-user-nickname'
						type='search'
						minLength={3}
						maxLength={25}
						value={groupUserSearch}
						onChange={(event) => onGroupUserSearchChange(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								onSearchGroupUsers();
							}
						}}
						placeholder='Введіть мінімум 3 символи'
					/>
					<button
						className='button button-soft'
						type='button'
						disabled={searchingGroupUsers}
						onClick={onSearchGroupUsers}
					>
						{searchingGroupUsers ? 'Пошук…' : 'Знайти'}
					</button>
				</div>
			</div>
			{groupUserResults.length > 0 && (
				<ul className='group-user-results'>
					{groupUserResults.map((user) => (
						<li key={user.id}>
							<span>
								<strong>{user.nickname}</strong>
								<small>ID {user.id}</small>
							</span>
							<button
								className='button button-soft'
								type='button'
								onClick={() => onSelectGroupUser(user)}
							>
								{mode === 'private' ? 'Вибрати' : 'Додати'}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);

	return (
		<form className='chat-create-form' onSubmit={onSubmit}>
			<div className='chat-create-heading'>
				<h2>Новий чат</h2>
				<label>
					<span className='sr-only'>Тип чату</span>
					<select
						value={mode}
						onChange={(event) => {
							const value = event.target.value;
							if (
								value === 'private' ||
								value === 'group' ||
								value === 'channel'
							) {
								onModeChange(value);
							}
						}}
					>
						<option value='private'>Приватний чат</option>
						<option value='group'>Група</option>
						<option value='channel'>Канал</option>
					</select>
				</label>
			</div>
			{mode !== 'private' && (
				<>
					<label>
						Назва
						<input
							value={title}
							minLength={3}
							maxLength={20}
							onChange={(event) => onTitleChange(event.target.value)}
							placeholder='3–20 символів'
							required
						/>
					</label>
					<label>
						Опис (необов’язково)
						<input
							value={description}
							minLength={2}
							maxLength={500}
							onChange={(event) => onDescriptionChange(event.target.value)}
							placeholder='Короткий опис'
						/>
					</label>
					<label>
						Видимість
						<select
							value={visibility}
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
				</>
			)}
			{mode === 'private' && (
				<>
					{userSearch}
					<label>
						ID користувача
						<input
							type='text'
							inputMode='numeric'
							value={userId}
							onChange={(event) => onUserIdChange(event.target.value)}
							placeholder='Наприклад, 12'
							required
						/>
					</label>
				</>
			)}
			{mode === 'group' && (
				<>
					{userSearch}
					<div className='group-user-selected'>
						<span className='group-user-selected-heading'>
							Учасники: {selectedGroupUsers.length}
						</span>
						{selectedGroupUsers.length === 0 ? (
							<p>Знайдіть і додайте хоча б одного учасника.</p>
						) : (
							<ul className='group-user-chips'>
								{selectedGroupUsers.map((user) => (
									<li key={user.id}>
										<span>{user.nickname}</span>
										<button
											type='button'
											aria-label={`Видалити ${user.nickname} зі списку учасників`}
											onClick={() => onRemoveGroupUser(user.id)}
										>
											×
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</>
			)}
			<button
				className='button button-primary'
				type='submit'
				disabled={creating}
			>
				{creating
					? 'Створення…'
					: mode === 'private'
						? 'Створити чат'
						: mode === 'group'
							? 'Створити групу'
							: 'Створити канал'}
			</button>
		</form>
	);
}

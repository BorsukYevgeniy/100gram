'use client';

import { FormEvent } from 'react';
import {
	ChatMessage,
	ConnectionState,
	Reaction,
	ReactionOption,
} from './chat-types';

type ChatMessageListProps = {
	messages: ChatMessage[];
	currentUserId: number | null;
	connection: ConnectionState;
	editingMessageId: number | null;
	editText: string;
	pendingReactionMessageIds: Set<number>;
	availableReactionOptions: ReactionOption[];
	onUpdateMessage: (event: FormEvent<HTMLFormElement>) => void;
	onEditTextChange: (value: string) => void;
	onCancelEdit: () => void;
	onStartEdit: (message: ChatMessage) => void;
	onDelete: (messageId: number) => void;
	onToggleReaction: (message: ChatMessage, reaction: Reaction) => void;
};

export default function ChatMessageList({
	messages,
	currentUserId,
	connection,
	editingMessageId,
	editText,
	pendingReactionMessageIds,
	availableReactionOptions,
	onUpdateMessage,
	onEditTextChange,
	onCancelEdit,
	onStartEdit,
	onDelete,
	onToggleReaction,
}: ChatMessageListProps) {
	if (messages.length === 0) {
		return (
			<div className='messenger-messages' aria-live='polite'>
				<div className='messenger-no-messages'>
					<span aria-hidden='true'>✉</span>
					<p>Повідомлень поки немає</p>
					<span>Напишіть першим</span>
				</div>
			</div>
		);
	}

	return (
		<div className='messenger-messages' aria-live='polite'>
			{messages.map((message) => {
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
								<form className='chat-edit-form' onSubmit={onUpdateMessage}>
									<input
										aria-label='Текст повідомлення'
										value={editText}
										maxLength={3000}
										onChange={(event) => onEditTextChange(event.target.value)}
										required
									/>
									<button className='button button-soft' type='submit'>
										Зберегти
									</button>
									<button
										className='button button-quiet'
										type='button'
										onClick={onCancelEdit}
									>
										Скасувати
									</button>
								</form>
							) : (
								<p className='messenger-message-text'>{message.text}</p>
							)}
							{message.files.length > 0 && (
								<p className='chat-muted'>
									Вкладення: {message.files.map((file) => file.name).join(', ')}
								</p>
							)}
							<div className='messenger-message-footer'>
								<div className='chat-message-actions'>
									{availableReactionOptions.map((option) => {
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
												onClick={() =>
													onToggleReaction(message, option.value)
												}
											>
												{option.label}
												{count > 0 ? ` ${count}` : ''}
											</button>
										);
									})}
								</div>
								<time dateTime={message.createdAt}>
									{new Date(message.createdAt).toLocaleTimeString('uk-UA', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</time>
								{isOwnMessage && editingMessageId !== message.id && (
									<div className='messenger-edit-actions'>
										<button
											className='text-button'
											type='button'
											disabled={connection !== 'connected'}
											onClick={() => onStartEdit(message)}
										>
											Редагувати
										</button>
										<button
											className='text-button'
											type='button'
											disabled={connection !== 'connected'}
											onClick={() => onDelete(message.id)}
										>
											Видалити
										</button>
									</div>
								)}
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}

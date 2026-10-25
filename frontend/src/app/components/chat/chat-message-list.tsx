'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
	ChatMessage,
	ConnectionState,
	Reaction,
	ReactionOption,
} from './chat-types';
import { fileProxyUrl, getReactionSummary } from './chat-utils';
import ChatMessageAttachment from './chat-message-attachment';

type ChatMessageListProps = {
	messages: ChatMessage[];
	messageScrollTrigger: number;
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
	onDeleteForMe: (messageId: number) => void;
	onToggleReaction: (message: ChatMessage, reaction: Reaction) => void;
	onOpenUserProfile: (userId: number) => void;
};

function ChatMessageAvatar({
	avatarName,
	nickname,
	onClick,
}: {
	avatarName: string | null;
	nickname: string;
	onClick: () => void;
}) {
	const [imageFailed, setImageFailed] = useState(false);

	return (
		<button
			className="messenger-message-avatar"
			type="button"
			aria-label={`Відкрити профіль: ${nickname}`}
			title={`Профіль: ${nickname}`}
			onClick={onClick}
		>
			{avatarName && !imageFailed ? (
				<Image
					src={fileProxyUrl(avatarName, 'users')}
					alt=""
					width={36}
					height={36}
					unoptimized
					onError={() => setImageFailed(true)}
				/>
			) : (
				nickname.slice(0, 1).toLocaleUpperCase('uk-UA')
			)}
		</button>
	);
}

export default function ChatMessageList({
	messages,
	messageScrollTrigger,
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
	onDeleteForMe,
	onToggleReaction,
	onOpenUserProfile,
}: ChatMessageListProps) {
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const previousScrollTrigger = useRef(messageScrollTrigger);

	useEffect(() => {
		if (previousScrollTrigger.current === messageScrollTrigger) return;
		previousScrollTrigger.current = messageScrollTrigger;
		messagesContainerRef.current?.scrollTo({
			top: messagesContainerRef.current.scrollHeight,
			behavior: 'smooth',
		});
	}, [messageScrollTrigger]);

	const visibleMessages = messages.filter((message) => !message.isDeletedForMe);

	if (visibleMessages.length === 0) {
		return (
			<div
				className="messenger-messages"
				aria-live="polite"
				ref={messagesContainerRef}
			>
				<div className="messenger-no-messages">
					<span aria-hidden="true">✉</span>
					<p>
						{messages.length > 0
							? 'Усі повідомлення приховані для вас'
							: 'Повідомлень поки немає'}
					</p>
					{messages.length === 0 && <span>Напишіть першим</span>}
				</div>
			</div>
		);
	}

	return (
		<div
			className="messenger-messages"
			aria-live="polite"
			ref={messagesContainerRef}
		>
			{visibleMessages.map((message) => {
				const isOwnMessage = message.user.id === currentUserId;
				return (
					<article
						className={`messenger-message${isOwnMessage ? ' own' : ''}${message.fileNames.length > 0 ? ' has-attachments' : ''}`}
						key={message.id}
					>
						<ChatMessageAvatar
							avatarName={message.user.avatarName}
							nickname={message.user.nickname}
							onClick={() => onOpenUserProfile(message.user.id)}
						/>
						<div className="messenger-message-bubble">
							{!isOwnMessage && (
								<strong className="messenger-sender">
									{message.user.nickname}
								</strong>
							)}
							{editingMessageId === message.id ? (
								<form className="chat-edit-form" onSubmit={onUpdateMessage}>
									<input
										aria-label="Текст повідомлення"
										value={editText}
										maxLength={3000}
										onChange={(event) => onEditTextChange(event.target.value)}
										required
									/>
									<button className="button button-soft" type="submit">
										Зберегти
									</button>
									<button
										className="button button-quiet"
										type="button"
										onClick={onCancelEdit}
									>
										Скасувати
									</button>
								</form>
							) : (
								<p className="messenger-message-text">{message.text}</p>
							)}
							{message.fileNames.length > 0 && (
								<div className="messenger-message-attachments">
									{message.fileNames.map((fileName) => (
										<ChatMessageAttachment
											key={fileName}
											fileName={fileName}
										/>
									))}
								</div>
							)}
							<div className="messenger-message-footer">
								<div className="chat-message-actions">
									{availableReactionOptions
										.filter(
											(option) =>
												getReactionSummary(message.reactions, option.value)
													.count > 0,
										)
										.map((option) => {
											const summary = getReactionSummary(
												message.reactions,
												option.value,
											);
											const { count, isReactedByMe: selected } = summary;
											return (
												<button
													type="button"
													key={option.value}
													className={`chat-reaction${selected ? ' selected' : ''}`}
													title={option.value}
													aria-label={`${option.value}: ${count}`}
													aria-pressed={selected}
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
									{availableReactionOptions.length > 0 && (
										<div
											className="chat-reaction-picker"
											role="group"
											aria-label="Вибрати реакцію"
										>
											{availableReactionOptions.map((option) => {
												const summary = getReactionSummary(
													message.reactions,
													option.value,
												);
												const { count, isReactedByMe: selected } = summary;
												return (
													<button
														type="button"
														key={option.value}
														className={`chat-reaction${selected ? ' selected' : ''}`}
														title={option.value}
														aria-label={`${option.value}: ${count}`}
														aria-pressed={selected}
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
									)}
								</div>
								<time dateTime={message.createdAt}>
									{new Date(message.createdAt).toLocaleTimeString('uk-UA', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</time>
								{isOwnMessage && editingMessageId !== message.id && (
									<div className="messenger-edit-actions">
										<button
											className="text-button"
											type="button"
											disabled={connection !== 'connected'}
											onClick={() => onStartEdit(message)}
										>
											Редагувати
										</button>
										<button
											className="text-button"
											type="button"
											disabled={connection !== 'connected'}
											onClick={() => onDelete(message.id)}
										>
											Видалити
										</button>
									</div>
								)}
								<button
									className="text-button"
									type="button"
									disabled={connection !== 'connected'}
									onClick={() => onDeleteForMe(message.id)}
								>
									Видалити для мене
								</button>
							</div>
						</div>
					</article>
				);
			})}
		</div>
	);
}

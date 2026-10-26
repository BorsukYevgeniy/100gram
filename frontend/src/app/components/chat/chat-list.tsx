'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChatSummary } from './chat-types';
import { fileProxyUrl, getChatAvatarName, getChatTitle } from './chat-utils';

type ChatListProps = {
	chats: ChatSummary[];
	selectedChatId: number | null;
	emptyMessage: string;
	onSelectChat: (chatId: number) => void;
	onTogglePin: (chatId: number) => void;
	onLeaveChat: (chatId: number) => void;
};

export default function ChatList({
	chats,
	selectedChatId,
	emptyMessage,
	onSelectChat,
	onTogglePin,
	onLeaveChat,
}: ChatListProps) {
	const [openChatMenuId, setOpenChatMenuId] = useState<number | null>(null);
	const openChatMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (openChatMenuId === null) return;

		const closeMenuOnOutsidePointerDown = (event: PointerEvent) => {
			if (
				event.target instanceof Node &&
				openChatMenuRef.current?.contains(event.target)
			) {
				return;
			}
			setOpenChatMenuId(null);
		};

		document.addEventListener('pointerdown', closeMenuOnOutsidePointerDown);
		return () =>
			document.removeEventListener('pointerdown', closeMenuOnOutsidePointerDown);
	}, [openChatMenuId]);

	if (chats.length === 0) {
		return (
			<div className='messenger-chat-list'>
				<p className='messenger-empty-list'>{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className='messenger-chat-list'>
			{chats.map((chat) => {
				const title = getChatTitle(chat) || `Чат #${chat.id}`;
				const avatarName = getChatAvatarName(chat);
				return (
					<div className='messenger-chat-row' key={chat.id}>
						<button
							type='button'
							className={`messenger-chat-item${selectedChatId === chat.id ? ' selected' : ''}`}
							onClick={() => onSelectChat(chat.id)}
						>
							<span className='messenger-avatar' aria-hidden='true'>
								{('avatarPreview' in chat && chat.avatarPreview) || avatarName ? (
									<Image
										src={
											('avatarPreview' in chat && chat.avatarPreview)
												? chat.avatarPreview
												: fileProxyUrl(
														avatarName ?? '',
														chat.chatType === 'PRIVATE' ? 'users' : 'chats',
													)
										}
										alt=''
										width={48}
										height={48}
										unoptimized
									/>
								) : (
									title.slice(0, 1).toLocaleUpperCase('uk-UA')
								)}
							</span>
							<span className='messenger-chat-copy'>
								<span className='messenger-chat-title'>
									{chat.isPinned && <span aria-label='Закріплено'>◆ </span>}
									{title}
								</span>
								<span className='messenger-chat-preview'>
									{chat.lastMessage?.text ?? 'Поки немає повідомлень'}
								</span>
							</span>
							{chat.lastMessage && (
								<time className='messenger-chat-time'>
									{new Date(chat.lastMessage.createdAt).toLocaleTimeString(
										'uk-UA',
										{ hour: '2-digit', minute: '2-digit' },
									)}
								</time>
							)}
						</button>
						<div
							ref={openChatMenuId === chat.id ? openChatMenuRef : null}
						>
							<button
								type='button'
								className='chat-menu-trigger'
								aria-label={`Меню чату ${title}`}
								title='Меню чату'
								aria-expanded={openChatMenuId === chat.id}
								onClick={() =>
									setOpenChatMenuId((current) =>
										current === chat.id ? null : chat.id,
									)
								}
							>
								⋯
							</button>
							{openChatMenuId === chat.id && (
								<div className='chat-item-menu'>
									<button
										type='button'
										onClick={() => {
											onTogglePin(chat.id);
											setOpenChatMenuId(null);
										}}
									>
										{chat.isPinned ? 'Відкріпити чат' : 'Закріпити чат'}
									</button>
									{chat.chatType !== 'PRIVATE' &&
										chat.currentUserRole !== 'OWNER' && (
											<button
												type='button'
												onClick={() => {
													onLeaveChat(chat.id);
													setOpenChatMenuId(null);
												}}
											>
												Вийти з чату
											</button>
										)}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

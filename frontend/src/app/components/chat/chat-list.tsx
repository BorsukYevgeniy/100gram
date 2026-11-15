'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChatFolder, ChatSummary } from './chat-types';
import { fileProxyUrl, getChatAvatarName, getChatTitle } from './chat-utils';

type ChatListProps = {
	chats: ChatSummary[];
	folders: ChatFolder[];
	selectedFolderId: number | null;
	selectedChatId: number | null;
	emptyMessage: string;
	onSelectChat: (chatId: number) => void;
	onTogglePin: (chatId: number) => void;
	onLeaveChat: (chatId: number) => void;
	onAddChatToFolder: (folderId: number, chatId: number) => void;
	onRemoveChatFromFolder: (folderId: number, chatId: number) => void;
};

export default function ChatList({
	chats,
	folders,
	selectedFolderId,
	selectedChatId,
	emptyMessage,
	onSelectChat,
	onTogglePin,
	onLeaveChat,
	onAddChatToFolder,
	onRemoveChatFromFolder,
}: ChatListProps) {
	const [openChatMenuId, setOpenChatMenuId] = useState<number | null>(null);
	const [folderChooserChatId, setFolderChooserChatId] = useState<number | null>(
		null,
	);
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
			setFolderChooserChatId(null);
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
			{chats.map((chat, index) => {
				const title = getChatTitle(chat) || `Чат #${chat.id}`;
				const avatarName = getChatAvatarName(chat);
				const availableFolders = folders.filter(
					(folder) =>
						folder.id !== selectedFolderId &&
						!folder.chatIds.includes(chat.id),
				);
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
								onClick={() => {
									setOpenChatMenuId((current) => {
										const next = current === chat.id ? null : chat.id;
										if (next === null) setFolderChooserChatId(null);
										return next;
									});
								}}
							>
								⋯
							</button>
							{openChatMenuId === chat.id && (
								<div
									className={`chat-item-menu ${index < 2 ? 'opens-down' : 'opens-up'}`}
								>
									<button
										type='button'
										onClick={() => {
											onTogglePin(chat.id);
											setOpenChatMenuId(null);
											setFolderChooserChatId(null);
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
													setFolderChooserChatId(null);
												}}
											>
												Вийти з чату
											</button>
										)}
									{selectedFolderId !== null && (
										<button
											type='button'
											onClick={() => {
												onRemoveChatFromFolder(selectedFolderId, chat.id);
												setOpenChatMenuId(null);
												setFolderChooserChatId(null);
											}}
										>
											Прибрати з папки
										</button>
									)}
									<button
										type='button'
										aria-expanded={folderChooserChatId === chat.id}
										onClick={() =>
											setFolderChooserChatId((current) =>
												current === chat.id ? null : chat.id,
											)
										}
									>
										Додати до папки <span aria-hidden='true'>›</span>
									</button>
									{folderChooserChatId === chat.id && (
										<div
											className='chat-folder-choices'
											role='group'
											aria-label='Виберіть папку'
										>
											{availableFolders.length > 0 ? (
												availableFolders.map((folder) => (
													<button
														type='button'
														key={folder.id}
														onClick={() => {
															onAddChatToFolder(folder.id, chat.id);
															setOpenChatMenuId(null);
															setFolderChooserChatId(null);
														}}
													>
														{folder.name}
													</button>
												))
											) : (
												<p>Немає папок для додавання</p>
											)}
										</div>
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

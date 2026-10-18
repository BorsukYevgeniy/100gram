'use client';

import Image from 'next/image';
import { ChatSummary } from './chat-types';
import { fileProxyUrl } from './chat-utils';

type ChatListProps = {
	chats: ChatSummary[];
	selectedChatId: number | null;
	emptyMessage: string;
	onSelectChat: (chatId: number) => void;
};

export default function ChatList({
	chats,
	selectedChatId,
	emptyMessage,
	onSelectChat,
}: ChatListProps) {
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
				const title =
					chat.participantName || chat.title || `Чат #${chat.id}`;
				return (
					<button
						type='button'
						key={chat.id}
						className={`messenger-chat-item${selectedChatId === chat.id ? ' selected' : ''}`}
						onClick={() => onSelectChat(chat.id)}
					>
						<span className='messenger-avatar' aria-hidden='true'>
							{chat.avatarPreview || chat.avatarName ? (
								<Image
									src={
										chat.avatarPreview ??
										fileProxyUrl(chat.avatarName ?? '')
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
				);
			})}
		</div>
	);
}

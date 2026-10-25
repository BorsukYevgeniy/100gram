'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PublicUserProfile } from './chat-types';
import { fetchPayload, fileProxyUrl, isPublicUserProfile } from './chat-utils';

type UserProfileDialogProps = {
	userId: number;
	currentUserId: number | null;
	onClose: () => void;
	onStartPrivateChat: (userId: number) => Promise<void>;
};

export default function UserProfileDialog({
	userId,
	currentUserId,
	onClose,
	onStartPrivateChat,
}: UserProfileDialogProps) {
	const [profile, setProfile] = useState<PublicUserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [startingChat, setStartingChat] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		let active = true;

		async function loadProfile() {
			try {
				const payload = await fetchPayload(
					`/api/users/${userId}/public-profile`,
				);
				if (!isPublicUserProfile(payload)) {
					throw new Error('Сервер повернув некоректні дані профілю.');
				}
				if (active) setProfile(payload);
			} catch (loadError) {
				if (active) {
					setError(
						loadError instanceof Error
							? loadError.message
							: 'Не вдалося завантажити профіль.',
					);
				}
			} finally {
				if (active) setLoading(false);
			}
		}

		void loadProfile();
		return () => {
			active = false;
		};
	}, [userId]);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	async function startPrivateChat() {
		setStartingChat(true);
		setError(null);
		try {
			await onStartPrivateChat(userId);
		} catch (startError) {
			setError(
				startError instanceof Error
					? startError.message
					: 'Не вдалося відкрити приватний чат.',
			);
			setStartingChat(false);
		}
	}

	return (
		<div
			className="user-profile-overlay"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section
				className="user-profile-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="user-profile-title"
			>
				<header className="user-profile-heading">
					<h2 id="user-profile-title">Профіль користувача</h2>
					<button
						className="notice-close"
						type="button"
						aria-label="Закрити профіль"
						onClick={onClose}
					>
						×
					</button>
				</header>
				{loading ? (
					<p className="user-profile-status">Завантаження профілю…</p>
				) : profile ? (
					<div className="user-profile-content">
						<div className="user-profile-summary">
							<span className="user-profile-avatar" aria-hidden="true">
								{profile.avatarName && !imageFailed ? (
									<Image
										src={fileProxyUrl(profile.avatarName, 'users')}
										alt=""
										width={80}
										height={80}
										unoptimized
										onError={() => setImageFailed(true)}
									/>
								) : (
									profile.nickname.slice(0, 1).toLocaleUpperCase('uk-UA')
								)}
							</span>
							<h3>{profile.nickname}</h3>
						</div>
						<div className="user-profile-info">
							<h3>Про себе</h3>
							<p>{profile.description || 'Користувач поки нічого не розповів.'}</p>
							<p>
								У 100gram з{' '}
								<time dateTime={profile.createdAt}>
									{new Date(profile.createdAt).toLocaleDateString('uk-UA')}
								</time>
							</p>
						</div>
						{currentUserId !== profile.id && (
							<button
								className="button button-soft user-profile-chat-button"
								type="button"
								disabled={startingChat}
								onClick={() => void startPrivateChat()}
							>
								{startingChat ? 'Відкриваємо чат…' : 'Почати приватний чат'}
							</button>
						)}
					</div>
				) : null}
				{error && (
					<p className="notice notice-error user-profile-error" role="alert">
						{error}
					</p>
				)}
			</section>
		</div>
	);
}

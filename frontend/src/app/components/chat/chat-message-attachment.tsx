'use client';

import Image from 'next/image';
import { fileProxyUrl } from './chat-utils';

type ChatMessageAttachmentProps = {
	file: { name: string; originalName: string };
};

const imageExtensions = new Set([
	'avif',
	'bmp',
	'gif',
	'jpeg',
	'jpg',
	'png',
	'svg',
	'webp',
]);

const videoExtensions = new Set([
	'3gp',
	'm4v',
	'mov',
	'mp4',
	'ogv',
	'webm',
]);

export default function ChatMessageAttachment({
	file,
}: ChatMessageAttachmentProps) {
	const extension = file.originalName.split('.').pop()?.toLowerCase() ?? '';
	const fileUrl = fileProxyUrl(file.name, 'attachments');

	if (imageExtensions.has(extension)) {
		const label = `Переглянути фото ${file.originalName}`;
		return (
			<a
				className='messenger-message-attachment'
				href={fileUrl}
				target='_blank'
				rel='noreferrer'
				aria-label={label}
			>
				<Image
					src={fileUrl}
					alt={file.originalName}
					width={480}
					height={360}
					unoptimized
				/>
			</a>
		);
	}

	if (videoExtensions.has(extension)) {
		return (
			<video
				className='messenger-message-video'
				src={fileUrl}
				controls
				preload='metadata'
				onLoadedMetadata={(event) => {
					const video = event.currentTarget;
					if (video.duration > 0) video.currentTime = 0.1;
				}}
				aria-label={`Відео ${file.originalName}`}
			/>
		);
	}

	return (
		<a
			className='messenger-message-file'
			href={fileUrl}
			download={file.originalName}
		>
			{file.originalName}
		</a>
	);
}

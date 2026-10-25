'use client';

import Image from 'next/image';
import { fileProxyUrl } from './chat-utils';

type ChatMessageAttachmentProps = {
	fileName: string;
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
	fileName,
}: ChatMessageAttachmentProps) {
	const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
	const fileUrl = fileProxyUrl(fileName, 'attachments');

	if (imageExtensions.has(extension)) {
		return (
			<a
				className='messenger-message-attachment'
				href={fileUrl}
				target='_blank'
				rel='noreferrer'
				aria-label={`Переглянути фото ${fileName}`}
			>
				<Image
					src={fileUrl}
					alt={fileName}
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
				aria-label={`Відео ${fileName}`}
			/>
		);
	}

	return (
		<a
			className='messenger-message-file'
			href={fileUrl}
			download={fileName}
		>
			{fileName}
		</a>
	);
}

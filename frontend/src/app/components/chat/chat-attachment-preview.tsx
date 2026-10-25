'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type ChatAttachmentPreviewProps = {
	file: File;
};

export default function ChatAttachmentPreview({
	file,
}: ChatAttachmentPreviewProps) {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const isImage = file.type.startsWith('image/');
	const isVideo = file.type.startsWith('video/');

	useEffect(() => {
		if (!isImage && !isVideo) return;

		const objectUrl = URL.createObjectURL(file);
		if (isImage) {
			const image = document.createElement('img');
			const handleImageLoad = () => setThumbnail(objectUrl);
			image.addEventListener('load', handleImageLoad);
			image.src = objectUrl;
			return () => {
				image.removeEventListener('load', handleImageLoad);
				URL.revokeObjectURL(objectUrl);
			};
		}

		const video = document.createElement('video');
		video.preload = 'auto';
		video.muted = true;
		video.playsInline = true;

		const captureFrame = () => {
			if (!video.videoWidth || !video.videoHeight) return;
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const context = canvas.getContext('2d');
			if (!context) return;
			context.drawImage(video, 0, 0, canvas.width, canvas.height);
			setThumbnail(canvas.toDataURL('image/jpeg', 0.8));
		};
		video.addEventListener('loadeddata', captureFrame);
		video.src = objectUrl;

		return () => {
			video.removeEventListener('loadeddata', captureFrame);
			video.removeAttribute('src');
			video.load();
			URL.revokeObjectURL(objectUrl);
		};
	}, [file, isImage, isVideo]);

	return (
		<div className='messenger-attachment-preview' title={file.name}>
			{thumbnail ? (
				<Image
					src={thumbnail}
					alt={isImage ? file.name : `Кадр з відео ${file.name}`}
					width={96}
					height={68}
					unoptimized
				/>
			) : (
				<span className='messenger-attachment-placeholder' aria-hidden='true'>
					{isVideo ? '▶' : isImage ? '▧' : '📄'}
				</span>
			)}
			<span className='messenger-attachment-name'>{file.name}</span>
		</div>
	);
}

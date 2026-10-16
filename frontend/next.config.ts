import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	cacheComponents: true,
	partialPrefetching: true,
	allowedDevOrigins: ['d061-46-149-186-24.ngrok-free.app'],
};

export default nextConfig;

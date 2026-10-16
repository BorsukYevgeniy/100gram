import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	cacheComponents: true,
	partialPrefetching: true,
	allowedDevOrigins: ['192.168.0.106'],
};

export default nextConfig;

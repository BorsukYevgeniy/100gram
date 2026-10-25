import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	cacheComponents: true,
	partialPrefetching: true,
	allowedDevOrigins: ['192.168.0.106', '*.ngrok-free.app'],
	experimental: {
		agentUpgrade: 'security',
	},
	async redirects() {
		return [
			{
				source: '/auth/success',
				destination: '/',
				permanent: false,
			},
		];
	},
};

export default nextConfig;

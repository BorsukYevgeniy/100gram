import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTokenRefresh } from '../auth-proxy';

function isAllowedFileKey(key: string) {
	const parts = key.split('/');
	return (
		(parts.length === 2 && parts[0] === 'attachments' && !!parts[1]) ||
		(parts.length === 3 &&
			parts[0] === 'avatars' &&
			['users', 'chats'].includes(parts[1]) &&
			!!parts[2])
	);
}

async function proxyFileRequest(request: NextRequest) {
	const backendUrl =
		process.env.BACKEND_URL?.trim() ||
		(process.env.NODE_ENV === 'development'
			? 'http://localhost:3000'
			: undefined);
	if (!backendUrl) {
		return NextResponse.json(
			{ message: 'BACKEND_URL is not configured for the frontend.' },
			{ status: 503 },
		);
	}
	if (request.method !== 'GET') {
		return NextResponse.json(
			{ message: 'Method not allowed.' },
			{ status: 405, headers: { Allow: 'GET' } },
		);
	}

	const key = request.nextUrl.searchParams.get('key');
	if (
		!key ||
		!isAllowedFileKey(key) ||
		key.split('/').some((part) => part === '.' || part === '..' || part === '')
	) {
		return NextResponse.json({ message: 'Not found.' }, { status: 404 });
	}

	const upstreamUrl = new URL('/files', backendUrl);
	upstreamUrl.searchParams.set('key', key);
	const cookie = request.headers.get('cookie');
	const headers = new Headers();
	if (cookie) headers.set('cookie', cookie);

	try {
		const { response, refreshedCookies } = await fetchWithTokenRefresh(
			backendUrl,
			{
				url: upstreamUrl,
				method: 'GET',
				headers,
				cookie: cookie ?? undefined,
			},
		);
		const responseHeaders = new Headers();
		for (const [name, value] of response.headers) {
			if (name.toLowerCase() !== 'set-cookie') {
				responseHeaders.append(name, value);
			}
		}
		for (const cookieHeader of [
			...refreshedCookies,
			...response.headers.getSetCookie(),
		]) {
			responseHeaders.append('set-cookie', cookieHeader);
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
		});
	} catch {
		return NextResponse.json(
			{ message: 'Unable to reach the file API.' },
			{ status: 502 },
		);
	}
}

export const GET = proxyFileRequest;

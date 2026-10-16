import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTokenRefresh } from '../../auth-proxy';

type RouteContext = {
	params: Promise<{ path: string[] }>;
};

async function proxyUserRequest(request: NextRequest, context: RouteContext) {
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

	const { path } = await context.params;
	const isUserId =
		path.length === 1 &&
		/^\d+$/.test(path[0]) &&
		Number.isSafeInteger(Number(path[0])) &&
		Number(path[0]) > 0;

	const isAdminRoute =
		path.length === 2 &&
		path[0] === 'assign-admin' &&
		/^\d+$/.test(path[1]) &&
		Number.isSafeInteger(Number(path[1])) &&
		Number(path[1]) > 0;

	const isSelfRoute = path.length === 1 && path[0] === 'me';
	const isBlockedListRoute =
		path.length === 2 && path[0] === 'me' && path[1] === 'blocked';
	const isBlockActionRoute =
		path.length === 2 &&
		path[0] === 'block' &&
		/^\d+$/.test(path[1]) &&
		Number.isSafeInteger(Number(path[1])) &&
		Number(path[1]) > 0;
	const isOwnAvatarRoute =
		path.length === 2 && path[0] === 'me' && path[1] === 'avatar';
	const isUserAvatarRoute =
		path.length === 2 &&
		/^\d+$/.test(path[0]) &&
		Number.isSafeInteger(Number(path[0])) &&
		Number(path[0]) > 0 &&
		path[1] === 'avatar';

	if (
		!isSelfRoute &&
		!isUserId &&
		!isAdminRoute &&
		!isBlockedListRoute &&
		!isBlockActionRoute &&
		!isOwnAvatarRoute &&
		!isUserAvatarRoute
	) {
		return NextResponse.json({ message: 'Not found.' }, { status: 404 });
	}

	const allowedMethods = isAdminRoute
		? ['PATCH']
		: isBlockedListRoute
			? ['GET']
			: isBlockActionRoute
				? ['POST', 'DELETE']
				: isOwnAvatarRoute
					? ['PATCH', 'DELETE']
					: isUserAvatarRoute
						? ['DELETE']
						: ['GET', 'DELETE'];

	if (!allowedMethods.includes(request.method)) {
		return NextResponse.json(
			{ message: 'Method not allowed.' },
			{
				status: 405,
				headers: { Allow: allowedMethods.join(', ') },
			},
		);
	}

	const endpoint = path.map((part) => encodeURIComponent(part)).join('/');
	const upstreamUrl = new URL(
		`/users/${endpoint}${request.nextUrl.search}`,
		backendUrl,
	);
	const headers = new Headers();
	const cookie = request.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);

	let upstream: Response;
	let refreshedCookies: string[] = [];

	try {
		const body =
			request.method === 'GET' || request.method === 'DELETE'
				? undefined
				: await request.arrayBuffer();
		const result = await fetchWithTokenRefresh(backendUrl, {
			url: upstreamUrl,
			method: request.method,
			headers,
			...(body ? { body } : {}),
			cookie: cookie ?? undefined,
		});
		upstream = result.response;
		refreshedCookies = result.refreshedCookies;
	} catch {
		return NextResponse.json(
			{ message: 'Unable to reach the user API.' },
			{ status: 502 },
		);
	}

	const responseHeaders = new Headers();
	for (const [name, value] of upstream.headers) {
		if (name.toLowerCase() !== 'set-cookie') {
			responseHeaders.append(name, value);
		}
	}

	for (const cookieHeader of [
		...refreshedCookies,
		...upstream.headers.getSetCookie(),
	]) {
		responseHeaders.append('set-cookie', cookieHeader);
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

export const GET = proxyUserRequest;
export const PATCH = proxyUserRequest;
export const DELETE = proxyUserRequest;

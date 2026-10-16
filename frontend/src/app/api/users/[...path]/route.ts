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

	if (!isSelfRoute && !isUserId && !isAdminRoute) {
		return NextResponse.json({ message: 'Not found.' }, { status: 404 });
	}

	const allowedMethods = isAdminRoute ? ['PATCH'] : ['GET', 'DELETE'];

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

	let upstream: Response;
	let refreshedCookies: string[] = [];

	try {
		const result = await fetchWithTokenRefresh(backendUrl, {
			url: upstreamUrl,
			method: request.method,
			headers,
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

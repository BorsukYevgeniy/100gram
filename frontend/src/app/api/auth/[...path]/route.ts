import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTokenRefresh } from '../../auth-proxy';

type RouteContext = {
	params: Promise<{ path: string[] }>;
};

async function proxyAuthRequest(request: NextRequest, context: RouteContext) {
	const backendUrl =
		process.env.BACKEND_URL?.trim() ||
		(process.env.NODE_ENV === 'development'
			? 'http://localhost:3000'
			: undefined);
	if (!backendUrl) {
		console.log(process.env.BACKEND_URL);

		return NextResponse.json(
			{ message: 'BACKEND_URL is not configured for the frontend.' },
			{ status: 503 },
		);
	}

	const { path } = await context.params;
	const endpoint = path.map((part) => encodeURIComponent(part)).join('/');
	const upstreamUrl = new URL(
		`/auth/${endpoint}${request.nextUrl.search}`,
		backendUrl,
	);
	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	const cookie = request.headers.get('cookie');
	if (contentType) headers.set('content-type', contentType);
	if (cookie) headers.set('cookie', cookie);

	let upstream: Response;
	let refreshedCookies: string[] = [];
	try {
		const result = await fetchWithTokenRefresh(backendUrl, {
			url: upstreamUrl,
			method: request.method,
			headers,
			...(request.method === 'GET' || request.method === 'HEAD'
				? {}
				: { body: await request.arrayBuffer() }),
			cookie: cookie ?? undefined,
		});
		upstream = result.response;
		refreshedCookies = result.refreshedCookies;
	} catch {
		return NextResponse.json(
			{ message: 'Unable to reach the authentication API.' },
			{ status: 502 },
		);
	}

	const isGoogleCallback =
		request.method === 'GET' &&
		path.length === 2 &&
		path[0] === 'google' &&
		path[1] === 'callback';
	if (isGoogleCallback && upstream.ok) {
		const redirect = NextResponse.redirect(
			new URL('/auth/success', request.url),
			303,
		);
		for (const cookieHeader of upstream.headers.getSetCookie()) {
			redirect.headers.append('set-cookie', cookieHeader);
		}
		return redirect;
	}

	const responseHeaders = new Headers();
	for (const [name, value] of upstream.headers) {
		if (name.toLowerCase() !== 'set-cookie') {
			responseHeaders.append(name, value);
		}
	}
	for (const cookieHeader of [...refreshedCookies, ...upstream.headers.getSetCookie()]) {
		responseHeaders.append('set-cookie', cookieHeader);
	}

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: responseHeaders,
	});
}

export const GET = proxyAuthRequest;
export const POST = proxyAuthRequest;

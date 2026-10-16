import { NextRequest, NextResponse } from "next/server";
import { fetchWithTokenRefresh } from "../../auth-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyChatRequest(request: NextRequest, context: RouteContext) {
  const backendUrl =
    process.env.BACKEND_URL?.trim() ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : undefined);
  if (!backendUrl) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured for the frontend." },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const isChatList = path.length === 1 && path[0] === "me";
  const isMessageList =
    path.length === 2 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    path[1] === "messages";
  const isChatUsersList =
    path.length === 2 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    path[1] === "users";
  const isChatCreation =
    path.length === 1 &&
    (path[0] === "private" || path[0] === "group" || path[0] === "channel");
  if (!isChatList && !isMessageList && !isChatUsersList && !isChatCreation) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  const allowedMethods = isChatCreation ? ["POST"] : ["GET"];
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { message: "Method not allowed." },
      { status: 405, headers: { Allow: allowedMethods.join(", ") } },
    );
  }

  const endpoint = path.map((part) => encodeURIComponent(part)).join("/");
  const upstreamUrl = new URL(
    `/chats/${endpoint}${request.nextUrl.search}`,
    backendUrl,
  );
  const cookie = request.headers.get("cookie");
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  try {
    const body = request.method === "GET" ? undefined : await request.arrayBuffer();
    const { response, refreshedCookies } = await fetchWithTokenRefresh(
      backendUrl,
      {
        url: upstreamUrl,
        method: request.method,
        headers,
        ...(body ? { body } : {}),
        cookie: cookie ?? undefined,
      },
    );

    const responseHeaders = new Headers();
    for (const [name, value] of response.headers) {
      if (name.toLowerCase() !== "set-cookie") {
        responseHeaders.append(name, value);
      }
    }
    for (const cookieHeader of [
      ...refreshedCookies,
      ...response.headers.getSetCookie(),
    ]) {
      responseHeaders.append("set-cookie", cookieHeader);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the chat API." },
      { status: 502 },
    );
  }
}

export const GET = proxyChatRequest;
export const POST = proxyChatRequest;

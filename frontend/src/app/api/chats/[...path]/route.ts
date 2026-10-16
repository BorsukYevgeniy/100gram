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
  const isChatDetails =
    path.length === 1 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0;
  const isChatCreation =
    path.length === 1 &&
    (path[0] === "private" || path[0] === "group" || path[0] === "channel");
  const isInviteJoin = path.length === 2 && path[0] === "invite";
  const isChatJoin =
    path.length === 2 &&
    path[0] === "join" &&
    /^\d+$/.test(path[1]) &&
    Number.isSafeInteger(Number(path[1])) &&
    Number(path[1]) > 0;
  const isChatAction =
    path.length === 2 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    ["invite-token", "pin", "unpin", "allowed-reactions", "avatar", "messages"].includes(path[1]);
  const isChatOwnerChange =
    path.length === 3 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    path[1] === "owner" &&
    /^\d+$/.test(path[2]) &&
    Number.isSafeInteger(Number(path[2])) &&
    Number(path[2]) > 0;
  const isChatMemberAction =
    path.length >= 3 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    path[1] === "users" &&
    (path.length === 3 && /^\d+$/.test(path[2]) ||
      path.length === 4 && /^\d+$/.test(path[2]) && path[3] === "role");
  const isChatAvatarAction =
    path.length === 2 &&
    /^\d+$/.test(path[0]) &&
    Number.isSafeInteger(Number(path[0])) &&
    Number(path[0]) > 0 &&
    path[1] === "avatar";
  if (
    !isChatList &&
    !isMessageList &&
    !isChatUsersList &&
    !isChatDetails &&
    !isChatCreation &&
    !isInviteJoin &&
    !isChatJoin &&
    !isChatAction &&
    !isChatOwnerChange &&
    !isChatMemberAction &&
    !isChatAvatarAction
  ) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  let allowedMethods: string[] = ["GET"];
  if (isChatCreation || isInviteJoin || isChatJoin) allowedMethods = ["POST"];
  else if (isChatDetails) allowedMethods = ["GET", "PATCH", "DELETE"];
  else if (isChatOwnerChange || isChatAvatarAction) {
    allowedMethods = isChatAvatarAction ? ["PATCH", "DELETE"] : ["PATCH"];
  } else if (isChatMemberAction) {
    allowedMethods =
      path.length === 3 ? ["DELETE"] : ["PATCH"];
  } else if (isChatAction) {
    switch (path[1]) {
      case "invite-token":
      case "pin":
      case "unpin":
      case "allowed-reactions":
        allowedMethods = ["PATCH"];
        break;
      case "avatar":
        allowedMethods = ["PATCH", "DELETE"];
        break;
      case "messages":
        allowedMethods = ["GET", "POST", "DELETE"];
        break;
    }
  }
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
    const body =
      request.method === "GET" || request.method === "DELETE"
        ? undefined
        : await request.arrayBuffer();
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
export const PATCH = proxyChatRequest;
export const DELETE = proxyChatRequest;

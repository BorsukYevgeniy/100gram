import { NextRequest, NextResponse } from "next/server";
import { fetchWithTokenRefresh } from "../../auth-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isPositiveInteger(value: string | undefined) {
  return (
    !!value &&
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  );
}

function getAllowedMethods(path: string[]) {
  if (path.length === 2 && path[0] === "files" && path[1] === "upload") {
    return ["POST"];
  }
  if (path.length === 2 && path[0] === "messages" && isPositiveInteger(path[1])) {
    return ["GET", "PATCH", "DELETE"];
  }
  if (
    path.length === 3 &&
    path[0] === "messages" &&
    isPositiveInteger(path[1]) &&
    ["pin", "unpin"].includes(path[2])
  ) {
    return ["PATCH"];
  }
  if (
    path.length === 3 &&
    path[0] === "messages" &&
    isPositiveInteger(path[1]) &&
    path[2] === "reactions"
  ) {
    return ["POST", "PATCH", "DELETE"];
  }
  return null;
}

async function proxyControllerRequest(
  request: NextRequest,
  context: RouteContext,
) {
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
  const allowedMethods = getAllowedMethods(path);
  if (!allowedMethods) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { message: "Method not allowed." },
      { status: 405, headers: { Allow: allowedMethods.join(", ") } },
    );
  }

  const endpoint = path.map((part) => encodeURIComponent(part)).join("/");
  const upstreamUrl = new URL(
    `/${endpoint}${request.nextUrl.search}`,
    backendUrl,
  );
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  if (cookie) headers.set("cookie", cookie);
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
      { message: "Unable to reach the requested API endpoint." },
      { status: 502 },
    );
  }
}

export const GET = proxyControllerRequest;
export const POST = proxyControllerRequest;
export const PATCH = proxyControllerRequest;
export const DELETE = proxyControllerRequest;

type ProxyRequest = {
  url: URL;
  method: string;
  headers: Headers;
  body?: ArrayBuffer;
  cookie?: string;
};

type ProxyResult = {
  response: Response;
  refreshedCookies: string[];
};

function mergeCookies(cookieHeader: string, setCookies: string[]) {
  const cookies = new Map<string, string>();

  for (const cookie of cookieHeader.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator > 0) {
      cookies.set(cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim());
    }
  }

  for (const cookie of setCookies) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    if (separator > 0) {
      cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
    }
  }

  return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
}

export async function fetchWithTokenRefresh(
  backendUrl: string,
  request: ProxyRequest,
): Promise<ProxyResult> {
  const fetchOptions = {
    method: request.method,
    headers: request.headers,
    ...(request.body ? { body: request.body } : {}),
    cache: "no-store" as const,
    redirect: "manual" as const,
  };

  const response = await fetch(request.url, fetchOptions);
  if (
    response.status !== 401 ||
    !request.cookie?.split(";").some((cookie) => cookie.trim().startsWith("refresh_token=")) ||
    request.url.pathname === "/auth/refresh"
  ) {
    return { response, refreshedCookies: [] };
  }

  const refreshResponse = await fetch(new URL("/auth/refresh", backendUrl), {
    method: "POST",
    headers: { cookie: request.cookie },
    cache: "no-store",
    redirect: "manual",
  });
  if (!refreshResponse.ok) {
    return { response, refreshedCookies: [] };
  }

  const refreshedCookies = refreshResponse.headers.getSetCookie();
  const headers = new Headers(request.headers);
  headers.set("cookie", mergeCookies(request.cookie, refreshedCookies));
  const retryResponse = await fetch(request.url, {
    ...fetchOptions,
    headers,
  });

  return { response: retryResponse, refreshedCookies };
}

# 100gram frontend

Next.js interface for the authentication routes in the NestJS API.

## Run locally

1. Optionally copy `.env.example` to `.env.local` and set `BACKEND_URL` to the
   NestJS server origin (without an `/auth` suffix). Local development defaults
   to `http://localhost:3000`; production requires `BACKEND_URL`. Also set
   `NEXT_PUBLIC_BACKEND_URL` to the browser-reachable NestJS origin for
   Socket.IO chat connections. On another device in local development, the
   socket uses the page hostname on port `3000`; ensure the backend port is
   reachable over the local network. For tunneled or deployed environments,
   configure `NEXT_PUBLIC_BACKEND_URL` to the browser-reachable backend URL.
2. Install dependencies with `npm install`.
3. Start the interface with `npm run dev`.

The frontend listens on `http://localhost:3001` by default; `BACKEND_URL` can
point to the backend on `http://localhost:3000`.

The browser calls the same-origin `/api/auth/*` proxy. The proxy forwards
authentication cookies to the API and relays `Set-Cookie` headers back to the
browser; access and refresh tokens are never exposed to client-side JavaScript.
If a protected request returns `401`, the proxy refreshes the token cookies and
retries that request automatically.

For Google sign-in, set the backend's `GOOGLE_CALLBACK_URL` to
`http://localhost:3001/api/auth/google/callback` for local development. Set the
backend's `APP_URL` to `http://localhost:3001` so verification emails open the
verification page.

The interface covers Google login/callback, registration, login, logout,
logout-all, email verification, token refresh, verification email resend,
one-time password reset email, and password reset. It also includes the user
controller features: view and update the current nickname, search users by
nickname, fetch a user by ID, assign an admin role, and delete the current
account or another user as an administrator.
The `/controllers` page exposes the existing chat membership and moderation,
chat invite/pinning/reaction settings, message CRUD and pinning, REST reactions,
blocked-user management, user/chat avatar operations, and attachment upload
controllers. Operations remain subject to backend authorization and validation.
The home page (`/`) is the Telegram-style chat interface for authenticated
users; unauthenticated visitors are sent to `/login`. The chat page has a
searchable conversation list and message view. It uses the existing Socket.IO
gateway to join and leave rooms, send/edit/delete messages, and
add/update/remove reactions. Users can create private chats, group chats with
selected user IDs, and public or private channels from the chat list. The
owners of groups and channels can update the chat title, description, and
visibility from the conversation header. The profile is available at `/user`,
and `/chats` remains an alias for the chat interface. Private chat names are
resolved from the other participant's nickname using the existing
chat-members endpoint.

## Recommended backend additions

The current frontend uses existing routes and does not require backend changes
for the controller tools. To support a more complete self-service product,
consider adding:

- A paginated `GET /chats/public` endpoint so users can discover public groups
  and channels before joining them.
- A file download or signed-URL endpoint for attachment records returned with
  messages; upload currently returns file metadata but the UI has no supported
  way to retrieve file contents.
- A chat details/list response that includes participant display names and
  chat type, avoiding separate participant lookups to identify private chats.
- Explicit owner/moderator authorization on `POST /chats/:chatId/users/:userId`;
  the current controller does not pass the requesting user's identity to the
  service for this operation.
- A stable structured error response format and explicit authorization
  requirements in the OpenAPI schemas for every controller route.

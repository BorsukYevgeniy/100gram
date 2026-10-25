# 100gram frontend

Next.js interface for the authentication routes in the NestJS API.

## Run locally

1. Optionally copy `.env.example` to `.env.local` and set `BACKEND_URL` to the
   NestJS server origin (without an `/auth` suffix). Local development defaults
   to `http://localhost:3000`; production requires `BACKEND_URL`. The browser
   connects to Socket.IO on the same origin as the frontend, so a reverse proxy
   can route the socket connection to NestJS without exposing a separate
   backend URL.
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
`http://localhost:3001/api/auth/google/callback` for local development. For
ngrok, expose the Nginx port (`ngrok http 80`) and set
`GOOGLE_CALLBACK_URL` to `https://<your-ngrok-domain>/api/auth/google/callback`;
register that exact URL in Google OAuth settings. Browser API and Socket.IO
traffic then share the ngrok origin, while `BACKEND_URL` remains the internal
Docker address (for example, `http://backend:3000`).

Docker Compose sets the frontend backend URL to `http://backend:3000` and waits
for the backend API to become healthy before starting the frontend. After
changing this Compose configuration, recreate the containers with
`docker compose up -d --build`.

Set the backend's `FRONTEND_URL` to the public frontend URL so verification
emails open the verification page.

The interface covers Google login/callback, registration, login, logout,
logout-all, email verification, token refresh, verification email resend,
one-time password reset email, and password reset. It also includes the user
controller features: view and update the current nickname, search users by
nickname, fetch a user by ID, assign an admin role, and delete the current
account or another user as an administrator.
The profile settings on `/user` let users update their nickname and upload or
remove their avatar.
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
group creation form finds participants by nickname through `GET /users/search`
and submits their selected IDs to the existing group creation endpoint. The
owners of groups and channels can update the chat title, description, and
visibility, chat avatar, and allowed reactions from the conversation header.
The same chat settings menu lists current members and lets owners add users by
nickname. The backend chat detail response includes allowed reactions, and
member and avatar operations support both groups and channels. The profile is
available at `/user`,
and `/chats` remains an alias for the chat interface. Private chat names are
resolved from the other participant's nickname using the existing
chat-members endpoint.
The chat composer uploads up to five attachments through `POST /files/upload`,
then sends their returned names through the existing Socket.IO `createMessage`
event. Message attachments are downloaded through the authenticated
`GET /files?key=attachments/<name>` route; the browser accesses both endpoints
through the same origin. Nginx forwards the upload route directly to NestJS so
large multipart bodies do not have to be buffered by the Next.js proxy. If the
access cookie has expired, the chat renews it through `/api/auth/refresh` and
retries the upload.

## Recommended backend additions

The current frontend uses the existing authentication, user, chat, message,
reaction, and file APIs. Attachment upload/download and all listed controller
operations are already supported by the backend. The following API additions
would close the remaining gaps for a more complete self-service product:

- A paginated `GET /chats/public` endpoint so users can discover public groups
  and channels before joining them. Include filtering, pagination, member
  counts, and only chats the authenticated user is allowed to discover.
- Include the sender's nickname (and optionally avatar) in REST and WebSocket
  message responses so group messages can show a name instead of a numeric user
  ID.
- Keep the REST/OpenAPI and AsyncAPI contracts aligned with actual response
  payloads, including message attachments and reaction summaries.

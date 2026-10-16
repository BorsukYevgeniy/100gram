# 100gram frontend

Next.js interface for the authentication routes in the NestJS API.

## Run locally

1. Optionally copy `.env.example` to `.env.local` and set `BACKEND_URL` to the
   NestJS server origin (without an `/auth` suffix). Local development defaults
   to `http://localhost:3000`; production requires `BACKEND_URL`.
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
controller features: view the current profile, fetch a user by ID, assign an
admin role, and delete the current account or another user as an administrator.

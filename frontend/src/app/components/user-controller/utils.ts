import type { UserProfile } from "./types";

type ApiError = {
  message?: string | string[];
  error?: string;
};

export function fileProxyUrl(fileName: string, kind: "users" | "chats") {
  const fileKey = fileName.startsWith("avatars/")
    ? fileName
    : `avatars/${kind}/${fileName}`;
  return `/api/files?key=${encodeURIComponent(fileKey)}`;
}

export function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as ApiError).message;
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as ApiError).error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

export function isUserProfile(payload: unknown): payload is UserProfile {
  if (!payload || typeof payload !== "object") return false;
  const user = payload as Partial<UserProfile>;
  return (
    typeof user.id === "number" &&
    typeof user.nickname === "string" &&
    (typeof user.avatarName === "string" || user.avatarName === null) &&
    (user.role === "ADMIN" || user.role === "USER") &&
    typeof user.isVerified === "boolean" &&
    typeof user.createdAt === "string" &&
    (typeof user.description === "string" || user.description === null)
  );
}

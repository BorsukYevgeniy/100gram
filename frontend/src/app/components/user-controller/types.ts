export type UserProfile = {
  id: number;
  nickname: string;
  avatarName: string | null;
  role: "ADMIN" | "USER";
  isVerified: boolean;
  createdAt: string;
  description: string | null;
};

export type UserSearchResult = {
  users: UserProfile[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type Notice = {
  kind: "success" | "error";
  text: string;
};

export type ProfileStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

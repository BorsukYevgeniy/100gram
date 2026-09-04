export type ChatMember = {
  userId: number;
  chatId: number;
  role: ChatRoleType;
  connectedAt: Date;
};

export enum ChatRole {
  OWNER = 'OWNER',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export type ChatRoleType = 'OWNER' | 'MEMBER' | 'MODERATOR';

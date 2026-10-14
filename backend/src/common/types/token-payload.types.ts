import { Role } from '../../../generated/prisma/enums';

export type AccessTokenPayload = {
  userId: number;
  role: Role;
  isVerified: boolean;
};

export type RefreshTokenPayload = {
  userId: number;
  jti: string;
};

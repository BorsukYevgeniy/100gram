import { Role } from '../../../generated/prisma/enums';

export type AccessTokenPayload = {
  id: number;
  role: Role;
  isVerified: boolean;
};

export type RefreshTokenPayload = {
  id: number;
};

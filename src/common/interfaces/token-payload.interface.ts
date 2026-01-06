import { Role } from '../../../generated/prisma/enums';

export interface AccessTokenPayload {
  id: number;
  role: Role;
  isVerified: boolean;
}

export interface RefreshTokenPayload {
  id: number;
}

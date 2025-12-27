import { Role } from '../../../generated/prisma/enums';

export interface AccessTokenPayload {
  id: number;
  role: Role;
}

export interface RefreshTokenPayload {
  id: number;
}

import { Role } from './role.enum';

export type AccessTokenPayload = {
  id: number;
  role: Role;
  isVerified: boolean;
};

export type RefreshTokenPayload = {
  id: number;
};

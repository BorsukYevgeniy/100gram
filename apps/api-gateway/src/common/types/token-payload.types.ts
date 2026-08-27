import { Role } from '@app/contracts/auth';

export type AccessTokenPayload = {
  id: number;
  role: Role;
  isVerified: boolean;
};

export type RefreshTokenPayload = {
  id: number;
};

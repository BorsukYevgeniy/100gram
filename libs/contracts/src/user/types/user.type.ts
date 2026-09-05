import { Role } from '../../auth';
import { Provider } from '../../auth/provider.enum';
import { Paginated } from '../../pagination';

export interface User {
  email: string;
  verificationCode: string;
  password: string;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  provider: Provider;
  description: string;
  id: number;
  nickname: string;
  avatar: string;
  createdAt: Date;
  role: Role;
  isVerified: boolean;
  verifiedAt: Date;
}

/**
 * Represents type User without `email`, `password`, `verificationCode` and OTP fields
 */
export type UserNoCredOtpVCode = Omit<
  User,
  | 'email'
  | 'verificationCode'
  | 'password'
  | 'otpHash'
  | 'otpExpiresAt'
  | 'otpAttempts'
  | 'provider'
>;

export type PaginatedUserNoCredOtpVCode = Paginated<
  'users',
  UserNoCredOtpVCode
>;

import { User } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types';

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
>;

export type PaginatedUserNoCredOtpVCode = Paginated<
  'users',
  UserNoCredOtpVCode
>;

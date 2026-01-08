import { User } from '../../../../generated/prisma/client';

/**
 * Represents type User without `email`, `password`, `verificationCode` fields
 */
export type UserNoCredVCode = Omit<
  User,
  'email' | 'verificationCode' | 'password'
>;

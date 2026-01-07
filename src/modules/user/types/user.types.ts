import { User } from '../../../../generated/prisma/client';

/**
 * Represents type User without `email`, `password`, `verificationLink` fields
 */
export type UserNoCredVLink = Omit<
  User,
  'email' | 'verificationLink' | 'password'
>;

import { User } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types';

/**
 * Represents type User without `email`, `password`, `verificationCode` fields
 */
export type UserNoCredVCode = Omit<
  User,
  'email' | 'verificationCode' | 'password'
>;

export type PaginatedUserNoCredVCode = Paginated<'users', UserNoCredVCode>;

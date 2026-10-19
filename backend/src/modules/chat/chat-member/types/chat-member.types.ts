import { ChatRole } from '../../../../../generated/prisma/browser';
import { Paginated } from '../../../../common/types';
import { UserNoCredOtpVCode } from '../../../user/types/user.types';

export type ChatMemberWithRole = Pick<
  UserNoCredOtpVCode,
  'avatarName' | 'id' | 'nickname'
> & { chatRole: ChatRole };
export type PaginatedChatMembers = Paginated<'users', ChatMemberWithRole>;

import { AccessTokenPayload } from '../../auth';
import { AddUserToChatPayload } from './add-user-to-chat.payload';

export type DeleteUserFromChatPayload = AddUserToChatPayload &
  AccessTokenPayload;

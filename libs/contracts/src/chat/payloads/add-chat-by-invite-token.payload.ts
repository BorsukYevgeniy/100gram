import { AccessTokenPayload } from '../../auth';

export interface AddChatByInviteTokenPayload {
  user: AccessTokenPayload;
  inviteToken: string;
}

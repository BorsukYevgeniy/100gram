import { AccessTokenPayload } from '../../auth';

export interface MessageActionPayload {
  user: AccessTokenPayload;
  messageId: number;
}

import { AccessTokenPayload } from '../../auth';

export interface ChatActionPayload {
  chatId: number;
  user: AccessTokenPayload;
}

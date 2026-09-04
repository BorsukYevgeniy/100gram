import { AccessTokenPayload } from '../../auth';

export interface UpdateOwnerPayload {
  chatId: number;
  ownerId: number;
  user: AccessTokenPayload;
}

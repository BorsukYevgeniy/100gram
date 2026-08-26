import { Request } from 'express';
import { AccessTokenPayload } from './token-payload.types';

export type AuthRequest = Request & {
  user: AccessTokenPayload;
};

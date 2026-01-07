import { Request } from 'express';
import { AccessTokenPayload } from './token-payload.types';

export interface AuthRequest extends Request {
  user: AccessTokenPayload;
}

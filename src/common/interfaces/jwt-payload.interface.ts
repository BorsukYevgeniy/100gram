import { Role } from '../../../generated/prisma/enums';

export interface JwtPayload {
  id: number;
  role: Role;
}

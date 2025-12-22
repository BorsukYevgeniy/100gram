import { Role } from '../enum/role.enum';

export interface JwtPayload {
  id: number;
  role: Role;
}

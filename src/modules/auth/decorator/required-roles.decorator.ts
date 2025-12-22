import { Reflector } from '@nestjs/core';
import { Role } from '../../../common/enum/role.enum';

export const RequiredRoles = Reflector.createDecorator<Role[]>();

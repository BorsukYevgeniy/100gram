import { Role } from '@app/contracts/auth';
import { Reflector } from '@nestjs/core';

export const RequiredRoles = Reflector.createDecorator<Role[]>();

import { UpdateRoleDto } from '../dto';
import { DeleteUserFromChatPayload } from './delete-user-from-chat.payload';

export type UpdateUserRolePayload = DeleteUserFromChatPayload & UpdateRoleDto;

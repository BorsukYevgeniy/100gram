import { ApiTags } from '@nestjs/swagger';

export function AuthControllerDocs() {
  return ApiTags('Auth');
}

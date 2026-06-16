import { ApiParam } from '@nestjs/swagger';

export function ApiUserIdParamDocs() {
  return ApiParam({
    name: 'userId',
    type: Number,
    description: 'The ID of the user',
    required: true,
  });
}

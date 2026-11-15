import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';

export function FolderControllerDocs() {
  return applyDecorators(ApiTags('Folder'), ApiVerifiedAuthDocs());
}
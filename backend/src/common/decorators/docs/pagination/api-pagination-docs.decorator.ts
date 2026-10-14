import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiQuery } from '@nestjs/swagger';
import { PaginationDto } from '../../../dto/pagination.dto';

export function ApiPaginationDocs() {
  return applyDecorators(
    ApiQuery({
      description: 'Pagination data',
      type: PaginationDto,
      required: false,
    }),
    ApiBadRequestResponse({ description: 'Invalid pagination DTO' }),
  );
}

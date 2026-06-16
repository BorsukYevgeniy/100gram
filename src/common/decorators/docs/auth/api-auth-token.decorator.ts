import { applyDecorators } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

export function ApiAuthCookies() {
  return applyDecorators(
    ApiCookieAuth('access_token'),
    ApiCookieAuth('refresh_token'),
  );
}

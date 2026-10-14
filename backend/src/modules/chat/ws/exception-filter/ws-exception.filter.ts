import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

import { Socket } from 'socket.io';

@Catch(HttpException)
export class HttpToWsExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    const message = exception.message;
    const statusCode = exception.getStatus();

    client.emit('exception', {
      message,
      statusCode,
    });
  }
}

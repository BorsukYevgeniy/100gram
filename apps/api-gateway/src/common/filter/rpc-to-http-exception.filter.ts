import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const { message, statusCode } = exception.getError() as {
      message: string;
      statusCode: number;
    };

    response.status(statusCode).json({
      statusCode,
      message,
    });
  }
}

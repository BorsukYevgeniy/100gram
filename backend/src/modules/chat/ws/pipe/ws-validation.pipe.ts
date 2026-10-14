import { ValidationPipe } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export default new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map((err) => ({
      property: err.property,
      target: err.target,
      messages: err.constraints ? Object.values(err.constraints) : [],
    }));

    return new WsException({
      errorCode: 400,
      errors: formattedErrors,
    });
  },
});

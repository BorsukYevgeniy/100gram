import { registerAs } from '@nestjs/config';
import { ClientProvider, Transport } from '@nestjs/microservices';

export default registerAs(
  'user-microservice',
  (): ClientProvider => ({
    transport: Transport.TCP,
    options: {
      host: process.env.USER_HOST,
      port: Number(process.env.USER_PORT),
    },
  }),
);

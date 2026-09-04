import { registerAs } from '@nestjs/config';
import { ClientProvider, Transport } from '@nestjs/microservices';

export default registerAs(
  'chat-microservice',
  (): ClientProvider => ({
    transport: Transport.TCP,
    options: {
      host: process.env.CHAT_HOST,
      port: Number(process.env.CHAT_PORT),
    },
  }),
);

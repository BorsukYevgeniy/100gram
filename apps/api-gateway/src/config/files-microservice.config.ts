import { registerAs } from '@nestjs/config';
import { ClientProvider, Transport } from '@nestjs/microservices';

export default registerAs(
  'files-microservice',
  (): ClientProvider => ({
    transport: Transport.TCP,
    options: {
      host: process.env.FILES_HOST,
      port: Number(process.env.FILES_PORT),
    },
  }),
);

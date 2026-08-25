import { registerAs } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

export default registerAs(
  'app',
  (): MicroserviceOptions => ({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST,
      port: Number(process.env.PORT),
    },
  }),
);

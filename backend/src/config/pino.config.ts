import { registerAs } from '@nestjs/config';
import { Params as PinoOptions } from 'nestjs-pino';

export default registerAs(
  'pino',
  (): PinoOptions => ({
    pinoHttp: {
      level: 'debug',
      autoLogging: false,

      redact: [
        'req.headers',
        'req.cookies',
        'req.query',
        'req.params',
        'req.remoteAddress',
        'req.remotePort',
      ],

      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    },
  }),
);

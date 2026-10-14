import { registerAs } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export default registerAs(
  'throttler',
  (): ThrottlerModuleOptions => ({
    throttlers: [
      {
        limit: Number(process.env.TROTTLE_LIMIT),
        ttl: Number(process.env.THROTTLE_TTL),
      },
    ],
  }),
);

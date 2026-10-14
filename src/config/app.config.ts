import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appPort: process.env.APP_PORT,
  appUrl: process.env.APP_URL,
}));

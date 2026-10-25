import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  appPort: process.env.BACKEND_PORT,
  frontendUrl: process.env.FRONTEND_URL,
}));

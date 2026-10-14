import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  passwordSalt: Number(process.env.PASSWORD_SALT),
}));

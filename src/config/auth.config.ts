import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  passwordSalt: process.env.PASSWORD_SALT,
}));

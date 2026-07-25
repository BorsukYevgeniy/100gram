import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  jwtAccessTokenSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshTokenSecret: process.env.JWT_REFRESH_SECRET,

  jwtAccessTokenExpirationTime: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
  jwtRefreshTokenExpirationTime: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
}));

import { registerAs } from '@nestjs/config';
import { StrategyOptions } from 'passport-google-oauth20';

export default registerAs(
  'googleOauth',
  (): StrategyOptions => ({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile'],
  }),
);

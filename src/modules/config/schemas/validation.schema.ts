import * as J from 'joi';

export const validationSchema = J.object({
  PORT: J.number().port().required(),

  DATABASE_URL: J.string().uri().required(),

  PASSWORD_SALT: J.number().integer().positive().required(),

  ACCESS_TOKEN_SECRET: J.string().required(),
  ACCESS_TOKEN_EXPIRATION_TIME: J.string().required(),

  REFRESH_TOKEN_SECRET: J.string().required(),
  REFRESH_TOKEN_EXPIRATION_TIME: J.string().required(),

  GOOGLE_CALLBACK_URL: J.string().uri().required(),
  GOOGLE_CLIENT_ID: J.string().required(),
  GOOGLE_CLIENT_SECRET: J.string().required(),
});

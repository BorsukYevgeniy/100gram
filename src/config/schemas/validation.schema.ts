import * as J from 'joi';

export const validationSchema = J.object({
  DATABASE_URL: J.string().uri().required(),

  APP_PORT: J.number().port().required(),
  APP_URL: J.string().uri().required(),

  PASSWORD_SALT: J.number().integer().positive().required(),

  JWT_ACCESS_TOKEN_SECRET: J.string().required(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: J.string().required(),

  JWT_REFRESH_TOKEN_SECRET: J.string().required(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: J.string().required(),

  GOOGLE_CLIENT_ID: J.string().required(),
  GOOGLE_CLIENT_SECRET: J.string().required(),
  GOOGLE_CALLBACK_URL: J.string().uri().required(),

  SMTP_HOST: J.string().hostname().required(),
  SMTP_USER: J.string().required(),
  SMTP_PASSWORD: J.string().required(),

  THROTTLER_TTL: J.number().positive().required(),
  THROTTLER_LIMIT: J.number().positive().required(),

  REDIS_URL: J.string().uri().required(),

  MINIO_ENDPOINT: J.string().uri().required(),
  MINIO_SECRET_KEY: J.string().required(),
  MINIO_ACCESS_KEY: J.string().required(),
  MINIO_REGION: J.string().required(),
  MINIO_BUCKET: J.string().required(),
});

import * as J from 'joi';

export const validationSchema = J.object({
  DATABASE_URL: J.string().uri().required(),
  PORT: J.number().port().required(),
});

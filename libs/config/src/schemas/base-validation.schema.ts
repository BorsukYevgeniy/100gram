import * as J from 'joi';

export const baseValidationSchema = J.object({
  DATABASE_URL: J.string().uri().required(),
});

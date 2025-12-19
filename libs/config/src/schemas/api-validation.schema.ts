import * as J from 'joi';

import { baseValidationSchema } from './base-validation.schema';

export const apiValidationSchema = baseValidationSchema.keys({
  API_PORT: J.number().port().required(),
});

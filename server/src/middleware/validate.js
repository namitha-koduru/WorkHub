import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return next(ApiError.badRequest('Validation Failed', errorMessages));
    }
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};


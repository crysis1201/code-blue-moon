import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { BadRequestError } from '../errors/index.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      throw new BadRequestError(message, 'VALIDATION_ERROR');
    }

    req[source] = result.data;
    next();
  };
}

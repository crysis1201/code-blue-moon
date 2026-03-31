import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@homehelp/shared';
import { ForbiddenError } from '../errors/index.js';

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      throw new ForbiddenError('You do not have permission to access this resource');
    }
    next();
  };
}

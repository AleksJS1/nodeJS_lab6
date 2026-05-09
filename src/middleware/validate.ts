import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export const validate = (schema: ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };

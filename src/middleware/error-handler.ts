import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors (HTTP request validation)
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      issues: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId format)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      message: 'Invalid ID format',
    });
    return;
  }

  // Handle Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const issues = Object.entries(err.errors).map(([path, error]) => ({
      path,
      message: error.message,
    }));

    res.status(400).json({
      message: 'Validation failed',
      issues,
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(409).json({
      message: `Duplicate value for field: ${field}`,
    });
    return;
  }

  // Handle generic MongoDB errors
  if (err instanceof mongoose.Error) {
    res.status(400).json({
      message: 'Database error',
      details: err.message,
    });
    return;
  }

  // Default error handler
  console.error('Unexpected error:', err);
  res.status(500).json({
    message: 'Internal server error',
  });
};

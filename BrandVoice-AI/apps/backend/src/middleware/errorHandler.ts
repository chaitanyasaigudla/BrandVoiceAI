import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Global error handler middleware – must have 4 params
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational error', { message: err.message, stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Prisma connection / initialization errors
  if (err.constructor.name === 'PrismaClientInitializationError' || err.constructor.name === 'PrismaClientRustPanicError') {
    logger.error('Database connection error', { message: err.message });
    res.status(503).json({
      success: false,
      error: 'Database is currently unavailable. Please try again later.',
    });
    return;
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: `A record with this ${prismaErr.meta?.target?.[0] ?? 'value'} already exists`,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Record not found' });
      return;
    }
  }

  // Unexpected errors – don't leak details in production
  logger.error('Unexpected error', { message: err.message, stack: err.stack });
  const isDev = process.env.NODE_ENV !== 'production';
  const msgLower = (err.message || '').toLowerCase();
  const isSensitive = msgLower.includes('database') || msgLower.includes('prisma') || msgLower.includes('p1001') || msgLower.includes('econnrefused');
  const safeMessage = isSensitive
    ? 'Database is currently unavailable. Please try again later.'
    : (isDev ? err.message : 'Internal server error');
  res.status(isSensitive ? 503 : 500).json({
    success: false,
    error: safeMessage,
  });
}

// 404 handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

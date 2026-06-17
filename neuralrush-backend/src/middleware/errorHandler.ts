import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Prisma unique constraint violation
  if ((err as Record<string, unknown>).code === 'P2002') {
    res.status(409).json({
      success: false,
      error: {
        message: 'A record with that value already exists.',
        code: 'DUPLICATE',
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  // Log full error in dev
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Unhandled Error:', err);
  } else {
    console.error('❌ Error:', err.message);
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred.',
      code: 'INTERNAL_ERROR',
    },
  });
}

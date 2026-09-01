import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details to standard error
  console.error(`[Error] ${statusCode} - ${message} - Path: ${req.path}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 400 ? "BAD_REQUEST" : statusCode === 404 ? "NOT_FOUND" : statusCode === 409 ? "CONFLICT" : "INTERNAL_SERVER_ERROR"),
      message,
    },
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error: AppError = new Error(`Resource not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

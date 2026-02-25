import { Request, Response, NextFunction } from "express";

interface ErrorWithStatus extends Error {
  status?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("❌ Error:", err);

  // Default error
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  // Handle specific errors
  if (err.name === "ValidationError") {
    status = 400;
    message = "Validation error";
  }

  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token expired";
  }

  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    status = 409;
    message = "Duplicate entry";
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

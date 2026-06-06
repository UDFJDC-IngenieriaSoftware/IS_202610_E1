import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http";
import logger from "../utils/logger";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const correlationId = req.headers["x-correlation-id"] as string;
  const isDev = process.env.NODE_ENV !== "production";

  if (error instanceof HttpError) {
    const errorLog: any = {
      correlationId,
      status: error.status,
      method: req.method,
      path: req.path,
    };
    if (error.details) {
      errorLog.details = error.details;
    }

    logger.warn(`[${correlationId}] HTTP ${error.status}: ${error.message}`, errorLog);

    const responseError: any = {
      code: error.status,
      message: error.message,
    };
    if (isDev && error.details) {
      responseError.details = error.details;
    }

    return res.status(error.status).json({
      success: false,
      error: responseError,
    });
  }

  if (error instanceof Error) {
    const errorLog: any = {
      correlationId,
      method: req.method,
      path: req.path,
    };
    if (isDev) {
      errorLog.stack = error.stack;
    }

    logger.error(`[${correlationId}] Unhandled error: ${error.message}`, errorLog);

    const responseError: any = {
      code: 500,
      message: isDev ? error.message : "Internal server error",
    };
    if (isDev) {
      responseError.stack = error.stack;
    }

    return res.status(500).json({
      success: false,
      error: responseError,
    });
  }

  logger.error(`[${correlationId}] Unknown error type`, {
    correlationId,
    method: req.method,
    path: req.path,
    error: String(error),
  });

  res.status(500).json({
    success: false,
    error: {
      code: 500,
      message: "Internal server error",
    },
  });
}

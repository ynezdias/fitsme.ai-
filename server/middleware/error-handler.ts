import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiErrorResponse } from "../types/api.js";
import { AppError } from "../utils/app-error.js";

export const notFoundHandler: RequestHandler = (req, res) => {
  const response: ApiErrorResponse = { success: false, error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} was not found.` } };
  res.status(404).json(response);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    const response: ApiErrorResponse = { success: false, error: { code: error.code, message: error.message } };
    res.status(error.statusCode).json(response);
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    const response: ApiErrorResponse = { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } };
    res.status(400).json(response);
    return;
  }
  console.error("Unexpected server error", { name: error.name });
  const response: ApiErrorResponse = { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." } };
  res.status(500).json(response);
};

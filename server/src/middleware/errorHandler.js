// server/src/middleware/errorHandler.js

const logger = require("../../utils/logger"); // Import our Winston logger

const AppError = require("../utils/appError");
/**
 * Centralized error handling middleware for Express.
 * This middleware catches errors passed via next(err) and sends a standardized error response.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 */
const errorHandler = (err, req, res, next) => {
  // 1. Determine if the error is operational or a programming error
  // Operational errors are expected (e.g., bad user input, unauthorized).
  // Programming errors are unexpected bugs (e.g., trying to read undefined property).
  // REPLACE FROM HERE:
  if (!err.isOperational) {
    // Check if the error is NOT operational
    // If it's a programming or unknown error, log it comprehensively at 'error' level
    logger.error(`UNHANDLED PROGRAMMING ERROR: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      // Consider adding req.body or req.params for more context if relevant, but be mindful of sensitive data
    });

    // For programming errors, send a generic 500 message in production
    // This prevents leaking sensitive details about internal server issues
    return res.status(500).json({
      status: "error",
      message:
        "An unexpected internal server error occurred. Please try again later.",
      // Include stack trace only in development for debugging
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
  }

  // 2. Handle operational errors (e.g., AppError instances, or errors with status codes)
  // These errors have an 'isOperational' flag set to true (or a status code set).
  const statusCode = err.statusCode || err.status || 500;
  const status =
    err.status || (statusCode >= 400 && statusCode < 500 ? "fail" : "error");
  const message = err.message || "Something went wrong!";

  // Log operational errors at a 'warn' level as they are less critical than programming errors
  logger.warn(`Operational Error: ${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined, // Log stack for operational errors in dev
  });
  // TO HERE. The response body part below remains the same.

  // For development, you might want to send the stack trace for debugging.
  // In production, sending the stack trace is a security risk.
  const responseBody = {
    status: status,
    message: message,
    // Only include stack in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  // Send the error response
  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;

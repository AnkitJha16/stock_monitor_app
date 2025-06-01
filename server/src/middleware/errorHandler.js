// server/src/middleware/errorHandler.js

const logger = require("../../utils/logger"); // Import our Winston logger

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
  // Log the error for debugging purposes (internal server error usually)
  // We check for err.status to differentiate between operational errors (like 400, 401)
  // and unexpected errors (like 500).
  if (
    err.status !== 400 &&
    err.status !== 401 &&
    err.status !== 403 &&
    err.status !== 404
  ) {
    logger.error(`Unhandled error: ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      // You can add more context here if needed, e.g., user ID, request body (carefully)
    });
  } else {
    // Log operational errors at a 'warn' or 'info' level, as they are often expected
    // user-facing issues (e.g., bad request, unauthorized)
    logger.warn(`Operational error: ${err.status} - ${err.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // Determine the status code and message to send back to the client
  const statusCode = err.status || 500; // Use the error's status if available, otherwise default to 500 (Internal Server Error)
  const message = err.expose // err.expose is a property from 'http-errors' or similar libraries
    ? err.message // If 'expose' is true, it's safe to send the message to the client
    : "An unexpected error occurred."; // Otherwise, send a generic message for security

  // For development, you might want to send the stack trace for debugging.
  // In production, sending the stack trace is a security risk.
  const responseBody = {
    status: statusCode,
    message: message,
    // Only include stack in development
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  // Send the error response
  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;

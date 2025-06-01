// server/src/utils/appError.js

/**
 * Custom Error class for operational errors.
 * These are errors that are expected to happen during the normal operation
 * of the application (e.g., invalid input, unauthorized access, not found).
 * They carry a specific statusCode and a message that can be exposed to the client.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call the parent Error constructor with the error message

    this.statusCode = statusCode; // HTTP status code for the error
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // 'fail' for 4xx, 'error' for 5xx
    this.isOperational = true; // Mark this error as an operational error

    // Capture the stack trace, excluding the constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

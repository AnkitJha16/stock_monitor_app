// // server/src/middleware/errorHandler.js
// server/src/middleware/errorHandler.js

const AppError = require("../../utils/appError"); // ADD THIS LINE
const logger = require("../../utils/logger");

// Helper function to handle errors in development mode
const sendErrorDev = (err, req, res) => {
  // 1) Log the error for internal debugging
  // For development, we want to log all errors, operational or not, with full details.
  // We'll categorize them slightly for better visibility.
  if (err.isOperational) {
    logger.warn(`OPERATIONAL ERROR (DEV): ${err.statusCode} - ${err.message}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack: err.stack, // Include stack for operational errors in dev for full context
    });
  } else {
    logger.error(`PROGRAMMING ERROR (DEV): ${err.message}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  }

  // 2) Send a detailed response to the client
  res.status(err.statusCode).json({
    status: err.status, // e.g., "fail" or "error" from AppError, or "error" default
    // error: err, // Send the full error object for debugging client-side
    message: err.message,
    stack: err.stack,
  });
};

// Helper function to handle errors in production mode
const sendErrorProd = (err, req, res) => {
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn(
      `OPERATIONAL ERROR (PROD): ${err.statusCode} - ${err.message}`,
      {
        path: req.path,
        method: req.method,
        ip: req.ip,
      }
    );
    res.status(err.statusCode).json({
      status: err.status, // e.g., "fail" or "error" from AppError
      message: err.message,
    });
  } else {
    // B) Programming or other unknown error: don't leak error details to the client
    // 1) Log error extensively for server-side investigation
    logger.error("PROGRAMMING ERROR (PROD) 💥:", {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    // 2) Send generic message to client
    res.status(500).json({
      status: "error", // Always 'error' for server errors
      message: "Something went very wrong! Please try again later.",
    });
  }
};

// Main error handling middleware
module.exports = (err, req, res, next) => {
  // Set default status code and status if not already set by AppError or other middleware
  err.statusCode = err.statusCode || 500;
  // If it's a programming error (no 'status' set by AppError), default to 'error'

  err.status = err.status || "error";

  // const nodeEnv = process.env.NODE_ENV; // <-- THIS IS THE LINE WHERE IT ACCESSES THE VARIABLE

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err }; // Create a shallow copy to avoid modifying original error object
    error.name = err.name; // Copy name explicitly
    error.message = err.message; // Copy message explicitly
    error.stack = err.stack; // Copy stack explicitly

    // Crucially: If it's a programming error (not an operational AppError),
    // we want to treat it as a generic 500 internal server error in production.
    // This involves converting specific database errors or other known programming errors
    // into AppError instances (e.g., CastError, ValidationError, Duplicate Fields etc.).
    // For now, if it's not an AppError (i.e., !error.isOperational), we'll make it generic.
    if (!error.isOperational) {
      // You can add specific error handling here for different types of programming errors
      // if you want to give slightly more specific, but still safe, messages in production.
      // For example:
      // if (error.name === 'CastError') error = new AppError(`Invalid ${error.path}: ${error.value}.`, 400);
      // if (error.code === '23505') error = new AppError('Duplicate field value. Please use another value!', 400); // PostgreSQL unique constraint
      // etc.

      // For now, if it's any non-operational error, convert it to a generic 500 AppError
      // to ensure sendErrorProd treats it correctly as a generic internal server error.
      error = new AppError("Something went very wrong!", 500);
      // Important: Ensure the converted error maintains the operational flag
      error.isOperational = false; // Mark it as non-operational so sendErrorProd logs it as programming error
    }

    sendErrorProd(error, req, res);
  }
};

// ------------xxxxxxxxx------ OLD CODE ------------xxxxxxxx-----------------

// const logger = require("../../utils/logger"); // Import our Winston logger

// /**
//  * Centralized error handling middleware for Express.
//  * This middleware catches errors passed via next(err) and sends a standardized error response.
//  *
//  * @param {Error} err - The error object.
//  * @param {object} req - The Express request object.
//  * @param {object} res - The Express response object.
//  * @param {function} next - The next middleware function in the stack.
//  */
// const errorHandler = (err, req, res, next) => {
//   // Log the error for debugging purposes (internal server error usually)
//   // We check for err.status to differentiate between operational errors (like 400, 401)
//   // and unexpected errors (like 500).
//   if (
//     err.status !== 400 &&
//     err.status !== 401 &&
//     err.status !== 403 &&
//     err.status !== 404
//   ) {
//     logger.error(`Unhandled error: ${err.message}`, {
//       stack: err.stack,
//       path: req.path,
//       method: req.method,
//       ip: req.ip,
//       // You can add more context here if needed, e.g., user ID, request body (carefully)
//     });
//   } else {
//     // Log operational errors at a 'warn' or 'info' level, as they are often expected
//     // user-facing issues (e.g., bad request, unauthorized)
//     logger.warn(`Operational error: ${err.status} - ${err.message}`, {
//       path: req.path,
//       method: req.method,
//       ip: req.ip,
//     });
//   }

//   // Determine the status code and message to send back to the client
//   const statusCode = err.statusCode || 500; // Use the error's status if available, otherwise default to 500 (Internal Server Error)
//   const message = err.expose // err.expose is a property from 'http-errors' or similar libraries
//     ? err.message // If 'expose' is true, it's safe to send the message to the client
//     : "An unexpected error occurred."; // Otherwise, send a generic message for security

//   // For development, you might want to send the stack trace for debugging.
//   // In production, sending the stack trace is a security risk.
//   const responseBody = {
//     status: statusCode,
//     message: message,
//     // Only include stack in development
//     ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
//   };

//   // Send the error response
//   res.status(statusCode).json(responseBody);
// };

// module.exports = errorHandler;

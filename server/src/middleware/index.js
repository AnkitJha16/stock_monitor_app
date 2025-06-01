// server/src/middleware/index.js

const express = require("express");
const cors = require("cors");
// We will import our central logger here later. For now, assume it's available or configure locally.

/**
 * Configures and applies global Express middleware.
 * @param {object} app - The Express application instance.
 * @param {object} logger - The Winston logger instance.
 */
const setupGlobalMiddleware = (app, logger) => {
  // Configure CORS for Express middleware
  app.use(
    cors({
      origin: "http://localhost:5173", // IMPORTANT: This must match your React app's development server URL.
    })
  );
  logger.info("CORS middleware configured.");

  // Middleware to parse JSON bodies from incoming requests
  app.use(express.json());
  logger.info("Express JSON parser middleware configured.");

  // Middleware to parse URL-encoded bodies (e.g., from HTML forms)
  app.use(express.urlencoded({ extended: true }));
  logger.info("Express URL-encoded parser middleware configured.");

  // Add more global middleware here as needed (e.g., logging, security headers)
  // For example, if you wanted a simple request logger:
  // app.use((req, res, next) => {
  //     logger.info(`${req.method} ${req.url}`);
  //     next();
  // });
};

module.exports = setupGlobalMiddleware;

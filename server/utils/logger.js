// server/src/utils/logger.js

const winston = require("winston");

// Define log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Add timestamp
  winston.format.errors({ stack: true }), // Include stack trace for errors
  winston.format.splat(), // Enable string interpolation
  winston.format.json() // Output logs in JSON format
);

// Define transports (where logs go)
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Add colors to console output
      winston.format.simple() // Simple format for readability in console
    ),
  }),
  // You could add more transports here for production, e.g.:
  new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  new winston.transports.File({ filename: "logs/combined.log" }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug", // Log 'debug' level and above in development, 'info' in production
  format: logFormat,
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Export the logger
module.exports = logger;

// stock_dashboard/server/index.js
require("dotenv").config();
const express = require("express");
const http = require("http"); // Node.js built-in module for HTTP server
const { Server } = require("socket.io"); // Socket.IO Server class
// const cors = require("cors"); // CORS middleware
const logger = require("./utils/logger");
// const winston = require("winston"); // NEW: Import Winston
const { connectDb, closeDb, testDbInsert } = require("./src/config/db"); // ADD this line to import DB functions
const errorHandler = require("./src/middleware/errorHandler"); // ADD THIS LINE

// ***--- NEW: Configure Winston Logger ---
// const logger = winston.createLogger({
//   level: "info", // Set the default logging level. 'info' logs info, warn, and error.
//   format: winston.format.combine(
//     winston.format.timestamp(), // Add a timestamp to each log entry
//     winston.format.json() // Output logs in JSON format for easy parsing by log aggregators
//   ),
//   transports: [
//     // Transport for writing all logs (info, warn, error) to a combined file
//     new winston.transports.File({ filename: "logs/combined.log" }),
//     // Transport for writing only error level logs to a separate error file
//     new winston.transports.File({ filename: "logs/error.log", level: "error" }),
//     // Optional: For development, you might still want console output.
//     // We'll keep this commented out for now as you preferred file logging.
//     new winston.transports.Console({ format: winston.format.simple() }),
//   ],
// });
// --- END NEW: Configure Winston Logger ---

// **--- NEW: Import our main API routes ---
const apiRoutes = require("./src/routes"); // This will automatically look for src/routes/index.js
// --- END NEW: Import routes ---

const setupGlobalMiddleware = require("./src/middleware");

// ** --- Initialize Express application
const app = express();

// Create an HTTP server using Express app
const server = http.createServer(app);

// ** --- NEW: General Middleware ---

setupGlobalMiddleware(app, logger);

// *** Middleware for Configuring CORS for Express
// This allows your frontend (which will run on a different port, e.g., 5173) to make requests to your backend.
// app.use(
//   cors({
//     origin: "http://localhost:5173", // IMPORTANT: This must match your React app's development server URL.
//     // Vite typically runs React apps on port 5173 by default.
//   })
// );

// *** Middleware to parse JSON bodies from incoming requests
// app.use(express.json());

// *** Middleware to parse URL-encoded bodies (e.g., from HTML forms)
// app.use(express.urlencoded({ extended: true }));

//--- END NEW: General Middleware ---

//** --- NEW: Mount API Routes ---
// All routes defined in src/routes/index.js (and any other routers it imports)
// will now be accessible under the /api path.
app.use("/api", apiRoutes);

// Optional: Keep a simple root route for browser access, but use /api/health for programmatic checks

// Define a basic route for the root URL
// When you visit http://localhost:3001 in your browser, this message will be displayed.
app.get("/", (req, res) => {
  res.send(
    "Stock Market Monitor Backend is Root. Use /api/health for API check."
  );
  // NEW: Log an info message when this endpoint is accessed
  logger.info("Root endpoint accessed.");
});

// *** Initialize Socket.IO server
// It attaches to the HTTP server and also needs CORS configuration for WebSocket connections.
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // IMPORTANT: Match your React app's development server URL here too.
    methods: ["GET", "POST"], // Allow GET and POST methods for Socket.IO handshake
  },
});

//** Handle Socket.IO connections
io.on("connection", (socket) => {
  //   console.log(`A user connected: ${socket.id}`);
  logger.info(`A user connected: ${socket.id}`);
  // --- DEMO: Sending dummy live data ---
  // This is just a placeholder to show Socket.IO working.
  // In the future, this will come from your broker API.
  const sendDummyData = setInterval(() => {
    const symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const livePrice = (Math.random() * 100 + 100).toFixed(2); // Random price between 100 and 200
    socket.emit("liveStockUpdate", {
      symbol: randomSymbol,
      price: parseFloat(livePrice),
      timestamp: new Date().toISOString(),
    });
  }, 3000); // Emit new data every 3 seconds

  // Handle disconnection
  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);

    clearInterval(sendDummyData); // Stop sending dummy data when a user disconnects
  });
});

// ADD THIS ENTIRE SECTION: ERROR HANDLING MIDDLEWARE
// IMPORTANT: This must be placed AFTER all other routes and middleware
// to catch any errors that occur within them.
app.use(errorHandler);
// END ADDITION

//** Set the port for the server
// It tries to use the PORT environment variable (for production) or defaults to 3001.
const PORT = process.env.PORT || 3001;

//** Start the server and listen on the defined port
server.listen(PORT, async () => {
  //   console.log(`Backend server running on port ${PORT}`);
  logger.info(`Backend server running on port ${PORT}`);
  // --- NEW: Attempt to connect to the database ---
  await connectDb(); // Call the connectDb function
  // --- END NEW ---
  // await testDbInsert(); // CALL THE NEW TEST FUNCTION HERE
});

// NEW: Add a handler for server shutdown events to gracefully close the DB connection
process.on("SIGINT", async () => {
  // Handle Ctrl+C (SIGINT)
  logger.info("SIGINT signal received: Shutting down gracefully...");
  await closeDb(); // Close database connection
  server.close(() => {
    // Close HTTP server
    logger.info("HTTP server closed.");
    process.exit(0); // Exit process
  });
});

process.on("SIGTERM", async () => {
  // Handle termination signals (e.g., from process managers)
  logger.info("SIGTERM signal received: Shutting down gracefully...");
  await closeDb(); // Close database connection
  server.close(() => {
    // Close HTTP server
    logger.info("HTTP server closed.");
    process.exit(0); // Exit process
  });
});

// ADD THIS ENTIRE SECTION: Process-level error handlers
// Catch unhandled Promise rejections (e.g., async errors without .catch())
process.on("unhandledRejection", async (reason, promise) => {
  logger.error("Unhandled Rejection at:", {
    promise,
    reason: reason.stack || reason,
    message: reason.message || "No message provided",
  });
  // Optional: Log stack trace if available
  // Application state is unknown at this point, so gracefully shutdown
  // In production, consider a monitoring service to restart the process.
  logger.info(
    "Unhandled Rejection: Attempting graceful Shut down and exiting..."
  );
  try {
    // Attempt to close DB connection first
    await closeDb();

    // Attempt to close HTTP server gracefully
    server.close(() => {
      logger.info("HTTP server closed after unhandled rejection.");
      process.exit(1); // Exit with a failure code
    });

    // Add a timeout to force exit if server.close() hangs (e.g., due to open connections)
    // This unref() call ensures the timeout itself doesn't keep the event loop alive if nothing else is running.
    setTimeout(() => {
      logger.warn(
        "Server close timed out, forcing exit after unhandled rejection."
      );
      process.exit(1);
    }, 5000).unref(); // 5 seconds timeout
  } catch (dbError) {
    logger.error(
      "Error during DB/server close after unhandled rejection:",
      dbError
    );
    process.exit(1); // Exit even if graceful close fails
  }
});

// Catch uncaught synchronous exceptions (e.g., throw new Error without try/catch)
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  // Optional: Log stack trace if available
  // Application state is corrupted, so immediate shutdown is necessary.
  // In production, consider a monitoring service to restart the process.
  logger.info(
    "Uncaught Exception: Attempting graceful shutdown and exiting..."
  );
  try {
    // Attempt to close DB connection first
    await closeDb();

    // Attempt to close HTTP server gracefully
    server.close(() => {
      logger.info("HTTP server closed after uncaught exception.");
      process.exit(1); // Exit with a failure code
    });

    // Add a timeout to force exit if server.close() hangs
    setTimeout(() => {
      logger.warn(
        "Server close timed out, forcing exit after uncaught exception."
      );
      process.exit(1);
    }, 5000).unref(); // 5 seconds timeout
  } catch (dbError) {
    logger.error(
      "Error during DB/server close after uncaught exception:",
      dbError
    );
    process.exit(1); // Exit even if graceful close fails
  }
  // server.close(() => {
  //   closeDb(); // Ensure DB is closed
  //   process.exit(1); // Exit with a failure code
  // });
});
// END ADDITION

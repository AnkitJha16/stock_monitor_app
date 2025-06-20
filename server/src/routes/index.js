// server/src/routes/index.js

const express = require("express");
const router = express.Router();
// const winston = require("winston"); // Import Winston for logging in this module
const logger = require("../../utils/logger");
const dataRoutes = require("./dataRoutes"); // Import the new data routes

// Define a basic health check route
// When this router is mounted under /api, this route will be /api/health
router.get("/health", (req, res) => {
  res.status(200).send("API Health Check: OK");
  logger.info("Health check endpoint accessed.");
});

// ADD THIS ENTIRE SECTION: TEMPORARY TEST ERROR ROUTE
router.get("/test-error", (req, res, next) => {
  const errorType = req.query.type; // Get error type from query parameter, e.g., /test-error?type=sync

  try {
    switch (errorType) {
      case "sync":
        // 1. Test synchronous error (will be caught by Express errorHandler)
        throw new Error(
          "This is a synchronous error triggered by /test-error?type=sync"
        );
      case "async":
        // 2. Test asynchronous error (explicitly passed to next, caught by Express errorHandler)
        // Simulate an async operation that fails
        setTimeout(() => {
          next(
            new Error(
              "This is an async error passed to next() from /test-error?type=async"
            )
          );
        }, 100);
        break;
      case "unhandled-rejection":
        // 3. Test unhandled promise rejection (will be caught by process.on('unhandledRejection'))
        // DO NOT use await here, to ensure it's truly unhandled
        Promise.reject(
          new Error(
            "This is an UNHANDLED PROMISE REJECTION from /test-error?type=unhandled-rejection"
          )
        );
        res
          .status(200)
          .send(
            "Attempting to trigger unhandled rejection (check server logs and process exit)"
          );
        break;
      case "uncaught-exception":
        // 4. Test uncaught synchronous exception (will be caught by process.on('uncaughtException'))
        // This will crash the server immediately after logging.
        res
          .status(200)
          .send(
            "Attempting to trigger uncaught exception (server will crash, check logs!)"
          );
        setTimeout(() => {
          console.log(undefinedVariable); // This will cause an uncaught reference error
        }, 100);
        break;
      default:
        res.status(400).json({
          message:
            "Please specify an error type: sync, async, unhandled-rejection, or uncaught-exception.",
        });
        break;
    }
  } catch (error) {
    // For synchronous errors, pass them to the Express error handler

    next(error);
  }
});
// END ADDITION

// NEW: Route to fetch Fyers Instruments using Sequelize
// router.get("/instruments", async (req, res, next) => {
//   try {
//     // Access the FyersInstrument model via app.locals.db
//     const FyersInstrument = req.app.locals.db.FyersInstrument;

//     // Fetch all instruments from the fyers_instruments table
//     const instruments = await FyersInstrument.findAll();

//     logger.info("Successfully fetched Fyers instruments.", {
//       count: instruments.length,
//     });
//     res.status(200).json(instruments);
//   } catch (error) {
//     logger.error("Error fetching Fyers instruments:", error);
//     // Pass the error to the Express error handling middleware
//     next(error);
//   }
// });

// router.get("/instruments", async (req, res, next) => {
//   try {
//     const sequelize = req.app.locals.db.sequelize; // Access the raw sequelize instance

//     // Temporarily query a system table that MUST exist in any PostgreSQL database
//     const result = await sequelize.query("SELECT version();", {
//       type: sequelize.QueryTypes.SELECT,
//     });

//     // You can also try listing tables directly
//     // const result = await sequelize.query(
//     //   "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
//     //   { type: sequelize.QueryTypes.SELECT }
//     // );

//     logger.info("Successfully executed raw query:", result);
//     res.status(200).json({
//       message: "Raw query successful",
//       data: result,
//     });
//   } catch (error) {
//     logger.error("Error executing raw query:", error);
//     next(error);
//   }
// });

router.use("/data", dataRoutes);
logger.info("Data routes mounted under /api/data.");

module.exports = router;

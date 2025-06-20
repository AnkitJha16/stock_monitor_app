// server/src/controllers/lookupController.js

const logger = require("../../utils/logger"); // Import our central logger
const AppError = require("../../utils/appError"); // Import our custom error class

/**
 * Controller function to fetch all Fyers Exchanges from the database.
 * @param {object} req - The Express request object, including app.locals.db.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.getAllExchanges = async (req, res, next) => {
  try {
    const FyersExchange = req.app.locals.db.FyersExchange; // Access the FyersExchange model

    const exchanges = await FyersExchange.findAll(); // Fetch all records

    logger.info("Successfully fetched Fyers exchanges.", {
      count: exchanges.length,
    });

    res.status(200).json({
      status: "success",
      message: "Exchanges fetched successfully.",
      data: exchanges,
    });
  } catch (error) {
    logger.error("Error fetching Fyers exchanges:", error);
    next(new AppError("Failed to fetch exchanges.", 500));
  }
};

/**
 * Controller function to fetch all Fyers Segments from the database.
 * @param {object} req - The Express request object, including app.locals.db.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.getAllSegments = async (req, res, next) => {
  try {
    const FyersSegment = req.app.locals.db.FyersSegment; // Access the FyersSegment model

    const segments = await FyersSegment.findAll(); // Fetch all records

    logger.info("Successfully fetched Fyers segments.", {
      count: segments.length,
    });

    res.status(200).json({
      status: "success",
      message: "Segments fetched successfully.",
      data: segments,
    });
  } catch (error) {
    logger.error("Error fetching Fyers segments:", error);
    next(new AppError("Failed to fetch segments.", 500));
  }
};

/**
 * Controller function to fetch all Fyers Instrument Types from the database.
 * @param {object} req - The Express request object, including app.locals.db.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.getAllInstrumentTypes = async (req, res, next) => {
  try {
    const FyersInstrumentType = req.app.locals.db.FyersInstrumentType; // Access the FyersInstrumentType model

    const instrumentTypes = await FyersInstrumentType.findAll(); // Fetch all records

    logger.info("Successfully fetched Fyers instrument types.", {
      count: instrumentTypes.length,
    });

    res.status(200).json({
      status: "success",
      message: "Instrument types fetched successfully.",
      data: instrumentTypes,
    });
  } catch (error) {
    logger.error("Error fetching Fyers instrument types:", error);
    next(new AppError("Failed to fetch instrument types.", 500));
  }
};

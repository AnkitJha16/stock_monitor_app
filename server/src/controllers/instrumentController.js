// server/src/controllers/instrumentController.js

const logger = require("../../utils/logger"); // Import our central logger
const AppError = require("../../utils/appError"); // Import our custom error class
const { Op } = require("sequelize"); // Import Sequelize Operators for complex queries

/**
 * Controller function to fetch Fyers instruments.
 * This version fetches all instruments with enhanced
 * filtering, searching, pagination, and eager loading of related lookup data.
 *
 * @param {object} req - The Express request object, including app.locals.db.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.getAllInstruments = async (req, res, next) => {
  try {
    // Access all necessary models from app.locals.db
    const {
      FyersInstrument,
      FyersExchange,
      FyersSegment,
      FyersInstrumentType,
    } = req.app.locals.db;

    // Extract query parameters for filtering and searching
    const {
      search, // General search term for symbol, exchange symbol, or details
      exchange_code, // Filter by exchange code (e.g., "10" for NSE)
      segment_code, // Filter by segment code (e.g., "10" for Capital Market)
      instrument_type_code, // Filter by instrument type code
      page = 1, // Current page number, default to 1
      limit = 50, // Number of items per page, default to 50
      sortBy = "symTicker", // Field to sort by, default to symTicker (camelCase property name)
      sortOrder = "ASC", // Sort order (ASC or DESC), default to ASC
    } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    // Basic validation for pagination parameters
    if (isNaN(parsedPage) || parsedPage < 1) {
      return next(
        new AppError("Invalid page number. Must be a positive integer.", 400)
      );
    }
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return next(
        new AppError("Invalid limit. Must be a positive integer.", 400)
      );
    }

    const offset = (parsedPage - 1) * parsedLimit; // Calculate offset for pagination

    const whereClause = {}; // Object to build our WHERE clause for Sequelize

    // 1. Implement search functionality (using 'fullDescription' and other relevant fields)
    if (search) {
      whereClause[Op.or] = [
        { symTicker: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for symbol ticker
        { exSymbol: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for exchange symbol
        { exSymName: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for exchange symbol name
        { fullDescription: { [Op.iLike]: `%${search}%` } }, // Search in consolidated description
        { exchangeName: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for exchange name
        // No need to search in segmentName/instrumentTypeDetails directly here, as we filter by codes
      ];
    }

    // 2. Implement filtering by specific parameters (using exact matches for codes)
    if (exchange_code) {
      whereClause.exchangeId = parseInt(exchange_code); // Use exchangeId as per model
    }
    if (segment_code) {
      whereClause.segmentId = parseInt(segment_code); // Use segmentId as per model
    }
    if (instrument_type_code) {
      whereClause.exInstType = parseInt(instrument_type_code); // Use exInstType as per model
    }

    // 3. Implement sorting
    const orderClause = [];
    // Validate sortBy field to prevent SQL injection and ensure it's a valid column
    const validSortFields = [
      "symTicker",
      "exchangeName",
      "createdAt",
      "updatedAt",
      "strikePrice",
      "expiryDate",
      "previousClose",
      "minLotSize", // Added relevant fields
      "tickSize",
      "upperPrice",
      "lowerPrice",
      "faceValue",
    ];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
      orderClause.push([sortBy, order]);
    } else if (sortBy) {
      logger.warn(
        `Invalid sortBy field provided: "${sortBy}". Defaulting to 'symTicker' ASC.`
      );
      orderClause.push(["symTicker", "ASC"]); // Default sort if invalid field is provided
    } else {
      orderClause.push(["symTicker", "ASC"]); // Default sort if no sortBy is provided
    }

    // Fetch instruments from the database with applied filters, search, and pagination
    const { count, rows: instruments } = await FyersInstrument.findAndCountAll({
      where: whereClause, // Apply the constructed WHERE clause
      limit: parsedLimit, // Apply pagination limit
      offset: offset, // Apply pagination offset
      order: orderClause, // Apply sorting
      include: [
        // Eager load associated lookup data
        {
          model: FyersExchange,
          as: "exchangeDetails", // Use the 'as' alias defined in models/index.js
          attributes: ["id", "name", "fullName"], // Select specific fields to include
        },
        {
          model: FyersSegment,
          as: "segmentDetails", // Use the 'as' alias defined in models/index.js
          attributes: ["id", "name"],
        },
        {
          model: FyersInstrumentType,
          as: "instrumentTypeDetails", // Use the 'as' alias defined in models/index.js
          attributes: ["id", "name"], // id here is ex_inst_type
          // NEW: Explicitly define the foreignKey for composite key in include
          foreignKey: ["exInstType", "segmentId"],
        },
      ],
    });

    logger.info(
      "Successfully fetched Fyers instruments with filters, search, and pagination.",
      {
        fetchedCount: instruments.length, // Renamed for clarity
        totalRecords: count,
        page: parsedPage,
        limit: parsedLimit,
        search: search || "N/A", // Log 'N/A' if not provided
        exchange_code: exchange_code || "N/A",
        segment_code: segment_code || "N/A",
        instrument_type_code: instrument_type_code || "N/A",
        sortBy: sortBy,
        sortOrder: sortOrder,
      }
    );

    res.status(200).json({
      status: "success",
      message: "Fyers instruments fetched successfully.",
      totalRecords: count, // Total number of records matching the criteria
      currentPage: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      data: instruments,
    });
  } catch (error) {
    logger.error("Error fetching all Fyers instruments:", error); // Log stack trace
    next(new AppError("Failed to fetch instruments.", 500));
  }
};

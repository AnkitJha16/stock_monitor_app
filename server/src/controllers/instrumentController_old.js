// server/src/controllers/instrumentController.js

const logger = require("../../utils/logger"); // Import our central logger
const AppError = require("../../utils/appError"); // Import our custom error class
const { Op } = require("sequelize"); // Import Sequelize Operators for complex queries

/**
 * Controller function to fetch Fyers instruments.
 * This version fetches all instruments. It will be enhanced later for
 * filtering, searching, and pagination.
 *
 * @param {object} req - The Express request object, including app.locals.db.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
exports.getAllInstruments = async (req, res, next) => {
  try {
    const FyersInstrument = req.app.locals.db.FyersInstrument; // Access the FyersInstrument model

    // Extract query parameters for filtering and searching
    const {
      search, // General search term for symbol, exchange symbol, or details
      exchange_code, // Filter by exchange code (e.g., "10" for NSE)
      segment_code, // Filter by segment code (e.g., "10" for Capital Market)
      instrument_type_code, // Filter by instrument type code
      page = 1, // Current page number, default to 1
      limit = 50, // Number of items per page, default to 50
      sortBy = "sym_ticker", // Field to sort by, default to sym_ticker
      sortOrder = "ASC", // Sort order (ASC or DESC), default to ASC
    } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit; // Calculate offset for pagination

    const whereClause = {}; // Object to build our WHERE clause for Sequelize

    // 1. Implement search functionality
    if (search) {
      // Use Sequelize's Op.or to search across multiple string fields case-insensitively
      whereClause[Op.or] = [
        { sym_ticker: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for symbol ticker
        { ex_symbol: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for exchange symbol
        { sym_details: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for symbol details
        { symbol_desc: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for symbol description
        { exchange_name: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search for exchange name
      ];
    }

    // 2. Implement filtering by specific parameters (using exact matches for codes)
    if (exchange_code) {
      // Ensure the exchange_code from query matches the 'exchange' column (INTEGER type)
      whereClause.exchange = parseInt(exchange_code);
    }
    if (segment_code) {
      // Ensure the segment_code from query matches the 'segment' column (INTEGER type)
      whereClause.segment = parseInt(segment_code);
    }
    if (instrument_type_code) {
      // Ensure the instrument_type_code from query matches the 'ex_inst_type' column (INTEGER type)
      whereClause.ex_inst_type = parseInt(instrument_type_code);
    }

    // 3. Implement sorting
    const orderClause = [];
    // Validate sortBy field to prevent SQL injection and ensure it's a valid column
    const validSortFields = [
      "sym_ticker",
      "exchange_name",
      "created_at",
      "updated_at",
      "strike_price",
      "expiry_date",
      "previous_close",
      // Add other relevant columns for sorting as needed
    ];
    if (sortBy && validSortFields.includes(sortBy)) {
      const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
      orderClause.push([sortBy, order]);
    } else if (sortBy) {
      logger.warn(
        `Invalid sortBy field provided: "${sortBy}". Defaulting to 'sym_ticker' ASC.`
      );
      orderClause.push(["sym_ticker", "ASC"]); // Default sort if invalid field is provided
    } else {
      orderClause.push(["sym_ticker", "ASC"]); // Default sort if no sortBy is provided
    }

    // Fetch instruments from the database with applied filters, search, and pagination
    const { count, rows: instruments } = await FyersInstrument.findAndCountAll({
      where: whereClause, // Apply the constructed WHERE clause
      limit: parsedLimit, // Apply pagination limit
      offset: offset, // Apply pagination offset
      order: orderClause, // Apply sorting
    });

    logger.info(
      "Successfully fetched Fyers instruments with filters, search, and pagination.",
      {
        count: instruments.length,
        totalRecords: count,
        page: parsedPage,
        limit: parsedLimit,
        search: search,
        exchange_code: exchange_code,
        segment_code: segment_code,
        instrument_type_code: instrument_type_code,
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

    //  -----------OLD CODE  -----------No filters, search, or pagination applied.
    // const instruments = await FyersInstrument.findAll();

    // logger.info("Successfully fetched all Fyers instruments.", {
    //   count: instruments.length,
    // });

    // res.status(200).json({
    //   status: "success",
    //   message: "Fyers instruments fetched successfully.",
    //   data: instruments,
    // });
  } catch (error) {
    logger.error("Error fetching all Fyers instruments:", error);
    next(new AppError("Failed to fetch instruments.", 500));
  }
};

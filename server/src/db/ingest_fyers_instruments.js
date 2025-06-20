// server/src/db/ingestFyersInstruments.js

require("dotenv").config(); // Load environment variables
const path = require("path");
const fs = require("fs/promises"); // Use fs/promises for async operations
const { pool } = require("../config/db"); // Import the database pool
const logger = require("../../utils/logger"); // Import the logger

// Helper to safely parse floating point numbers
const safeParseFloat = (val) => {
  if (
    val === null ||
    val === undefined ||
    val === "" ||
    isNaN(parseFloat(val))
  ) {
    return null;
  }
  return parseFloat(val);
};

// Helper to safely parse integers
const safeParseInt = (val) => {
  if (val === null || val === undefined || val === "" || isNaN(parseInt(val))) {
    return null;
  }
  return parseInt(val);
};

// Helper to safely parse BigInt values (e.g., for Unix timestamps or large quantities)
const safeParseBigInt = (val) => {
  if (val === null || val === undefined || val === "") {
    return null;
  }
  try {
    // Attempt to parse as BigInt, handling potential string input
    return BigInt(val);
  } catch (e) {
    logger.warn(
      `Failed to parse BigInt for value: ${val}. Error: ${e.message}`
    );
    return null;
  }
};

// Helper to parse date strings (YYYY-MM-DD) or Unix timestamps (seconds) to YYYY-MM-DD
const parseDateForDb = (dateInput) => {
  if (dateInput === null || dateInput === undefined) {
    return null;
  }

  const trimmedInput = String(dateInput).trim();

  // More robust check for 'none' or 'null' strings, case-insensitive
  if (trimmedInput === "" || /^(none|null)$/i.test(trimmedInput)) {
    return null;
  }

  // Check if it's a numeric Unix timestamp (e.g., "1750154400")
  if (!isNaN(trimmedInput) && !isNaN(parseFloat(trimmedInput))) {
    const timestampMs = parseFloat(trimmedInput) * 1000; // Convert seconds to milliseconds
    const date = new Date(timestampMs);
    if (isNaN(date.getTime())) {
      return null; // Invalid date after parsing timestamp
    }
    return date.toISOString().split("T")[0]; // Return in YYYY-MM-DD format for DATE type
  }

  // Assume it's already in YYYY-MM-DD or a format convertible by PG DATE
  return trimmedInput;
};

async function ingestFyersInstruments() {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN"); // Start a transaction

    const dataDir = path.join(__dirname, "..", "..", "data"); // Path to server/data
    logger.info(
      `Starting ingestion of Fyers instruments from JSON files in: ${dataDir}`
    );

    const dataDirExists = await fs
      .access(dataDir)
      .then(() => true)
      .catch(() => false);

    if (!dataDirExists) {
      logger.error(
        `Data directory not found at: ${dataDir}. Please ensure your JSON files are in this directory.`
      );
      await client.query("ROLLBACK");
      return;
    }

    const files = await fs.readdir(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    if (jsonFiles.length === 0) {
      logger.warn(
        "No JSON files found in the data directory to ingest. Please ensure they are present."
      );
      await client.query("ROLLBACK");
      return;
    }

    let allInstruments = [];
    const segmentCounts = {}; // To log distribution

    for (const fileName of jsonFiles) {
      const filePath = path.join(dataDir, fileName);
      logger.info(`Reading and parsing: ${filePath}`);
      try {
        const fileContent = await fs.readFile(filePath, "utf8");
        const instrumentsFromFile = JSON.parse(fileContent);

        if (
          typeof instrumentsFromFile === "object" &&
          instrumentsFromFile !== null
        ) {
          const instrumentsArray = Object.values(instrumentsFromFile);
          for (const instrument of instrumentsArray) {
            // Increment segment count for the parsed instrument
            const segment = safeParseInt(instrument.segment);
            if (segment !== null) {
              // Only count if segment is a valid number
              segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
            }
            allInstruments.push(instrument); // Collect all instruments; DB ON CONFLICT will handle uniqueness
          }
        } else {
          logger.warn(
            `JSON file ${fileName} does not contain an object at its root. Skipping this file.`
          );
        }
      } catch (parseError) {
        logger.error(
          `Error parsing JSON file ${fileName}:`,
          parseError.message
        );
      }
    }

    logger.info(
      `Finished reading all JSON files. Total instruments parsed: ${allInstruments.length}.`
    );
    logger.info(
      `Parsed instrument segment distribution (before DB insert): ${JSON.stringify(
        segmentCounts
      )}`
    );

    if (allInstruments.length === 0) {
      logger.warn(
        "No valid instruments found across all JSON files to ingest."
      );
      await client.query("ROLLBACK");
      return;
    }

    // Clear existing data before inserting new data for a full refresh migration
    logger.info(
      "Truncating Fyers_instruments table... This will also restart the ID sequence."
    );
    await client.query(
      "TRUNCATE TABLE Fyers_instruments RESTART IDENTITY CASCADE;"
    );
    logger.info("Fyers_instruments table truncated.");

    // Prepare for batch insert
    // Ensure the order of columns matches the VALUES array precisely.
    const insertQuery = `
            INSERT INTO Fyers_instruments (
                sym_ticker, fy_token, ex_token, ex_symbol, ex_sym_name,
                exchange_id, exchange_name, segment_id, ex_inst_type, trade_status,
                currency_code, last_update, under_sym, under_fy_tok, ex_series,
                opt_type, expiry_date, strike_price, min_lot_size, tick_size,
                upper_price, lower_price, face_value, qty_multiplier, qty_freeze,
                previous_close, previous_oi, is_mtf_tradable, mtf_margin, isin,
                trading_session, asm_gsm_val, stream, cautionary_msg, product_code,
                full_description, short_name, display_name_mobile
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                      $31, $32, $33, $34, $35, $36, $37, $38)
            ON CONFLICT (sym_ticker) DO UPDATE SET
                fy_token = EXCLUDED.fy_token,
                ex_token = EXCLUDED.ex_token,
                ex_symbol = EXCLUDED.ex_symbol,
                ex_sym_name = EXCLUDED.ex_sym_name,
                exchange_id = EXCLUDED.exchange_id,
                exchange_name = EXCLUDED.exchange_name,
                segment_id = EXCLUDED.segment_id,
                ex_inst_type = EXCLUDED.ex_inst_type,
                trade_status = EXCLUDED.trade_status,
                currency_code = EXCLUDED.currency_code,
                last_update = EXCLUDED.last_update,
                under_sym = EXCLUDED.under_sym,
                under_fy_tok = EXCLUDED.under_fy_tok,
                ex_series = EXCLUDED.ex_series,
                opt_type = EXCLUDED.opt_type,
                expiry_date = EXCLUDED.expiry_date,
                strike_price = EXCLUDED.strike_price,
                min_lot_size = EXCLUDED.min_lot_size,
                tick_size = EXCLUDED.tick_size,
                upper_price = EXCLUDED.upper_price,
                lower_price = EXCLUDED.lower_price,
                face_value = EXCLUDED.face_value,
                qty_multiplier = EXCLUDED.qty_multiplier,
                qty_freeze = EXCLUDED.qty_freeze,
                previous_close = EXCLUDED.previous_close,
                previous_oi = EXCLUDED.previous_oi,
                is_mtf_tradable = EXCLUDED.is_mtf_tradable,
                mtf_margin = EXCLUDED.mtf_margin,
                isin = EXCLUDED.isin,
                trading_session = EXCLUDED.trading_session,
                asm_gsm_val = EXCLUDED.asm_gsm_val,
                stream = EXCLUDED.stream,
                cautionary_msg = EXCLUDED.cautionary_msg,
                product_code = EXCLUDED.product_code,
                full_description = EXCLUDED.full_description,
                short_name = EXCLUDED.short_name,
                display_name_mobile = EXCLUDED.display_name_mobile,
                updated_at = CURRENT_TIMESTAMP;
        `;

    logger.info(
      `Starting batch insert of ${allInstruments.length} instruments...`
    );
    let upsertedCount = 0; // Tracks both inserts and updates
    let errorCount = 0;

    for (const instrument of allInstruments) {
      try {
        // Prepare values, ensuring correct types and handling nulls
        const values = [
          instrument.symTicker, // The primary identifier for UPSERT
          instrument.fyToken,
          safeParseBigInt(instrument.exToken), // Use BigInt for exToken if it can be very large
          instrument.exSymbol || null,
          instrument.exSymName || null,
          safeParseInt(instrument.exchange),
          instrument.exchangeName || null,
          safeParseInt(instrument.segment),
          safeParseInt(instrument.exInstType),
          instrument.tradeStatus === 1, // Convert to boolean
          instrument.currencyCode || null,
          parseDateForDb(instrument.lastUpdate),
          instrument.underSym || null,
          instrument.underFyTok || null,
          instrument.exSeries || null,
          instrument.optType === "XX" || instrument.optType === ""
            ? null
            : instrument.optType,
          safeParseBigInt(instrument.expiryDate), // Unix timestamp stored as BigInt
          instrument.strikePrice === -1.0
            ? null
            : safeParseFloat(instrument.strikePrice),
          safeParseInt(instrument.minLotSize),
          safeParseFloat(instrument.tickSize),
          safeParseFloat(instrument.upperPrice),
          safeParseFloat(instrument.lowerPrice),
          safeParseFloat(instrument.faceValue),
          safeParseFloat(instrument.qtyMultiplier),
          safeParseBigInt(instrument.qtyFreeze), // Convert string number to BigInt
          safeParseFloat(instrument.previousClose),
          safeParseFloat(instrument.previousOi),
          typeof instrument.is_mtf_tradable === "number"
            ? instrument.is_mtf_tradable === 1
            : null, // Convert to boolean
          safeParseFloat(instrument.mtf_margin),
          instrument.isin === "" || instrument.isin === "NA"
            ? null
            : instrument.isin, // Handle empty/NA ISIN to null
          instrument.tradingSession || null,
          instrument.asmGsmVal || null,
          instrument.stream || null,
          instrument.cautionary_msg || null,
          instrument.productCode || null, // Ensure productCode is included
          instrument.symbolDetails ||
            instrument.symDetails ||
            instrument.symbolDesc ||
            null, // Consolidated full_description
          instrument.short_name || null,
          instrument.display_format_mob || null,
        ];

        await client.query(insertQuery, values);
        upsertedCount++;
      } catch (insertError) {
        errorCount++;
        logger.error(
          `Error upserting instrument ${
            instrument.symTicker || instrument.fyToken || "unknown"
          }: ${insertError.message}`
        );
        // Consider adding more detailed logging for specific instrument causing issues
      }
    }
    logger.info(
      `Batch insert completed. Successfully inserted/updated ${upsertedCount} instruments. Failed: ${errorCount} instruments.`
    );

    await client.query("COMMIT");
    logger.info("Fyers instruments ingestion completed successfully!");
  } catch (error) {
    logger.error("Error during Fyers instruments ingestion:", error.message);
    if (client) {
      await client.query("ROLLBACK");
      logger.error("Transaction rolled back due to error.");
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Run the ingestion function
if (require.main === module) {
  ingestFyersInstruments().catch((err) => {
    logger.error("Unhandled error during ingestion script execution:", err);
    process.exit(1);
  });
}

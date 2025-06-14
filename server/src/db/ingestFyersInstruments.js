// server/src/db/ingestFyersInstruments.js

require("dotenv").config(); // Load environment variables
const path = require("path");
const fs = require("fs/promises"); // Use fs/promises for async operations
const { pool } = require("../config/db"); // Import the database pool
const logger = require("../../utils/logger"); // Import the logger

// Helper to safely parse numbers, converting NaN or invalid/empty inputs to null
const safeParseFloat = (val) => {
  if (val === null || val === undefined || val === "") {
    return null;
  }
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

const safeParseInt = (val) => {
  if (val === null || val === undefined || val === "") {
    return null;
  }
  const parsed = parseInt(val);
  return isNaN(parsed) ? null : parsed;
};

// Helper to safely parse date strings, converting '', null, undefined, 'None', or ' ' to null
const parseDateValue = (dateStr) => {
  if (dateStr === null || dateStr === undefined) {
    return null;
  }
  const trimmedDateStr = String(dateStr).trim(); // Trim whitespace
  if (trimmedDateStr === "" || trimmedDateStr.toLowerCase() === "none") {
    return null;
  }
  // If it's not any of the above, assume it's a valid date string (e.g., "YYYY-MM-DD")
  return trimmedDateStr; // Return the trimmed string for potential date parsing
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

    // Check if the data directory exists
    const dataDirExists = await fs
      .access(dataDir)
      .then(() => true)
      .catch(() => false);

    if (!dataDirExists) {
      logger.error(
        `Data directory not found at: ${dataDir}. Please ensure you have run downloadInstruments.js first.`
      );
      await client.query("ROLLBACK"); // Rollback transaction if directory not found
      return;
    }

    const files = await fs.readdir(dataDir); // Read all files in the directory
    const jsonFiles = files.filter((file) => file.endsWith(".json")); // Filter for JSON files

    if (jsonFiles.length === 0) {
      logger.warn(
        "No JSON files found in the data directory to ingest. Please ensure downloadInstruments.js created them."
      );
      await client.query("ROLLBACK");
      return;
    }

    let allInstruments = [];
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
          allInstruments = allInstruments.concat(
            Object.values(instrumentsFromFile)
          );
        } else {
          logger.warn(
            `JSON file ${fileName} does not contain an object or array at its root. Skipping this file.`
          );
        }
      } catch (parseError) {
        logger.error(`Error parsing JSON file ${fileName}:`, parseError);
        // Continue to the next file even if one fails to parse
      }
    }

    if (allInstruments.length === 0) {
      logger.warn(
        "No valid instruments found across all JSON files to ingest."
      );
      await client.query("ROLLBACK");
      return;
    }

    logger.info(
      `Finished reading all JSON files. Total instruments parsed: ${allInstruments.length}.`
    );

    // Clear existing data before inserting new data (optional, but good for re-runs)
    logger.info(
      "Truncating fyers_instruments table... This will also restart the ID sequence."
    );
    await client.query(
      "TRUNCATE TABLE fyers_instruments RESTART IDENTITY CASCADE;"
    );
    logger.info("fyers_instruments table truncated.");

    // Prepare for batch insert
    const insertQuery = `
            INSERT INTO fyers_instruments (
                fy_token, sym_ticker, ex_token, ex_symbol, ex_sym_name, sym_details,
                symbol_desc, exchange_name, currency_code, exchange, segment,
                ex_series, ex_inst_type, trade_status, trading_session, last_update,
                is_mtf_tradable, under_sym, under_fy_tok, expiry_date, original_exp_date,
                opt_type, strike_price, min_lot_size, qty_multiplier, qty_freeze,
                tick_size, upper_price, lower_price, face_value, previous_close,
                previous_oi, isin, asm_gsm_val, stream, cautionary_msg,
                symbol_details, mpp_flag, leverage, mtf_margin
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                      $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40)
            ON CONFLICT (fy_token) DO UPDATE SET
                sym_ticker = EXCLUDED.sym_ticker,
                ex_token = EXCLUDED.ex_token,
                ex_symbol = EXCLUDED.ex_symbol,
                ex_sym_name = EXCLUDED.ex_sym_name,
                sym_details = EXCLUDED.sym_details,
                symbol_desc = EXCLUDED.symbol_desc,
                exchange_name = EXCLUDED.exchange_name,
                currency_code = EXCLUDED.currency_code,
                exchange = EXCLUDED.exchange,
                segment = EXCLUDED.segment,
                ex_series = EXCLUDED.ex_series,
                ex_inst_type = EXCLUDED.ex_inst_type,
                trade_status = EXCLUDED.trade_status,
                trading_session = EXCLUDED.trading_session,
                last_update = EXCLUDED.last_update,
                is_mtf_tradable = EXCLUDED.is_mtf_tradable,
                under_sym = EXCLUDED.under_sym,
                under_fy_tok = EXCLUDED.under_fy_tok,
                expiry_date = EXCLUDED.expiry_date,
                original_exp_date = EXCLUDED.original_exp_date,
                opt_type = EXCLUDED.opt_type,
                strike_price = EXCLUDED.strike_price,
                min_lot_size = EXCLUDED.min_lot_size,
                qty_multiplier = EXCLUDED.qty_multiplier,
                qty_freeze = EXCLUDED.qty_freeze,
                tick_size = EXCLUDED.tick_size,
                upper_price = EXCLUDED.upper_price,
                lower_price = EXCLUDED.lower_price,
                face_value = EXCLUDED.face_value,
                previous_close = EXCLUDED.previous_close,
                previous_oi = EXCLUDED.previous_oi,
                isin = EXCLUDED.isin,
                asm_gsm_val = EXCLUDED.asm_gsm_val,
                stream = EXCLUDED.stream,
                cautionary_msg = EXCLUDED.cautionary_msg,
                symbol_details = EXCLUDED.symbol_details,
                mpp_flag = EXCLUDED.mpp_flag,
                leverage = EXCLUDED.leverage,
                mtf_margin = EXCLUDED.mtf_margin,
                updated_at = CURRENT_TIMESTAMP;
        `;

    logger.info(
      `Starting batch insert of ${allInstruments.length} instruments...`
    );
    let insertedCount = 0;
    for (const instrument of allInstruments) {
      try {
        await client.query(insertQuery, [
          // Ensure the order here EXACTLY matches the INSERT statement columns
          instrument.fyToken,
          instrument.symTicker,
          safeParseInt(instrument.exToken),
          instrument.exSymbol,
          instrument.exSymName,
          instrument.symDetails,
          instrument.symbolDesc,
          instrument.exchangeName,
          instrument.currencyCode,
          safeParseInt(instrument.exchange),
          safeParseInt(instrument.segment),
          instrument.exSeries,
          safeParseInt(instrument.exInstType),
          safeParseInt(instrument.tradeStatus),
          instrument.tradingSession,
          parseDateValue(instrument.lastUpdate), // Corrected here
          safeParseInt(instrument.is_mtf_tradable),
          instrument.underSym,
          instrument.underFyTok,
          parseDateValue(instrument.expiryDate), // Corrected here
          parseDateValue(instrument.originalExpDate), // Corrected here
          instrument.optType,
          safeParseFloat(instrument.strikePrice),
          safeParseInt(instrument.minLotSize),
          safeParseFloat(instrument.qtyMultiplier),
          instrument.qtyFreeze,
          safeParseFloat(instrument.tickSize),
          safeParseFloat(instrument.upperPrice),
          safeParseFloat(instrument.lowerPrice),
          safeParseFloat(instrument.faceValue),
          safeParseFloat(instrument.previousClose),
          safeParseFloat(instrument.previousOi),
          instrument.isin,
          instrument.asmGsmVal,
          instrument.stream,
          instrument.cautionary_msg,
          instrument.symbolDetails,
          safeParseInt(instrument.mpp_flag),
          safeParseFloat(instrument.leverage),
          safeParseFloat(instrument.mtf_margin),
        ]);
        insertedCount++;
      } catch (insertError) {
        logger.error(
          `Error inserting instrument ${instrument.fyToken || "unknown"}:`,
          insertError
        );
      }
    }
    logger.info(
      `Batch insert completed. Successfully inserted/updated ${insertedCount} instruments.`
    );

    await client.query("COMMIT");
    logger.info("Fyers instruments ingestion completed successfully!");
  } catch (error) {
    logger.error("Error during Fyers instruments ingestion:", error);
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
  ingestFyersInstruments();
}

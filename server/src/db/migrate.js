// server/src/db/migrate.js
require("dotenv").config();
const { pool } = require("../config/db"); // Assuming db.js exports the pg pool
const logger = require("../../utils/logger"); // Assuming logger.js is at ../../utils/logger

async function runMigrations() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Start transaction

    logger.info("Starting database migrations...");

    // --- DDL Statements (Table Creation) ---

    // 1. Create fyers_instruments table
    await client.query(`
          CREATE TABLE IF NOT EXISTS fyers_instruments (
        id SERIAL PRIMARY KEY,                  -- Auto-incrementing ID for the record
        fy_token TEXT NOT NULL UNIQUE,          -- Unique token for the security from Fyers (e.g., "12100000001")
        sym_ticker TEXT NOT NULL UNIQUE,        -- Unique string to identify the security (e.g., "BSE:SENSEX-INDEX")

        ex_token INTEGER NOT NULL,              -- Exchange token (e.g., 1)
        ex_symbol TEXT,                         -- Exchange symbol (e.g., "SENSEX")
        ex_sym_name TEXT,                       -- Symbol name (e.g., "S&P BSE PSU-INDEX")
        sym_details TEXT,                       -- Full name of the security / instrument description (e.g., "INDEX")
        symbol_desc TEXT,                       -- Full name of the security (from JSON sample, e.g., "INDEX")
        exchange_name TEXT,                     -- Exchange Name (e.g., "BSE")
        currency_code TEXT,                     -- Currency code (e.g., "INR")

        exchange INTEGER NOT NULL,              -- Exchange ID (e.g., 12 for BSE)
        segment INTEGER NOT NULL,               -- Segment ID (e.g., 10 for Capital Market)
        ex_series TEXT,                         -- Series of the security (CM segments only) (e.g., "XX", "EQ")
        ex_inst_type INTEGER,                   -- Instrument Type ID (e.g., 10 for INDEX, 0 for EQUITY)

        trade_status INTEGER NOT NULL,          -- Flag: 0 = Inactive, 1 = Active
        trading_session TEXT,                   -- Trading session provided in IST (e.g., "0915-1530|1815-1915:")
        last_update DATE,                       -- Date of last update in YYYY-MM-DD format (e.g., "2025-06-05")
        is_mtf_tradable INTEGER,                -- 0: Not MTF tradable. 1: MTF tradable.

        under_sym TEXT,                         -- Name of underlying symbol (e.g., "SENSEX")
        under_fy_tok TEXT,                      -- Unique token for the underlying symbol
        expiry_date DATE,                       -- Date of expiry for derivative contracts (e.g., "", "2023-12-28")
        original_exp_date DATE,                 -- Original Expiry Date (from JSON sample, often null)
        opt_type TEXT,                          -- CE/PE for options, XX for others
        strike_price NUMERIC,                   -- Strike price for options (e.g., -1.0)
        min_lot_size INTEGER,                   -- Minimum quantity multiplier (e.g., 0, 1)
        qty_multiplier NUMERIC,                 -- Quantity Multiplier (e.g., 1.0)
        qty_freeze TEXT,                        -- Freeze quantity (can be empty string)

        tick_size NUMERIC,                      -- Minimum price multiplier (e.g., 0.01)
        upper_price NUMERIC,                    -- Upper circuit price
        lower_price NUMERIC,                    -- Lower circuit price
        face_value NUMERIC,
        previous_close NUMERIC,
        previous_oi NUMERIC,                    -- Previous Open Interest value

        isin TEXT,                              -- ISIN code for the security
        asm_gsm_val TEXT,                       -- Surveillance Indicator message
        stream TEXT,                            -- Stream Group
        cautionary_msg TEXT,                    -- Cautionary message
        symbol_details TEXT,                    -- Secondary symbol details string (from JSON sample, e.g., "SENSEX-INDEX")
        mpp_flag INTEGER,                       -- Miscellaneous flag (from JSON sample)
        leverage NUMERIC,                       -- Leverage for MTF (present in NSE sample)
        mtf_margin NUMERIC,                     -- Margin multiplier for MTF (present in both samples)

        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
        `);
    logger.info("Table fyers_instruments created or already exists.");

    // 2. Create fyers_exchanges table
    await client.query(`
            CREATE TABLE IF NOT EXISTS fyers_exchanges (
                id INTEGER PRIMARY KEY,         -- Fyers Exchange Code (e.g., 10, 11, 12)
                name TEXT NOT NULL UNIQUE,      -- Exchange Name (e.g., 'NSE', 'MCX', 'BSE')
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    logger.info("Table fyers_exchanges created or already exists.");

    // 3. Create fyers_segments table
    await client.query(`
            CREATE TABLE IF NOT EXISTS fyers_segments (
                id INTEGER PRIMARY KEY,         -- Fyers Segment Code (e.g., 10, 11, 12, 20)
                name TEXT NOT NULL UNIQUE,      -- Segment Name (e.g., 'Capital Market', 'Equity Derivatives')
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    logger.info("Table fyers_segments created or already exists.");

    // 4. Create fyers_instrument_types table
    await client.query(`
            CREATE TABLE IF NOT EXISTS fyers_instrument_types (
                id INTEGER PRIMARY KEY,         -- Fyers Instrument Type Code (e.g., 0, 11, 14, 30)
                description TEXT NOT NULL UNIQUE, -- Description of the instrument type (e.g., 'EQ', 'FUTIDX', 'OPTIDX')
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    logger.info("Table fyers_instrument_types created or already exists.");

    // --- DML Statements (Initial Data Population for Lookup Tables) ---

    // 1. Populate fyers_exchanges
    await client.query(`
            INSERT INTO fyers_exchanges (id, name) VALUES
            (10, 'NSE'),
            (11, 'MCX'),
            (12, 'BSE')
            ON CONFLICT (id) DO NOTHING;
        `);
    logger.info("Data populated for fyers_exchanges.");

    // 2. Populate fyers_segments
    await client.query(`
            INSERT INTO fyers_segments (id, name) VALUES
            (10, 'Capital Market'),
            (11, 'Equity Derivatives'),
            (12, 'Currency Derivatives'),
            (20, 'Commodity Derivatives')
            ON CONFLICT (id) DO NOTHING;
        `);
    logger.info("Data populated for fyers_segments.");

    // 3. Populate fyers_instrument_types
    await client.query(`
            INSERT INTO fyers_instrument_types (id, description) VALUES
(0, 'EQ (EQUITY)'), (1, 'PREFSHARES'), (2, 'DEBENTURES'), (3, 'WARRANTS'), (4, 'MISC (NSE, BSE)'),
(5, 'SGB'), (6, 'G - Secs'), (7, 'T - Bills'), (8, 'MF'), (9, 'ETF'), (10, 'INDEX'),
(50, 'MISC (BSE)'), (11, 'FUTIDX'), (12, 'FUTIVX'), (13, 'FUTSTK'), (14, 'OPTIDX'),
(15, 'OPTSTK'), (16, 'FUTCUR'), (17, 'FUTIRT'), (18, 'FUTIRC'), (19, 'OPTCUR'),
(20, 'UNDCUR'), (21, 'UNDIRC'), (22, 'UNDIRT'), (23, 'UNDIRD'), (24, 'INDEX_CD'),
(25, 'FUTIRD'), (30, 'FUTCOM'), (31, 'OPTFUT'), (32, 'OPTCOM'), (33, 'FUTBAS'),
(34, 'FUTBLN'), (35, 'FUTENR'), (36, 'OPTBLN'), (37, 'OPTFUT (NCOM)')
ON CONFLICT (id) DO NOTHING;
        `);
    logger.info("Data populated for fyers_instrument_types.");

    await client.query("COMMIT"); // Commit transaction
    logger.info("Database migrations completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    logger.error("Database migration failed:", error.message);
    throw error; // Re-throw the error for external handling
  } finally {
    client.release(); // Release the client back to the pool
  }
}

// Execute the migration function
runMigrations().catch((err) => {
  logger.error("Unhandled error during migration script execution:", err);
  process.exit(1); // Exit with a non-zero code to indicate failure
});

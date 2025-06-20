// server/src/db/migrate.js
require("dotenv").config(); // Ensure environment variables are loaded
const { pool } = require("../config/db"); // Import the database pool
const logger = require("../../utils/logger"); // Import the logger

async function runMigrations() {
  let client; // Declare client outside try block for finally access
  try {
    client = await pool.connect(); // Acquire a client from the pool
    await client.query("BEGIN"); // Start transaction

    logger.info(
      "Starting database migrations (dropping and recreating tables)..."
    );

    // --- DDL Statements (Table Dropping and Creation) ---

    // Drop tables in reverse dependency order (important!)
    logger.info("Dropping existing Fyers tables (if they exist)...");
    await client.query("DROP TABLE IF EXISTS Fyers_instruments CASCADE;");
    await client.query(
      "DROP TABLE IF EXISTS Fyers_exchange_segment_combinations CASCADE;"
    );
    await client.query("DROP TABLE IF EXISTS Fyers_instrument_types CASCADE;");
    await client.query("DROP TABLE IF EXISTS Fyers_segments CASCADE;");
    await client.query("DROP TABLE IF EXISTS Fyers_exchanges CASCADE;");
    logger.info("Finished dropping tables.");

    // 1. Create Fyers_exchanges table
    logger.info("Creating Fyers_exchanges table...");
    await client.query(`
            CREATE TABLE Fyers_exchanges (
                id INTEGER PRIMARY KEY,           -- Fyers Exchange Code (e.g., 10, 11, 12)
                name VARCHAR(50) UNIQUE NOT NULL, -- Exchange Name (e.g., 'NSE', 'MCX', 'BSE')
                full_name VARCHAR(100) NOT NULL,  -- Full descriptive name
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    logger.info("Table Fyers_exchanges created.");

    // 2. Create Fyers_segments table
    logger.info("Creating Fyers_segments table...");
    await client.query(`
            CREATE TABLE Fyers_segments (
                id INTEGER PRIMARY KEY,           -- Fyers Segment Code (e.g., 10, 11, 12, 20)
                name VARCHAR(50) UNIQUE NOT NULL, -- Segment Name (e.g., 'Capital Market', 'Equity Derivatives')
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    logger.info("Table Fyers_segments created.");

    // 3. Create Fyers_instrument_types table
    //    Note: Composite PRIMARY KEY (id, segment_id) as 'id' is not unique globally
    logger.info("Creating Fyers_instrument_types table...");
    await client.query(`
            CREATE TABLE Fyers_instrument_types (
                id INTEGER NOT NULL,               -- Fyers Instrument Type Code (e.g., 0, 11, 14, 30)
                segment_id INTEGER NOT NULL REFERENCES Fyers_segments(id), -- Segment context for the instrument type
                name VARCHAR(100) NOT NULL,        -- Description of the instrument type (e.g., 'EQ', 'FUTIDX')
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id, segment_id)       -- Composite primary key
            );
        `);
    logger.info("Table Fyers_instrument_types created.");

    // 4. Create Fyers_exchange_segment_combinations table
    //    To enforce valid (exchange_id, segment_id) pairs
    logger.info("Creating Fyers_exchange_segment_combinations table...");
    await client.query(`
            CREATE TABLE Fyers_exchange_segment_combinations (
                exchange_id INTEGER NOT NULL REFERENCES Fyers_exchanges(id),
                segment_id INTEGER NOT NULL REFERENCES Fyers_segments(id),
                exchange_name VARCHAR(50) NOT NULL, -- Added exchange name
                segment_name VARCHAR(50) NOT NULL,  -- Added segment name
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (exchange_id, segment_id) -- Ensures unique combinations
            );
        `);
    logger.info("Table Fyers_exchange_segment_combinations created.");

    // 5. Create Fyers_instruments table
    logger.info("Creating Fyers_instruments table...");
    await client.query(`
            CREATE TABLE Fyers_instruments (
                id SERIAL PRIMARY KEY,
                sym_ticker VARCHAR(255) UNIQUE NOT NULL, -- Unique string to identify the security (e.g., "BSE:SENSEX-INDEX")

                fy_token VARCHAR(50) NOT NULL,           -- Unique token for the security
                ex_token BIGINT NOT NULL,                -- Exchange token
                ex_symbol VARCHAR(50) NOT NULL,          -- Exchange symbol of the security (e.g., "ABAN", "NIFTY")
                ex_sym_name VARCHAR(255) NOT NULL,       -- Official short/primary name of the security
                exchange_id INTEGER NOT NULL REFERENCES Fyers_exchanges(id),
                exchange_name VARCHAR(50) NOT NULL,      -- Human-readable Exchange Name (e.g., "NSE", "BSE", "MCX")
                segment_id INTEGER NOT NULL REFERENCES Fyers_segments(id),
                ex_inst_type INTEGER NOT NULL,           -- Exchange instrument type (numeric code)
                trade_status BOOLEAN NOT NULL,           -- Flag: 1 = Active, 0 = Inactive (converted from 0/1 int)
                currency_code VARCHAR(10) NOT NULL,      -- Currency code (e.g., "INR")
                last_update DATE NULL,                   -- *** CHANGED TO NULLABLE ***
                
                under_sym VARCHAR(50) NULL,              -- Name of underlying symbol (NULL if not applicable, e.g., for equities)
                under_fy_tok VARCHAR(50) NULL,           -- Unique token for the underlying symbol (NULL if not applicable)

                ex_series VARCHAR(20) NULL,              -- Series information (e.g., "EQ", "SG", "XX"). NULL if not applicable.
                opt_type VARCHAR(10) NULL,               -- CE/PE for options, XX for others. NULL if not a derivative.
                expiry_date BIGINT NULL,                 -- Date of expiry for a symbol in Unix timestamp (seconds). NULL if not applicable.
                strike_price NUMERIC(18, 4) NULL,        -- Strike price. NULL if not applicable.

                min_lot_size INTEGER NULL,               -- Minimum quantity multiplier (NULL for some instrument types)
                tick_size NUMERIC(18, 4) NULL,           -- Minimum price multiplier
                upper_price NUMERIC(18, 4) NULL,         -- Upper circuit price
                lower_price NUMERIC(18, 4) NULL,         -- Lower circuit price
                face_value NUMERIC(18, 4) NULL,          -- Face value
                qty_multiplier NUMERIC(18, 4) NULL,      -- Quantity multiplier
                qty_freeze BIGINT NULL,                  -- Freeze quantity (parsed from string, NULL if empty)

                previous_close NUMERIC(18, 4) NULL,      -- Previous close price
                previous_oi NUMERIC(18, 4) NULL,         -- Previous OI value (Open Interest)

                is_mtf_tradable BOOLEAN NULL,            -- 0: Not MTF tradable, 1: MTF tradable (converted from 0/1 int)
                mtf_margin NUMERIC(18, 4) NULL,          -- Margin multiplier for MTF transactions

                isin VARCHAR(20) NULL,                   -- ISIN code for the security (Removed UNIQUE constraint)
                trading_session VARCHAR(100) NULL,       -- Trading session provided in IST. Allow NULL if not always present.
                asm_gsm_val TEXT NULL,                   -- Surveillance Indicator message (TEXT for potentially long strings)
                stream VARCHAR(50) NULL,                 -- Stream Group
                cautionary_msg TEXT NULL,                -- Cautionary message (TEXT for potentially long strings)
                product_code VARCHAR(50) NULL,           -- Product code (observed in BSE_FO)

                full_description VARCHAR(255) NULL,      -- Consolidates symDetails, symbolDesc, symbolDetails as a comprehensive description
                short_name VARCHAR(100) NULL,            -- Shorter name for display
                display_name_mobile VARCHAR(255) NULL,   -- From display_format_mob

                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

                -- Foreign key constraint to ensure exchange-segment combination is valid
                CONSTRAINT fk_exchange_segment
                    FOREIGN KEY (exchange_id, segment_id)
                    REFERENCES Fyers_exchange_segment_combinations(exchange_id, segment_id)
            );
        `);
    logger.info("Table Fyers_instruments created.");

    // --- DML Statements (Initial Data Population for Lookup Tables) ---
    // Using ON CONFLICT DO UPDATE/NOTHING for idempotency

    // 1. Populate Fyers_exchanges
    logger.info("Populating Fyers_exchanges data...");
    await client.query(`
            INSERT INTO Fyers_exchanges (id, name, full_name) VALUES
            (10, 'NSE', 'National Stock Exchange'),
            (11, 'MCX', 'Multi Commodity Exchange'),
            (12, 'BSE', 'Bombay Stock Exchange')
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                full_name = EXCLUDED.full_name;
        `);
    logger.info("Data populated for Fyers_exchanges.");

    // 2. Populate Fyers_segments
    logger.info("Populating Fyers_segments data...");
    await client.query(`
            INSERT INTO Fyers_segments (id, name) VALUES
            (10, 'Capital Market'),
            (11, 'Equity Derivatives'),
            (12, 'Currency Derivatives'),
            (20, 'Commodity Derivatives')
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name;
        `);
    logger.info("Data populated for Fyers_segments.");

    // 3. Populate Fyers_exchange_segment_combinations
    logger.info("Populating Fyers_exchange_segment_combinations data...");
    await client.query(`
            INSERT INTO Fyers_exchange_segment_combinations (exchange_id, segment_id, exchange_name, segment_name) VALUES
            (10, 10, 'NSE', 'Capital Market'),
            (10, 11, 'NSE', 'Equity Derivatives'),
            (10, 12, 'NSE', 'Currency Derivatives'),
            (10, 20, 'NSE', 'Commodity Derivatives'),
            (12, 10, 'BSE', 'Capital Market'),
            (12, 11, 'BSE', 'Equity Derivatives'),
            (12, 12, 'BSE', 'Currency Derivatives'),
            (11, 20, 'MCX', 'Commodity Derivatives')
            ON CONFLICT (exchange_id, segment_id) DO UPDATE SET
                exchange_name = EXCLUDED.exchange_name,
                segment_name = EXCLUDED.segment_name;
        `);
    logger.info("Data populated for Fyers_exchange_segment_combinations.");

    // 4. Populate Fyers_instrument_types
    //    Using ON CONFLICT (id, segment_id) DO UPDATE SET name to handle potential updates
    logger.info("Populating Fyers_instrument_types data...");
    await client.query(`
            INSERT INTO Fyers_instrument_types (id, segment_id, name) VALUES
            (0, 10, 'EQ (EQUITY)'), (1, 10, 'PREFSHARES'), (2, 10, 'DEBENTURES'),
            (3, 10, 'WARRANTS'), (4, 10, 'MISC (NSE, BSE)'), (5, 10, 'SGB'),
            (6, 10, 'G - Secs'), (7, 10, 'T - Bills'), (8, 10, 'MF'),
            (9, 10, 'ETF'), (10, 10, 'INDEX'), (50, 10, 'MISC (BSE)'),
            (11, 11, 'FUTIDX'), (12, 11, 'FUTIVX'), (13, 11, 'FUTSTK'),
            (14, 11, 'OPTIDX'), (15, 11, 'OPTSTK'),
            (16, 12, 'FUTCUR'), (17, 12, 'FUTIRT'), (18, 12, 'FUTIRC'),
            (19, 12, 'OPTCUR'), (20, 12, 'UNDCUR'), (21, 12, 'UNDIRC'),
            (22, 12, 'UNDIRT'), (23, 12, 'UNDIRD'), (24, 12, 'INDEX_CD'),
            (25, 12, 'FUTIRD'),
            (11, 20, 'FUTIDX'), -- Note: Same ID as FO segment, but different segment_id
            (30, 20, 'FUTCOM'), (31, 20, 'OPTFUT'), (32, 20, 'OPTCOM'),
            (33, 20, 'FUTBAS'), (34, 20, 'FUTBLN'), (35, 20, 'FUTENR'),
            (36, 20, 'OPTBLN'), (37, 20, 'OPTFUT (NCOM)')
            ON CONFLICT (id, segment_id) DO UPDATE SET
                name = EXCLUDED.name;
        `);
    logger.info("Data populated for Fyers_instrument_types.");

    await client.query("COMMIT"); // Commit transaction
    logger.info("Database migrations completed successfully!");
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK"); // Rollback transaction on error
    }
    logger.error("Database migration failed:", error.message);
    throw error; // Re-throw the error for external handling
  } finally {
    if (client) {
      client.release(); // Release the client back to the pool
    }
  }
}

// Execute the migration function
// Added a top-level catch for unhandled promise rejections
runMigrations().catch((err) => {
  logger.error("Unhandled error during migration script execution:", err);
  process.exit(1); // Exit with a non-zero code to indicate failure
});

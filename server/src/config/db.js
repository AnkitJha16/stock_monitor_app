// server/src/config/db.js

const { Pool } = require("pg");
const logger = require("../../utils/logger"); // Assuming our central logger is available here

// --- START: ADD THESE LINES HERE ---
// These lines will log the values of your environment variables as seen by Node.js
// logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
// logger.debug(`DB_PORT: ${process.env.DB_PORT}`); // Note: DB_PORT should typically be a number, but process.env provides strings. pg client handles this.
// logger.debug(`DB_USER: ${process.env.DB_USER}`);
// logger.debug(`DB_DATABASE: ${process.env.DB_DATABASE}`);
// // Be careful with logging passwords directly in production! This is for temporary debugging.
// logger.debug(
//   `DB_PASSWORD (length): ${
//     process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : "N/A"
//   }`
// );
// logger.debug(
//   `DB_PASSWORD (first 5 chars): ${
//     process.env.DB_PASSWORD
//       ? process.env.DB_PASSWORD.substring(0, 5) + "..."
//       : "N/A"
//   }`
// );
// logger.debug(`DB_PASSWORD (type): ${typeof process.env.DB_PASSWORD}`);
// --- END: ADD THESE LINES HERE ---

// Create a new Pool instance using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a new client from the pool to become available
});

// Event listener for errors in the connection pool
pool.on("error", (err, client) => {
  logger.error(
    "Unexpected error on idle PostgreSQL client:",
    err.message,
    err.stack
  );
  // This means a client in the pool errored out, it will be removed from the pool.
  // You might want to implement more robust error handling here, like attempting to reconnect.
});

/**
 * Temporary function to test database insert operation.
 * REMOVE AFTER CONFIRMATION.
 */
// async function testDbInsert() {
//   let client;
//   try {
//     client = await pool.connect();

//     // 1. Create a simple test table if it doesn't exist
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS test_data (
//         id SERIAL PRIMARY KEY,
//         message VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       );
//     `);
//     logger.info("Checked/Created 'test_data' table.");

//     // 2. Insert a dummy record
//     const testMessage = `Test entry at ${new Date().toISOString()}`;
//     const result = await client.query(
//       `INSERT INTO test_data(message) VALUES($1) RETURNING *;`,
//       [testMessage]
//     );
//     logger.info(`Inserted test record: ${JSON.stringify(result.rows[0])}`);
//   } catch (err) {
//     logger.error("Failed to perform test DB insert:", err);
//   } finally {
//     if (client) {
//       client.release();
//     }
//   }
// }

// Function to connect to the database (attempt to acquire a client from the pool)
async function connectDb() {
  try {
    // Attempt to get a client from the pool to test the connection
    const client = await pool.connect();
    client.release(); // Release the client back to the pool immediately after testing
    logger.info("Database connected successfully!");
  } catch (err) {
    // logger.error("Failed to connect to the database:", err.message);
    logger.error("Failed to connect to the database:", err);
    // In a real production app, you might want to exit the process if the DB connection fails on startup
    // process.exit(1);
  }
}

// Function to close the database connection pool
async function closeDb() {
  try {
    await pool.end(); // This will end all clients in the pool
    logger.info("Database connection pool closed.");
  } catch (err) {
    logger.error("Error closing database connection pool:", err.message);
  }
}

// Export the pool and the connection/disconnection functions
module.exports = {
  pool,
  connectDb,
  closeDb,
  // testDbInsert, // EXPORT the new function
};

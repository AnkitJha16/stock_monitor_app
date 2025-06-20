// server/src/config/sequelize.js

// require("dotenv").config();
const { Sequelize } = require("sequelize");
const logger = require("../../utils/logger");

const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, NODE_ENV } =
  process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  logging: (msg) => {
    // Only log SQL queries in development or if explicitly enabled
    if (NODE_ENV === "development") {
      logger.debug(msg);
    }
  },
  define: {
    // Prevent Sequelize from pluralizing table names
    freezeTableName: true,
    // Add default timestamps to all models
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function connectSequelize() {
  try {
    await sequelize.authenticate();
    logger.info("Sequelize connection has been established successfully.");
    // --- ADD THIS NEW LINE BELOW ---
    logger.info(
      `Connected to database: ${sequelize.config.database} on host: ${sequelize.config.host}:${sequelize.config.port}`
    );
    // --- END NEW LINE ---
    return sequelize;
  } catch (error) {
    logger.error("Unable to connect to the database with Sequelize:", error);
    process.exit(1); // Exit if database connection fails
  }
}

module.exports = { sequelize, connectSequelize };

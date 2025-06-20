// server/src/models/FyersExchange.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FyersExchange = sequelize.define(
    "FyersExchange",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false, // IDs are externally provided (10, 11, 12)
        allowNull: false,
      },
      name: {
        // Maps to 'name' column in DB (e.g., 'NSE')
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      fullName: {
        // Maps to 'full_name' column in DB (e.g., 'National Stock Exchange')
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "full_name", // Explicitly map to snake_case column
      },
      // created_at and updated_at are handled by global `define` in sequelize.js
    },
    {
      sequelize,
      tableName: "fyers_exchanges", // Match database table name exactly
      modelName: "FyersExchange",
      timestamps: true, // Use global setting from sequelize.js
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return FyersExchange;
};

// ------------------------ OLD CODE -----------------------------
// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const FyersExchange = sequelize.define(
//     "FyersExchange",
//     {
//       // The 'id' column from your database table
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true, // This is the primary key in your DB
//         autoIncrement: false, // Assuming it's auto-incrementing if it's the primary key 'id'
//         allowNull: false,
//       },
//       // Mapping 'exchange_id' in the model to the 'id' column in the database
//       // The actual Fyers exchange code (10, 11, 12)
//       // exchange_code: {
//       //   // Changed to 'exchange_code' for clarity as per appendix data
//       //   type: DataTypes.INTEGER,
//       //   allowNull: false,
//       //   unique: true,
//       //   field: "id", // Explicitly map to the 'id' column in the database table
//       // },
//       // Mapping 'exchange_name' in the model to the 'name' column in the database
//       exchange_name: {
//         // Keeping model property name for consistency with pattern
//         type: DataTypes.TEXT,
//         allowNull: false,
//         unique: true,
//         field: "name", // Explicitly map to the 'name' column in the database table
//       },
//     },
//     {
//       sequelize,
//       tableName: "fyers_exchanges",
//       modelName: "FyersExchange",
//       schema: "public",
//       timestamps: true, // Set to true as per your database schema
//       createdAt: "created_at", // Explicitly map to 'created_at' column
//       updatedAt: "updated_at", // Explicitly map to 'updated_at' column
//       // We are defining the primary key as 'id' as per your database table.
//       // No need for separate 'exchange_id' property for PK if 'id' serves that.
//       // If 'id' is a generic auto-incrementing PK and Fyers's '10, 11, 12' are in 'exchange_id' equivalent,
//       // we use 'field' to map.
//     }
//   );

//   return FyersExchange;
// };

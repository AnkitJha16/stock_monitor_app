// server/src/models/FyersSegment.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FyersSegment = sequelize.define(
    "FyersSegment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: false, // IDs are externally provided (10, 11, 12, 20)
        allowNull: false,
        unique: true, // Also unique as it's a primary key
      },
      name: {
        // Maps to 'name' column in DB (e.g., 'Capital Market')
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      // created_at and updated_at are handled by global `define` in sequelize.js
    },
    {
      sequelize,
      tableName: "fyers_segments", // Match database table name exactly
      modelName: "FyersSegment",
      timestamps: true, // Use global setting from sequelize.js
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return FyersSegment;
};

///---------------------------OLD CODE -----------------------------------

// // server/src/models/FyersSegment.js

// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const FyersSegment = sequelize.define(
//     "FyersSegment",
//     {
//       // The 'id' column from your database table
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true, // This is the primary key in your DB
//         autoIncrement: false, // Assuming it's auto-incrementing if it's the primary key 'id'
//         allowNull: false,
//         unique: true,
//       },
//       // Mapping 'segment_code' in the model to the 'id' column in the database
//       // The actual Fyers segment code (10, 11, 12, 20)
//       // segment_code: {
//       //   // Changed to 'segment_code' for clarity as per appendix data
//       //   type: DataTypes.INTEGER,
//       //   allowNull: false,
//       //   unique: true,
//       //   field: "id", // Explicitly map to the 'id' column in the database table
//       // },
//       // Mapping 'segment_name' in the model to the 'name' column in the database
//       segment_name: {
//         // Keeping model property name for consistency with pattern
//         type: DataTypes.TEXT,
//         allowNull: false,
//         unique: true,
//         field: "name", // Explicitly map to the 'name' column in the database table
//       },
//     },
//     {
//       sequelize,
//       tableName: "fyers_segments",
//       modelName: "FyersSegment",
//       schema: "public",
//       timestamps: true, // Set to true as per your database schema
//       createdAt: "created_at", // Explicitly map to 'created_at' column
//       updatedAt: "updated_at", // Explicitly map to 'updated_at' column
//       // We are defining the primary key as 'id' as per your database table.
//     }
//   );

//   return FyersSegment;
// };

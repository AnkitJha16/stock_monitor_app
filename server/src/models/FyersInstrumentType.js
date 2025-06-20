// server/src/models/FyersInstrumentType.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FyersInstrumentType = sequelize.define(
    "FyersInstrumentType",
    {
      id: {
        // Represents the ex_inst_type code
        type: DataTypes.INTEGER,
        primaryKey: true, // Part of composite primary key
        autoIncrement: false,
        allowNull: false,
      },
      segmentId: {
        // Foreign Key, part of composite primary key
        type: DataTypes.INTEGER,
        primaryKey: true, // Part of composite primary key
        allowNull: false,
        field: "segment_id", // Explicitly map to snake_case column
        references: {
          // Define foreign key relationship
          model: "Fyers_segments", // References Fyers_segments table
          key: "id",
        },
      },
      name: {
        // Description of the instrument type (e.g., 'EQ (EQUITY)')
        type: DataTypes.STRING(100),
        allowNull: false,
        // Not unique on its own, only unique in combination with segmentId
      },
      // created_at and updated_at are handled by global `define` in sequelize.js
    },
    {
      sequelize,
      tableName: "fyers_instrument_types", // Match database table name exactly
      modelName: "FyersInstrumentType",
      timestamps: true, // Use global setting from sequelize.js
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Associations will be defined in a central file (e.g., models/index.js or after loading all models)
  // FyersInstrumentType.associate = (models) => {
  //     FyersInstrumentType.belongsTo(models.FyersSegment, { foreignKey: 'segment_id' });
  // };

  return FyersInstrumentType;
};

//------------------- OLD CODE -------------------------------
// // server/src/models/FyersInstrumentType.js

// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const FyersInstrumentType = sequelize.define(
//     "FyersInstrumentType",
//     {
//       // The 'id' column from your database table
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true, // This is the primary key in your DB
//         autoIncrement: false, // Assuming it's auto-incrementing if it's the primary key 'id'
//         allowNull: false,
//       },
//       // Mapping 'instrument_type_code' in the model to the 'id' column in the database
//       // The actual Fyers instrument type code (0, 1, 2... etc.)
//       // instrument_type_code: {
//       //   // Changed to 'instrument_type_code' for clarity
//       //   type: DataTypes.INTEGER,
//       //   allowNull: false,
//       //   unique: true,
//       //   field: "id", // Explicitly map to the 'id' column in the database table
//       // },
//       // Mapping 'instrument_type_name' in the model to the 'description' column in the database
//       instrument_type_name: {
//         // Keeping model property name for consistency
//         type: DataTypes.TEXT,
//         allowNull: false,
//         unique: true,
//         field: "description", // Explicitly map to the 'description' column in the database table
//       },
//     },
//     {
//       sequelize,
//       tableName: "fyers_instrument_types",
//       modelName: "FyersInstrumentType",
//       schema: "public",
//       timestamps: true, // Set to true as per your database schema
//       createdAt: "created_at", // Explicitly map to 'created_at' column
//       updatedAt: "updated_at", // Explicitly map to 'updated_at' column
//     }
//   );

//   return FyersInstrumentType;
// };

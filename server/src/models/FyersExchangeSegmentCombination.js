// server/src/models/FyersExchangeSegmentCombination.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FyersExchangeSegmentCombination = sequelize.define(
    "FyersExchangeSegmentCombination",
    {
      // Composite Primary Key representing the valid combination
      exchangeId: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Part of the composite primary key
        allowNull: false,
        field: "exchange_id", // Explicitly map to snake_case column
        references: {
          // Define foreign key relationship
          model: "Fyers_exchanges", // References the Fyers_exchanges table
          key: "id",
        },
      },
      segmentId: {
        type: DataTypes.INTEGER,
        primaryKey: true, // Part of the composite primary key
        allowNull: false,
        field: "segment_id", // Explicitly map to snake_case column
        references: {
          // Define foreign key relationship
          model: "Fyers_segments", // References the Fyers_segments table
          key: "id",
        },
      },
      // Denormalized fields for convenience, directly from the lookup data
      exchangeName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "exchange_name", // Explicitly map to snake_case column
      },
      segmentName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "segment_name", // Explicitly map to snake_case column
      },
      // created_at and updated_at are handled by global `define` in sequelize.js
    },
    {
      sequelize,
      tableName: "fyers_exchange_segment_combinations", // Ensure exact table name match
      modelName: "FyersExchangeSegmentCombination",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Associations will be defined in a central file (e.g., models/index.js or after loading all models)
  // FyersExchangeSegmentCombination.associate = (models) => {
  //     FyersExchangeSegmentCombination.belongsTo(models.FyersExchange, { foreignKey: 'exchange_id' });
  //     FyersExchangeSegmentCombination.belongsTo(models.FyersSegment, { foreignKey: 'segment_id' });
  // };

  return FyersExchangeSegmentCombination;
};

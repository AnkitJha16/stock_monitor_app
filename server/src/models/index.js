// server/src/models/index.js

const { sequelize } = require("../config/sequelize");
const { DataTypes } = require("sequelize");

const db = {};

// Import and define all Fyers models
db.FyersInstrument = require("./FyersInstrument")(sequelize); // Pass only sequelize
db.FyersExchange = require("./FyersExchange")(sequelize);
db.FyersSegment = require("./FyersSegment")(sequelize);
db.FyersInstrumentType = require("./FyersInstrumentType")(sequelize);
db.FyersExchangeSegmentCombination =
  require("./FyersExchangeSegmentCombination")(sequelize); // NEW: Add this model

// Define Associations
// These are defined after all models are loaded to ensure they exist

// FyersInstrument Associations
db.FyersInstrument.belongsTo(db.FyersExchange, {
  foreignKey: "exchangeId", // Use camelCase model property
  targetKey: "id",
  as: "exchangeDetails", // Alias for eager loading
});

db.FyersInstrument.belongsTo(db.FyersSegment, {
  foreignKey: "segmentId", // Use camelCase model property
  targetKey: "id",
  as: "segmentDetails", // Alias for eager loading
});

// Composite foreign key to FyersExchangeSegmentCombination
// Note: Sequelize handles composite foreign keys by looking for multiple foreignKey fields
// and referencing the composite primary key of the target model.
db.FyersInstrument.belongsTo(db.FyersExchangeSegmentCombination, {
  foreignKey: ["exchangeId", "segmentId"], // Array for composite foreign key
  // Removed 'targetKey' as Sequelize infers it when 'foreignKey' is a composite primary key reference.
  // targetKey: ["exchangeId", "segmentId"], // Array for composite primary key in target model
  as: "exchangeSegmentCombination", // Alias for eager loading
  // onDelete: 'RESTRICT' // Default behavior, but can be explicit
});

// Association to FyersInstrumentType (composite foreign key)
// This association requires both exInstType (id) and segmentId from FyersInstrument
db.FyersInstrument.belongsTo(db.FyersInstrumentType, {
  foreignKey: ["exInstType", "segmentId"], // Composite foreign key
  // targetKey: ["exchangeId", "segmentId"], // Array for composite primary key in target model
  // targetKey: ["id", "segmentId"], // Composite primary key in target model
  as: "instrumentTypeDetails", // Alias for eager loading
});

// FyersExchangeSegmentCombination Associations
db.FyersExchangeSegmentCombination.belongsTo(db.FyersExchange, {
  foreignKey: "exchangeId",
  targetKey: "id",
  as: "exchangeInfo",
});

db.FyersExchangeSegmentCombination.belongsTo(db.FyersSegment, {
  foreignKey: "segmentId",
  targetKey: "id",
  as: "segmentInfo",
});

// FyersInstrumentType Associations (already handled via composite key above and in model itself)
db.FyersInstrumentType.belongsTo(db.FyersSegment, {
  foreignKey: "segmentId",
  targetKey: "id",
  as: "segmentType", // Alias
});

// (Optional: If you want to use the .associate pattern, ensure all models are defined first)
// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

db.sequelize = sequelize; // The sequelize instance
db.Sequelize = DataTypes; // The Sequelize library (containing DataTypes etc.)

module.exports = db;

//---------------------------------------OLD CODE ----------------------------------
// // server/src/models/index.js

// const { sequelize } = require("../config/sequelize");
// const { DataTypes } = require("sequelize");

// const db = {};

// // Import and define FyersInstrument model
// db.FyersInstrument = require("./FyersInstrument")(sequelize, DataTypes);

// // Add more models here as you define them:
// // --- NEW: Import and define the new lookup models ---
// db.FyersExchange = require("./FyersExchange")(sequelize, DataTypes);
// db.FyersSegment = require("./FyersSegment")(sequelize, DataTypes);
// db.FyersInstrumentType = require("./FyersInstrumentType")(sequelize, DataTypes);
// // --- END NEW IMPORTS ---

// // Set up associations (if any)
// // Example: if FyersInstrument had a foreign key to FyersExchange:
// // db.FyersInstrument.associate = (models) => {
// //   db.FyersInstrument.belongsTo(models.FyersExchange, { foreignKey: 'exchange_id' });
// // };

// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     db[modelName].associate(db);
//   }
// });

// db.sequelize = sequelize; // The sequelize instance
// db.Sequelize = DataTypes; // The Sequelize library (containing DataTypes etc.)

// module.exports = db;

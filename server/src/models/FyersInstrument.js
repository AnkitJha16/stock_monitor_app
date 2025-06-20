// server/src/models/FyersInstrument.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FyersInstrument = sequelize.define(
    "FyersInstrument",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      symTicker: {
        // sym_ticker VARCHAR(255) UNIQUE NOT NULL
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: "sym_ticker",
      },
      fyToken: {
        // fy_token VARCHAR(50) NOT NULL
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "fy_token",
      },
      exToken: {
        // ex_token BIGINT NOT NULL
        type: DataTypes.BIGINT,
        allowNull: false,
        field: "ex_token",
      },
      exSymbol: {
        // ex_symbol VARCHAR(50) NOT NULL
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "ex_symbol",
      },
      exSymName: {
        // ex_sym_name VARCHAR(255) NOT NULL
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "ex_sym_name",
      },
      exchangeId: {
        // exchange_id INTEGER NOT NULL REFERENCES Fyers_exchanges(id)
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "exchange_id",
        references: {
          model: "Fyers_exchanges",
          key: "id",
        },
      },
      exchangeName: {
        // exchange_name VARCHAR(50) NOT NULL
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "exchange_name",
      },
      segmentId: {
        // segment_id INTEGER NOT NULL REFERENCES Fyers_segments(id)
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "segment_id",
        references: {
          model: "Fyers_segments",
          key: "id",
        },
      },
      exInstType: {
        // ex_inst_type INTEGER NOT NULL
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "ex_inst_type",
      },
      tradeStatus: {
        // trade_status BOOLEAN NOT NULL
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: "trade_status",
      },
      currencyCode: {
        // currency_code VARCHAR(10) NOT NULL
        type: DataTypes.STRING(10),
        allowNull: false,
        field: "currency_code",
      },
      lastUpdate: {
        // last_update DATE NULL (made nullable based on errors)
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "last_update",
      },
      underSym: {
        // under_sym VARCHAR(50) NULL
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "under_sym",
      },
      underFyTok: {
        // under_fy_tok VARCHAR(50) NULL
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "under_fy_tok",
      },
      exSeries: {
        // ex_series VARCHAR(20) NULL
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "ex_series",
      },
      optType: {
        // opt_type VARCHAR(10) NULL
        type: DataTypes.STRING(10),
        allowNull: true,
        field: "opt_type",
      },
      expiryDate: {
        // expiry_date BIGINT NULL (Unix timestamp)
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "expiry_date",
      },
      strikePrice: {
        // strike_price NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "strike_price",
      },
      minLotSize: {
        // min_lot_size INTEGER NULL
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "min_lot_size",
      },
      tickSize: {
        // tick_size NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "tick_size",
      },
      upperPrice: {
        // upper_price NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "upper_price",
      },
      lowerPrice: {
        // lower_price NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "lower_price",
      },
      faceValue: {
        // face_value NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "face_value",
      },
      qtyMultiplier: {
        // qty_multiplier NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "qty_multiplier",
      },
      qtyFreeze: {
        // qty_freeze BIGINT NULL
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "qty_freeze",
      },
      previousClose: {
        // previous_close NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "previous_close",
      },
      previousOi: {
        // previous_oi NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "previous_oi",
      },
      isMtfTradable: {
        // is_mtf_tradable BOOLEAN NULL
        type: DataTypes.BOOLEAN,
        allowNull: true,
        field: "is_mtf_tradable",
      },
      mtfMargin: {
        // mtf_margin NUMERIC(18, 4) NULL
        type: DataTypes.DECIMAL(18, 4),
        allowNull: true,
        field: "mtf_margin",
      },
      isin: {
        // isin VARCHAR(20) NULL (UNIQUE constraint removed)
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      tradingSession: {
        // trading_session VARCHAR(100) NULL
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "trading_session",
      },
      asmGsmVal: {
        // asm_gsm_val TEXT NULL
        type: DataTypes.TEXT,
        allowNull: true,
        field: "asm_gsm_val",
      },
      stream: {
        // stream VARCHAR(50) NULL
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      cautionaryMsg: {
        // cautionary_msg TEXT NULL
        type: DataTypes.TEXT,
        allowNull: true,
        field: "cautionary_msg",
      },
      productCode: {
        // product_code VARCHAR(50) NULL (new field)
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "product_code",
      },
      fullDescription: {
        // full_description VARCHAR(255) NULL (consolidated)
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "full_description",
      },
      shortName: {
        // short_name VARCHAR(100) NULL
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "short_name",
      },
      displayNameMobile: {
        // display_name_mobile VARCHAR(255) NULL
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "display_name_mobile",
      },
      // created_at and updated_at are handled by global `define` in sequelize.js
    },
    {
      sequelize, // Pass the connection instance
      tableName: "fyers_instruments", // Explicitly define the table name
      modelName: "FyersInstrument", // Define the model name
      timestamps: true, // Use global setting from sequelize.js
      createdAt: "created_at",
      updatedAt: "updated_at",
      // You can add indexes here if needed for performance
      // indexes: [
      //     { unique: true, fields: ['fy_token'] }, // fy_token is unique
      //     { fields: ['exchange_id', 'segment_id'] }, // For foreign key
      //     { fields: ['ex_symbol'] },
      // ]
    }
  );

  // Associations will be defined in a central file (e.g., models/index.js or after loading all models)
  // FyersInstrument.associate = (models) => {
  //     FyersInstrument.belongsTo(models.FyersExchange, { foreignKey: 'exchange_id', as: 'exchange' });
  //     FyersInstrument.belongsTo(models.FyersSegment, { foreignKey: 'segment_id', as: 'segment' });
  //     FyersInstrument.belongsTo(models.FyersInstrumentType, { foreignKey: 'ex_inst_type', targetKey: 'id' }); // Assuming FyersInstrumentType has 'id' as PK
  // };

  return FyersInstrument;
};

// -------------------------------OLD CODE -------------------------------------------------

// // server/src/models/FyersInstrument.js

// const { DataTypes } = require("sequelize");

// module.exports = (sequelize) => {
//   const FyersInstrument = sequelize.define(
//     "FyersInstrument",
//     {
//       id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//         allowNull: false,
//       },
//       fy_token: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         unique: true,
//       },
//       sym_ticker: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         unique: true,
//       },
//       ex_token: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       ex_symbol: {
//         type: DataTypes.TEXT,
//         allowNull: true, // Assuming it can be null based on previous schema
//       },
//       ex_sym_name: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       sym_details: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       symbol_desc: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       exchange_name: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       currency_code: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       exchange: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       segment: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       ex_series: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       ex_inst_type: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//       trade_status: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//       },
//       trading_session: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       last_update: {
//         type: DataTypes.DATEONLY, // Use DATEONLY for 'YYYY-MM-DD'
//         allowNull: true,
//       },
//       is_mtf_tradable: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//       under_sym: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       under_fy_tok: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       expiry_date: {
//         type: DataTypes.DATEONLY,
//         allowNull: true,
//       },
//       original_exp_date: {
//         type: DataTypes.DATEONLY,
//         allowNull: true,
//       },
//       opt_type: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       strike_price: {
//         type: DataTypes.DECIMAL(10, 2), // NUMERIC in PG, using DECIMAL with precision
//         allowNull: true,
//       },
//       min_lot_size: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//       qty_multiplier: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       qty_freeze: {
//         type: DataTypes.TEXT, // Kept as TEXT as it could be an empty string
//         allowNull: true,
//       },
//       tick_size: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       upper_price: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       lower_price: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       face_value: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       previous_close: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       previous_oi: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       isin: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       asm_gsm_val: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       stream: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       cautionary_msg: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       symbol_details: {
//         type: DataTypes.TEXT,
//         allowNull: true,
//       },
//       mpp_flag: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       },
//       leverage: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       mtf_margin: {
//         type: DataTypes.DECIMAL(10, 2),
//         allowNull: true,
//       },
//       // created_at and updated_at are handled by default with timestamps: true
//       // and mapped via the define object in sequelize.js
//     },
//     {
//       sequelize, // Pass the connection instance
//       tableName: "fyers_instruments", // Explicitly define the table name
//       modelName: "FyersInstrument", // Define the model name
//       schema: "public",
//       // freezeTableName: true is already set globally in sequelize.js,
//       // so no need to repeat it here, but it wouldn't hurt.
//     }
//   );

//   return FyersInstrument;
// };

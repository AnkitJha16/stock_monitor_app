// server/downloadInstruments.js
const fs = require("fs/promises"); // For async file system operations
const path = require("path"); // For path manipulation
const https = require("https"); // For making HTTPS requests

const dataDir = path.join(__dirname, "data"); // Path to the new 'data' folder
const instrumentUrls = {
  // --- UPDATED: ALL JSON files for all segments ---
  "NSE_CM_sym_master.json":
    "https://public.fyers.in/sym_details/NSE_CM_sym_master.json", // NSE - Capital Market (Equity)
  "BSE_CM_sym_master.json":
    "https://public.fyers.in/sym_details/BSE_CM_sym_master.json", // BSE - Capital Market (Equity)
  "NSE_FO_sym_master.json":
    "https://public.fyers.in/sym_details/NSE_FO_sym_master.json", // NSE - Equity Derivatives (Futures & Options)
  "NSE_CD_sym_master.json":
    "https://public.fyers.in/sym_details/NSE_CD_sym_master.json", // NSE - Currency Derivatives
  "MCX_COM_sym_master.json":
    "https://public.fyers.in/sym_details/MCX_COM_sym_master.json", // MCX - Commodity Derivatives
  "BSE_FO_sym_master.json":
    "https://public.fyers.in/sym_details/BSE_FO_sym_master.json", // BSE - Equity Derivatives (Futures & Options)
  "NSE_COM_sym_master.json":
    "https://public.fyers.in/sym_details/NSE_COM_sym_master.json", // NSE - Commodity (Futures & Options)
  // --- END UPDATED URLS ---
};

async function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(
            new Error(`HTTP error! Status: ${response.statusCode}`)
          );
        }

        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", async () => {
          try {
            await fs.writeFile(destinationPath, data, "utf8");
            resolve();
          } catch (writeErr) {
            reject(writeErr);
          }
        });
      })
      .on("error", (reqErr) => {
        reject(reqErr);
      });
  });
}

async function downloadAllInstruments() {
  try {
    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`Ensured directory exists: ${dataDir}`);

    for (const fileName in instrumentUrls) {
      const url = instrumentUrls[fileName];
      const destinationPath = path.join(dataDir, fileName);
      console.log(
        `Downloading ${fileName} from ${url} to ${destinationPath}...`
      );
      await downloadFile(url, destinationPath);
      console.log(`Successfully downloaded ${fileName}`);
    }
    console.log("All instrument master files downloaded successfully!");
  } catch (error) {
    console.error("Error downloading instrument files:", error);
  }
}

// Run the download process
downloadAllInstruments();

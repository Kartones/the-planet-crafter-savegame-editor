import { parseSavegame } from "../js/savegameParser.mjs";
import fs from "fs";

console.log("Running parser test...");

// Test with Custom-1.json
try {
  const fileContent = fs.readFileSync("./savegames/Custom-1.json", "utf8");
  const savegameData = parseSavegame(fileContent);

  // Check for section6 specifically
  if (savegameData.section6) {
    console.log("Section6 found:");
    console.log(`Section6 length: ${savegameData.section6.length}`);
    console.log("Section6 items:", savegameData.section6);
  } else {
    console.log("Section6 not found in savegame data");
  }

  // Log array sections and their lengths
  console.log("\nAll array sections:");
  Object.entries(savegameData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      console.log(`${key}: ${value.length} items`);
    }
  });
} catch (error) {
  console.error("Error running parser test:", error);
}

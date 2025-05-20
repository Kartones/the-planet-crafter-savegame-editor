import { parseSavegame } from "./savegameParser.mjs";

function initialize() {
  const loadButton = document.getElementById("load-savegame");
  loadButton.addEventListener("click", handleLoadSavegame);
}

async function handleLoadSavegame() {
  try {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          const fileContent = await readFile(file);
          const savegameData = parseSavegame(fileContent);

          console.log(savegameData);
        } catch (error) {
          console.error("Error processing savegame:", error);
          alert(
            "Failed to process the savegame file. See console for details."
          );
        }
      }
    };

    fileInput.click();
  } catch (error) {
    console.error("Error opening file dialog:", error);
    alert("Failed to open file dialog.");
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);

    reader.readAsText(file);
  });
}

document.addEventListener("DOMContentLoaded", initialize);

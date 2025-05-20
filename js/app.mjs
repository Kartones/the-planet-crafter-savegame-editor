import { parseSavegame } from "./savegameParser.mjs";
import { DataManager } from "./dataManager.mjs";
import "./components/SectionComponent.mjs";
import "./components/SectionItemComponent.mjs";

let dataManager;
let sectionsExpanded = false;

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
          dataManager = new DataManager(savegameData);

          dataManager.addChangeListener(onDataChanged);

          renderSavegameData(savegameData);

          addSaveButton();

          addToggleSectionsButton();
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

function renderSavegameData(savegameData) {
  const editorContainer = document.getElementById("editor-container");
  editorContainer.innerHTML = "";

  const sectionsContainer = document.createElement("div");
  sectionsContainer.id = "sections-container";
  editorContainer.appendChild(sectionsContainer);

  const entries = Object.entries(savegameData);
  let delay = 0;

  entries.forEach(([sectionKey, sectionData]) => {
    // Add a small delay for each array section to allow time for rendering
    setTimeout(() => {
      const sectionComponent = document.createElement("section-component");
      sectionComponent.setAttribute("section-key", sectionKey);
      sectionComponent.data = sectionData;
      sectionComponent.addEventListener("value-changed", handleValueChange);
      sectionsContainer.appendChild(sectionComponent);
    }, delay);

    // Increment delay for array sections to avoid rendering conflicts
    if (Array.isArray(sectionData) && sectionData.length > 10) {
      delay += 10;
    }
  });
}

function handleValueChange(event) {
  const { key, index, type, oldValue, newValue, propertyName } = event.detail;

  const sectionComponent = event.target.closest("section-component");
  const sectionKey = sectionComponent.getAttribute("section-key");

  dataManager.updateValue({
    sectionKey,
    key,
    index,
    type,
    newValue,
    propertyName,
  });
}

function onDataChanged(data) {
  // console.log("Data changed:", data);
  // Here we could implement additional logic when data changes
  // For example, we might want to update the UI or enable/disable save buttons
}

function addSaveButton() {
  let saveButton = document.getElementById("save-savegame");
  if (!saveButton) {
    const header = document.querySelector("header");

    let buttonGroup = header.querySelector(".button-group");
    if (!buttonGroup) {
      buttonGroup = document.createElement("div");
      buttonGroup.className = "button-group";
      header.appendChild(buttonGroup);
    }

    saveButton = document.createElement("button");
    saveButton.id = "save-savegame";
    saveButton.textContent = "Save savegame";
    saveButton.addEventListener("click", handleSaveSavegame);

    buttonGroup.appendChild(saveButton);
  }
}

function addToggleSectionsButton() {
  let toggleButton = document.getElementById("toggle-sections");
  if (!toggleButton) {
    const header = document.querySelector("header");

    let buttonGroup = header.querySelector(".button-group");
    if (!buttonGroup) {
      buttonGroup = document.createElement("div");
      buttonGroup.className = "button-group";
      header.appendChild(buttonGroup);
    }

    toggleButton = document.createElement("button");
    toggleButton.id = "toggle-sections";
    toggleButton.textContent = "Expand all sections";
    toggleButton.addEventListener("click", toggleAllSections);

    buttonGroup.appendChild(toggleButton);
  }
}

function toggleAllSections() {
  const toggleButton = document.getElementById("toggle-sections");
  const sectionComponents = document.querySelectorAll("section-component");

  sectionsExpanded = !sectionsExpanded;

  sectionComponents.forEach((section) => {
    if (section.shadowRoot) {
      const header = section.shadowRoot.querySelector(".section-header");
      const content = section.shadowRoot.querySelector(".section-content");

      if (header && content) {
        if (sectionsExpanded) {
          header.classList.remove("collapsed");
          content.classList.remove("collapsed");
        } else {
          header.classList.add("collapsed");
          content.classList.add("collapsed");
        }
      }
    }
  });

  if (toggleButton) {
    toggleButton.textContent = sectionsExpanded
      ? "Collapse all sections"
      : "Expand all sections";
  }
}

function handleSaveSavegame() {
  if (!dataManager) {
    alert("No savegame data loaded yet.");
    return;
  }

  try {
    const content = dataManager.generateSavegameContent();

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "savegame.json";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  } catch (error) {
    console.error("Error saving savegame:", error);
    alert("Failed to save savegame. See console for details.");
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

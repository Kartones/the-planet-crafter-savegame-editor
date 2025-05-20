export class ConversionComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._propertyOptions = [];
    this._fromValue = "";
    this._toValue = "";
  }

  connectedCallback() {
    this.sectionKey = this.getAttribute("section-key") || "";
    this.itemKey = this.getAttribute("item-key") || "";
    this.render();
  }

  static get observedAttributes() {
    return ["section-key", "item-key", "property-options"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "section-key") {
      this.sectionKey = newValue;
    } else if (name === "item-key") {
      this.itemKey = newValue;
    } else if (name === "property-options") {
      try {
        this._propertyOptions = JSON.parse(newValue);
      } catch (e) {
        console.error("Invalid property options:", e);
      }
    }

    // Only re-render if shadowRoot already initialized
    if (this.shadowRoot.children.length > 0) {
      this.render();
    }
  }

  set propertyOptions(options) {
    if (Array.isArray(options)) {
      this._propertyOptions = options;
      this.render();
    }
  }

  get propertyOptions() {
    return this._propertyOptions;
  }

  render() {
    // Save current input values before re-rendering
    this._saveInputValues();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 15px;
        }
        .conversion-container {
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 4px;
          background-color: #f9f9f9;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        .conversion-label {
          margin: 0 8px;
          font-weight: bold;
        }
        input, select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        input {
          width: 120px;
        }
        .property-selector {
          margin-right: 8px;
        }
        button {
          padding: 6px 12px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
          transition: background-color 0.2s;
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        button:hover:not(:disabled) {
          background-color: #45a049;
        }
        @media (max-width: 600px) {
          .conversion-container {
            flex-direction: column;
            align-items: flex-start;
          }
          input, button, select {
            margin-top: 8px;
          }
          button {
            margin-left: 0;
          }
        }
      </style>
      <div class="conversion-container">
        ${this.renderPropertySelector()}
        <span class="conversion-label">Convert all from</span>
        <input type="text" id="from-value" placeholder="Value to replace" value="${
          this._fromValue
        }">
        <span class="conversion-label">into</span>
        <input type="text" id="to-value" placeholder="New value" value="${
          this._toValue
        }">
        <button id="apply-conversion" ${
          !this._fromValue.trim() || !this._toValue.trim() ? "disabled" : ""
        }>Apply</button>
      </div>
    `;

    this.setupListeners();
  }

  _saveInputValues() {
    if (this.shadowRoot.children.length > 0) {
      const fromInput = this.shadowRoot.getElementById("from-value");
      const toInput = this.shadowRoot.getElementById("to-value");

      if (fromInput) this._fromValue = fromInput.value;
      if (toInput) this._toValue = toInput.value;
    }
  }

  renderPropertySelector() {
    if (!this._propertyOptions || this._propertyOptions.length <= 1) {
      return "";
    }

    return `
      <select class="property-selector" id="property-selector">
        ${this._propertyOptions
          .map(
            (option) => `
          <option value="${option}" ${
              option === this.itemKey ? "selected" : ""
            }>
            ${option}
          </option>
        `
          )
          .join("")}
      </select>
    `;
  }

  setupListeners() {
    const fromInput = this.shadowRoot.getElementById("from-value");
    const toInput = this.shadowRoot.getElementById("to-value");
    const applyButton = this.shadowRoot.getElementById("apply-conversion");
    const propertySelector =
      this.shadowRoot.getElementById("property-selector");

    if (propertySelector) {
      propertySelector.addEventListener("change", (e) => {
        this.itemKey = e.target.value;
        this.setAttribute("item-key", e.target.value);
      });
    }

    const updateButtonState = () => {
      applyButton.disabled = !fromInput.value.trim() || !toInput.value.trim();
    };

    fromInput.addEventListener("input", (e) => {
      this._fromValue = e.target.value;
      updateButtonState();
    });

    toInput.addEventListener("input", (e) => {
      this._toValue = e.target.value;
      updateButtonState();
    });

    applyButton.addEventListener("click", () => {
      this.convertValues(fromInput.value, toInput.value);
    });
  }

  convertValues(fromValue, toValue) {
    if (!this.sectionKey || !this.itemKey) {
      console.error("Section key or item key not specified for conversion");
      return;
    }

    // Get a reference to the DataManager
    const dataManager = window.dataManager || this.getDataManager();
    if (!dataManager) {
      console.error("DataManager not found");
      return;
    }

    const sectionData = dataManager.getSectionData(this.sectionKey);
    if (!sectionData) {
      console.error(`Section '${this.sectionKey}' not found`);
      return;
    }

    let conversionCount = 0;
    const affectedComponents = [];

    if (Array.isArray(sectionData)) {
      // Handle array data
      for (let i = 0; i < sectionData.length; i++) {
        const item = sectionData[i];
        if (item && typeof item === "object" && this.itemKey in item) {
          if (String(item[this.itemKey]) === String(fromValue)) {
            // Apply conversion based on the original value type
            const originalType = typeof item[this.itemKey];
            const convertedValue = this.convertValueToType(
              toValue,
              originalType
            );

            dataManager.updateValue({
              sectionKey: this.sectionKey,
              index: i,
              type: "array-item",
              propertyName: this.itemKey,
              newValue: convertedValue,
            });

            conversionCount++;

            // Track which items were affected
            affectedComponents.push({ index: i, property: this.itemKey });
          }
        }
      }
    } else if (typeof sectionData === "object" && sectionData !== null) {
      // Handle object data
      for (const key in sectionData) {
        if (
          key === this.itemKey &&
          String(sectionData[key]) === String(fromValue)
        ) {
          const originalType = typeof sectionData[key];
          const convertedValue = this.convertValueToType(toValue, originalType);

          dataManager.updateValue({
            sectionKey: this.sectionKey,
            key: this.itemKey,
            newValue: convertedValue,
          });

          conversionCount++;

          // Track which keys were affected
          affectedComponents.push({ key: key });
        }
      }
    }

    // Update UI after conversion
    this._updateUIAfterConversion(affectedComponents);

    // Alert the user about the conversion
    alert(
      `Converted ${conversionCount} item${conversionCount !== 1 ? "s" : ""}`
    );
  }

  _updateUIAfterConversion(affectedItems) {
    // Find the parent section component
    const sectionComponent =
      this.closest(".section-wrapper")?.querySelector("section-component");
    if (!sectionComponent) return;

    // If it's an array section, update the corresponding section items
    if (Array.isArray(affectedItems) && affectedItems.length > 0) {
      if (sectionComponent.shadowRoot) {
        const items =
          sectionComponent.shadowRoot.querySelectorAll("section-item");

        // Update each affected item in the UI
        affectedItems.forEach((affected) => {
          if (affected.index !== undefined) {
            // Find the array item by index
            const item = Array.from(items).find(
              (item) =>
                item.getAttribute("data-index") === String(affected.index)
            );

            if (item && item.shadowRoot) {
              // Find the property input within the item
              const propertyInput = item.shadowRoot.querySelector(
                `[data-property="${affected.property}"]`
              );
              if (propertyInput) {
                // Force a re-render of this item
                item.loadArrayItemData();
                item.render();
              }
            }
          } else if (affected.key !== undefined) {
            // Find the direct property item by key
            const item = Array.from(items).find(
              (item) => item.getAttribute("data-key") === affected.key
            );

            if (item) {
              // Force a re-render
              item.render();
            }
          }
        });
      }
    }

    // Alternatively, trigger a full render of the section
    if (typeof sectionComponent.render === "function") {
      sectionComponent.render();
    }
  }

  convertValueToType(value, type) {
    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      default:
        return value;
    }
  }

  getDataManager() {
    // Try to find DataManager from window or through parent components
    return (
      window.dataManager ||
      document.querySelector("#editor-container")?.dataManager
    );
  }
}

customElements.define("conversion-component", ConversionComponent);

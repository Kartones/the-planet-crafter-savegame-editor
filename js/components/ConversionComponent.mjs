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
    this._saveInputValues();

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/css/styles.css">
      <div class="conversion-container">
        ${this.renderPropertySelector()}
        <span class="conversion-label">Convert all from</span>
        <input type="text" id="from-value" placeholder="Old value" value="${
          this._fromValue
        }">
        <span class="conversion-label">into</span>
        <input type="text" id="to-value" placeholder="New value" value="${
          this._toValue
        }">
        <button
          id="apply-conversion"
          ${!this._fromValue.trim() || !this._toValue.trim() ? "disabled" : ""}
          title="${
            !this._fromValue.trim() || !this._toValue.trim()
              ? "Please enter both old and new values"
              : "Click to convert values"
          }"
        >Apply</button>
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
      for (let i = 0; i < sectionData.length; i++) {
        const item = sectionData[i];

        if (!item || typeof item !== "object") {
          console.log(`Item ${i} is not an object:`, item);
          continue;
        }

        if (!(this.itemKey in item)) {
          console.log(`Item ${i} does not have property '${this.itemKey}'`);
          continue;
        }

        const currentValue = item[this.itemKey];
        const currentValueStr = String(currentValue).trim();
        const fromValueStr = String(fromValue).trim();

        if (currentValueStr === fromValueStr) {
          const originalType = typeof currentValue;

          const convertedValue = this.convertValueToType(toValue, originalType);

          dataManager.updateValue({
            sectionKey: this.sectionKey,
            index: i,
            type: "array-item",
            propertyName: this.itemKey,
            newValue: convertedValue,
          });

          conversionCount++;
          affectedComponents.push({ index: i, property: this.itemKey });
        }
      }
    } else if (typeof sectionData === "object" && sectionData !== null) {
      for (const key in sectionData) {
        if (key === this.itemKey) {
          const currentValue = sectionData[key];
          const currentValueStr = String(currentValue).trim();
          const fromValueStr = String(fromValue).trim();

          if (currentValueStr === fromValueStr) {
            const originalType = typeof currentValue;

            const convertedValue = this.convertValueToType(
              toValue,
              originalType
            );

            dataManager.updateValue({
              sectionKey: this.sectionKey,
              key: this.itemKey,
              newValue: convertedValue,
            });

            conversionCount++;
            affectedComponents.push({ key: key });
          }
        }
      }
    }

    if (conversionCount > 0) {
      this._updateUIAfterConversion(affectedComponents);
    }

    alert(
      `Converted ${conversionCount} item${conversionCount !== 1 ? "s" : ""}`
    );
  }

  _updateUIAfterConversion(affectedItems) {
    if (!Array.isArray(affectedItems) || affectedItems.length === 0) {
      return;
    }

    const parentNode = this.getRootNode();
    if (!parentNode || !parentNode.host) return;

    const sectionComponent = parentNode.host;
    if (!sectionComponent) return;

    if (typeof sectionComponent.render === "function") {
      const dataManager = window.dataManager || this.getDataManager();
      if (dataManager) {
        const freshData = dataManager.getSectionData(this.sectionKey);
        if (freshData) {
          sectionComponent._data = freshData;
        }
      }

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
    return (
      window.dataManager ||
      document.querySelector("#editor-container")?.dataManager
    );
  }
}

customElements.define("conversion-component", ConversionComponent);

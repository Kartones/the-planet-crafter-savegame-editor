export class SectionItemComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.key = this.getAttribute("data-key") || "";
    this.type = this.getAttribute("data-type") || "unknown";
    this.value = this.getAttribute("data-value");
    this.index = this.getAttribute("data-index");

    this.loadArrayItemData();

    if (this.type === "array-item") {
      // Add a small delay to ensure parent data is available
      setTimeout(() => this.render(), 10);
    } else {
      this.render();
    }
  }

  loadArrayItemData() {
    if (this.type === "array-item" && this.parentElement) {
      const parentComponent = this.closest("section-component");
      if (!parentComponent) {
        return;
      }

      if (this.index === null || this.index === undefined) {
        return;
      }

      if (typeof parentComponent.getArrayItemAt === "function") {
        this.arrayItemData = parentComponent.getArrayItemAt(this.index);
        if (this.arrayItemData !== undefined) {
          return;
        }
      }

      if (parentComponent.data && Array.isArray(parentComponent.data)) {
        const numericIndex = parseInt(this.index, 10);
        if (
          !isNaN(numericIndex) &&
          numericIndex >= 0 &&
          numericIndex < parentComponent.data.length
        ) {
          this.arrayItemData = parentComponent.data[numericIndex];
        }
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 8px;
        }
        .item {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .item-label {
          min-width: 150px;
          font-weight: bold;
          margin-right: 10px;
        }
        input {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex: 1;
        }
        select {
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        .null-value {
          color: #888;
          font-style: italic;
        }
        .array-item {
          border: 1px solid #eee;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
        }
        .array-item-header {
          font-weight: bold;
          margin-bottom: 5px;
        }
      </style>
      ${this.renderItem()}
    `;

    const inputs = this.shadowRoot.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        const propertyName = e.target.getAttribute("data-property");
        this.handleValueChange(e.target.value, propertyName);
      });
    });
  }

  renderItem() {
    if (this.type === "array-item") {
      return this.renderArrayItem();
    }

    if (this.value === "null") {
      return `
        <div class="item">
          <div class="item-label">${this.key}</div>
          <div class="null-value">&lt;null&gt;</div>
        </div>
      `;
    }

    if (this.value === undefined || this.value === "") {
      return `
        <div class="item">
          <div class="item-label">${this.key}</div>
          <div class="null-value">&lt;Empty&gt;</div>
        </div>
      `;
    }

    if (this.type === "boolean") {
      const boolValue = this.value === "true" || this.value === true;
      return `
        <div class="item">
          <div class="item-label">${this.key}</div>
          <select>
            <option value="true" ${boolValue ? "selected" : ""}>Yes</option>
            <option value="false" ${!boolValue ? "selected" : ""}>No</option>
          </select>
        </div>
      `;
    }

    if (this.type === "number") {
      return `
        <div class="item">
          <div class="item-label">${this.key}</div>
          <input type="number" value="${this.value}" step="${
        this.value.includes(".") ? "0.01" : "1"
      }">
        </div>
      `;
    }

    return `
      <div class="item">
        <div class="item-label">${this.key}</div>
        <input type="text" value="${this.value || ""}">
      </div>
    `;
  }

  renderArrayItem() {
    const numIndex = parseInt(this.index, 10);
    const itemNumber = !isNaN(numIndex) ? numIndex + 1 : "?";

    if (this.arrayItemData === undefined) {
      this.loadArrayItemData();

      if (this.arrayItemData === undefined) {
        return `
          <div class="array-item">
            <div class="item">
              <div class="item-label">Item ${itemNumber}</div>
              <div class="null-value">&lt;Error: Unable to load item&gt;</div>
            </div>
          </div>
        `;
      }
    }

    if (this.arrayItemData === null) {
      return `
        <div class="array-item">
          <div class="item">
            <div class="item-label">Item ${itemNumber}</div>
            <div class="null-value">&lt;null&gt;</div>
          </div>
        </div>
      `;
    }

    if (typeof this.arrayItemData !== "object") {
      const displayValue = this.arrayItemData.toString();
      return `
        <div class="array-item">
          <div class="item">
            <div class="item-label">Item ${itemNumber}</div>
            <input type="text" value="${displayValue}">
          </div>
        </div>
      `;
    }

    return `
      <div class="array-item">
        <div class="array-item-header">Item ${itemNumber}</div>
        ${Object.entries(this.arrayItemData)
          .map(([key, value]) => {
            // For each property in the object
            if (value === null) {
              return `
              <div class="item">
                <div class="item-label">${key}</div>
                <div class="null-value">&lt;null&gt;</div>
              </div>
            `;
            } else if (typeof value === "boolean") {
              return `
              <div class="item">
                <div class="item-label">${key}</div>
                <select data-property="${key}">
                  <option value="true" ${value ? "selected" : ""}>Yes</option>
                  <option value="false" ${!value ? "selected" : ""}>No</option>
                </select>
              </div>
            `;
            } else if (typeof value === "number") {
              return `
              <div class="item">
                <div class="item-label">${key}</div>
                <input type="number" data-property="${key}" value="${value}" step="${
                String(value).includes(".") ? "0.01" : "1"
              }">
              </div>
            `;
            } else {
              return `
              <div class="item">
                <div class="item-label">${key}</div>
                <input type="text" data-property="${key}" value="${
                value || ""
              }">
              </div>
            `;
            }
          })
          .join("")}
      </div>
    `;
  }

  handleValueChange(newValue, propertyName) {
    // notify parent components that a value has changed
    const event = new CustomEvent("value-changed", {
      bubbles: true,
      composed: true,
      detail: {
        key: propertyName || this.key,
        index: this.index,
        type: this.type,
        oldValue: this.value,
        newValue: newValue,
        propertyName: propertyName,
      },
    });
    this.dispatchEvent(event);

    this.value = newValue;
  }
}

customElements.define("section-item", SectionItemComponent);

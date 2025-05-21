export class SectionComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.getArrayItemAt = this.getArrayItemAt.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
    this._conversionComponent = null;
  }

  connectedCallback() {
    this.render();
  }

  set data(value) {
    this._data = value;
    this.sectionKey = this.getAttribute("section-key") || "Unknown Section";
    this.render();
  }

  get data() {
    return this._data;
  }

  set conversionComponent(component) {
    this._conversionComponent = component;
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }

  toggleCollapse(event) {
    const content = this.shadowRoot.querySelector(".section-content");
    const header = this.shadowRoot.querySelector(".section-header");

    if (content && header) {
      const isCollapsed = content.classList.toggle("collapsed");
      if (isCollapsed) {
        header.classList.add("collapsed");
      } else {
        header.classList.remove("collapsed");
      }
    }
  }

  render() {
    if (
      !this._data &&
      this._data !== null &&
      this._data !== 0 &&
      this._data !== false
    ) {
      return;
    }

    let conversionComponent = this._conversionComponent;
    if (!conversionComponent && this.shadowRoot) {
      const conversionContainer = this.shadowRoot.querySelector(
        "#conversion-container"
      );
      if (conversionContainer && conversionContainer.firstChild) {
        conversionComponent = conversionContainer.firstChild;
      }
    }

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="css/styles.css">
      <div class="section">
        <div class="section-header collapsed" part="section-header">${
          this.sectionKey
        }</div>
        <div class="section-content collapsed" id="content">
          <div id="conversion-container"></div>
          <div class="section-items">
            ${this.renderContent()}
          </div>
        </div>
      </div>
    `;

    const header = this.shadowRoot.querySelector(".section-header");
    if (header) {
      header.addEventListener("click", this.toggleCollapse);
    }

    this._conversionComponent = conversionComponent;

    if (this._conversionComponent) {
      const conversionContainer = this.shadowRoot.querySelector(
        "#conversion-container"
      );
      if (conversionContainer) {
        conversionContainer.appendChild(this._conversionComponent);
      }
    }

    if (Array.isArray(this._data)) {
      setTimeout(() => {
        const items = this.shadowRoot.querySelectorAll(
          'section-item[data-type="array-item"]'
        );
        items.forEach((item) => {
          const index = parseInt(item.getAttribute("data-index"), 10);
          if (!isNaN(index) && index >= 0 && index < this._data.length) {
            item.arrayItemData = this._data[index];
            if (typeof item.render === "function") {
              item.render();
            }
          }
        });
      }, 10);
    }
  }

  renderContent() {
    if (this._data === null) {
      return '<div class="empty-message">&lt;null&gt;</div>';
    }

    if (
      (Array.isArray(this._data) && this._data.length === 0) ||
      (typeof this._data === "object" &&
        !Array.isArray(this._data) &&
        Object.keys(this._data).length === 0)
    ) {
      return '<div class="empty-message">&lt;Empty Section&gt;</div>';
    }

    if (Array.isArray(this._data)) {
      return this._data
        .map((item, index) => {
          let valueAttr = "";
          if (item === null) {
            valueAttr = "null";
          } else if (typeof item !== "object") {
            valueAttr = item.toString();
          }

          return `<section-item
          data-index="${index}"
          data-type="array-item"
          data-value="${valueAttr}">
        </section-item>`;
        })
        .join("");
    }

    if (typeof this._data !== "object") {
      return `<section-item
        data-value="${this._data}"
        data-type="${typeof this._data}"
        data-key="${this.sectionKey}">
      </section-item>`;
    }

    return Object.entries(this._data)
      .map(([key, value]) => {
        let dataValue = "";
        if (value === null) {
          dataValue = "null";
        } else if (typeof value === "string") {
          dataValue = value;
        } else if (typeof value === "number" || typeof value === "boolean") {
          dataValue = value.toString();
        }

        return `<section-item
        data-key="${key}"
        data-type="${typeof value}"
        data-value="${dataValue}">
      </section-item>`;
      })
      .join("");
  }

  getArrayItemAt(index) {
    const dataManager = window.dataManager;
    if (dataManager) {
      const sectionKey = this.getAttribute("section-key");
      if (sectionKey) {
        const freshData = dataManager.getSectionData(sectionKey);
        if (Array.isArray(freshData) && index !== null && index !== undefined) {
          const numIndex = parseInt(index, 10);
          if (
            !isNaN(numIndex) &&
            numIndex >= 0 &&
            numIndex < freshData.length
          ) {
            return freshData[numIndex];
          }
        }
      }
    }

    // Fall back to local data if dataManager is not available
    if (Array.isArray(this._data) && index !== null && index !== undefined) {
      const numIndex = parseInt(index, 10);
      if (!isNaN(numIndex) && numIndex >= 0 && numIndex < this._data.length) {
        return this._data[numIndex];
      }
    }
    return undefined;
  }
}

customElements.define("section-component", SectionComponent);

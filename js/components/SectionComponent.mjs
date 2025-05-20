export class SectionComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.getArrayItemAt = this.getArrayItemAt.bind(this);
    this.toggleCollapse = this.toggleCollapse.bind(this);
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

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 20px;
        }
        .section {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        .section-header {
          background-color: #f5f5f5;
          padding: 10px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }
        .section-header::after {
          content: "▼";
          font-size: 0.8em;
          transition: transform 0.2s;
          opacity: 0.7;
          margin-left: 5px;
        }
        .section-header.collapsed::after {
          transform: rotate(-90deg);
        }
        .section-header:hover::after {
          opacity: 1;
        }
        .section-content {
          padding: 15px;
          transition: max-height 0.3s ease-out, padding 0.3s ease-out;
          overflow: hidden;
        }
        .section-content.collapsed {
          max-height: 0;
          padding: 0 15px;
          border-bottom: none;
          visibility: hidden;
        }
        .empty-message {
          color: #888;
          font-style: italic;
        }
      </style>
      <div class="section">
        <div class="section-header collapsed" part="section-header">${
          this.sectionKey
        }</div>
        <div class="section-content collapsed" id="content">
          ${this.renderContent()}
        </div>
      </div>
    `;

    const header = this.shadowRoot.querySelector(".section-header");
    if (header) {
      header.addEventListener("click", this.toggleCollapse);
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
            // Force a re-render of the item
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
      // TODO: use map instead of for loop
      let itemsHtml = "";
      for (let index = 0; index < this._data.length; index++) {
        const item = this._data[index];
        let valueAttr = "";
        if (item === null) {
          valueAttr = "null";
        } else if (typeof item !== "object") {
          valueAttr = item.toString();
        }

        itemsHtml += `<section-item
          data-index="${index}"
          data-type="array-item"
          data-value="${valueAttr}">
        </section-item>`;
      }

      return itemsHtml;
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

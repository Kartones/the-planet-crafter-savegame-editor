export class DataManager {
  constructor(initialData = {}) {
    this.data = initialData;
    this.listeners = [];
  }

  getAllData() {
    return this.data;
  }

  getSectionData(sectionKey) {
    return this.data[sectionKey];
  }

  updateValue({ sectionKey, key, index, type, newValue, propertyName }) {
    if (type === "array-item" && index !== undefined) {
      const section = this.data[sectionKey];
      if (Array.isArray(section)) {
        // Convert index to number as it might be a string from the attribute
        const numIndex = parseInt(index, 10);

        if (!isNaN(numIndex) && numIndex >= 0 && numIndex < section.length) {
          if (propertyName) {
            // If propertyName is provided, update that specific property in the array item
            if (
              typeof section[numIndex] === "object" &&
              section[numIndex] !== null
            ) {
              section[numIndex][propertyName] = this.convertValue(
                newValue,
                typeof section[numIndex][propertyName]
              );
            }
          } else if (key) {
            if (
              typeof section[numIndex] === "object" &&
              section[numIndex] !== null
            ) {
              section[numIndex][key] = this.convertValue(
                newValue,
                typeof section[numIndex][key]
              );
            }
          } else {
            section[numIndex] = this.convertValue(
              newValue,
              typeof section[numIndex]
            );
          }
        }
      }
    } else if (key) {
      const section = this.data[sectionKey];
      if (
        typeof section === "object" &&
        section !== null &&
        !Array.isArray(section)
      ) {
        section[key] = this.convertValue(newValue, typeof section[key]);
      }
    } else {
      this.data[sectionKey] = this.convertValue(
        newValue,
        typeof this.data[sectionKey]
      );
    }

    this.notifyListeners();
  }

  convertValue(value, originalType) {
    if (value === "null") return null;

    switch (originalType) {
      case "number":
        return Number(value);
      case "boolean":
        return value === "true";
      default:
        return value;
    }
  }

  addChangeListener(callback) {
    if (typeof callback === "function" && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  removeChangeListener(callback) {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.data));
  }

  exportAsJson() {
    return JSON.stringify(this.data, null, 2);
  }

  generateSavegameContent() {
    // Format the data back to the original structure with @ separators and strange array-item delimiters
    return (
      // There is an empty newline at the beginning of the file
      "\n" +
      Object.values(this.data)
        .map((section) => {
          if (section === null) {
            return "\n";
          }

          if (Array.isArray(section)) {
            // The format is `{"id":1}|`{"id":2}|`{"id":3}` (last item without |)
            // For arrays, each item on a line ending with |
            return section.map((item) => JSON.stringify(item)).join("|\n");
          } else {
            // For other sections, just stringify the JSON
            return JSON.stringify(section);
          }
        })
        .join("\n@\n") +
      "@"
    );
  }
}

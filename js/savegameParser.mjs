export function parseSavegame(fileContent) {
  const normalizedContent = fileContent.replace(/\r\n/g, "\n");

  const rawSections = normalizedContent.split("@");
  const savegameData = {};

  rawSections.forEach((section, index) => {
    const sectionKey = `section${index}`;
    const trimmedSection = section.trim();

    // If section is empty or just contains "@", store as null
    if (!trimmedSection) {
      savegameData[sectionKey] = null;
      return;
    }

    try {
      const lines = trimmedSection.split("\n");
      // If any line ends with a pipe, the section is an array of objects,
      // each on a line delimited by a pipe
      const hasPipeEnding = lines.some((line) => line.trim().endsWith("|"));

      if (hasPipeEnding) {
        const results = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const jsonString = line.endsWith("|") ? line.slice(0, -1) : line;

          try {
            const parsed = JSON.parse(jsonString);
            results.push(parsed);
          } catch (lineError) {
            console.error(
              `Error parsing line ${i} in section ${sectionKey}:`,
              lineError,
              "Line content:",
              jsonString
            );
          }
        }

        if (results.length > 0) {
          savegameData[sectionKey] = results;
        } else {
          try {
            savegameData[sectionKey] = JSON.parse(trimmedSection);
          } catch (sectionError) {
            console.error(
              `Error parsing section ${sectionKey} as JSON:`,
              sectionError
            );
            savegameData[sectionKey] = []; // Set as empty array instead of null
          }
        }
      } else {
        // If no line ends with a pipe, the section is a standard JSON object
        try {
          savegameData[sectionKey] = JSON.parse(trimmedSection);
        } catch (sectionError) {
          console.error(
            `Error parsing trimmed section ${sectionKey}:`,
            sectionError
          );
          savegameData[sectionKey] = null;
        }
      }
    } catch (error) {
      console.error(`Error parsing section ${sectionKey}:`, error);
      savegameData[sectionKey] = null;
    }
  });

  // Delete last section, as it marks the EOF (the file ends in `@`)
  delete savegameData[`section${rawSections.length - 1}`];

  return savegameData;
}

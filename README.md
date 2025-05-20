# The Planet Crafter Editor

A minimalistic editor for [The Planet Crafter](https://store.steampowered.com/app/1284190/The_Planet_Crafter/) savegame files.

⚠️ Vibe-coding experiment ⚠️ The code will be manually cleaned up and improved, and this message will go away when done so. **Always make backups of your savegames before using this tool**. ⚠️

## Features

- Load savegame files and display their contents
- Editing and saving coming soon
- Saving works, I'll put up an online version of the editor.

## Installation

```bash
pnpm install
```

## Running Locally

```bash
pnpm start
```

Then open your browser at http://localhost:8080

> **Note:** Due to browser security restrictions with ES modules and file access, running via HTTP server is required. Direct file access will not work properly.

## Usage

1. Once the application is open, click the "Load savegame" button
2. Select a `.json` savegame file
3. The parsed data will be logged to the console (press F12 to view)

## Development

- This project uses vanilla JavaScript (ES modules), HTML, and CSS
- Run `pnpm test` to execute the test script

## Savegame File Format

The Planet Crafter uses a custom format for its savegame files:

- Each file contains multiple sections separated by the `@` character
- Sections can be either:
  - A single JSON object (for game settings, player stats, etc.)
  - An array of JSON objects (for game entities, inventory items, etc.)
  - Empty (represented as `null` in the parsed data)
- In array sections, each object ends with a `|` character
- The last section is empty and marks the end of the file

### Parser Implementation

The parser (`js/savegameParser.mjs`) handles this custom format by:
1. Splitting the file by `@` characters into sections
2. For each section:
   - If a section contains lines ending with `|`, it's treated as an array of objects
   - Otherwise, it attempts to parse the section as a single JSON object
   - Empty sections are returned as `null`
3. The last section is removed (EOF marker)

The result is an object with keys like `section0`, `section1`, etc., each containing the parsed data from that section.

## Testing

The project includes tests that verify the parser works correctly with both example data and real savegame files.

Run the tests with:
```bash
pnpm test
``` 
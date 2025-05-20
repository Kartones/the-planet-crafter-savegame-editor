# The Planet Crafter Editor

A minimalistic editor for [The Planet Crafter](https://store.steampowered.com/app/1284190/The_Planet_Crafter/) savegame files.

⚠️ **Always make backups of your savegames before using this tool** ⚠️

Can be used online at: [https://kartones.net/demos/032/](https://kartones.net/demos/032/)

## Features

- Load savegame files and display their contents
- Editing fields (check my post for details)
- Saving changes (generates a new savegame file)

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

## Testing

The project includes tests that verify the parser works correctly with both example data and real savegame files.

Tests run via the NodeJS test runner.

Run the tests with:
```bash
pnpm test
``` 
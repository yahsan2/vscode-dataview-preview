# VSCode Dataview Preview

Render [Obsidian Dataview](https://blacksmithgu.github.io/obsidian-dataview/) queries directly within VSCode's built-in Markdown preview.

This extension brings the power of dynamic data querying to your Markdown workspace in VSCode. It indexes your Markdown files (frontmatter, tags, lists, tasks) and allows you to query them using the Dataview Query Language (DQL).

## Screenshots

![Dataview Query Example](https://raw.githubusercontent.com/yahsan2/vscode-dataview-preview/main/demo/screenshot.png)

*Example: Querying daily notes with weather and mood data*


## Features

- **Dataview Query Language (DQL) Support**:
  - `TABLE`: Create tables with columns from file properties.
  - `LIST`: List files or properties.
  - `FROM`: Filter by folder or tags.
  - `WHERE`: Filter results based on fields.
  - `SORT`: Sort results by any field.
  - `FLATTEN`: Unroll lists (e.g., tasks) into individual rows.
  - `AS`: Rename columns (e.g., `file.day AS "Date"`).
- **Seamless Integration**: Works directly in VSCode's standard Markdown preview.
- **Live Updates**: Preview updates automatically when you save files or switch editors.
- **Clickable Links**: File links in tables and lists open directly in the VSCode editor.

## Installation

### Option 1: Install from VSIX (Recommended)

1. Download the latest `.vsix` file from the [Releases](https://github.com/yahsan2/vscode-dataview-preview/releases) page
2. Open VSCode
3. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
4. Type "Extensions: Install from VSIX..." and select it
5. Navigate to the downloaded `.vsix` file and select it
6. Reload VSCode when prompted

### Option 2: Install from Source (For Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/yahsan2/vscode-dataview-preview.git
   cd vscode-dataview-preview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the extension:
   ```bash
   npm run compile
   ```

4. Open the project in VSCode:
   ```bash
   code .
   ```

5. Press `F5` to launch a new VSCode window with the extension loaded

### Verify Installation

After installation, open any Markdown file with a `dataview` code block. The preview should automatically render the query results.

## Usage

Simply add a `dataview` code block to your Markdown file:

```dataview
TABLE file.day AS "Date", weather, mood
FROM "daily"
WHERE mood = "good"
SORT file.day desc
```

### Supported Fields
- `file.name`: File name
- `file.path`: Absolute file path
- `file.link`: Clickable link to the file
- `file.day`: Date extracted from frontmatter (`date`) or filename (`yyyy-mm-dd`)
- `file.ctime`: Creation time
- `file.mtime`: Modification time
- `file.tags`: List of tags
- `file.lists`: List items in the file (useful with `FLATTEN`)
- Any YAML frontmatter property

## Demos

Check out the [Demo Gallery](demo/README.md) for practical use cases:

- 📅 [Daily Dashboard](demo/daily/dashboard.md)
- 🚀 [Project Management](demo/projects/overview.md)
- 📚 [Reading List](demo/books/library.md)
- 📝 [Meeting Tasks](demo/meetings/tasks.md)

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Compile the extension:
   ```bash
   npm run compile
   ```
3. Run in debug mode:
   Press `F5` in VSCode.

## License

MIT

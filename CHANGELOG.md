# Change Log

All notable changes to the "vscode-dataview-preview" extension will be documented in this file.

## [0.0.1] - 2025-11-20

### Added
- Initial release
- Support for Dataview Query Language (DQL)
  - `TABLE` queries with column selection
  - `LIST` queries for file listings
  - `FROM` clause for folder and tag filtering
  - `WHERE` clause for field-based filtering
  - `SORT` clause for result ordering
  - `FLATTEN` clause for list expansion
  - `AS` keyword for column aliasing
- File metadata support:
  - `file.name`, `file.path`, `file.link`
  - `file.day` (from frontmatter or filename)
  - `file.ctime`, `file.mtime`
  - `file.tags`, `file.lists`
- Frontmatter parsing (YAML)
- Clickable file links in preview
- Live preview updates on file save
- Demo gallery with practical examples

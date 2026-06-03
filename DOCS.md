# BOOKMRK — End-User Documentation

Welcome to BOOKMRK — a lightweight bookmark / board manager with a browser-extension-style manifest and a React + Vite front-end. This document explains how the application behaves, how to install and run it, how to use each feature, and details on the project structure so end users and power users can understand and troubleshoot the product.

Table of contents
- Introduction
- Quick Start
- Installation & Development
- Building for production
- Browser extension specifics
- Core features and UI walkthrough
- Component reference
- Data model & storage
- Settings and configuration
- Keyboard shortcuts and power-user tips
- Troubleshooting
- FAQ
- Contributing
- Appendix: file map and references

---

## Introduction

BOOKMRK is a focused bookmarking and board management tool implemented as a React application bundled with Vite. The project is organized to support both a local web-app development experience and an extension-like manifest for browser integration. The app aims to be fast, keyboard-friendly, and extensible.

This documentation covers everything an end user needs to know to use the app and to set up and run it locally for development.

High-level goals:
- Easy, fast bookmarking and page saving
- Organize bookmarks on boards and pages
- Quick-save modal and on-page keyboard interactions
- Sync-friendly storage model (local-first)

---

## Quick Start

If you just want to try the app locally for evaluation:

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open the URL printed by Vite (usually `http://localhost:5173`).

For a production build:

```bash
npm run build
npm run preview
```

Notes:
- The app is configured via Vite and TypeScript; see `tsconfig.json` and `vite.config.ts` for bundler settings.
- Static public assets are in the `public/` directory.

---

## Installation & Development

System requirements
- Node.js >= 16.8 LTS (or later recommended)
- npm (bundled with Node) or yarn

Developer setup steps

1. Clone the repo and change into the project folder.
2. Install packages with `npm install`.
3. Run `npm run dev` to start a hot-reloading dev server.

Scripts available in `package.json` (typical):
- `dev` — start dev server
- `build` — build for production
- `preview` — preview the production build locally

If you modify TypeScript configuration, restart the dev server.

---

## Building for production

To create a production build run:

```bash
npm run build
```

The build output will be in `dist/` (default Vite output). To preview the build run:

```bash
npm run preview
```

When packaging as a browser extension,
- Use the output assets and the `manifest.json` file in `public/` to produce an extension bundle.
- Background scripts and content scripts are in `background.js` and `content_toast.js`.

---

## Browser extension specifics

The repo contains typical extension artifacts, enabling the project to be used both as a web app and as an extension.

Key files:
- `public/manifest.json` — extension manifest (permissions, icons, content/background scripts)
- `background.js` — background script (entrypoint for extension background tasks)
- `content_toast.js` — content script to show small notifications or to integrate quick-save flows from web pages

Behavioral notes:
- The extension's quick-save flow can be triggered from the content script which communicates with the UI or stores data locally.
- Icons are stored under `public/icons/` and referenced in `manifest.json`.

Packaging recommendation:
- When building for an extension platform, copy the `dist/` output into a temporary folder with `manifest.json` and `icons/`, then load it as an unpacked extension for testing.

---

## Core features and UI walkthrough

This section describes the user-facing features and how they behave.

Primary features
- Boards: group bookmarks visually into boards and columns.
- Pages: a page is a collection or view within a board.
- Bookmarks: saved items with title, url, description, and optional favicon.
- Quick Save: a modal to rapidly save the current page or URL.
- Search: global search modal to locate bookmarks quickly.
- Settings & Import/Export: manage preferences and backup/restore data.

Top-level UI elements
- Header / Toolbar: provides quick actions like search and add.
- Sidebar: navigation between boards and pages.
- Board view: columns with bookmark tiles and drag/drop support.

Walkthrough — saving a bookmark
1. Open the Quick Save modal via the toolbar or a keyboard shortcut.
2. Enter a title, choose a board and page, optionally edit the favicon or description.
3. Click Save — the bookmark will appear in the selected board/page and persist to local storage.

Walkthrough — creating and organizing boards
1. Open the Sidebar and choose Add Board.
2. Name the board and optionally create default columns.
3. Drag bookmarks between columns to reorganize.

Search
- Press search hotkey (or click the Search icon). The Search modal supports fuzzy matching across titles and descriptions.

Quick Tips
- Use keyboard navigation inside lists for fast operations.
- Use the Bookmark tile's context menu to edit or delete items.

---

## Component reference

This section explains the visible React components and their behaviors. It is written for end users who want to understand how UI pieces map to features. Developers will find it useful as well.

Note: component names match files in `src/components/`.

### `Toolbar` (`src/components/Toolbar.tsx`)
- Purpose: top-level action bar for quick commands (search, add bookmark, settings).
- Visible controls: Search button, Add bookmark button, Settings.
- Behavior: clicking Search opens `SearchModal`; Add opens `QuickSaveModal` or `AddBookmarkModal` depending on context; Settings opens `SettingsModal`.

Usage details:
- Hovering on icons reveals tooltips.
- Disabled states: if no bookmark is selected, some actions hide or become disabled.

---

### `Sidebar` (`src/components/Sidebar.tsx`)
- Purpose: navigate between Boards, Pages, and Settings.
- Behavior: clicking a board updates the main view; right-clicking yields context actions like rename or delete.

User notes:
- Pin the sidebar to keep it visible; otherwise it auto-collapses on narrow screens.

---

### `BlurOverlay` (`src/components/BlurOverlay.tsx`)
- Purpose: UI backdrop used when modals are open.
- Behavior: clicking the overlay closes the active modal unless the modal requests a confirmation.

---

### `BoardColumn` (`src/components/Board/BoardColumn.tsx`)
- Purpose: container for a vertical list of bookmark tiles.
- Behavior: supports drag-and-drop reordering; shows column title and count of bookmarks.

User guidance:
- To move a tile between columns, drag and drop. Keyboard reordering is supported via accessible controls in the tile menu.

---

### `BoardSettingsModal` (`src/components/Board/BoardSettingsModal.tsx`)
- Purpose: edit board metadata and column structure.
- Behavior: change board title, add/remove columns, reorder columns.

Notes:
- Column reordering sometimes requires dragging the column header in the settings UI.

---

### Bookmark components

`AddBookmarkModal` (`src/components/Bookmark/AddBookmarkModal.tsx`)
- Purpose: create a bookmark manually.
- Fields: Title, URL, Description, Choose Board/Page, Tags, Favicon.
- Behavior: validates the URL, fetches favicon suggestions if available.

`QuickSaveModal` (`src/components/Bookmark/QuickSaveModal.tsx`)
- Purpose: minimal save flow for saving the current page (or a provided URL).
- Behavior: autofill title and URL if present; allow quick selection of target board/page; Save persists immediately.

`BookmarkSettingsModal` (`src/components/Bookmark/BookmarkSettingsModal.tsx`)
- Purpose: edit existing bookmark metadata.
- Behavior: update fields, optional move to different board/page, or delete.

`BookmarkTile` (`src/components/Bookmark/BookmarkTile.tsx`)
- Purpose: visual presentation of a bookmark inside a column.
- Behavior: click to open, right-click for options, drag to reorder.

`BookmarkFavicon` (`src/components/Shared/BookmarkFavicon.tsx`)
- Purpose: small component to display the favicon for a bookmark, falling back to a generated placeholder.

---

### Page components

`PageView` (`src/components/Page/PageView.tsx`)
- Purpose: shows the contents of a specific page within a board (columns and tiles).

`PageSettingsModal` (`src/components/Page/PageSettingsModal.tsx`)
- Purpose: edit page metadata and behavior (layout options, default sort order).

---

### Settings components

`SettingsModal` (`src/components/Settings/SettingsModal.tsx`)
- Purpose: global app settings like theme, keyboard shortcuts, and storage options.
- Typical options:
  - Theme (light/dark/system)
  - Default board/page on startup
  - Import/Export JSON backup

`InputModal` (`src/components/Shared/InputModal.tsx`)
- Purpose: generic input modal used for rename operations and small prompts.

`OnboardingModal` (`src/components/Shared/OnboardingModal.tsx`)
- Purpose: present onboarding steps to first-time users. It runs automatically when no data is present.

---

### Search components

`SearchModal` (`src/components/Search/SearchModal.tsx`)
- Purpose: search across bookmarks and pages.
- Behavior: instant fuzzy search with keyboard navigation of results.

---

### OperaGX folder
- Note: `src/components/OperaGX/` exists for platform-specific tweaks. If you use Opera GX, some UI optimizations/overrides apply.

---

### Shared utilities and hooks

`shared/types.ts` — TypeScript types used across the app such as `Bookmark`, `Board`, `Page`.

`shared/utils.ts` — utility helpers (formatting, validation, helpers to extract favicons).

`storage/local.ts` — an abstraction over localStorage (reads, writes, and version migration). It implements easy-to-use functions for saving boards and bookmarks.

`store/useStore.ts` — a central state hook (likely using Zustand or similar) which components use to read/write application state.

---

## Data model & storage

BOOKMRK uses a local-first storage model persisted in the browser's storage (localStorage). The main entities are:

- Bookmark
  - id: string (UUID)
  - title: string
  - url: string
  - description?: string
  - favicon?: string
  - pageId: string

- Page
  - id: string
  - title: string
  - boardId: string
  - columns: array of column ids or column definitions

- Board
  - id: string
  - title: string
  - pages: array of `Page` ids

Storage behaviors:
- Saves are batched and debounced to avoid excessive write frequency.
- A migration script `scripts/migrate_v1_to_v2.ts` exists for older storage versions. If you upgrade from a v1 export, use the script to migrate your data safely.

Backup and restore
- Use the Settings modal to export JSON backups of your data.
- To restore, use the Import option. Import validates the structure before overwriting existing data; the app also recommends downloading a local backup first.

---

## Settings and configuration

Settings are available in the `SettingsModal` and saved to local storage. Typical user-facing settings include:
- Theme selection: Light / Dark / System
- Default landing board/page
- Import/Export backup
- Toggle onboarding
- Keyboard shortcut preferences

Advanced configuration
- Editing `manifest.json` (only for extension builds): change permissions and icons.

Developer configuration
- TypeScript and Vite configuration are in `tsconfig.json` and `vite.config.ts`.

---

## Keyboard shortcuts and power-user tips

Default hotkeys (configurable in Settings)
- `Ctrl+K` or `Cmd+K` — Open Search Modal
- `Ctrl+S` or `Cmd+S` — Open Quick Save modal
- `Esc` — Close modal / overlay

Power-user tips
- Use Quick Save when browsing to stash pages rapidly.
- Keep frequently used board pinned in the sidebar for one-click access.
- Use exported JSON to create offline backups or to migrate between devices.

---

## Troubleshooting

Common issues and fixes
- Bookmarks not appearing after import: ensure the JSON format matches the schema and that pages and board IDs are present. Use the migration script if necessary.
- Favicon not loading: the app falls back to a generated placeholder. Check that the URL is valid and reachable.
- Extension packaging issues: ensure `manifest.json` version matches extension platform requirements (manifest v3 or v2 as required by target browser).

If the app fails to start
1. Confirm Node and npm versions.
2. Run `npm install` again.
3. Run `npm run dev` and inspect the terminal output for errors.

Reporting bugs
- Include a minimal reproduction, browser console logs, and steps to reproduce.

---

## FAQ

Q: Can I sync bookmarks across devices?
A: The current implementation uses localStorage only. You can export/import JSON to manually transfer data. Sync capabilities (cloud sync) can be implemented as a future feature.

Q: Does the app support tags and full-text search?
A: Tags are supported in the data model; the search modal supports fuzzy search across title and description. Tag-based filtering may be available in future releases.

Q: How do I migrate from an older version?
A: A migration script `scripts/migrate_v1_to_v2.ts` exists; follow instructions in `README.md` or run the script as described in the migration helper.

---

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repository.
2. Create a feature branch.
3. Run and test locally.
4. Open a pull request with a clear description.

Guidelines
- Keep changes focused and testable.
- Add or update documentation for user-facing changes.
- Follow TypeScript strictness used in the project.

See `CONTRIBUTING.md` for more details.

---

## Appendix: file map and references

This appendix lists important files and where they live.

- Project root
  - `package.json` — npm scripts and dependencies
  - `tsconfig.json` — TypeScript config
  - `vite.config.ts` — Vite configuration
  - `README.md` — short project README
  - `CONTRIBUTING.md` — contribution guidelines

- Public assets
  - `public/manifest.json` — extension manifest
  - `public/icons/*` — icon files

- Source files (high-level)
  - `src/main.tsx` — app entry
  - `src/App.tsx` — main app component
  - `src/index.css` — app styling
  - `src/components/*` — UI components (Toolbar, Sidebar, Board, Bookmark, etc.)
  - `src/shared/*` — shared types and utilities
  - `src/storage/local.ts` — storage adapter
  - `src/store/useStore.ts` — application store/hooks

Developer notes on the file map
- When changing component props, update both the UI and the `shared/types.ts` types to keep TypeScript consistent.

---

## Detailed component reference (expanded)

The following section expands the minimal component descriptions above into more detailed behavioral documentation meant for advanced users and testers. Each sub-section describes the user-visible interactions, expected results, edge cases, and error states.

### `App` (`src/App.tsx`)
- Responsibilities: initializes global providers (theme, store), mounts top-level UI components (Toolbar, Sidebar, Board/Page view), and sets up route handling if any.
- Startup behavior: checks local storage for existing data; if none present, opens `OnboardingModal`.
- Error states: If initialization fails (bad data), the app presents a migration or reset option to the user.

Edge cases
- Partial data in storage: the app tries to repair missing fields, but user will be prompted to backup then restore.

### `main.tsx` (`src/main.tsx`)
- Responsibilities: hydrate the React tree into `index.html`, apply CSS resets, and attach the Vite dev overlay in development.

### `useStore` (`src/store/useStore.ts`)
- Responsibilities: provide a central reactive store for boards, pages, and bookmarks. Exposes imperative functions to load, add, update, delete entities.
- Save semantics: changes are saved to local storage through the `storage/local.ts` adapter.

Examples of store methods
- `addBookmark(bookmark)` — validates and persists a bookmark
- `moveBookmark(id, destinationPageId, destinationColumnId)` — reorders and persists the move
- `exportData()` — returns a JSON snapshot of current state for backup

---

### `storage/local.ts` internals
- The module wraps `localStorage` and provides typed functions: `loadState()`, `saveState()`, `clearState()`, and migration helpers.
- It includes debouncing logic to prevent excessive writes when multiple UI updates occur in rapid succession.

Recovery behavior
- If the storage contains an incompatible version, the module either attempts to migrate automatically or exposes a migration error that surfaces in the UI with instructions.

---

## Accessibility and keyboard navigation

The app is designed to be keyboard-friendly and accessible:
- Focusable controls for toolbar and sidebar
- ARIA roles for modal dialogs
- Keyboard navigation in lists

If you rely on assistive tech and encounter issues, please open an issue with your browser and assistive tech versions.

---

## Exported commands and developer helpers

`scripts/migrate_v1_to_v2.ts` — run this with `ts-node` or compile + run with Node to transform old data formats into the newer layout. It is intended for advanced users migrating older backups.

Developer commands
- `npm run lint` — if present, runs linters
- `npm run test` — if tests exist, runs test suite

---

## Security and privacy

BOOKMRK stores user data locally and never phones home by default. If you add any integration that sends data to remote services, document it clearly and require opt-in.

Sensitive data handling
- No sensitive credentials are stored by default.

---

## Glossary

- Bookmark: an individual saved URL with metadata.
- Board: a named collection of pages used to organize bookmarks.
- Page: a view within a board; can contain columns of bookmarks.
- Quick Save: modal to save the current page.

---

## Example user scenarios

Scenario 1: Rapidly save research links
1. Browse multiple pages.
2. Each time press the Quick Save hotkey (or click the toolbar icon).
3. Select the target board and page and save — the bookmarks are persisted locally and can be arranged later.

Scenario 2: Share a curated board
1. Use Export from Settings to create a JSON snapshot.
2. Send the snapshot to your colleague.
3. The colleague imports the snapshot to reproduce your board structure locally.

---

## Release notes and changelog guidance

Keep a `CHANGELOG.md` in the root for public release notes. For internal dev notes, keep a `changelog/` folder with dated notes listing migration steps and notable fixes.

Suggested changelog template:
- Version X.Y.Z — YYYY-MM-DD
  - Added: ...
  - Changed: ...
  - Fixed: ...

---

## Developer contact and support

If you require help running the app or packaging the extension, please open an issue in the repository. Include the following when reporting a problem:
- Browser and version
- Node and npm versions
- Steps to reproduce
- Console logs and screenshots

---

## Final notes

This document is intended to be comprehensive for end-users who want to run, use, and understand BOOKMRK. If you need more developer-oriented documentation (API docs, component-level TypeDoc), ask and we can generate a `DEVELOPER.md` with type signatures and examples.

Thank you for using BOOKMRK!

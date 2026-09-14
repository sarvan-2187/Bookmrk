<a href="https://extension.js.org" target="_blank" rel="noopener noreferrer"><img src="https://img.shields.io/badge/Powered%20by%20%7C%20Extension.js-0971fe" alt="Powered by Extension.js" align="right" /></a>

# Bookmrk

> Open-source, local-first visual bookmark manager. Replaces your New Tab page with a four-column canvas of boards, and runs on Chrome, Firefox and Edge from a single codebase.

**v1.6.0** is a rebuild of [Bookmrk 1.5.0](https://github.com/sarvan-2187/Bookmrk) (Vite + two hand-maintained manifests) on top of [Extension.js](https://extension.js.org). Your data carries over — see [Migrating from 1.5.0](#migrating-from-150).

---

## Contents

- [Install](#install)
- [Features](#features)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Migrating from 1.5.0](#migrating-from-150)
- [What changed since 1.5.0](#what-changed-since-150)
- [Architecture](#architecture)
- [Development](#development)

---

## Install

Grab the ZIP for your browser from the [**Releases**](../../releases/latest) page — `Bookmrk-v1.6.0-chromium.zip`, `Bookmrk-v1.6.0-firefox.zip` or `Bookmrk-v1.6.0-edge.zip` — and extract it somewhere you'll keep (the browser loads it from that folder, so deleting it uninstalls the extension).

### Chrome / Edge

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the extracted folder.
4. Open a new tab — Bookmrk is there.

### Firefox

1. Open `about:debugging` → **This Firefox**.
2. Click **Load Temporary Add-on…** and select `manifest.json` inside the extracted folder.
3. Open a new tab.

> Firefox removes temporary add-ons when it restarts, so this needs redoing each session until the add-on is signed.

### Build it yourself

Requires Node.js 22.12+.

```bash
npm install
npm run build:chrome     # or build:firefox / build:edge  → dist/<browser>/
```

Load `dist/chrome` (or `dist/edge`) unpacked, or `dist/firefox/manifest.json` in `about:debugging`. To reproduce the release ZIPs exactly, run `npm run release`.

If you're changing the code, `npm run dev -- --browser=chrome` launches a browser with the extension loaded and hot-reloads as you edit — no manual reloading.

---

## Features

### Organising

- **Pages → Boards → Bookmarks.** Multiple pages, each a four-column canvas of boards.
- **Drag to rearrange.** Boards move between columns (empty columns are valid drop targets); bookmarks move within and across boards. Boards drag from their header; bookmarks drag from their favicon, which turns into a grip on hover.
- **Per-board bookmark limit.** Each page sets how many bookmarks show per board before a "Show more" fold.
- **Right-click anything.** Board → add bookmark, rename, open all, delete. Bookmark → open in new tab, copy link, edit, delete. `Shift+F10` does the same from the keyboard.

### Capture

- **Quick Save** — `Ctrl/Cmd+Shift+Y` on any page saves the current tab to a `Quick Saves` board (created on demand), with a confirmation toast injected into the page. Works even when Bookmrk isn't the active tab.
- **Right-click → Save to Bookmrk** from any page's context menu.
- **Import from your browser** — pulls Chrome/Firefox bookmarks into an `Imported` board.

### Finding

- **Search** (`/`) across titles, URLs, notes, tags, board and page names.
- **Command palette** (`Ctrl/Cmd+K`) covering **every** action in the app: page switch/create/rename/delete, new board, export/import, all four themes, colour modes, layouts, background, compact mode, blur, settings, help.
- **Tags** — tag any bookmark, then filter by tag chips in search.

### Appearance

- **Four themes** — Discord, Simple, NeoBrutalist, Neumorphism.
- **Deep-black (AMOLED) dark mode** for Discord and Simple: true `#000` page with cards lifted by a hairline border and a subtle glass blur rather than a lighter grey fill.
- **Colour mode** — System / Light / Dark, independent of theme.
- **Layout** — Sidebar or Tabs, also independent of theme. Every feature is reachable in both.
- **Backgrounds** — eight bundled Unsplash presets, or your own image URL / uploaded file.
- **Eight UI fonts**, compact mode, and optional bookmark descriptions.

### Safety & privacy

- **Undo delete.** Deleting a bookmark, board or page is staged for ~6 seconds with an Undo action on the toast.
- **Privacy blur** (`x`) blurs every bookmark until you hover one — for screen sharing.
- **Local-first.** Everything lives in `chrome.storage.local`. No account, no telemetry, no sync.

  Bookmrk makes exactly four kinds of outbound request, all of them a direct consequence of something you did:

  | Request | When |
  |---|---|
  | `google.com/s2/favicons` | Fetching a bookmark's icon |
  | The bookmarked page itself | On add — read once to scrape its `og:description` (`store/useStore.ts`) |
  | Your background image URL | If you set an image background (uploads are stored locally as data URLs) |
  | `ntfy.sh/bookmrk-help-v1` | Only when you submit the Settings → Support form |

### Accessibility

Focus is trapped in modals and restored on close; every icon-only control has an accessible name; menus support arrow-key navigation; drag-and-drop works from the keyboard (Space to lift, arrows to move, Space to drop); focus rings are guaranteed visible in every theme. Colour pairs are checked against WCAG AA.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Search bookmarks |
| `Ctrl/Cmd + K` | Command palette |
| `Ctrl/Cmd + Shift + Y` | Quick Save current tab (works on any page) |
| `p` | New page |
| `i` | Open settings |
| `s` | Toggle sidebar (Sidebar layout only) |
| `x` | Toggle privacy blur |
| `?` | Show shortcuts |
| `Right-click` / `Shift + F10` | Board or bookmark actions |
| `Esc` | Close the open modal or menu |

Shortcuts are ignored while typing in a field. `Ctrl/Cmd+K` works even then.

---

## Migrating from 1.5.0

**The data format is unchanged between 1.5.0 and 1.6.0**, so migration is an export/import:

1. In the original extension: sidebar → **Export JSON**.
2. In this build: **⋯ → Import JSON** (or `Ctrl/Cmd+K` → "Import JSON") and pick that file.

The two extensions have separate storage (different extension IDs), so installing this one never touches the original's data — keep both installed until you're happy.

Note that exports deliberately omit the background image to keep the file small; re-pick your background afterwards.

---

## What changed since 1.5.0

### Breaking

| | 1.5.0 | 1.6.0 |
|---|---|---|
| **Drag Mode** | Global toggle that had to be on to drag, and blocked ~8 other actions while active | **Removed.** Drag any time from a board header or a bookmark's favicon grip |
| **Board settings modal** | Modal with rename / summon / delete + confirm checkbox | **Removed.** Those actions are on the board's right-click menu; delete is undoable instead of confirmed |
| **Per-card action buttons** | `⋯` on every board header, `⋯`+🗑 on every bookmark row | **Removed.** Right-click (or `Shift+F10`) instead |
| **Toolbar** | 9 icon buttons | **4** — Search, Quick Save, Pages, ⋯ More. The rest moved into ⋯ and the command palette |
| **Theme picker button** | Palette button in the toolbar | **Removed** — theme lives in Settings → Appearance and in the palette |
| **Layout follows theme** | Discord got a sidebar; the other three got tabs, and Export/Import JSON were unreachable outside Discord | **Layout is its own setting** (`navStyle`), independent of theme. Every action is reachable in both layouts |
| **Firefox manifest** | Separate `public/manifest.firefox.json` | Single `src/manifest.json` using Extension.js `chromium:` / `firefox:` key prefixes |
| **`commands` permission** | Listed in `permissions` | Dropped — it was never a valid permission string; the `commands` manifest key is what matters |
| **`host_permissions`** | `https://*/*`, `http://*/*`, `<all_urls>` | Just `<all_urls>` (the other two were redundant) |
| **Build tooling** | Vite + custom `scripts/build-extension.mjs`, `package-release.mjs`, `web-ext` | Extension.js CLI (`extension build --browser …`). Those scripts and `vite.config.ts`, `web-ext.config.mjs`, `release.config.json` are gone |
| **Dependencies** | Included `@google/genai`, `express`, `dotenv`, `motion` | Dropped — `@google/genai` and `motion` had zero imports; the others only served the old dev server |

Settings added since: `colorMode`, `navStyle`. Both are optional and fall back to the original behaviour, so an old export imports cleanly.

### Path changes

The app moved under a `newtab/` entry point, since Extension.js keys pages by folder:

| Original | This build |
|---|---|
| `index.html`, `src/main.tsx`, `src/App.tsx` | `src/newtab/index.html`, `src/newtab/main.tsx`, `src/newtab/App.tsx` |
| `src/components/**`, `src/shared/**`, `src/store/**`, `src/storage/**` | `src/newtab/…` (same layout underneath) |
| `src/index.css` | `src/newtab/styles/index.css` (+ new `themes.css`, `components.css`) |
| `public/background.js` | `src/background.ts` |
| `public/content_toast.js` | `src/content/scripts.ts` |
| `public/manifest.json` + `public/manifest.firefox.json` | `src/manifest.json` |
| `public/icons/**` | `src/icons/**` |

New files: `src/newtab/shared/actions.ts` (shared prompt flows), `src/newtab/shared/commands.ts` (the command registry), `src/newtab/components/Shared/ui/*` (Button, IconButton, Menu, ContextMenu, Panel, Field), `src/newtab/styles/themes.css` + `components.css`.

### Fixed along the way

- Themes decided *which features existed*, not just how they looked — Export JSON, Import JSON and Backgrounds were unreachable in some themes.
- `--accent` equalled the surface colour in Simple and Neumorphism, so every primary button was invisible — and since the focus ring was `var(--accent)`, **keyboard focus was invisible in two of four themes**.
- `border-b` combined with `[border-width:…]` drew a full box instead of a divider (20 places), because `border-width` is the all-sides shorthand.
- A Tailwind group-name collision made *every* bookmark's drag grip appear at once when hovering anywhere in a column.
- Danger/warning/success colours were hardcoded hex in 14 files and ignored the active theme.
- The sidebar's "Chrome imported" check looked for a board name (`Imported Bookmarks`) that the importer never creates (`Imported`).

---

## Architecture

```
src/
├── manifest.json          # one cross-browser manifest (chromium:/firefox: prefixes)
├── background.ts          # context menu + quick-save command, writes chrome.storage.local
├── content/scripts.ts     # in-page Quick Save toast
└── newtab/                # the New Tab app
    ├── App.tsx            # shell, global shortcuts, theme/layout attributes
    ├── store/useStore.ts  # Zustand: data, modals, undo-delete staging
    ├── storage/local.ts   # chrome.storage.local adapter + JSON export/import
    ├── shared/            # types, utils, actions, command registry
    ├── styles/            # index.css, themes.css (tokens), components.css (primitives)
    └── components/        # Toolbar, Sidebar, PageView, Board, Bookmark, modals, ui/
```

Two conventions worth knowing before you edit:

1. **Themes are cosmetic only.** A theme may change how things look, never which controls exist or where they live — that's `Settings.navStyle`'s job. Components read `var(--token)` from `styles/themes.css`; they never branch on `isDark` / `isNeoBrutalist` to pick a colour.
2. **Every action belongs in `shared/commands.ts`.** The toolbar shows four buttons, so anything missing from the registry is unreachable by keyboard. Add features there too.

**Stack:** React 19, Zustand, dnd-kit, Tailwind v4, lucide-react, Sonner.

---

## Development

```bash
npm run dev                      # Chromium, hot reload
npm run dev -- --browser=firefox # or edge
npm run lint                     # tsc --noEmit
npm run build:chrome             # production build → dist/chrome
npm run build:firefox
npm run build:edge
npm run preview                  # preview a production build
```

### Cutting a release

```bash
npm run release                  # all three archives
npm run release -- firefox       # just one target
npm run zip:source               # source ZIP, only needed for Firefox AMO review
```

Produces `Bookmrk-v<version>-chromium.zip`, `-firefox.zip` and `-edge.zip` (~186 KB each) at the repo root, ready to attach to a GitHub Release. Root-level `*.zip` is gitignored, so build output never lands in history.

The version is read from `src/manifest.json` — bump that, then tag the release `v<version>` to match.

Before opening a PR: `npm run lint` and all three builds should be clean, and the change should be checked in each theme × both layouts × light/dark — that matrix is where this codebase historically broke.

---

## Licence

MIT.

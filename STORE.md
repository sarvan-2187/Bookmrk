# Store metadata

Submission material for the Chrome Web Store, Firefox Add-ons (AMO) and Edge Add-ons. Keep it current as the code changes rather than reconstructing it at submission time — the permission justifications in particular must match `src/manifest.json` exactly, or review bounces.

Primary distribution today is [GitHub Releases](../../releases) (load-unpacked). This file exists so a store submission is a filling-in exercise, not a rewrite.

Last updated: 2026-09-14 · Version: 1.6.0 (unreleased)

---

## Before you submit

Two items need a human decision — see [Privacy and data use](#privacy-and-data-use) for detail:

1. **The Firefox data-collection declaration is currently inaccurate.** `src/manifest.json` declares `data_collection_permissions.required: ["none"]`, but Settings → Support POSTs a user-supplied email address and message to `ntfy.sh`. Either amend the declaration or drop the form.
2. **Screenshots don't exist yet.** Every store requires at least one.

---

## Listing

- **Name:** Bookmrk
- **Summary:** Open-source, local-first visual bookmark manager for your New Tab page.
- **Category:** Productivity
- **Licence:** MIT
- **Screenshots:** TODO — at least one 1280×800 per store. Suggested set: (1) a populated board canvas, (2) the command palette open, (3) Quick Save's in-page toast, (4) the theme/layout settings.

### Description

Bookmrk turns your New Tab page into a place you actually organise things. Instead of one long bookmark list buried in a menu, you get pages of boards laid out on a four-column canvas — one board for a project, one for a course, one for the things you'll read later — and you drag bookmarks between them.

Saving is one keystroke. Press Ctrl+Shift+Y (Cmd+Shift+Y on Mac) on any page and it lands in your Quick Saves board, with a small confirmation appearing on the page you're on; you never lose your place. You can also right-click any page and choose "Save to Bookmrk", or import the bookmarks you already have from your browser. Search everything with `/`, or press Ctrl+K for a command palette that reaches every action in the app.

Your data stays on your machine. There's no account, no sync server and no tracking — bookmarks live in your browser's local extension storage, and you can export the whole thing to a JSON file whenever you want. Make it yours with four themes, light/dark/system, a sidebar or tab layout, eight fonts, and your own background image. Deleting something is always undoable.

---

## Privacy and data use

**Bookmrk has no account system, no analytics, no telemetry and no sync server.** All bookmarks, boards, pages and settings are stored locally via the `storage` permission and never leave the device on their own.

It makes four kinds of outbound request, each a direct consequence of a user action:

| Request | Trigger | Data sent |
|---|---|---|
| `https://www.google.com/s2/favicons` | Displaying a bookmark's icon | The bookmarked site's hostname |
| The bookmarked page itself | Adding a bookmark — fetched once to read its `og:description` | Nothing beyond a normal page request |
| A background image URL | Only if the user sets an image background by URL. Uploaded images are stored locally as data URLs and are never transmitted | Nothing beyond the image request |
| `https://ntfy.sh/bookmrk-help-v1` | **Only** when the user fills in and submits Settings → Support | The email address and message the user typed |

### ⚠ Firefox declaration mismatch

`src/manifest.json` currently declares:

```json
"data_collection_permissions": { "required": ["none"] }
```

That is accurate for everything except the support form, which transmits a user-entered email address — `personallyIdentifyingInfo` under Mozilla's taxonomy. `"none"` means *no* collection and cannot be combined with other values, so pick one before submitting to AMO:

- **Keep the form** → change the declaration to `"optional": ["personallyIdentifyingInfo"]` (it is optional: nothing is sent unless the user submits it), update this section, and publish a privacy policy URL.
- **Drop the form** → remove the Support tab from `src/newtab/components/Settings/SettingsModal.tsx`, and `"required": ["none"]` becomes correct as-is.

- **Privacy policy URL:** TODO — required by all three stores once any data is collected. Only avoidable via the "drop the form" option above.

---

## Chrome Web Store

### Single purpose

Replace the New Tab page with a visual bookmark manager, and provide a keyboard shortcut and context-menu item for saving the current tab into it.

### New Tab override justification

Chrome reviews `chrome_url_overrides.newtab` closely. Bookmrk's entire user interface *is* the New Tab page — the bookmark canvas, search, settings and all management live there. The extension has no popup and no other UI surface. The override is the product, not a side effect, and it is disclosed in the listing summary and the first line of the description.

### Permissions justification

Each entry matches `src/manifest.json`.

| Permission | Why it is needed |
|---|---|
| `storage` | Persists the user's pages, boards, bookmarks and settings locally (`chrome.storage.local`). This is the extension's only data store. |
| `bookmarks` | Powers the optional "Import Chrome bookmarks" action, which reads the browser's bookmark tree once, on the user's explicit click, and copies the entries into a Bookmrk board. Bookmrk never writes to or deletes browser bookmarks. |
| `contextMenus` | Adds the single "Save to Bookmrk" item to the page context menu. |
| `tabs` | Quick Save needs the active tab's URL and title to save it, and sends the confirmation toast to that tab. Used only in response to the keyboard command or the context-menu click. |
| `host_permissions: <all_urls>` | Two uses: the content script renders the Quick Save confirmation on whatever page the user triggers it from, and adding a bookmark fetches that one page to read its `og:description`. Since a user may bookmark any site, this cannot be narrowed to a fixed list. |
| `content_scripts` matching `<all_urls>` | The confirmation toast, for the same reason. The script is ~60 lines: it listens for one message type from the background worker and renders a positioned `div`. It reads nothing from the page and sends nothing back. |
| `commands` (manifest key) | Registers the Ctrl/Cmd+Shift+Y Quick Save shortcut. Not a permission string — declared via the `commands` key. |

> `scripting` was declared in earlier revisions and has been removed — nothing in the codebase calls `chrome.scripting`.

### Remote code

None. All JavaScript is bundled at build time; nothing is fetched and executed at runtime. The only remote resources are images (favicons, an optional background) and the two documented `fetch` calls, none of which are evaluated as code.

---

## Firefox Add-ons (AMO)

### Reviewer notes

No account or credentials needed — install and open a new tab.

Suggested exercise path:
1. Open a new tab; the board canvas appears with two starter boards.
2. Click **+** on a board to add a bookmark, or press **Ctrl+K** for the command palette listing every action.
3. Visit any website and press **Ctrl+Shift+Y** — it saves to a "Quick Saves" board and shows a toast on the page.
4. Right-click a board or bookmark for its actions; deletions show an Undo toast.
5. **⋯ → Export JSON** writes all data to a local file; **Import JSON** restores it.

**Build from source** (the upload is bundled, so AMO requires this):

```bash
npm install          # Node.js 22.12+
npm run build:firefox
```

Output is `dist/firefox/`, which matches the uploaded ZIP byte-for-byte in content. `npm run zip:source` produces the source archive. Build tooling is [Extension.js](https://extension.js.org) (`extension build --browser firefox`); there is no custom or obfuscated build step.

**Note the data-collection declaration flagged above** — reconcile it before uploading.

### Release notes (1.6.0)

Rebuilt on Extension.js, so Chrome, Firefox and Edge now ship from one codebase and one manifest instead of two hand-maintained ones.

**New:** command palette (Ctrl+K) reaching every action in the app · undo for any deletion · tags on bookmarks, filterable from search · explicit Light/Dark/System control · Sidebar-or-Tabs layout chosen independently of the theme · right-click menus on boards and bookmarks · deep-black (AMOLED) dark mode · eight bundled background presets.

**Changed:** the toolbar is four controls instead of nine — the rest moved into the ⋯ menu and the palette. Themes are now purely cosmetic; previously they decided which features existed, and Export/Import JSON were unreachable outside the Discord theme.

**Removed:** the global "Drag Mode" toggle. Dragging works at any time from a board header or a bookmark's grip, and no longer blocks other actions while it's on.

Existing data is untouched — the storage format is unchanged. Upgrading from 1.5.0 by ZIP? See "Migrating from the original" in the README; the two builds have separate extension IDs, so export/import is the path across.

---

## Edge Add-ons

### Certification notes

Same as the Firefox reviewer notes above: no credentials, no account, no server component. The extension replaces the New Tab page, which is its entire interface.

Build with `npm run build:edge` (Node.js 22.12+); output is `dist/edge/`. The manifest is MV3 and identical to the Chrome build.

---

## Version history

- **1.6.0** (unreleased) — Extension.js rebuild; first version to ship Chrome, Firefox and Edge from a single codebase. Distributed via GitHub Releases; not yet submitted to any store.
- **1.5.0 and earlier** — the original Vite build ([sarvan-2187/Bookmrk](https://github.com/sarvan-2187/Bookmrk)), released as separate Chromium and Firefox archives. Never submitted to a store.

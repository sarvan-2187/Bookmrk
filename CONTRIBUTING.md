# Contributing to Bookmrk

First off — thank you for considering contributing to Bookmrk ❤️

Bookmrk is built as a fast, local-first bookmark manager focused on clean UX, keyboard-driven workflows, and developer-friendly architecture. Whether you're fixing bugs, improving accessibility, refining UI interactions, or proposing major features, contributions are welcome.

---

# Table of Contents

- Code of Conduct
- Before You Start
- Development Setup
- Project Philosophy
- Repository Structure
- Branching Strategy
- Commit Guidelines
- Pull Request Process
- UI & UX Standards
- TypeScript Standards
- State Management Guidelines
- Styling Guidelines
- Accessibility Expectations
- Performance Expectations
- Testing
- Documentation
- Reporting Bugs
- Suggesting Features
- Good First Contributions
- Questions

---

# Code of Conduct

Be respectful, constructive, and collaborative.

This project values:
- thoughtful discussion
- clean engineering
- maintainable code
- accessibility
- respectful communication

Harassment, hostility, spam, or toxic behavior will not be tolerated.

---

# Before You Start

Before opening a PR:

1. Check existing Issues and PRs first.
2. Discuss major architectural changes before implementing them.
3. Keep pull requests focused and atomic.
4. Ensure your change aligns with Bookmrk's local-first philosophy.

---

# Development Setup

## Prerequisites

- Node.js 18+
- npm
- Chromium browser (for extension testing)

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

## Build Production Version

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

---

# Project Philosophy

Bookmrk is designed around several core principles:

## 1. Fast Capture

Saving bookmarks should feel instant.

Features should avoid:
- unnecessary confirmations
- excessive clicks
- blocking dialogs

## 2. Local-First

User data belongs to the user.

Avoid:
- forced cloud sync
- unnecessary network requests
- telemetry-heavy patterns

## 3. Keyboard-Driven UX

Power users should be able to move quickly.

Keyboard workflows should remain:
- intuitive
- consistent
- responsive

## 4. Clean Visual Hierarchy

UI should remain:
- uncluttered
- readable
- minimal
- responsive

---

# Repository Structure

```txt
src/
 ├── components/
 ├── store/
 ├── storage/
 ├── shared/
 ├── hooks/
 ├── utils/
 └── assets/
```

Important files:

| File | Purpose |
|---|---|
| `src/App.tsx` | App root |
| `src/store/useStore.ts` | Zustand global store |
| `src/storage/local.ts` | Persistence layer |
| `src/shared/types.ts` | Shared TypeScript types |
| `src/components/Page/PageView.tsx` | Board canvas layout |
| `src/components/Bookmark/QuickSaveModal.tsx` | Quick Save flow |

---

# Branching Strategy

Create feature branches from `main`.

Examples:

```bash
feature/quick-save-improvements
fix/modal-scroll-lock
refactor/storage-layer
```

Avoid committing directly to `main`.

---

# Commit Guidelines

Use clear, descriptive commit messages.

Recommended format:

```txt
type(scope): summary
```

Examples:

```txt
feat(board): add empty-column drop support
fix(modal): prevent background scroll
refactor(store): simplify board movement logic
docs(readme): update installation guide
```

Common commit types:
- `feat`
- `fix`
- `refactor`
- `docs`
- `style`
- `test`
- `chore`

---

# Pull Request Process

## Before Submitting

Ensure:
- project builds successfully
- no TypeScript errors
- no console errors
- responsive layouts still work
- dark mode still works
- keyboard shortcuts still work

## PR Requirements

Include:
- clear description
- rationale for change
- screenshots/videos for UI changes
- migration notes if data shape changed

## UI Changes

For visual changes:
- include before/after screenshots
- test both light and dark modes
- test mobile responsiveness

---

# UI & UX Standards

Bookmrk follows a modern desktop-inspired UX.

## Design Priorities

Prioritize:
- speed
- clarity
- consistency
- minimal friction

Avoid:
- excessive animations
- intrusive popups
- cluttered layouts

## Modal Standards

All modals should:
- use portals
- support Escape-to-close
- support dark mode
- center properly
- trap focus correctly

## Toasts Instead of Alerts

Prefer:
- non-blocking toast notifications

Avoid:
- `alert()`
- `prompt()`
- blocking browser dialogs

---

# TypeScript Standards

## Prefer Strong Typing

Avoid:
```ts
any
```

Prefer:
```ts
type
interface
generics
discriminated unions
```

## Shared Types

Shared application types belong in:

```txt
src/shared/types.ts
```

---

# State Management Guidelines

Bookmrk uses Zustand.

## Store Rules

- Keep actions predictable.
- Avoid deeply nested mutations.
- Keep persistence logic separated from UI logic.

## Avoid Component Bloat

If component state becomes complex:
- extract hooks
- extract utilities
- split components

---

# Styling Guidelines

Bookmrk uses:
- Tailwind CSS
- utility-first styling

## Preferred Patterns

Prefer:
```tsx
className="flex items-center gap-2"
```

Avoid:
- deeply nested conditional classes
- duplicated utility chains
- inline styles unless necessary

## Dark Mode

Dark mode should use:
```txt
bg-black
```

for primary dark surfaces where applicable.

Always verify:
- contrast
- readability
- hover states

---

# Accessibility Expectations

All contributions should consider accessibility.

Minimum expectations:
- keyboard navigation support
- visible focus states
- semantic HTML
- sufficient color contrast
- proper button labels
- ARIA attributes where necessary

---

# Performance Expectations

Avoid:
- unnecessary re-renders
- large dependency additions
- blocking operations on the main thread

Be cautious with:
- large background images
- excessive localStorage writes
- heavy drag-and-drop calculations

---

# Testing

Current testing infrastructure is lightweight, but contributors are encouraged to add:

- unit tests
- interaction tests
- regression tests

Recommended tools:
- Vitest
- React Testing Library

---

# Documentation

If your contribution changes:
- architecture
- setup flow
- storage shape
- keyboard shortcuts
- settings behavior
- user workflows

then update:
- `README.md`
- inline documentation
- migration notes if needed

---

# Reporting Bugs

When opening an issue, include:

## Environment
- OS
- Browser
- Extension/App version

## Reproduction Steps
1. Step one
2. Step two
3. Expected result
4. Actual result

## Additional Context
- screenshots
- console logs
- recordings

---

# Suggesting Features

Feature requests should explain:
- the problem
- proposed solution
- expected UX
- potential tradeoffs

Good feature requests are concrete and implementation-aware.

---

# Good First Contributions

Good beginner-friendly areas:
- accessibility improvements
- keyboard navigation
- responsive polish
- documentation
- animation refinement
- bug fixes
- empty states
- toast improvements

---

# Questions

If you need help:
- open a discussion
- create an issue
- ask in pull request comments

Constructive collaboration is always encouraged.

---

Thank you for helping improve Bookmrk 🚀


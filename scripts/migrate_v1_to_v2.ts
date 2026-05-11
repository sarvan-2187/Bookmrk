#!/usr/bin/env ts-node
// Simple migration script example for Bookmrk
// Usage: npx ts-node scripts/migrate_v1_to_v2.ts old.json migrated.json

import fs from 'fs'

function ensure<T>(value: T | undefined, fallback: T): T {
  return typeof value === 'undefined' ? fallback : value
}

function normalizeBackground(bg: any) {
  if (!bg) return null
  if (typeof bg === 'string') {
    // older format might have stored raw color or url string
    if (bg.startsWith('#')) return { type: 'color', value: bg }
    return { type: 'url', value: bg }
  }
  if (bg.type && bg.value) return { type: bg.type, value: bg.value }
  return null
}

function migrate(input: any) {
  const out: any = { ...input }
  out.meta = ensure(out.meta, { createdAt: new Date().toISOString() })
  if (!out.meta.createdAt) out.meta.createdAt = new Date().toISOString()
  out.chromeBookmarksImported = ensure(out.chromeBookmarksImported, false)
  out.background = normalizeBackground(out.background)

  // Ensure pages -> boards -> bookmarks shape
  out.pages = (out.pages || []).map((page: any) => {
    page.id = ensure(page.id, `page-${Math.random().toString(36).slice(2,9)}`)
    page.boards = (page.boards || []).map((board: any) => {
      board.id = ensure(board.id, `board-${Math.random().toString(36).slice(2,9)}`)
      board.bookmarks = (board.bookmarks || []).map((bm: any) => ({
        id: ensure(bm.id, `bm-${Math.random().toString(36).slice(2,9)}`),
        url: bm.url,
        title: ensure(bm.title, bm.url || 'Untitled'),
        notes: bm.notes || '',
        createdAt: ensure(bm.createdAt, new Date().toISOString()),
      }))
      return board
    })
    return page
  })

  return out
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.error('Usage: migrate_v1_to_v2.ts <input.json> <output.json>')
    process.exit(2)
  }
  const [inPath, outPath] = args
  const raw = fs.readFileSync(inPath, 'utf8')
  const parsed = JSON.parse(raw)
  const migrated = migrate(parsed)
  fs.writeFileSync(outPath, JSON.stringify(migrated, null, 2), 'utf8')
  console.log('Migration complete:', outPath)
}

main().catch(err => { console.error(err); process.exit(1) })

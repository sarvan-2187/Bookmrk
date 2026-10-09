#!/usr/bin/env node
// Builds the release archives for every browser target.
//
// Extension.js names its ZIP after the extension and version, which collides
// across targets when three of them are attached to one GitHub Release. This
// stamps the browser into the filename and keeps the naming convention the
// project has used since v1.5.0: Bookmrk-v<version>-<target>.zip
//
//   npm run release            # all targets
//   npm run release -- firefox # one target

import {execFileSync} from 'node:child_process'
import {copyFileSync, readFileSync, existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {join} from 'node:path'

// Resolve Extension.js's CLI entry and run it with the current Node binary.
// Spawning the `npx`/`extension` shims instead fails on Windows with
// `spawnSync npx.cmd EINVAL`, since .cmd needs a shell to execute.
const cli = createRequire(import.meta.url).resolve('extension')

// The manifest is the single source of truth for the version — package.json
// mirrors it, but what ships is whatever the manifest says.
const {version} = JSON.parse(readFileSync('src/manifest.json', 'utf8'))

// `chromium` rather than `chrome` in the filename, matching v1.5.0's assets.
const TARGETS = [
  {browser: 'chrome', label: 'chromium'},
  {browser: 'firefox', label: 'firefox'},
  {browser: 'edge', label: 'edge'}
]

const requested = process.argv.slice(2)
const targets = requested.length
  ? TARGETS.filter((t) => requested.includes(t.browser) || requested.includes(t.label))
  : TARGETS

if (targets.length === 0) {
  console.error(`No matching target. Known: ${TARGETS.map((t) => t.browser).join(', ')}`)
  process.exit(1)
}

for (const {browser, label} of targets) {
  const name = `Bookmrk-v${version}-${label}`

  execFileSync(
    process.execPath,
    [cli, 'build', '--browser', browser, '--zip', '--zip-filename', name],
    {stdio: 'inherit'}
  )

  // Stage a copy at the repo root so the archives are easy to attach to a
  // release without digging through dist/. Root *.zip is gitignored.
  // Older Extension.js wrote dist/<browser>/<name>.zip; newer releases write
  // dist/<name>-<browser>.zip, skipping the suffix when the name already ends
  // in it (so firefox lands at dist/<name>.zip). No lockfile is committed, so
  // accept any of them.
  const candidates = [
    join('dist', browser, `${name}.zip`),
    join('dist', `${name}-${browser}.zip`),
    join('dist', `${name}.zip`)
  ]
  const built = candidates.find((path) => existsSync(path))
  if (!built) {
    console.error(`Expected one of ${candidates.join(', ')} to exist after the build.`)
    process.exit(1)
  }
  copyFileSync(built, `${name}.zip`)
  console.log(`→ ${name}.zip`)
}

console.log(`\nBookmrk v${version} — ${targets.length} archive(s) ready at the repo root.`)

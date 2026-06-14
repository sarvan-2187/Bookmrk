import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReleaseConfig, patchManifestVersion, syncPublicManifestVersions } from './release-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const target = process.argv[2];

if (target !== 'firefox' && target !== 'chromium') {
  console.error('Usage: node scripts/build-extension.mjs <firefox|chromium>');
  process.exit(1);
}

const { version } = getReleaseConfig();
syncPublicManifestVersions(version);

execSync('vite build', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, BUILD_TARGET: target },
});

patchManifestVersion(path.join(rootDir, 'dist'), version);

console.log(`\n${target[0].toUpperCase()}${target.slice(1)} extension bundle ready in dist/`);

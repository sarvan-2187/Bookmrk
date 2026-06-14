import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  getReleaseConfig,
  getReleaseDir,
  getReleaseZipName,
  zipDistContents,
} from './release-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const targetArg = process.argv[2];
const targets =
  targetArg === 'all' ? ['firefox', 'chromium'] : targetArg ? [targetArg] : [];

if (targets.length === 0 || targets.some((target) => target !== 'firefox' && target !== 'chromium')) {
  console.error('Usage: node scripts/package-release.mjs <firefox|chromium|all>');
  process.exit(1);
}

const { version } = getReleaseConfig();
const zipName = getReleaseZipName(version);

for (const target of targets) {
  execSync(`node scripts/build-extension.mjs ${target}`, {
    stdio: 'inherit',
    cwd: rootDir,
  });

  const releaseDir = getReleaseDir(target);
  const outputPath = path.join(releaseDir, zipName);

  await zipDistContents(path.join(rootDir, 'dist'), outputPath);
  console.log(`\n${target} release written to ${outputPath}`);
}

import archiver from 'archiver';
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function getReleaseConfig() {
  const configPath = path.join(rootDir, 'release.config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  if (!config.version || typeof config.version !== 'string') {
    throw new Error('release.config.json must define a string "version".');
  }

  return config;
}

export function getReleaseZipName(version = getReleaseConfig().version) {
  return `Bookmrk-v${version}.zip`;
}

export function getReleaseDir(target) {
  if (target === 'firefox') {
    return path.join(rootDir, 'firefox-releases');
  }
  if (target === 'chromium') {
    return path.join(rootDir, 'chromium-releases');
  }
  throw new Error(`Unknown release target "${target}". Use "firefox" or "chromium".`);
}

export function patchManifestVersion(distDir, version) {
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function syncPublicManifestVersions(version) {
  for (const relativePath of ['public/manifest.json', 'public/manifest.firefox.json']) {
    const manifestPath = path.join(rootDir, relativePath);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.version = version;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

export function zipDistContents(distDir, outputPath) {
  mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

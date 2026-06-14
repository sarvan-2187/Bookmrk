/** @type {import('web-ext').MultiExtensionRunnerOptions} */
export default {
  sourceDir: 'dist',
  run: {
    firefox: 'firefox',
    keepProfileChanges: true,
    startUrl: ['about:newtab'],
  },
  build: {
    overwriteDest: true,
  },
};

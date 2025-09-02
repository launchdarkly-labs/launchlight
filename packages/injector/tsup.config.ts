import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM and CJS builds
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['launchdarkly-js-client-sdk']
  },
  // UMD build for browser injection
  {
    entry: { 'index.umd': 'src/umd.ts' },
    format: ['iife'],
    globalName: 'WebExpInjector',
    minify: true,
    sourcemap: true,
    noExternal: [/@webexp\/.*/],
    esbuildOptions(options) {
      options.target = 'es2020';
    }
  }
]);

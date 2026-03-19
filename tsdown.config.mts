// @ts-check
import { defineConfig } from 'tsdown/config';

export default defineConfig({
  deps: {
    onlyBundle: ['sury'],
  },

  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  exports: true,

  failOnWarn: false,
});

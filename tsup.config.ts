import {defineConfig} from 'tsup'

export default defineConfig([
  {
    entry: {index: 'src/index.ts'},
    format: [
      'esm',
      'cjs',
    ],
    target: 'es2020',
    dts: true,
    sourcemap: true,
    // noExternal: [/^base/, /\^@noble/],
  },
  {
    entry: {'sr25519.min': 'src/index.ts'},
    format: [
      'iife',
    ],
    platform: 'browser',
    outExtension: () => ({js: '.js'}),
    globalName: 'sr25519',
    minify: true,
    target: 'es2020',
    dts: true,
    splitting: false,
    sourcemap: true,
    noExternal: [/.*/],
  },
])

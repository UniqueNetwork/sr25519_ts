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
    // splitting: false,
    sourcemap: true,
    metafile: true,
    // noExternal: [/^base/, /\^@noble/],
  },
  {
    entry: {'index.min': 'src/index.ts'},
    format: [
      'iife',
    ],
    minify: true,
    target: 'es2020',
    dts: true,
    splitting: false,
    sourcemap: true,
    // metafile: true,
    noExternal: [/^base/, /\^@noble/],
  },
])

import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/plugin.cjs.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: ['@capacitor/core'],
    plugins: [resolve()],
  },
  {
    input: 'dist/esm/index.js',
    output: [
      {
        file: 'dist/plugin.js',
        format: 'iife',
        exports: 'named',
        name: 'capacitorEncorePlugin',
        globals: {
          '@capacitor/core': 'capacitorExports',
        },
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    external: ['@capacitor/core'],
    plugins: [resolve()],
  },
];

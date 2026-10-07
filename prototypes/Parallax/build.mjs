import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  entryPoints: [fileURLToPath(new URL('./src/main.tsx', import.meta.url))],
  outfile: fileURLToPath(new URL('./app.js', import.meta.url)),
  bundle: true,
  minify: true,
  format: 'esm',
  jsx: 'automatic',
  target: 'es2022',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'eof',
});

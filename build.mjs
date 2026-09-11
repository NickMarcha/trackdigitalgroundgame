// Bundles client and server. `--watch` rebuilds on change.
import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const common = {
  bundle: true,
  logLevel: 'warning',
  minify: !watch,
  sourcemap: 'linked',
  target: 'es2023',
}

const configs = [
  {
    ...common,
    entryPoints: ['src/client/splash.ts', 'src/client/goals.ts'],
    format: 'esm',
    outdir: 'public',
    platform: 'browser',
  },
  {
    ...common,
    entryPoints: ['src/server/index.ts'],
    format: 'cjs',
    outdir: 'dist/server',
    platform: 'node',
  },
]

if (watch) {
  const contexts = await Promise.all(configs.map(c => esbuild.context(c)))
  await Promise.all(contexts.map(ctx => ctx.watch()))
} else {
  await Promise.all(configs.map(c => esbuild.build(c)))
}

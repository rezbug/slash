// scripts/build-router.ts
import { resolve } from 'node:path';
import { mkdir, rename, readFile, writeFile } from 'node:fs/promises';

const isDev = process.env.NODE_ENV !== 'production';
const format = process.env.FORMAT || 'esm';

type BuildConfig = Parameters<typeof Bun.build>[0];

const ROOT = resolve(import.meta.dir, '..');

const config: BuildConfig = {
  entrypoints: [resolve(ROOT, 'src/router/index.ts')],
  outdir: resolve(ROOT, 'dist/router'),
  format: format as 'esm' | 'cjs',
  sourcemap: isDev ? 'inline' : 'external',
  minify: !isDev,
  naming: isDev ? undefined : '[dir]/[name].[ext]',
  target: 'browser',
  splitting: false,
  external: ['slash'],
};

// Ensure router directory exists
await mkdir(resolve(ROOT, 'dist/router'), { recursive: true });

const result = await Bun.build(config);

if (!result.success) {
  console.error('❌ Router build failed');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Renomear arquivos para extensões corretas (.mjs ou .cjs)
if (!isDev && result.outputs.length > 0) {
  const ext = format === 'esm' ? 'mjs' : 'cjs';
  for (const output of result.outputs) {
    const oldPath = output.path;
    if (oldPath.endsWith('.js')) {
      const newPath = oldPath.replace(/\.js$/, `.${ext}`);
      await rename(oldPath, newPath);

      let content = await readFile(newPath, 'utf-8');

      // Atualizar imports relativos
      content = content.replace(/from\s*["']\.\/([^"']+)\.js["']/g, `from "./$1.${ext}"`);
      content = content.replace(/import\s*\(\s*["']\.\/([^"']+)\.js["']\s*\)/g, `import("./$1.${ext}")`);

      // Adicionar referência ao source map
      const mapFileName = `index.${ext}.map`;
      const sourceMapComment = `\n//# sourceMappingURL=${mapFileName}\n`;

      if (!content.includes('sourceMappingURL=')) {
        content += sourceMapComment;
      }

      await writeFile(newPath, content, 'utf-8');

      console.log(`  ✓ ${newPath.replace(ROOT, '.')}`);
    } else if (oldPath.endsWith('.js.map')) {
      const newPath = oldPath.replace(/\.js\.map$/, `.${ext}.map`);
      await rename(oldPath, newPath);
    }
  }
}

const size = result.outputs.reduce((acc, o) => acc + o.size, 0);
const sizeKB = (size / 1024).toFixed(2);
console.log(`✅ Built router/${format} - ${sizeKB}KB`);

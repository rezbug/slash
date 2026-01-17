// scripts/build.ts
import { resolve } from 'node:path';
import { rename, readFile, writeFile } from 'node:fs/promises';

const isDev = process.env.NODE_ENV !== 'production';
const format = process.env.FORMAT || 'esm';
const watch = process.argv.includes('--watch');

type BuildConfig = Parameters<typeof Bun.build>[0];

const ROOT = resolve(import.meta.dir, '..');

const config: BuildConfig = {
  entrypoints: [resolve(ROOT, 'src/index.ts')],
  outdir: resolve(ROOT, 'dist'),
  format: format as 'esm' | 'cjs',
  sourcemap: isDev ? 'inline' : 'external',
  minify: !isDev,
  naming: isDev ? undefined : '[dir]/[name].[ext]',
  target: 'browser',
  splitting: false, // Desabilitado - causava exports duplicados com chunks
};

if (watch) {
  // @ts-ignore - watch existe em runtime mas não na tipagem
  config.watch = {
    onWatch(_event: any, path: string) {
      console.log(`📝 Changed: ${path}`);
    },
    onRebuildEnd(result: any) {
      if (!result.success) {
        console.error('❌ Build failed');
        for (const log of result.logs) {
          console.error(log);
        }
        return;
      }
      const size = result.outputs.reduce((acc: number, o: any) => acc + o.size, 0);
      const sizeKB = (size / 1024).toFixed(2);
      console.log(`✅ Rebuilt ${format} - ${sizeKB}KB`);
    },
  };
  console.log(`👀 Watching ${format} bundle...`);
}

const result = await Bun.build(config);

if (!result.success) {
  console.error('❌ Build failed');
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

      // Ler o conteúdo e atualizar imports de .js para .mjs/.cjs
      let content = await readFile(newPath, 'utf-8');

      // Atualizar imports relativos de .js para a extensão correta
      content = content.replace(/from\s*["']\.\/([^"']+)\.js["']/g, `from "./$1.${ext}"`);
      content = content.replace(/import\s*\(\s*["']\.\/([^"']+)\.js["']\s*\)/g, `import("./$1.${ext}")`);

      // Adicionar referência ao source map se não existir
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
} else if (result.outputs.length > 0) {
  for (const output of result.outputs) {
    console.log(`  ✓ ${output.path.replace(ROOT, '.')}`);
  }
} else {
  console.warn('⚠️  Warning: No outputs generated!');
}

if (!watch) {
  const mode = isDev ? 'dev' : 'prod';
  const size = result.outputs.reduce((acc, o) => acc + o.size, 0);
  const sizeKB = (size / 1024).toFixed(2);
  console.log(`✅ Built ${format} (${mode}) - ${sizeKB}KB`);
} else {
  // Mostrar tamanho inicial em modo watch
  const size = result.outputs.reduce((acc, o) => acc + o.size, 0);
  const sizeKB = (size / 1024).toFixed(2);
  console.log(`✅ Initial build ${format} - ${sizeKB}KB\n`);

  // Manter o processo ativo em modo watch
  await new Promise(() => {});
}

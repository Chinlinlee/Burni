import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');
const DOCS_DIR = path.resolve(__dirname, '../../docs');
const NOJEKYLL_FILE = path.join(DOCS_DIR, '.nojekyll');

function resolveExportDir() {
  if (!fs.existsSync(OUT_DIR)) {
    console.error('[postbuild] out/ not found. Run `next build` first.');
    process.exit(1);
  }

  if (fs.existsSync(path.join(OUT_DIR, '_next', 'static'))) {
    return OUT_DIR;
  }

  // basePath 會多一層目錄，例如 out/Burni / basePath adds a nested folder such as out/Burni
  for (const entry of fs.readdirSync(OUT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const nested = path.join(OUT_DIR, entry.name);
    if (fs.existsSync(path.join(nested, '_next', 'static'))) {
      return nested;
    }
  }

  console.error('[postbuild] missing out/_next/static (checked nested basePath folders too)');
  process.exit(1);
}

function moveExportToDocs(exportDir) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  for (const entry of fs.readdirSync(exportDir)) {
    const src = path.join(exportDir, entry);
    const dest = path.join(DOCS_DIR, entry);

    fs.cpSync(src, dest, { recursive: true, force: true });
    fs.rmSync(src, { recursive: true, force: true });
  }

  // GitHub Pages 預設 Jekyll 會略過 _ 開頭資料夾；.nojekyll 關閉 Jekyll / disable Jekyll so _next is published
  fs.writeFileSync(NOJEKYLL_FILE, '');

  console.log(`[postbuild] moved ${path.relative(path.resolve(__dirname, '..'), exportDir)}/ -> docs/`);
  console.log('[postbuild] wrote docs/.nojekyll for GitHub Pages');
}

const exportDir = resolveExportDir();
moveExportToDocs(exportDir);

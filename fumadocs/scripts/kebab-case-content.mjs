import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../content/docs');
const LOCALES = ['en', 'zh-TW'];

/**
 * @param {string} name
 */
export function toKebab(name) {
  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;

  const kebab = base
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase())
    .join('-');

  return ext ? `${kebab}${ext}` : kebab;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function listRelativePaths(dir) {
  /** @type {string[]} */
  const results = [];

  /** @param {string} current */
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(dir, abs).replace(/\\/g, '/');
      results.push(rel);
      if (entry.isDirectory()) walk(abs);
    }
  }

  walk(dir);
  return results.sort((a, b) => b.split('/').length - a.split('/').length);
}

/**
 * @param {string} localeDir
 */
function applySegmentRenames(localeDir) {
  for (const rel of listRelativePaths(localeDir)) {
    if (rel.startsWith('assets/')) continue;

    const segments = rel.split('/');
    const oldName = segments[segments.length - 1];
    const newName = toKebab(oldName);

    if (oldName === newName) continue;

    const parent = path.join(localeDir, ...segments.slice(0, -1));
    const oldAbs = path.join(parent, oldName);
    const newAbs = path.join(parent, newName);

    if (!fs.existsSync(oldAbs)) continue;

    fs.renameSync(oldAbs, newAbs);
  }
}

/**
 * @param {string} content
 */
function updateMetaPages(content) {
  const meta = JSON.parse(content);
  if (Array.isArray(meta.pages)) {
    meta.pages = meta.pages.map((page) => (typeof page === 'string' ? toKebab(page) : page));
  }
  return `${JSON.stringify(meta, null, 2)}\n`;
}

/**
 * @param {string} content
 */
function updateMdxLinks(content) {
  return content
    .replace(/\]\(\/([^)]+)\)/g, (match, href) => {
      const updated = href
        .split('/')
        .map((segment) => toKebab(decodeURIComponent(segment)))
        .join('/');
      return `](/${updated})`;
    })
    .replace(/\(\/([^)]+)\)/g, (match, href) => {
      if (!href.includes(' ') && !href.includes('_') && href === href.toLowerCase()) return match;
      const updated = href
        .split('/')
        .map((segment) => toKebab(decodeURIComponent(segment)))
        .join('/');
      return `(/${updated})`;
    });
}

/**
 * @param {string} localeDir
 */
function updateMetaAndMdx(localeDir) {
  for (const rel of listRelativePaths(localeDir)) {
    const abs = path.join(localeDir, rel);
    if (!rel.endsWith('.json') && !rel.endsWith('.mdx')) continue;

    const raw = fs.readFileSync(abs, 'utf8');
    const next = rel.endsWith('.json') ? updateMetaPages(raw) : updateMdxLinks(raw);
    fs.writeFileSync(abs, next, 'utf8');
  }
}

for (const locale of LOCALES) {
  const localeDir = path.join(CONTENT_DIR, locale);
  applySegmentRenames(localeDir);
  updateMetaAndMdx(localeDir);
  console.log(`Kebab-case applied: ${locale}`);
}

console.log('Done.');

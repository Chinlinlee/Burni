import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const CONFIG_DIR = path.join(ROOT, 'config');
const SOURCE_DOCS = path.join(ROOT, 'docs');
const TARGET_BASE = path.join(ROOT, 'fumadocs/content/docs');

const LOCALES = [
  { locale: 'en', configFile: 'en/mkdocs.yml', sourceDir: 'en' },
  { locale: 'zh-TW', configFile: 'zh-TW/mkdocs.yml', sourceDir: 'zh-TW' },
];

/** @typedef {{ title: string, path: string } | { title: string, children: NavNode[] }} NavNode */

/**
 * @param {unknown[]} items
 * @returns {NavNode[]}
 */
function parseNavItems(items) {
  /** @type {NavNode[]} */
  const nodes = [];

  for (const item of items) {
    if (typeof item !== 'object' || item === null) continue;

    for (const [title, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        nodes.push({ title, path: value.replace(/\\/g, '/') });
      } else if (Array.isArray(value)) {
        nodes.push({ title, children: parseNavItems(value) });
      }
    }
  }

  return nodes;
}

/**
 * @param {NavNode[]} nodes
 * @param {Map<string, string>} titleByPath
 */
function collectTitleByPath(nodes, titleByPath) {
  for (const node of nodes) {
    if ('path' in node) {
      titleByPath.set(node.path, node.title);
    } else {
      collectTitleByPath(node.children, titleByPath);
    }
  }
}

/**
 * @param {string} type
 */
function mapCalloutType(type) {
  if (type === 'warning' || type === 'warn') return 'warn';
  if (type === 'note') return 'info';
  return type;
}

/**
 * @param {string} content
 */
function convertAdmonitions(content) {
  const lines = content.split('\n');
  /** @type {string[]} */
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^!!!\s+(note|info|warning|warn|danger|tip)\s*(?:"([^"]*)")?\s*$/);
    if (match) {
      const calloutType = mapCalloutType(match[1]);
      const calloutTitle = match[2];
      i += 1;

      /** @type {string[]} */
      const bodyLines = [];
      while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith('    ')) {
          bodyLines.push(line.slice(4));
          i += 1;
          continue;
        }
        if (line.trim() === '' && bodyLines.length > 0) {
          bodyLines.push('');
          i += 1;
          continue;
        }
        break;
      }

      while (bodyLines.length > 0 && bodyLines[bodyLines.length - 1] === '') {
        bodyLines.pop();
      }

      const titleAttr = calloutTitle ? ` title="${calloutTitle.replace(/"/g, '&quot;')}"` : '';
      result.push(`<Callout type="${calloutType}"${titleAttr}>`);
      result.push(...bodyLines);
      result.push('</Callout>');
      continue;
    }

    result.push(lines[i]);
    i += 1;
  }

  return result.join('\n');
}

/**
 * @param {string} content
 * @param {string} title
 */
function removeDuplicateH1(content, title) {
  const lines = content.split('\n');
  let start = 0;
  while (start < lines.length && lines[start].trim() === '') start += 1;
  if (start >= lines.length) return content;

  const h1Match = lines[start].match(/^#\s+(.+?)\s*$/);
  if (!h1Match) return content;

  const h1Text = h1Match[1].trim();
  if (h1Text.localeCompare(title.trim(), undefined, { sensitivity: 'accent' }) !== 0) {
    return content;
  }

  const next = lines.slice(start + 1);
  while (next.length > 0 && next[0].trim() === '') next.shift();
  return next.join('\n');
}

/**
 * @param {string} content
 */
function extractDescription(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('<Callout')) continue;
    if (trimmed.startsWith('```')) continue;
    return trimmed.slice(0, 160);
  }
  return '';
}

/**
 * @param {string} relPath - e.g. Getting started/Installation.md
 */
function toPageSlug(relPath) {
  const withoutExt = relPath.replace(/\.mdx?$/, '');
  if (withoutExt.endsWith('/index')) {
    return withoutExt.slice(0, -'/index'.length);
  }
  if (withoutExt === 'index') return 'index';
  const base = path.posix.basename(withoutExt);
  return base;
}

/**
 * @param {NavNode[]} nodes
 * @returns {string[]}
 */
function navPagesList(nodes) {
  /** @type {string[]} */
  const pages = [];

  for (const node of nodes) {
    if ('path' in node) {
      pages.push(toPageSlug(node.path));
    } else {
      const folderRel = getFolderFromNavSection(node);
      if (folderRel) {
        pages.push(folderRel.split('/')[0] ?? folderRel);
      }
    }
  }

  return pages;
}

/**
 * @param {NavNode[]} children
 * @param {string} folderRel
 * @returns {string[]}
 */
function buildMetaPagesForSection(children, folderRel) {
  /** @type {string[]} */
  const pages = [];

  for (const child of children) {
    if (!('path' in child)) continue;

    const remaining = folderRel ? child.path.slice(folderRel.length + 1) : child.path;
    const nextSegment = remaining.split('/')[0]?.replace(/\.mdx?$/, '');

    if (!nextSegment) continue;
    if (pages.includes(nextSegment)) continue;

    pages.push(nextSegment);
  }

  return pages;
}

/**
 * @param {NavNode} node
 * @returns {string | null}
 */
function getFolderFromNavSection(node) {
  if (!('children' in node)) return null;

  const firstPath = node.children.find((child) => 'path' in child)?.path;
  if (!firstPath || !firstPath.includes('/')) return null;

  return firstPath.split('/').slice(0, -1).join('/');
}

/**
 * @param {NavNode} node
 * @param {string} targetLocaleDir
 */
function writeSectionMetaRecursive(node, targetLocaleDir) {
  const folderRel = getFolderFromNavSection(node);
  if (!folderRel) return;

  const folderAbs = path.join(targetLocaleDir, folderRel);
  const pages = buildMetaPagesForSection(node.children, folderRel);

  /** @type {Record<string, unknown>} */
  const meta = {
    title: node.title,
    pages,
  };

  fs.writeFileSync(path.join(folderAbs, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

/**
 * @param {string} localeDir
 */
function ensureDeepDirMeta(localeDir) {
  /** @param {string} relDir */
  function walk(relDir) {
    const absDir = path.join(localeDir, relDir);
    if (!fs.existsSync(absDir)) return;

    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      walk(path.posix.join(relDir, entry.name));
    }

    const metaPath = path.join(absDir, 'meta.json');
    if (fs.existsSync(metaPath)) return;

    /** @type {string[]} */
    const pages = [];
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (entry.isDirectory()) pages.push(entry.name);
      else if (entry.name.endsWith('.mdx') && entry.name !== 'index.mdx') {
        pages.push(entry.name.replace(/\.mdx$/, ''));
      }
    }

    if (pages.length === 0) return;

    fs.writeFileSync(metaPath, `${JSON.stringify({ pages }, null, 2)}\n`, 'utf8');
  }

  walk('');
}

/**
 * @param {NavNode[]} nodes
 * @param {string} targetLocaleDir
 */
function writeAllMeta(nodes, targetLocaleDir) {
  fs.writeFileSync(
    path.join(targetLocaleDir, 'meta.json'),
    `${JSON.stringify({ pages: navPagesList(nodes) }, null, 2)}\n`,
    'utf8',
  );

  for (const node of nodes) {
    if ('children' in node) {
      writeSectionMetaRecursive(node, targetLocaleDir);
    }
  }

  ensureDeepDirMeta(targetLocaleDir);
}

/**
 * @param {string} sourceLocaleDir
 * @param {string} targetLocaleDir
 * @param {Map<string, string>} titleByPath
 */
function migrateMarkdownFiles(sourceLocaleDir, targetLocaleDir, titleByPath) {
  /** @param {string} dir */
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'assets') continue;
        walk(abs);
        continue;
      }

      if (!entry.name.endsWith('.md')) continue;

      const relFromLocale = path.relative(sourceLocaleDir, abs).replace(/\\/g, '/');
      const relMdx = relFromLocale.replace(/\.md$/, '.mdx');
      const targetAbs = path.join(targetLocaleDir, relMdx);
      fs.mkdirSync(path.dirname(targetAbs), { recursive: true });

      const title = titleByPath.get(relFromLocale) ?? path.basename(relFromLocale, '.md');
      let body = fs.readFileSync(abs, 'utf8');
  body = convertAdmonitions(body);
  body = body.replace(/```env\n/g, '```bash\n');
  body = removeDuplicateH1(body, title);
      const description = extractDescription(body);

      const frontmatter = ['---', `title: ${JSON.stringify(title)}`];
      if (description) frontmatter.push(`description: ${JSON.stringify(description)}`);
      frontmatter.push('---', '');

      fs.writeFileSync(targetAbs, `${frontmatter.join('\n')}${body.trimStart()}\n`, 'utf8');
    }
  }

  walk(sourceLocaleDir);
}

/**
 * @param {string} sourceLocaleDir
 * @param {string} targetLocaleDir
 */
function copyAssets(sourceLocaleDir, targetLocaleDir) {
  const assetsDir = path.join(sourceLocaleDir, 'assets');
  if (!fs.existsSync(assetsDir)) return;

  const targetAssets = path.join(targetLocaleDir, 'assets');
  fs.mkdirSync(targetAssets, { recursive: true });

  for (const entry of fs.readdirSync(assetsDir)) {
    fs.copyFileSync(path.join(assetsDir, entry), path.join(targetAssets, entry));
  }
}

/**
 * @param {{ locale: string, configFile: string, sourceDir: string }} localeConfig
 */
function migrateLocale(localeConfig) {
  const configPath = path.join(CONFIG_DIR, localeConfig.configFile);
  const config = parseYaml(fs.readFileSync(configPath, 'utf8'));
  const navNodes = parseNavItems(config.nav);

  const titleByPath = new Map();
  collectTitleByPath(navNodes, titleByPath);

  const sourceLocaleDir = path.join(SOURCE_DOCS, localeConfig.sourceDir);
  const targetLocaleDir = path.join(TARGET_BASE, localeConfig.locale);

  if (fs.existsSync(targetLocaleDir)) {
    fs.rmSync(targetLocaleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetLocaleDir, { recursive: true });

  migrateMarkdownFiles(sourceLocaleDir, targetLocaleDir, titleByPath);
  copyAssets(sourceLocaleDir, targetLocaleDir);

  writeAllMeta(navNodes, targetLocaleDir);

  console.log(`Migrated ${localeConfig.locale}: ${titleByPath.size} pages`);
}

for (const localeConfig of LOCALES) {
  migrateLocale(localeConfig);
}

console.log('Done. Run `node scripts/kebab-case-content.mjs` to apply kebab-case paths.');

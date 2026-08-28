import { source } from '@/lib/source';

function slugVariants(slug: string[] | undefined): (string[] | undefined)[] {
  if (!slug || slug.length === 0) return [undefined, []];

  const decoded = slug.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  const encoded = decoded.map((segment) => encodeURI(segment));

  /** @type {(string[] | undefined)[]} */
  const variants = [slug, decoded, encoded];

  return [...new Set(variants.map((value) => JSON.stringify(value)))].map((value) =>
    JSON.parse(value),
  );
}

export function resolvePage(slug: string[] | undefined, lang: string) {
  for (const variant of slugVariants(slug)) {
    const page = source.getPage(variant, lang);
    if (page) return page;
  }

  return undefined;
}

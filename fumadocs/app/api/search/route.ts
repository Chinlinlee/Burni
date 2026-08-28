import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const revalidate = false;

export const { staticGET: GET } = createFromSource(source, {
  localeMap: {
    en: { language: 'english' },
    // Orama 無 zh-TW；繁中先用 english tokenizer，後續可換 @orama/tokenizers/mandarin
    'zh-TW': { language: 'english' },
  },
});

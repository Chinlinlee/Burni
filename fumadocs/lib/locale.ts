import { i18n } from '@/lib/i18n';

export const secondaryLanguages = i18n.languages.filter(
  (language) => language !== i18n.defaultLanguage,
);

export function isSupportedLanguage(language: string): boolean {
  return (i18n.languages as readonly string[]).includes(language);
}

export function buildLocalePath(pathname: string, nextLocale: string): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const hasLocalePrefix =
    segments.length > 0 && isSupportedLanguage(segments[0]);

  if (hasLocalePrefix) {
    // hideLocale: default-locale 時，切到預設語系要移除前綴 / remove prefix for default locale
    if (
      nextLocale === i18n.defaultLanguage &&
      i18n.hideLocale === 'default-locale'
    ) {
      segments.shift();
    } else {
      segments[0] = nextLocale;
    }
  } else if (nextLocale !== i18n.defaultLanguage) {
    segments.unshift(nextLocale);
  }

  return `/${segments.join('/')}`;
}

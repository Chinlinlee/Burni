'use client';

import SearchDialog from '@/components/search';
import { translations } from '@/lib/layout.shared';
import { buildLocalePath } from '@/lib/locale';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

export function RootProviderWrapper({
  lang,
  children,
}: {
  lang: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const i18n = i18nProvider(translations, lang);

  return (
    <RootProvider
      search={{ SearchDialog }}
      i18n={{
        ...i18n,
        onLocaleChange: (nextLocale) => {
          router.push(buildLocalePath(pathname, nextLocale));
        },
      }}
    >
      {children}
    </RootProvider>
  );
}

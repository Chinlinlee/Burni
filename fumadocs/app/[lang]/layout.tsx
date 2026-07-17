import { RootProviderWrapper } from '@/lib/root-provider';
import { isSupportedLanguage, secondaryLanguages } from '@/lib/locale';
import { notFound } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;

  if (!isSupportedLanguage(lang) || lang === 'en') {
    notFound();
  }

  return <RootProviderWrapper lang={lang}>{children}</RootProviderWrapper>;
}

export function generateStaticParams() {
  return secondaryLanguages.map((lang) => ({ lang }));
}

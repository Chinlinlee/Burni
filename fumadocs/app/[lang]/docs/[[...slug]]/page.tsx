import { DocsPageContent, docsPageMetadata } from '@/lib/docs-page';
import { secondaryLanguages } from '@/lib/locale';
import { source } from '@/lib/source';

export default async function Page(props: PageProps<'/[lang]/docs/[[...slug]]'>) {
  const params = await props.params;
  return <DocsPageContent lang={params.lang} slug={params.slug} />;
}

export function generateStaticParams() {
  return secondaryLanguages.flatMap((lang) =>
    source.getPages(lang).map((page) => ({
      lang,
      slug: page.slugs,
    })),
  );
}

export async function generateMetadata(props: PageProps<'/[lang]/docs/[[...slug]]'>) {
  const params = await props.params;
  return docsPageMetadata({ lang: params.lang, slug: params.slug });
}

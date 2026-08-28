import { DocsPageContent, docsPageMetadata } from '@/lib/docs-page';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  return <DocsPageContent lang={i18n.defaultLanguage} slug={params.slug} />;
}

export function generateStaticParams() {
  return source.getPages(i18n.defaultLanguage).map((page) => ({
    slug: page.slugs,
  }));
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  return docsPageMetadata({ lang: i18n.defaultLanguage, slug: params.slug });
}

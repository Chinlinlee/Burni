import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { i18n } from '@/lib/i18n';
import { RootProviderWrapper } from '@/lib/root-provider';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <RootProviderWrapper lang={i18n.defaultLanguage}>
      <DocsLayout tree={source.getPageTree(i18n.defaultLanguage)} {...baseOptions(i18n.defaultLanguage)}>
        {children}
      </DocsLayout>
    </RootProviderWrapper>
  );
}

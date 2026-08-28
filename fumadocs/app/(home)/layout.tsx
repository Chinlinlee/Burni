import { RootProviderWrapper } from '@/lib/root-provider';
import { i18n } from '@/lib/i18n';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <RootProviderWrapper lang={i18n.defaultLanguage}>
      <HomeLayout {...baseOptions(i18n.defaultLanguage)}>{children}</HomeLayout>
    </RootProviderWrapper>
  );
}

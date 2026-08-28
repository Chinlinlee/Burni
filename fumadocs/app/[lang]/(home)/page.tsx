import Link from 'next/link';
import { docsRoute } from '@/lib/shared';

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;

  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Burni 文件</h1>
      <p>
        開啟{' '}
        <Link href={`/${lang}${docsRoute}`} className="font-medium underline">
          /{lang}
          {docsRoute}
        </Link>{' '}
        閱讀文件（{lang}）。
      </p>
    </div>
  );
}

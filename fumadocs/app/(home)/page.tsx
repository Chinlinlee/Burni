import Link from 'next/link';
import { i18n } from '@/lib/i18n';
import { docsRoute } from '@/lib/shared';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Burni documentation</h1>
      <p>
        Open{' '}
        <Link href={docsRoute} className="font-medium underline">
          {docsRoute}
        </Link>{' '}
        to read the docs ({i18n.defaultLanguage}).
      </p>
    </div>
  );
}

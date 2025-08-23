import TestV2Page from './test-v2/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Axis Integrity Test',
  description: '7 lines under pressure — you now.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
      <div className="mx-auto max-w-6xl p-2">
        <TestV2Page />
      </div>
    </div>
  );
}

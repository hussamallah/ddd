import QuizApp from './QuizApp';

export const dynamic = 'force-dynamic'; // skip prerender pressure
export const revalidate = 0; // ensure runtime fetch

export const metadata = {
  title: 'Axis Integrity Test',
  description: '7 lines under pressure — you now.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
      <div className="mx-auto max-w-6xl p-2">
        <QuizApp />
      </div>
    </div>
  );
}

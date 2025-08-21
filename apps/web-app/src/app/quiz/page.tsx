import QuizApp from './QuizApp';

export const metadata = {
  title: 'Axis Integrity Test',
  description: '7 lines under pressure — you now.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
      {/* Navigation buttons positioned at far right */}
      <div className="fixed top-4 right-4 flex space-x-3 z-50">
        <a 
          href="/quiz/sample-result" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm"
        >
          🎯 View Sample Results
        </a>
        <a 
          href="/quiz/strong-profiles" 
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm"
        >
          🏆 Strong Axis Profiles (200+)
        </a>
      </div>
      
      <div className="mx-auto max-w-6xl p-2">
        <QuizApp />
      </div>
    </div>
  );
}

'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const handleStartOldQuiz = () => {
    router.push('/quiz')
  }

  const handleStartNewQuiz = () => {
    router.push('/quiz/test-v2')
  }

  return (
    <main className="min-h-screen">
      <div className="hero">
        <div className="relative w-full h-full">
          {/* Quiz Selection Title */}
          <div className="absolute left-1/2 top-[40%] transform -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Axis Integrity Test
            </h1>
            <p className="text-xl text-white/80 mb-8 drop-shadow-md">
              Choose Your Quiz Experience
            </p>
          </div>
          
          {/* Old Quiz Button */}
          <button 
            onClick={handleStartOldQuiz}
            className="absolute left-[25%] top-[70%] transform -translate-x-1/2 -translate-y-1/2 px-8 py-3 bg-blue-500/90 backdrop-blur-md text-white font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)] border-2 border-blue-400/80"
          >
            🎯 OLD QUIZ
            <div className="text-sm font-normal mt-1 opacity-90">
              Classic Experience
            </div>
          </button>
          
          {/* Old Quiz Info */}
          <div className="absolute left-[25%] top-[78%] transform -translate-x-1/2 -translate-y-1/2 text-center max-w-xs">
            <p className="text-sm text-white/70 drop-shadow-md">
              Original quiz system with separate components
            </p>
          </div>
          
          {/* New Quiz Button */}
          <button 
            onClick={handleStartNewQuiz}
            className="absolute left-[75%] top-[70%] transform -translate-x-1/2 -translate-y-1/2 px-8 py-3 bg-yellow-400/90 backdrop-blur-md text-black font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:shadow-[0_0_40px_rgba(234,179,8,0.7)] border-2 border-yellow-300/80"
          >
            🚀 NEW QUIZ
            <div className="text-sm font-normal mt-1 opacity-90">
              Integrated v2.7
            </div>
          </button>
          
          {/* New Quiz Info */}
          <div className="absolute left-[75%] top-[78%] transform -translate-x-1/2 -translate-y-1/2 text-center max-w-xs">
            <p className="text-sm text-white/70 drop-shadow-md">
              All-in-one system with integrated results
            </p>
          </div>
          
          {/* Recommendation */}
          <div className="absolute left-1/2 bottom-[15%] transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-3 border border-white/20">
              <p className="text-sm text-white/90 font-medium">
                💡 Recommended: Try the NEW QUIZ for the complete experience
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hero {
          min-height: 100dvh;
          width: 100vw;
          background: url("/images/landig-page1.png") center/contain no-repeat;
          background-color: #0E2A2D;
        }
      `}</style>
    </main>
  )
}

'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  const handleStartTest = () => {
    router.push('/quiz')
  }

  return (
    <main className="min-h-screen">
      <div className="hero">
        <div className="relative w-full h-full">
          <button 
            onClick={handleStartTest}
            className="absolute left-[36.5%] top-[70.5%] transform -translate-x-1/2 -translate-y-1/2 px-8 py-3 bg-yellow-400/90 backdrop-blur-md text-black font-bold text-2xl rounded-2xl transition-all duration-300 hover:scale-110 shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:shadow-[0_0_40px_rgba(234,179,8,0.7)] border-2 border-yellow-300/80"
          >
            PRESS TO START
          </button>
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

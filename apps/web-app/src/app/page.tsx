'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [showStep, setShowStep] = useState(false)

  const handleStartTest = () => {
    // Navigate to the actual quiz page
    router.push('/quiz')
  }

  const handleChoiceClick = (button: HTMLButtonElement) => {
    button.style.borderColor = '#5b4a3a'
    button.style.background = '#201a16'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1b1814] via-[#0c0b09] to-[#0c0b09] bg-fixed bg-[length:1200px_700px] bg-[position:15%_10%]">
      <div className="max-w-6xl mx-auto p-6">
        <section className="relative border-2 border-[#d2ab59] rounded-3xl p-4 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.45)] bg-gradient-to-b from-[rgba(210,171,89,0.05)] to-transparent bg-[length:100%_120px] bg-no-repeat bg-[position:0_0], linear-gradient(to bottom, #15120f, #0e0c0a)">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 lg:gap-10 items-center min-h-[500px]">
            {/* Left side - eagle/hawk image */}
            <div className="relative min-h-[420px] lg:flex lg:items-center lg:justify-center" aria-hidden="true">
              <div className="w-96 h-96 lg:w-[640px] lg:h-[640px] flex items-center justify-center">
                <img 
                  src="/images/landingpage2.png" 
                  alt="Powerful eagle with golden highlights" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Content - right side */}
            <div className="content lg:col-start-2 w-full -translate-y-20">
              <h1 className="font-extrabold text-4xl sm:text-6xl lg:text-[72px] leading-[1.05] mt-1 mb-4 text-[#f3eee6]">
                Know your now.
              </h1>
              
              <div className="mt-[18px] mb-[6px] flex flex-col items-start gap-[10px]">
                <button 
                  onClick={handleStartTest}
                  className="relative inline-flex items-center justify-center gap-[0.6rem] h-[60px] px-4 sm:px-7 rounded-2xl border-2 border-[#d2ab59] text-[#f3eee6] font-extrabold tracking-[0.02em] text-lg sm:text-xl lg:text-[22px] bg-gradient-to-r from-[#c34733] to-[#a33329] shadow-[inset_0_2px_0_rgba(255,255,255,0.12),inset_0_-2px_0_rgba(0,0,0,0.35),0_8px_24px_rgba(204,65,45,0.25)] transition-all duration-150 ease-in-out hover:transform hover:-translate-y-[1px] hover:filter hover:saturate-[1.05] focus-visible:outline-3 focus-visible:outline-[#fff3] focus-visible:outline-offset-3 active:transform active:translate-y-0 active:shadow-[inset_0_3px_12px_rgba(0,0,0,0.35),0_6px_14px_rgba(204,65,45,0.2)]"
                  aria-label="Start the free test — about 3 to 4 minutes"
                >
                  START THE FREE TEST
                  {/* Glint effect */}
                  <div className="absolute inset-[2px] rounded-[14px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.22)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </button>
                
                <div className="text-sm text-[#e6dfd3]">
                  <span className="font-bold text-[#d2ab59]">Free • 3–4 min • No email</span>
                </div>
                
                <div className="flex gap-4 flex-wrap mt-[6px] text-sm text-[#e6dfd3]">
                  <span className="flex items-center gap-[6px]" aria-label="No signup">
                    <svg className="w-4 text-[#d2ab59]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    No signup
                  </span>
                  <span className="flex items-center gap-[6px]" aria-label="Instant result">
                    <svg className="w-4 text-[#d2ab59]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Instant result
                  </span>
                  <span className="flex items-center gap-[6px]" aria-label="Privacy first">
                    <svg className="w-4 text-[#d2ab59]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V7l-8-4-8 4v5c0 6 8 10 8 10z"/>
                    </svg>
                    Privacy-first
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="max-w-[880px] mx-auto mt-9 mb-2 text-center text-[#c8bfae] text-sm">
          Only your answers. No tricks. No pressure.
        </footer>
      </div>
    </main>
  )
}

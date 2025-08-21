'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [showPopup, setShowPopup] = useState(false)
  // Add state for smooth transition
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMode, setTransitionMode] = useState<string>('');

  const handleStartTest = () => {
    setShowPopup(true)
  }

  const handleModeSelect = (mode: string) => {
    // Start the cinematic transition
    setTransitionMode(mode);
    setIsTransitioning(true);
    
    // Wait for the fade-out animation to complete, then navigate
    setTimeout(() => {
      router.push(`/quiz?mode=${mode}`);
    }, 800); // 800ms for smooth fade-out
  }

  // Add CSS for the cinematic transition
  const popupClasses = `fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-800 ease-in-out ${
    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
  }`;

  const modalClasses = `bg-neutral-950 rounded-2xl shadow-2xl max-w-2xl w-full p-8 transition-all duration-800 ease-in-out ${
    isTransitioning ? 'opacity-0 -translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'
  }`;

  return (
    <main className="hero-wrap">
      <div className="hero">
        {/* CENTER: Poster */}
        <div style={{gridColumn:'1 / -1', textAlign:'center'}}>
          <div style={{maxWidth:'860px', margin:'0 auto', position:'relative'}}>
            <img src="/images/landing-page2.png" alt="Identity Core Mapper poster"
              style={{display:'block', width:'100%', height:'auto', objectFit:'contain'}}/>
            
            {/* Invisible clickable overlay over the fake button in the image */}
            <button 
              onClick={handleStartTest}
              role="button"
              tabIndex={0}
              aria-label="Start the free test"
              style={{
                position: 'absolute',
                top: '81%',  /* Moved down 1 tick */
                left: '51.5%',  /* Moved right to collapse right border by half a tick */
                transform: 'translateX(-50%)',  /* Center the element */
                width: '50%',  /* Increased width as requested */
                height: '7.5%',  /* Adjusted height as requested */
                cursor: 'pointer',
                zIndex: 10,
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartTest();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Popup Modal - Test Mode Selection Only */}
      {showPopup && (
        <div className={popupClasses}>
          <div className={modalClasses}>
            {/* Close Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowPopup(false)}
                className="text-neutral-400 hover:text-white font-medium py-2 px-4 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <h2 className="hd gilded text-2xl font-bold mb-6 text-center">Choose Your Test Mode</h2>
            
            <div className="space-y-4">
              <button
                onClick={() => handleModeSelect('original')}
                className="w-full p-4 text-left rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <h3 className="hd gilded font-semibold text-lg">📜 Original</h3>
                <p className="body text-sm text-neutral-400 mt-1">The classic AIT experience - your exact specifications, one-breath neutral prompts</p>
              </button>
              
              <button
                onClick={() => handleModeSelect('standard')}
                className="w-full p-4 text-left rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <h3 className="hd gilded font-semibold text-lg">🎯 Standard</h3>
                <p className="body text-sm text-neutral-400 mt-1">Classic AIT - test your axis integrity under normal pressure</p>
              </button>
              
              <button
                onClick={() => handleModeSelect('heat')}
                className="w-full p-4 text-left rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <h3 className="hd gilded font-semibold text-lg">🔥 Heat Mode</h3>
                <p className="body text-sm text-neutral-400 mt-1">High-pressure scenarios - when everything is urgent and visible</p>
              </button>
              
              <button
                onClick={() => handleModeSelect('friend')}
                className="w-full p-4 text-left rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <h3 className="hd gilded font-semibold text-lg">👥 Third-Person</h3>
                <p className="body text-sm text-neutral-400 mt-1">How others see your patterns - external perspective view</p>
              </button>
              
              <button
                onClick={() => handleModeSelect('bet')}
                className="w-full p-4 text-left rounded-lg border border-neutral-700 hover:border-neutral-500 transition-colors"
              >
                <h3 className="hd gilded font-semibold text-lg">🎲 Bet Mode</h3>
                <p className="body text-sm text-neutral-400 mt-1">Stakes are high - reputation and relationships on the line</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

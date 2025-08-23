"use client";

import type { Metadata } from 'next'
import { Cinzel, Lora } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-cinzel' })
const lora   = Lora({ subsets: ['latin'], weight: ['400','600'], variable: '--font-lora' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isLandingPage, setIsLandingPage] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [enableTracking, setEnableTracking] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsLandingPage(pathname === '/')
    
    // Check if tracking is blocked by extensions
    const checkTracking = () => {
      try {
        // Simple check for common blocking patterns
        if (typeof window !== 'undefined') {
          const testScript = document.createElement('script')
          testScript.src = 'data:text/javascript,console.log("tracking-test")'
          document.head.appendChild(testScript)
          document.head.removeChild(testScript)
          
          // Debug logging
          console.log('🔍 Tracking check passed, enableTracking will be:', true)
        }
      } catch (e) {
        console.log('❌ Tracking check failed, enableTracking will be:', false)
        setEnableTracking(false)
      }
    }
    
    checkTracking()
  }, [pathname])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <html lang="en" className={`${cinzel.variable} ${lora.variable}`}>
        <head>
          {/* Only load Hotjar if tracking is enabled */}
          {enableTracking && (
            <Script
              id="hotjar-tracking"
              strategy="afterInteractive"
              onError={() => setEnableTracking(false)}
              dangerouslySetInnerHTML={{
                __html: `
                  try {
                    (function(h,o,t,j,a,r){
                        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                        h._hjSettings={hjid:6500150,hjsv:6};
                        a=o.getElementsByTagName('head')[0];
                        r=o.createElement('script');r.async=1;
                        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                        a.appendChild(r);
                    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                  } catch(e) {
                    console.log('Hotjar failed to load:', e);
                  }
                `
              }}
            />
          )}
          
          {/* Microsoft Clarity tracking */}
          {enableTracking ? (
            <Script
              id="clarity-tracking"
              strategy="afterInteractive"
              onError={() => console.log('❌ Clarity failed to load')}
              onLoad={() => console.log('✅ Clarity script loaded successfully')}
              dangerouslySetInnerHTML={{
                __html: `
                  console.log('🚀 Clarity script executing...');
                  (function(c,l,a,r,i,t,y){
                      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                      console.log('✅ Clarity script tag created and inserted');
                  })(window, document, "clarity", "script", "szf17qutds");
                `
              }}
            />
          ) : (
            <div style={{display: 'none'}}>Clarity tracking disabled</div>
          )}
        </head>
        <body>
          <div className="loading-layout">
            {children}
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en" className={`${cinzel.variable} ${lora.variable}`}>
      <head>
        {/* Only load Hotjar if tracking is enabled */}
        {enableTracking && (
          <Script
            id="hotjar-tracking"
            strategy="afterInteractive"
            onError={() => setEnableTracking(false)}
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  (function(h,o,t,j,a,r){
                      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                      h._hjSettings={hjid:6500150,hjsv:6};
                      a=o.getElementsByTagName('head')[0];
                      r=o.createElement('script');r.async=1;
                      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                      a.appendChild(r);
                  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                } catch(e) {
                  console.log('Hotjar failed to load:', e);
                }
              `
            }}
          />
        )}
        
        {/* Microsoft Clarity tracking */}
        {enableTracking ? (
          <Script
            id="clarity-tracking"
            strategy="afterInteractive"
            onError={() => console.log('❌ Clarity failed to load')}
            onLoad={() => console.log('✅ Clarity script loaded successfully')}
            dangerouslySetInnerHTML={{
              __html: `
                console.log('🚀 Clarity script executing...');
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                    console.log('✅ Clarity script tag created and inserted');
                })(window, document, "clarity", "script", "szf17qutds");
              `
            }}
          />
        ) : (
          <div style={{display: 'none'}}>Clarity tracking disabled</div>
        )}
      </head>
      <body>
        {isLandingPage ? (
          // Landing page - no sidebar
          <div className="landing-layout">
            {children}
          </div>
        ) : (
          // Other pages - with sidebar
          <div className="layout-container">
            {/* Left Sidebar - Always Visible */}
            <div className="left-sidebar">
            </div>
            
            {/* Main Content Area */}
            <div className="main-content">
              {children}
            </div>
          </div>
        )}
      </body>
    </html>
  )
}

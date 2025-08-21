"use client";

import type { Metadata } from 'next'
import { Cinzel, Lora } from 'next/font/google'
import './globals.css'
import Script from 'next/script'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400','700','900'], variable: '--font-cinzel' })
const lora   = Lora({ subsets: ['latin'], weight: ['400','600'], variable: '--font-lora' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${lora.variable}`}>
      <head>
        <Script
          id="hotjar-tracking"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:6500150,hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}

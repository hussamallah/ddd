'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { generateArchetypeProfile } from '@/lib/archetype-generator';
import { composeAIR } from '../results/composeAIR';
import GbuDiagnosticCards from '../results/components/GbuDiagnosticCards';

// ————— Archetype Color Mapping —————
const ARCHETYPE_COLORS: Record<string, { name: string; hex: string }> = {
  "Sovereign": { "name": "Imperial Purple", "hex": "#6B2F8A" },
  "Visionary": { "name": "Indigo", "hex": "#3F51B5" },
  "Rebel": { "name": "Crimson", "hex": "#C62828" },
  "Equalizer": { "name": "Teal", "hex": "#00897B" },
  "Provider": { "name": "Sage Green", "hex": "#5E8C6A" },
  "Wanderer": { "name": "Turquoise", "hex": "#1ABC9C" },
  "Seeker": { "name": "Midnight Blue", "hex": "#0D47A1" },
  "Mask": { "name": "Charcoal", "hex": "#2E3138" },
  "Partner": { "name": "Rose", "hex": "#D81B60" },
  "Guardian": { "name": "Forest Green", "hex": "#1B5E20" },
  "Servant": { "name": "Ochre", "hex": "#A9782B" },
  "Spotlight": { "name": "Marigold", "hex": "#F9A825" },
  "Architect": { "name": "Blueprint Blue", "hex": "#355AA6" },
  "Strategist": { "name": "Navy", "hex": "#1A2A44" },
  "Catalyst": { "name": "Flame Orange", "hex": "#EF6C00" },
  "Diplomat": { "name": "Olive", "hex": "#6B8E23" },
  "Sentinel": { "name": "Blue-Gray", "hex": "#455A64" },
  "Artisan": { "name": "Terracotta", "hex": "#C65D3A" },
  "Navigator": { "name": "Cerulean", "hex": "#2A9DF4" },
  "Alchemist": { "name": "Citrine", "hex": "#C59A1F" }
};

// ————— Art Nouveau Archetype Icons —————
const GOLD = "#D4AF37"; // warm gold

// Decorative corner ornaments
function CornerOrnament({ flipX=false, flipY=false }: { flipX?: boolean; flipY?: boolean }) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return (
    <svg viewBox="0 0 100 100" className="absolute size-10 opacity-70" style={{ transform: `scale(${sx},${sy})`}} aria-hidden>
      <g fill="none" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2,98 C22,78 42,60 64,54"/>
        <path d="M6,94 C22,80 36,68 48,62"/>
        <path d="M38 70c8-8 18-10 24-8c-8 2-12 8-12 14c6-4 14-2 18 2c-10 0-16 6-18 12"/>
        <path d="M18 78c6-10 18-16 30-18"/>
      </g>
    </svg>
  );
}

// Icon definitions
const ICONS: Record<string, React.FC> = {
  Sovereign: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="58" r="22"/>
      <path d="M26 38l8 4l8-10l8 10l8-10l8 10l8-4"/>
      <path d="M20 72h60"/>
    </svg>
  ),
  Visionary: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 50c12-18 30-28 42-28s30 10 42 28c-12 18-30 28-42 28S20 68 8 50z"/>
      <circle cx="50" cy="50" r="10"/>
      <path d="M18 50h64"/>
    </svg>
  ),
  Rebel: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M38 16l-8 22h16l-10 28l26-26h-14l10-24z"/>
      <path d="M62 20l-6 14h12l-8 18"/>
    </svg>
  ),
  Equalizer: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 16v66"/>
      <path d="M22 28h56"/>
      <path d="M32 28l-12 20h24z"/>
      <path d="M68 28l-12 20h24z"/>
      <path d="M36 82h28"/>
    </svg>
  ),
  Provider: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 52c0 16 14 28 32 28s32-12 32-28H18z"/>
      <path d="M26 46c8-8 40-8 48 0"/>
    </svg>
  ),
  Wanderer: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="4"/>
      <path d="M50 10v22M50 68v22M10 50h22M68 50h22"/>
      <path d="M50 18l10 32l-10 10l-10-10z"/>
    </svg>
  ),
  Seeker: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="36" r="10"/>
      <path d="M50 46l-8 16h16z"/>
    </svg>
  ),
  Mask: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 30c0 20 12 34 32 34S82 50 82 30c-10 6-20 6-32 0c-12 6-22 6-32 0z"/>
      <path d="M38 44c2 0 4 2 4 4M58 44c-2 0-4 2-4 4"/>
      <path d="M50 28v40"/>
    </svg>
  ),
  Partner: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="35" cy="40" r="8"/>
      <circle cx="65" cy="40" r="8"/>
      <path d="M35 48c0 8 6 14 15 14s15-6 15-14"/>
      <path d="M65 48c0 8-6 14-15 14s-15-6-15-14"/>
    </svg>
  ),
  Guardian: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 40h60v40H20z"/>
      <path d="M35 40V20h30v20"/>
      <circle cx="50" cy="60" r="8"/>
    </svg>
  ),
  Servant: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="30" r="15"/>
      <path d="M25 70c0-15 11-25 25-25s25 10 25 25"/>
      <path d="M40 60h20"/>
      <path d="M40 70h20"/>
    </svg>
  ),
  Spotlight: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="30"/>
      <path d="M20 20l20 20M80 20l-20 20M20 80l20-20M80 80l-20-20"/>
    </svg>
  ),
  Architect: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 80V40l30-20l30 20v40"/>
      <path d="M35 60h30"/>
      <path d="M35 70h30"/>
      <circle cx="50" cy="50" r="5"/>
    </svg>
  ),
  Strategist: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20h60v60H20z"/>
      <path d="M30 30h40"/>
      <path d="M30 40h40"/>
      <path d="M30 50h25"/>
      <path d="M30 60h40"/>
      <path d="M30 70h30"/>
    </svg>
  ),
  Catalyst: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 20c-15 0-25 15-25 30s10 30 25 30s25-15 25-30S65 20 50 20z"/>
      <path d="M40 35l10 10l10-10"/>
    </svg>
  ),
  Diplomat: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 30h40v40H30z"/>
      <path d="M40 40h20"/>
      <path d="M40 50h20"/>
      <path d="M40 60h20"/>
      <circle cx="50" cy="35" r="3"/>
    </svg>
  ),
  Sentinel: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 40h60v30H20z"/>
      <path d="M30 40V20h40v20"/>
      <circle cx="50" cy="55" r="5"/>
    </svg>
  ),
  Artisan: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 30h40v40H30z"/>
      <path d="M40 40h20"/>
      <path d="M40 50h20"/>
      <path d="M40 60h20"/>
      <path d="M35 35l-5-5M65 35l5-5"/>
    </svg>
  ),
  Navigator: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 20L80 80H20L50 20z"/>
      <circle cx="50" cy="60" r="8"/>
      <path d="M50 52v16M42 60h16"/>
    </svg>
  ),
  Alchemist: () => (
    <svg viewBox="0 0 100 100" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 70V40l20-20l20 20v30"/>
      <circle cx="50" cy="50" r="8"/>
      <path d="M40 30h20"/>
    </svg>
  )
};

// Archetype Icon Component
function ArchetypeIcon({ archetypeName }: { archetypeName: string }) {
  const IconComponent = ICONS[archetypeName] || ICONS.Sovereign; // fallback to Sovereign
  
  return (
    <div className="relative">
      {/* Corner ornaments */}
      <CornerOrnament />
      <CornerOrnament flipX flipY />
      
      {/* Icon container */}
      <div className="relative z-10 flex items-center justify-center w-24 h-24 mx-auto">
        <IconComponent />
      </div>
    </div>
  );
}

// Mock data for testing - you can replace this with real data later
const mockVerdicts = [
  { line: 'Control', distance: 'Close', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} } },
  { line: 'Pace', distance: 'Offset', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} } },
  { line: 'Boundary', distance: 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 2} } },
  { line: 'Truth', distance: 'Close', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} } },
  { line: 'Recognition', distance: 'Offset', counts: { base: {A: 1, B: 2, C: 0}, final: {A: 1, B: 2, C: 0} } },
  { line: 'Bonding', distance: 'Far', counts: { base: {A: 0, B: 1, C: 2}, final: {A: 0, B: 1, C: 0} } },
  { line: 'Stress', distance: 'Close', counts: { base: {A: 3, B: 0, C: 0}, final: {A: 3, B: 0, C: 0} } }
];

export default function ChamperPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'original';
  
  // Generate results using the same logic as QuizApp
  const result = composeAIR(mockVerdicts, mode);
  const archetypeProfile = generateArchetypeProfile(mockVerdicts);
  const archetypeColor = ARCHETYPE_COLORS[archetypeProfile.archetype] || ARCHETYPE_COLORS.Sovereign;

  return (
    <div 
      className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{
        background: `radial-gradient(circle at center, ${archetypeColor.hex}10 0%, ${archetypeColor.hex}05 50%, #000000 100%)`,
        transform: 'scale(0.85)',
        transformOrigin: 'top center',
        marginTop: '-10vh'
      }}
    >
      {/* Logo in top left */}
      <div className="absolute top-4 left-4 z-50">
        <img 
          src="/images/logo1.png" 
          alt="Logo" 
          className="h-12 w-auto"
        />
      </div>

      {/* Glowing Background Elements */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${archetypeColor.hex}40 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, ${archetypeColor.hex}30 0%, transparent 50%)`
        }}
      />
      
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-yellow-400">Identity Code Mapper</h1>
        </div>
        
        {/* Results Header */}
        <div className="text-center mb-12">
          {/* Archetype Icon - Centered and Glowing */}
          <div className="mb-6 flex justify-center">
            <div 
              className="p-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${archetypeColor.hex}30, ${archetypeColor.hex}10)`,
                boxShadow: `0 0 30px ${archetypeColor.hex}50, 0 0 60px ${archetypeColor.hex}30`
              }}
            >
              <ArchetypeIcon archetypeName={archetypeProfile.archetype} />
            </div>
          </div>
          
          {/* Main Title - Glowing Archetype Name */}
          <h1 
            className="text-6xl font-black mb-4 tracking-wider"
            style={{
              color: archetypeColor.hex,
              textShadow: `0 0 20px ${archetypeColor.hex}, 0 0 40px ${archetypeColor.hex}80`
            }}
          >
            {archetypeProfile.archetype.toUpperCase()}
          </h1>
          
          {/* Subtitle 1 */}
          <h2 className="text-2xl text-white mb-2 font-medium">
            {(() => {
              // Find all lines that are not Close (Offset or Far)
              const offLines = mockVerdicts.filter(l => l.distance !== 'Close');
              
              // Group by distance type
              const brokenLines = offLines.filter(l => l.distance === 'Far').map(l => l.line);
              const stalledLines = offLines.filter(l => l.distance === 'Offset').map(l => l.line);
              
              // Create descriptive combinations
              let description = '';
              
              if (brokenLines.length > 0 && stalledLines.length > 0) {
                description = `Broken in ${brokenLines.join(' + ')} — Stalled in ${stalledLines.join(' + ')}`;
              } else if (brokenLines.length > 0) {
                description = `Broken in ${brokenLines.join(' + ')}`;
              } else if (stalledLines.length > 0) {
                description = `Stalled in ${stalledLines.join(' + ')}`;
              } else {
                description = 'Stable';
              }
              
              return description;
            })()}
          </h2>
        </div>

        {/* MAIN CONTENT BLOCK */}
        <div 
          className="max-w-2xl mx-auto mb-12 p-8 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}15, ${archetypeColor.hex}25, ${archetypeColor.hex}15)`,
            border: `1px solid ${archetypeColor.hex}30`
          }}
        >
          <h3 
            className="text-2xl font-bold mb-4"
            style={{ color: archetypeColor.hex }}
          >
            What These Traits Reveal About You
          </h3>
          <div className="space-y-4 text-lg text-white/90 leading-relaxed">
            <p>
              Every answer you gave was a real reflection of your way of moving through life—not a guess, not an ideal.
            </p>
            <p>
              You didn't invent these patterns; they're the lines your experience has already drawn.
            </p>
          </div>
          
          {/* Glowing Line */}
          <div 
            className="mt-6 h-1 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${archetypeColor.hex}, transparent)`,
              boxShadow: `0 0 10px ${archetypeColor.hex}`
            }}
          />
        </div>

        {/* Results Heat Map */}
        <div 
          className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
            border: `1px solid ${archetypeColor.hex}40`,
            boxShadow: `0 0 20px ${archetypeColor.hex}20`
          }}
        >
          <h3 className="text-xl font-semibold mb-4" style={{ color: archetypeColor.hex }}>
            Results Heat Map
          </h3>
          <div className="grid grid-cols-7 gap-4">
            {mockVerdicts.map((verdict, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-white/80 mb-2">{verdict.line}</div>
                <div 
                  className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-white font-bold ${
                    verdict.distance === 'Close' ? 'bg-green-600' : 
                    verdict.distance === 'Offset' ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                >
                  {verdict.distance === 'Close' ? '✓' : 
                   verdict.distance === 'Offset' ? '▲' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Good/Bad/Ugly Analysis */}
        <div 
          className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
          style={{
            background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
            border: `1px solid ${archetypeColor.hex}40`,
            boxShadow: `0 0 20px ${archetypeColor.hex}20`
          }}
        >
          <GbuDiagnosticCards
            good={result.goodBadUgly.good}
            bad={result.goodBadUgly.bad}
            ugly={result.goodBadUgly.ugly || ''}
            goodFooter="Stable. Outcomes land. Clear tempo."
            badFooter="Variability enters. Delays creep in."
          />
        </div>
        
        {/* Mode-Specific Insights */}
        {mode !== 'original' && result.modeSpecificInsights && (
          <div 
            className="max-w-6xl mx-auto mb-8 p-6 rounded-2xl backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${archetypeColor.hex}20, ${archetypeColor.hex}30)`,
              border: `1px solid ${archetypeColor.hex}40`,
              boxShadow: `0 0 20px ${archetypeColor.hex}20`
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4"
              style={{ color: archetypeColor.hex }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode Insights
            </h3>
            <div className="space-y-2 text-base text-white/90">
              {result.modeSpecificInsights.heatAnalysis && (
                <p>{result.modeSpecificInsights.heatAnalysis}</p>
              )}
              {result.modeSpecificInsights.thirdPersonPattern && (
                <p>{result.modeSpecificInsights.thirdPersonPattern}</p>
              )}
              {result.modeSpecificInsights.betOutcome && (
                <p>{result.modeSpecificInsights.betOutcome}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Navigation to All Profiles */}
        <div className="text-center mt-12">
          <a 
            href="/quiz/champer/all-profiles"
            className="inline-flex items-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${archetypeColor.hex}, ${archetypeColor.hex}80)`,
              boxShadow: `0 0 20px ${archetypeColor.hex}50`,
              color: '#000'
            }}
          >
            🏛️ Explore All 190+ Profiles
          </a>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface GbuDiagnosticCardsProps {
  good: string;
  bad: string;
  ugly: string;
  goodFooter: string;
  badFooter: string;
}

export default function GbuDiagnosticCards({ 
  good, 
  bad, 
  ugly, 
  goodFooter, 
  badFooter 
}: GbuDiagnosticCardsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-center mb-6">Diagnostic Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Good Card */}
        <div className="rounded-2xl border border-emerald-600/30 bg-emerald-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <div className="text-lg font-semibold text-emerald-300">✅ The Good</div>
          </div>
          <div className="text-base text-emerald-200 font-medium text-center mb-4 leading-relaxed">
            {good}
          </div>
          <div className="text-sm text-emerald-400 text-center italic">
            {goodFooter}
          </div>
        </div>

        {/* Bad Card */}
        <div className="rounded-2xl border border-amber-600/30 bg-amber-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <div className="text-lg font-semibold text-amber-300">⚠️ The Bad</div>
          </div>
          <div className="text-base text-amber-200 font-medium text-center mb-4 leading-relaxed">
            {bad}
          </div>
          <div className="text-sm text-amber-400 text-center italic">
            {badFooter}
          </div>
        </div>

        {/* Ugly Card */}
        <div className="rounded-2xl border border-rose-600/30 bg-rose-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full bg-rose-500"></div>
            <div className="text-lg font-semibold text-rose-300">❌ The Ugly</div>
          </div>
          <div className="text-base text-rose-200 font-medium text-center mb-4 leading-relaxed">
            {ugly}
          </div>
          <div className="text-sm text-rose-400 text-center italic">
            Critical breakdowns
          </div>
        </div>
      </div>
    </div>
  );
}

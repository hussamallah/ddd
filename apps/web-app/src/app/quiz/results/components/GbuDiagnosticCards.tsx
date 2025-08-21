'use client';

import React from 'react';

type GBU = {
  good: string[];   // 3–5 compact bullets
  bad: string[];    // 3–5 compact bullets
  ugly: string;     // 1 muted sentence
  goodFooter?: string; // optional muted one-liner (e.g., "Stable. Outcomes land. Clear tempo.")
  badFooter?: string;  // optional muted one-liner (e.g., "Variability enters. Delays creep in.")
  uglyFooter?: string; // optional muted one-liner (optional; can be same as ugly if you prefer)
};

type CardSpec = {
  tone: 'good' | 'bad' | 'ugly';
  title: string;
  icon: string;      // ✓ / ⚠ / ✖
  bullets: string[];
  footer: string;
};

export default function GbuDiagnosticCards(props: GBU) {
  const { good, bad, ugly, goodFooter, badFooter, uglyFooter } = props;

  const cards: CardSpec[] = [
    {
      tone: 'good',
      title: 'The Good',
      icon: '✓',
      bullets: good,
      footer: goodFooter ?? 'Stable. Outcomes land. Clear tempo.',
    },
    {
      tone: 'bad',
      title: 'The Bad',
      icon: '⚠',
      bullets: bad,
      footer: badFooter ?? 'Variability enters. Delays creep in.',
    },
    {
      tone: 'ugly',
      title: 'The Ugly',
      icon: '✖',
      bullets: ugly ? [ugly] : [],
      footer: uglyFooter ?? '',
    },
  ];

  return (
    <section className="mt-6">
      {/* Desktop: 3-up; Mobile: stacked */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <article
            key={c.title}
            className={cardClass(c.tone)}
            role="region"
            aria-labelledby={idFor(c.title)}
          >
            {/* Header chip */}
            <header className="flex items-center justify-center gap-2">
              <span className={chipClass(c.tone)} aria-hidden="true">
                {c.icon}
              </span>
              <h3 id={idFor(c.title)} className="text-base font-semibold tracking-wide">
                {c.title}
              </h3>
            </header>

            {/* Divider */}
            <div className="my-3 h-px w-full bg-white/10" />

            {/* Bullets (centered, 3–5 for Good/Bad; 1 for Ugly) */}
            <ul className="space-y-2 text-center text-[15px] leading-6">
              {c.bullets.map((b, i) => (
                <li key={i} className="mx-auto max-w-[40ch]">
                  • {normalize(b)}
                </li>
              ))}
              {/* Ensure at least one line on Ugly even if bullets empty */}
              {c.tone === 'ugly' && c.bullets.length === 0 && (
                <li className="mx-auto max-w-[40ch]">• Sequence breaks under stacked pressure</li>
              )}
            </ul>

            {/* Footer (muted one-liner) */}
            {(c.footer ?? '').trim() !== '' && (
              <p className="mt-3 text-center text-sm text-white/50 italic">
                {c.footer}
            </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- Helpers ---------- */

function idFor(title: string) {
  return `gbu-${title.toLowerCase().replace(/\s+/g, '-')}`;
}

function normalize(s: string) {
  // Compact style: trim, remove trailing punctuation, collapse spaces
  const t = s.replace(/\s+/g, ' ').trim().replace(/[.;,:]+$/g, '');
  return t;
}

function cardClass(tone: 'good' | 'bad' | 'ugly') {
  const base =
    'rounded-2xl border p-5 md:p-6 shadow-sm transition-colors duration-200 bg-black/30';
  const palette = {
    good: 'border-emerald-600/40 hover:border-emerald-400/60',
    bad: 'border-amber-600/40 hover:border-amber-400/60',
    ugly: 'border-rose-700/40 hover:border-rose-500/60',
  }[tone];
  return `${base} ${palette}`;
}

function chipClass(tone: 'good' | 'bad' | 'ugly') {
  const base =
    'inline-flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold';
  const palette = {
    good: 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40',
    bad: 'bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/40',
    ugly: 'bg-rose-700/25 text-rose-300 ring-1 ring-rose-500/40',
  }[tone];
  return `${base} ${palette}`;
}

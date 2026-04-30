import { useState } from 'react';
import type { MatchView } from '../types';
import { formatRange, humanDuration } from '../utils/time';
import { incrementReveal } from '../services/profiles';
import { track } from '../services/analytics';

interface Props {
  match: MatchView;
  delayMs?: number;
}

export default function MatchCard({ match, delayMs = 0 }: Props) {
  const { profile, overlapStart, overlapEnd, overlapMinutes } = match;
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const reveal = async () => {
    setBusy(true);
    try {
      await incrementReveal(profile.id);
      track('instagram_revealed', { airport: profile.airportCode });
      setRevealed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className="card card-hover flex flex-col gap-3 animate-fade-in"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold text-amber-900">
              {profile.nickname}, {profile.age}
            </h3>
            {profile.emailVerified && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                title="Email verified — passed our quick real-human check."
              >
                ✓ Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-amber-900/70">
            ⏱ {humanDuration(overlapMinutes)} together · {formatRange(overlapStart, overlapEnd)}
          </p>
        </div>
        <span className="pill">✈️ {profile.airportCode}</span>
      </header>

      {profile.vibe.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.vibe.map((v) => (
            <span key={v} className="chip">
              {vibeEmoji(v)} {v}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-amber-900/80">Someone else is waiting too ✨</p>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {revealed ? (
          <a
            className="btn-primary"
            href={`https://instagram.com/${profile.instagram}`}
            target="_blank"
            rel="noreferrer"
          >
            📸 @{profile.instagram}
          </a>
        ) : (
          <button className="btn-primary" onClick={reveal} disabled={busy}>
            {busy ? 'Revealing…' : '💌 Reveal Instagram'}
          </button>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => alert('Reporting coming soon — for the MVP, just close the tab.')}
        >
          🌷 Report / hide
        </button>
      </div>

      <p className="text-xs text-amber-900/55">
        Stay in public airport areas. Don't share boarding passes or documents.
      </p>
    </article>
  );
}

function vibeEmoji(v: string): string {
  switch (v) {
    case 'coffee':
      return '☕';
    case 'drinks':
      return '🍷';
    case 'walk':
      return '🚶';
    case 'chat':
      return '💬';
    case 'dating':
      return '💘';
    case 'friends':
      return '🤝';
    default:
      return '✨';
  }
}

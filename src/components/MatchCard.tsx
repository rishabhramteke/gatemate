import { useState } from 'react';
import type { MatchView } from '../types';
import { formatRange, humanDuration } from '../utils/time';
import { incrementReveal } from '../services/profiles';
import { track } from '../services/analytics';

interface Props {
  match: MatchView;
}

export default function MatchCard({ match }: Props) {
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
    <article className="card flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {profile.name}, {profile.age}
          </h3>
          <p className="text-sm text-slate-500">
            ⏱ {humanDuration(overlapMinutes)} overlap · {formatRange(overlapStart, overlapEnd)}
          </p>
        </div>
        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
          ✈️ {profile.airportCode}
        </span>
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
            {busy ? 'Revealing…' : 'Reveal Instagram'}
          </button>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => alert('Reporting coming soon — for the MVP, just close the tab.')}
        >
          🚩 Report / hide
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Only meet in public airport areas. Don't share boarding passes or documents.
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

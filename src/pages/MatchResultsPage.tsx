import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import { airportLabel } from '../utils/airports';
import { formatRange } from '../utils/time';
import { listActiveByAirport, firebaseReady } from '../services/profiles';
import { overlapMatches } from '../services/matching';
import { track } from '../services/analytics';
import type { Gender, InterestedIn, MatchView } from '../types';

export default function MatchResultsPage() {
  const [params] = useSearchParams();
  const airport = params.get('airport') ?? '';
  const start = params.get('start');
  const end = params.get('end');
  const gender = (params.get('gender') ?? 'other') as Gender;
  const interestedIn = (params.get('interestedIn') ?? 'everyone') as InterestedIn;
  const id = params.get('id');
  const name = params.get('name');

  const viewer = useMemo(() => {
    if (!start || !end || !airport) return null;
    return {
      id,
      airportCode: airport,
      gender,
      interestedIn,
      layoverStart: new Date(start),
      layoverEnd: new Date(end),
    };
  }, [airport, start, end, gender, interestedIn, id]);

  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('page_view', { page: 'matches' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!viewer) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        if (!firebaseReady()) {
          setMatches([]);
          return;
        }
        const profiles = await listActiveByAirport(viewer.airportCode);
        if (cancelled) return;
        const result = overlapMatches(viewer, profiles);
        setMatches(result);
        track('matches_found', { airport: viewer.airportCode, count: result.length });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load matches.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [viewer]);

  if (!viewer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold">Missing layover info</h1>
        <p className="mt-2 text-slate-600">Start over by filling out the signup form.</p>
        <Link to="/signup" className="btn-primary mt-6">Drop your layover</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        {name && <p className="text-sm font-medium text-sky-700">Hi {name} 👋</p>}
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
          {loading ? 'Looking for travelers…' : `${matches.length} traveler${matches.length === 1 ? '' : 's'} overlap with your layover`}
        </h1>
        <p className="mt-1 text-slate-600">
          {airportLabel(viewer.airportCode)} · {formatRange(viewer.layoverStart, viewer.layoverEnd)}
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!firebaseReady() && (
        <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
          Demo mode — no live database connected. Configure Firebase to see real travelers here.
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-1/2 rounded bg-slate-100" />
              <div className="mt-3 h-3 w-3/4 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState airport={viewer.airportCode} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.profile.id} match={m} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link to="/signup" className="btn-ghost">Edit my layover</Link>
      </div>
    </div>
  );
}

function EmptyState({ airport }: { airport: string }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareText = `Stuck at ${airport}? Drop your Instagram on GateMate and meet someone during your layover ✈️`;
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'GateMate', text: shareText, url: shareUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="card text-center">
      <p className="text-3xl">🛬</p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">Looks quiet during your layover.</h2>
      <p className="mt-1 text-slate-600">
        Leave your Instagram and we'll show you to anyone who lands while you're still here.
      </p>
      <p className="mt-3 text-sm text-slate-500">
        Share this with another traveler at {airport} to kick things off.
      </p>
      <button onClick={handleShare} className="btn-primary mt-5">
        📤 Share GateMate
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import { AirportActivityMap } from '../components/airportMap';
import { airportLabel } from '../utils/airports';
import { formatRange } from '../utils/time';
import {
  firebaseReady,
  getMyLatestActiveProfile,
  listActiveByAirport,
} from '../services/profiles';
import { watchAuth } from '../services/auth';
import { overlapMatches, type ViewerForMatching } from '../services/matching';
import { loadDraft } from '../services/storage';
import { track } from '../services/analytics';
import type { LayoverProfile, MatchView } from '../types';

export default function MatchResultsPage() {
  const [params] = useSearchParams();
  const isDemo = params.get('demo') === '1' || !firebaseReady();

  const [viewer, setViewer] = useState<ViewerForMatching | null>(null);
  const [viewerProfile, setViewerProfile] = useState<LayoverProfile | null>(null);
  const [matches, setMatches] = useState<MatchView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('page_view', { page: 'matches' });
  }, []);

  // 1. Resolve the viewer.
  useEffect(() => {
    let cancelled = false;

    if (isDemo) {
      const draft = loadDraft();
      if (!draft) {
        setLoading(false);
        return;
      }
      setViewer({
        profileId: null,
        userId: null,
        airportCode: draft.airportCode,
        gender: draft.gender,
        interestedIn: draft.interestedIn,
        layoverStart: draft.layoverStart,
        layoverEnd: draft.layoverEnd,
      });
      setViewerProfile(null);
      setLoading(false);
      return;
    }

    const unsub = watchAuth(async (user) => {
      if (cancelled) return;
      if (!user) {
        setViewer(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getMyLatestActiveProfile();
        if (cancelled) return;
        if (!profile) {
          setViewer(null);
          setLoading(false);
          return;
        }
        setViewerProfile(profile);
        setViewer({
          profileId: profile.id,
          userId: profile.userId,
          airportCode: profile.airportCode,
          gender: profile.gender,
          interestedIn: profile.interestedIn,
          layoverStart: profile.layoverStart.toDate(),
          layoverEnd: profile.layoverEnd.toDate(),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load your profile.');
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [isDemo]);

  // 2. Fetch candidates + run matching.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!viewer) return;
      setLoading(true);
      try {
        if (isDemo) {
          setMatches([]);
        } else {
          const profiles = await listActiveByAirport(viewer.airportCode);
          if (cancelled) return;
          const result = overlapMatches(viewer, profiles);
          setMatches(result);
          track('matches_found', { airport: viewer.airportCode, count: result.length });
        }
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
  }, [viewer, isDemo]);

  const headerLine = useMemo(() => {
    if (loading) return 'Looking around the airport ✨';
    if (matches.length === 0) return 'Quiet skies for now…';
    return `${matches.length} traveler${matches.length === 1 ? '' : 's'} overlap with your layover`;
  }, [loading, matches.length]);

  if (!viewer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center animate-fade-in">
        <h1 className="font-display text-2xl font-bold text-amber-900">Missing layover info</h1>
        <p className="mt-2 text-amber-900/70">
          Drop a fresh layover to see who's around at your airport.
        </p>
        <Link to="/signup" className="btn-primary mt-6 inline-flex">Drop your layover</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 animate-fade-in">
        {viewerProfile?.nickname && (
          <p className="text-sm font-semibold text-peach-600">Hi {viewerProfile.nickname} 👋</p>
        )}
        <h1 className="mt-1 font-display text-3xl font-bold text-amber-900">{headerLine}</h1>
        <p className="mt-1 text-amber-900/75">
          {airportLabel(viewer.airportCode)} · {formatRange(viewer.layoverStart, viewer.layoverEnd)}
        </p>
        {!loading && matches.length > 0 && (
          <p className="mt-1 text-sm text-peach-600">Someone else is waiting too ✨</p>
        )}
      </header>

      <div className="mb-6">
        <AirportActivityMap airportCode={viewer.airportCode} />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isDemo && (
        <div className="mb-4 rounded-3xl border border-skyish-200 bg-skyish-50/80 p-3 text-sm text-sky-800 shadow-soft">
          ✨ Demo mode — no live database connected. Configure Firebase to see real travelers here.
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-1/2 rounded bg-peach-100" />
              <div className="mt-3 h-3 w-3/4 rounded bg-peach-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-peach-100" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState airport={viewer.airportCode} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {matches.map((m, i) => (
            <MatchCard key={m.profile.id} match={m} delayMs={i * 80} />
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
  const shareUrl =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareText = `Stuck at ${airport}? Drop your Instagram on GateMate and meet someone during your layover ✨`;

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
    <div className="card text-center animate-fade-in">
      <p className="text-3xl">🛬</p>
      <h2 className="mt-2 font-display text-xl font-bold text-amber-900">Looks quiet during your layover.</h2>
      <p className="mt-1 text-amber-900/75">
        You might not be alone this layover ✨ — leave your Instagram and we'll show you to anyone who
        lands while you're still here.
      </p>
      <p className="mt-3 text-sm text-amber-900/65">
        Share this with another traveler at {airport} to kick things off.
      </p>
      <button onClick={handleShare} className="btn-primary mt-5">
        📤 Share GateMate
      </button>
    </div>
  );
}

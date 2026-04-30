import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AirportSelect from '../components/AirportSelect';
import VibeSelector from '../components/VibeSelector';
import PrivacyNotice from '../components/PrivacyNotice';
import { fromDatetimeLocal, toDatetimeLocal } from '../utils/time';
import { firebaseReady } from '../services/profiles';
import { saveDraft } from '../services/storage';
import { track } from '../services/analytics';
import type { Gender, InterestedIn, ProfileDraft, Vibe } from '../types';

export default function SignupPage() {
  const navigate = useNavigate();
  const startedRef = useRef(false);

  const defaults = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    return { start: toDatetimeLocal(start), end: toDatetimeLocal(end) };
  }, []);

  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('woman');
  const [interestedIn, setInterestedIn] = useState<InterestedIn>('everyone');
  const [airportCode, setAirportCode] = useState('AMS');
  const [layoverStart, setLayoverStart] = useState(defaults.start);
  const [layoverEnd, setLayoverEnd] = useState(defaults.end);
  const [instagram, setInstagram] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [vibe, setVibe] = useState<Vibe[]>(['coffee']);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('page_view', { page: 'signup' });
  }, []);

  const markStarted = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track('form_started');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (typeof age !== 'number' || age < 18) {
      setError('You must be 18 or older.');
      return;
    }
    const start = fromDatetimeLocal(layoverStart);
    const end = fromDatetimeLocal(layoverEnd);
    if (!(end > start)) {
      setError('Layover end must be after start.');
      return;
    }
    if (end < new Date()) {
      setError('Layover already ended — pick a future window.');
      return;
    }
    if (!instagram.trim()) {
      setError('Instagram handle is required so others can reach you.');
      return;
    }
    if (!consent) {
      setError('Please tick the consent box to continue.');
      return;
    }

    const draft: ProfileDraft = {
      nickname: nickname.trim(),
      age,
      gender,
      interestedIn,
      airportCode,
      layoverStart: start,
      layoverEnd: end,
      instagram: instagram.trim(),
      flightNumber: flightNumber.trim() || undefined,
      vibe,
      consent,
    };

    setSubmitting(true);
    saveDraft(draft);
    track('form_submitted', { airport: airportCode });
    navigate('/verify');
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
      <header className="mb-6">
        <span className="pill">step 1 of 2 · cosy & quick</span>
        <h1 className="mt-3 font-display text-3xl font-bold text-amber-900">Drop your layover ✈️</h1>
        <p className="mt-1 text-amber-900/75">
          30 seconds. No password. We'll send a quick email check before you go live.
        </p>
      </header>

      {!firebaseReady() && (
        <div className="mb-4 rounded-3xl border border-skyish-200 bg-skyish-50/80 p-3 text-sm text-sky-800 shadow-soft">
          ✨ Demo mode — Firebase isn't configured, so submissions stay local. Set the{' '}
          <code className="rounded bg-white px-1">VITE_FIREBASE_*</code> env vars to enable matching.
        </div>
      )}

      <form className="card space-y-5" onSubmit={handleSubmit} onChange={markStarted}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nickname">Nickname</label>
            <input
              id="nickname"
              className="input"
              required
              maxLength={40}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Alex"
            />
          </div>
          <div>
            <label className="label" htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              min={18}
              max={99}
              className="input"
              required
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="gender">Gender</label>
            <select
              id="gender"
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="woman">Woman</option>
              <option value="man">Man</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="interestedIn">Interested in</label>
            <select
              id="interestedIn"
              className="input"
              value={interestedIn}
              onChange={(e) => setInterestedIn(e.target.value as InterestedIn)}
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="everyone">Everyone</option>
              <option value="friends">Friends only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ig">Instagram handle</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-peach-400">@</span>
            <input
              id="ig"
              className="input pl-7"
              required
              maxLength={32}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="yourhandle"
            />
          </div>
          <p className="mt-1 text-xs text-amber-900/60">
            Only revealed when someone taps "Reveal". Public, on purpose.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="airport">Airport</label>
          <AirportSelect value={airportCode} onChange={setAirportCode} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="start">Layover starts</label>
            <input
              id="start"
              type="datetime-local"
              className="input"
              required
              value={layoverStart}
              onChange={(e) => setLayoverStart(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="end">Layover ends</label>
            <input
              id="end"
              type="datetime-local"
              className="input"
              required
              value={layoverEnd}
              onChange={(e) => setLayoverEnd(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="flight">Flight number (optional)</label>
          <input
            id="flight"
            className="input"
            maxLength={10}
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="KL1234"
          />
        </div>

        <div>
          <span className="label">Vibe</span>
          <VibeSelector value={vibe} onChange={setVibe} />
        </div>

        <PrivacyNotice />

        <label className="flex items-start gap-2 text-sm text-amber-900/85">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-peach-300 text-peach-500 focus:ring-peach-300"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I agree my profile may be shown to overlapping travelers at this airport, and that my
            Instagram handle is shared only when someone taps "Reveal".
          </span>
        </label>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full text-lg" disabled={submitting}>
          {submitting ? 'Saving…' : 'Next: quick email check ✨'}
        </button>
      </form>
    </div>
  );
}

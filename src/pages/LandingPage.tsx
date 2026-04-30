import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AIRPORTS } from '../utils/airports';
import { track } from '../services/analytics';

export default function LandingPage() {
  useEffect(() => {
    track('page_view', { page: 'landing' });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <section className="text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
          ✈️ MVP · No login needed
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Stuck at an airport?{' '}
          <span className="bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
            Meet someone during your layover.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          GateMate matches travelers at the same airport whose layovers overlap. No chat. No swiping. Just
          drop your Instagram and meet for ☕, a 🚶, or a 💬 between flights.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="btn-primary text-lg">
            🛫 Find people at my airport
          </Link>
          <a className="btn-ghost" href="#how">
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="mt-16 grid gap-4 sm:grid-cols-3">
        <Step
          n="1"
          title="Drop your layover"
          body="Airport, dates, vibe. Takes 30 seconds. No login."
          emoji="🛬"
        />
        <Step
          n="2"
          title="See who overlaps"
          body="We show travelers at the same airport during your time window."
          emoji="🤝"
        />
        <Step
          n="3"
          title="Connect on Instagram"
          body="Tap reveal, slide into DMs, meet for coffee. We never message you."
          emoji="📸"
        />
      </section>

      <section className="mt-12">
        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500">
          Live at airports
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {AIRPORTS.map((a) => (
            <span key={a.code} className="chip">
              {a.emoji} {a.code}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-gradient-to-br from-sky-600 to-sky-500 p-6 text-white shadow-card">
        <h2 className="text-2xl font-bold">Privacy first.</h2>
        <ul className="mt-3 space-y-1 text-sky-50">
          <li>· Instagram handles are hidden by default — revealed only on tap.</li>
          <li>· Profiles auto-expire when your layover ends.</li>
          <li>· Always meet in public airport areas.</li>
        </ul>
        <Link to="/signup" className="mt-5 inline-block rounded-2xl bg-white px-5 py-3 font-semibold text-sky-700 shadow-card hover:bg-sky-50">
          Create my layover →
        </Link>
      </section>
    </div>
  );
}

function Step({ n, title, body, emoji }: { n: string; title: string; body: string; emoji: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-100">{n}</span>
        <span aria-hidden>{emoji}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

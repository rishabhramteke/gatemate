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
      <section className="relative text-center animate-fade-in">
        <span className="pill">✈️ MVP · no login, no chat</span>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-amber-900 sm:text-5xl">
          Stuck at an airport?{' '}
          <span className="bg-gradient-to-r from-peach-500 via-peach-400 to-rose-300 bg-clip-text text-transparent">
            Meet someone during your layover.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-amber-900/75">
          A cosy little corner for travelers. Drop your layover, see who else is around, and connect on
          Instagram for ☕ a coffee, 🚶 a walk, or 💬 a chat between flights.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="btn-primary text-lg">
            🛫 Find people at my airport
          </Link>
          <a className="btn-ghost" href="#how">
            How it works
          </a>
        </div>

        <FloatingDecor />
      </section>

      <section id="how" className="mt-16 grid gap-4 sm:grid-cols-3">
        <Step n="1" title="Drop your layover" body="Airport, dates, vibe. 30 seconds. No login." emoji="🛬" delay={0} />
        <Step n="2" title="See who overlaps" body="Travelers at the same airport, in your time window." emoji="🤝" delay={120} />
        <Step n="3" title="Slide into Instagram" body="Tap reveal. We never message you. Meet for coffee." emoji="📸" delay={240} />
      </section>

      <section className="mt-12">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-amber-700/80">
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

      <section className="mt-12 overflow-hidden rounded-blob bg-gradient-to-br from-peach-200 via-peach-300 to-rose-200 p-8 text-amber-950 shadow-soft">
        <h2 className="font-display text-2xl font-bold">Privacy first, with a soft landing.</h2>
        <ul className="mt-3 space-y-1 text-amber-950/85">
          <li>✨ Instagram handles stay hidden — revealed only on tap.</li>
          <li>🌙 Profiles auto-expire when your layover ends.</li>
          <li>☕ Always meet in public airport areas.</li>
        </ul>
        <Link
          to="/signup"
          className="mt-5 inline-block rounded-full bg-white/95 px-5 py-3 font-semibold text-peach-600 shadow-soft hover:bg-white"
        >
          Create my layover →
        </Link>
      </section>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  emoji,
  delay,
}: {
  n: string;
  title: string;
  body: string;
  emoji: string;
  delay: number;
}) {
  return (
    <div className="card card-hover animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 text-sm font-semibold text-peach-600">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-peach-100">{n}</span>
        <span aria-hidden className="text-base">
          {emoji}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-amber-900">{title}</h3>
      <p className="mt-1 text-sm text-amber-900/75">{body}</p>
    </div>
  );
}

function FloatingDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <span className="absolute left-2 top-6 animate-float text-2xl opacity-70">☁️</span>
      <span className="absolute right-4 top-16 animate-sparkle text-xl">✨</span>
      <span className="absolute left-10 bottom-2 animate-drift-x text-2xl opacity-80">✈️</span>
      <span className="absolute right-10 bottom-6 animate-float text-xl opacity-70">☕</span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmailVerificationStep from '../components/EmailVerificationStep';
import {
  authReady,
  completeEmailLinkSignIn,
  isReturningFromEmailLink,
  sendVerificationLink,
} from '../services/auth';
import { createVerifiedProfile, firebaseReady } from '../services/profiles';
import { clearDraft, loadDraft } from '../services/storage';
import { track } from '../services/analytics';

type Phase = 'loading' | 'collect_email' | 'finalizing' | 'no_draft' | 'demo' | 'error';

export default function VerifyPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    track('page_view', { page: 'verify' });
    if (!firebaseReady() || !authReady()) {
      setPhase('demo');
      return;
    }
    if (isReturningFromEmailLink()) {
      finalize();
      return;
    }
    setPhase('collect_email');
  }, []);

  async function finalize() {
    setPhase('finalizing');
    setError(null);
    try {
      const draft = loadDraft();
      if (!draft) {
        setPhase('no_draft');
        return;
      }
      await completeEmailLinkSignIn();
      await createVerifiedProfile(draft);
      clearDraft();
      track('profile_created', { airport: draft.airportCode, vibes: draft.vibe });
      navigate('/matches', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
      setPhase('error');
    }
  }

  async function handleSend(email: string) {
    if (!loadDraft()) {
      throw new Error('Your layover details were lost — please start over from /signup.');
    }
    await sendVerificationLink(email);
    track('verification_sent');
  }

  if (phase === 'loading' || phase === 'finalizing') {
    return (
      <Center>
        <div className="card text-center animate-fade-in">
          <p className="text-3xl">✨</p>
          <h2 className="mt-2 font-display text-xl font-bold text-amber-900">
            {phase === 'finalizing' ? 'Finishing up…' : 'Just a sec…'}
          </h2>
          <p className="mt-1 text-amber-900/70">Verifying your email and saving your layover.</p>
        </div>
      </Center>
    );
  }

  if (phase === 'demo') {
    return (
      <Center>
        <div className="card text-center animate-fade-in">
          <p className="text-3xl">🌙</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-amber-900">Demo mode</h2>
          <p className="mt-1 text-amber-900/80">
            Firebase isn't wired up yet, so we can't actually send a verification email. Skip ahead
            to see the matches page with mock data.
          </p>
          <button
            className="btn-primary mt-5"
            onClick={() => navigate('/matches?demo=1', { replace: true })}
          >
            Skip to matches →
          </button>
        </div>
      </Center>
    );
  }

  if (phase === 'no_draft') {
    return (
      <Center>
        <div className="card text-center animate-fade-in">
          <p className="text-3xl">🤔</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-amber-900">
            Looks like a fresh device
          </h2>
          <p className="mt-1 text-amber-900/80">
            We couldn't find your in-progress layover. If you started signing up on another device or
            cleared your browser data, just start over and we'll send a new link.
          </p>
          <Link to="/signup" className="btn-primary mt-5 inline-flex">
            Start over
          </Link>
        </div>
      </Center>
    );
  }

  if (phase === 'error') {
    return (
      <Center>
        <div className="card text-center animate-fade-in">
          <p className="text-3xl">😶‍🌫️</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-amber-900">
            Verification didn't go through
          </h2>
          <p className="mt-2 text-sm text-rose-700">{error}</p>
          <p className="mt-3 text-amber-900/75">
            Magic links expire after ~15 minutes and can only be used once. Try sending a fresh one.
          </p>
          <Link to="/signup" className="btn-primary mt-5 inline-flex">
            Start over
          </Link>
        </div>
      </Center>
    );
  }

  return (
    <Center>
      <EmailVerificationStep onSend={handleSend} />
    </Center>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 py-10">{children}</div>;
}

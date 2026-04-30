import { FormEvent, useState } from 'react';

interface Props {
  onSend: (email: string) => Promise<void>;
  defaultEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailVerificationStep({ onSend, defaultEmail = '' }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('That email looks off — double-check it?');
      return;
    }
    setBusy(true);
    try {
      await onSend(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="card text-center animate-fade-in">
        <p className="text-3xl">📬</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-amber-900">Check your inbox ✨</h2>
        <p className="mt-1 text-amber-900/80">
          We just sent a magic link to <strong>{email}</strong>. Tap it to confirm and go live.
        </p>
        <p className="mt-3 text-sm text-amber-900/60">
          The link only works for ~15 minutes. If it doesn't arrive, peek in spam, or come back here
          and try a different email.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="btn-ghost mt-5"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="card space-y-4 animate-fade-in" onSubmit={submit}>
      <div>
        <span className="pill">step 2 of 2 · quick real-human check ✨</span>
        <h2 className="mt-3 font-display text-2xl font-bold text-amber-900">Almost there ✨</h2>
        <p className="mt-1 text-amber-900/80">
          Where should we notify you if someone overlaps with your layover?
        </p>
      </div>

      <div>
        <label htmlFor="email" className="label">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <p className="mt-1 text-xs text-amber-900/60">
          We'll send a quick code to confirm you're real. No passwords. No spam. Your email stays private.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
        {busy ? 'Sending magic link…' : '✨ Send my magic link'}
      </button>

      <ul className="rounded-2xl bg-peach-50/60 p-3 text-xs text-amber-900/80">
        <li>· Only visible during your layover.</li>
        <li>· Your email is never shown to other travelers.</li>
        <li>· Profile auto-disappears when your layover ends.</li>
      </ul>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/60 bg-white/40 py-6 text-center text-sm text-amber-900/70 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4">
        <p>
          ✨ GateMate · little hello between flights
        </p>
        <p className="mt-1">
          Always meet in public airport areas ·{' '}
          <a className="underline decoration-peach-300 underline-offset-2 hover:text-peach-600" href="https://github.com/rishabhramteke/gatemate" target="_blank" rel="noreferrer">
            source
          </a>
        </p>
      </div>
    </footer>
  );
}

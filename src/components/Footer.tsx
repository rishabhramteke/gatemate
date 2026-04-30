export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white/60 py-6 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-3xl px-4">
        <p>
          ✈️ GateMate — meet someone during your layover. Built for travelers, not stalkers.
        </p>
        <p className="mt-1">
          Always meet in public airport areas.{' '}
          <a className="underline hover:text-sky-700" href="https://github.com/rishabhramteke/gatemate" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}

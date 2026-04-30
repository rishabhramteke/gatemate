export default function PrivacyNotice() {
  return (
    <div className="rounded-3xl border border-peach-100 bg-peach-50/70 p-4 text-sm text-amber-900 shadow-soft">
      <p className="font-display text-base font-semibold text-amber-900">A little safety hug 🤍</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-amber-900/85">
        <li>Only meet in public airport areas — food court, lounges, gates.</li>
        <li>Your Instagram stays hidden until someone taps "Reveal".</li>
        <li>Profiles softly disappear when your layover ends.</li>
        <li>Don't share boarding passes or document photos with strangers.</li>
      </ul>
    </div>
  );
}

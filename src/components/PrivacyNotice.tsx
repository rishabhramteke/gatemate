export default function PrivacyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Stay safe ✈️</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        <li>Only meet in public airport areas (food court, lounges, gates).</li>
        <li>Your Instagram handle stays hidden until someone taps "Reveal".</li>
        <li>Profiles auto-expire when your layover ends.</li>
        <li>Don't share boarding passes or document photos with strangers.</li>
      </ul>
    </div>
  );
}

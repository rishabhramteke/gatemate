// Lightweight analytics shim. Wire to GA4 / Plausible / Firebase Analytics later.
// Keeps a typed event set so call sites stay consistent.

export type AnalyticsEvent =
  | 'page_view'
  | 'form_started'
  | 'form_submitted'
  | 'verification_sent'
  | 'profile_created'
  | 'matches_found'
  | 'instagram_revealed';

export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line no-console
  console.debug('[gatemate:analytics]', event, payload);
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === 'function') {
    w.gtag('event', event, payload);
  }
}

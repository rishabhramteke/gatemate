export function formatRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const dayFmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const timeFmt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  if (sameDay) {
    return `${start.toLocaleDateString(undefined, dayFmt)} · ${start.toLocaleTimeString(
      undefined,
      timeFmt
    )} – ${end.toLocaleTimeString(undefined, timeFmt)}`;
  }
  return `${start.toLocaleDateString(undefined, dayFmt)} ${start.toLocaleTimeString(
    undefined,
    timeFmt
  )} → ${end.toLocaleDateString(undefined, dayFmt)} ${end.toLocaleTimeString(undefined, timeFmt)}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

export function humanDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Convert <input type="datetime-local"> string to Date.
export function fromDatetimeLocal(value: string): Date {
  return new Date(value);
}

// Convert Date to value usable by <input type="datetime-local"> in the user's local zone.
export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

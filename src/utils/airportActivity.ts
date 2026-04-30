import type { AirportActivity } from '../types/activity';

// Hand-picked fixtures — swap for a real API in production.
const FIXTURES: Record<string, AirportActivity> = {
  AMS: {
    airportCode: 'AMS',
    airportName: 'AMS · Schiphol',
    terminals: [
      { id: 'A', activityScore: 0.22, userCount: 0 },
      { id: 'B', activityScore: 0.74, userCount: 3 },
      { id: 'C', activityScore: 0.5, userCount: 1 },
    ],
    globalActivityScore: 0.65,
  },
  LHR: {
    airportCode: 'LHR',
    airportName: 'LHR · Heathrow',
    terminals: [
      { id: '2', activityScore: 0.55, userCount: 1 },
      { id: '3', activityScore: 0.78, userCount: 4 },
      { id: '5', activityScore: 0.62, userCount: 2 },
    ],
    globalActivityScore: 0.7,
  },
  CDG: {
    airportCode: 'CDG',
    airportName: 'CDG · Charles de Gaulle',
    terminals: [
      { id: '1', activityScore: 0.4, userCount: 0 },
      { id: '2', activityScore: 0.66, userCount: 2 },
      { id: '3', activityScore: 0.3, userCount: 0 },
    ],
    globalActivityScore: 0.5,
  },
  DXB: {
    airportCode: 'DXB',
    airportName: 'DXB · Dubai International',
    terminals: [
      { id: 'A', activityScore: 0.82, userCount: 4 },
      { id: 'B', activityScore: 0.75, userCount: 3 },
      { id: 'C', activityScore: 0.7, userCount: 2 },
    ],
    globalActivityScore: 0.78,
  },
};

/**
 * Returns mock activity for the given airport. Production: replace with a fetch
 * to a flights/activity API + a small client cache. The shape is the contract —
 * keep it stable.
 */
export function fetchActivity(code: string): AirportActivity {
  const upper = code.toUpperCase();
  if (FIXTURES[upper]) return FIXTURES[upper];
  return synthesize(upper);
}

// Deterministic-but-cute fallback for airports we don't have fixtures for.
function synthesize(code: string): AirportActivity {
  const seed = code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hour = new Date().getHours();
  const wave = (n: number) => (Math.sin((seed + hour) * (n + 1) * 0.71) + 1) / 2;

  const terminals = [
    { id: 'A', activityScore: clamp(wave(1)), userCount: Math.floor(wave(2) * 4) },
    { id: 'B', activityScore: clamp(wave(3)), userCount: Math.floor(wave(4) * 4) },
    { id: 'C', activityScore: clamp(wave(5)), userCount: Math.floor(wave(6) * 3) },
  ];
  const global = terminals.reduce((acc, t) => acc + t.activityScore, 0) / terminals.length;
  return {
    airportCode: code,
    airportName: code,
    terminals,
    globalActivityScore: global,
  };
}

function clamp(n: number): number {
  return Math.max(0.08, Math.min(0.92, n));
}

export function activityHeadline(score: number): string {
  if (score >= 0.66) return '✨ Busy social window right now';
  if (score >= 0.33) return '☕ Calm in-between hours';
  return '🌙 Quiet layover hours';
}

export function terminalHeadline(score: number): string {
  if (score >= 0.66) return 'High activity ✨';
  if (score >= 0.33) return 'Cosy buzz ☕';
  return 'Soft & quiet 🌙';
}

// Best-time window string per terminal — mock heuristic, replace with real data later.
export function bestWindow(score: number, hourNow: number = new Date().getHours()): string {
  if (score >= 0.66) {
    const start = (hourNow + 1) % 24;
    const end = (start + 2) % 24;
    return `${pad(start)}:00 – ${pad(end)}:00`;
  }
  if (score >= 0.33) return 'Around now ☕';
  return 'Try again in the next hour ✨';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

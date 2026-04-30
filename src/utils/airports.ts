export interface Airport {
  code: string;
  city: string;
  country: string;
  emoji: string;
}

export const AIRPORTS: Airport[] = [
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', emoji: '🇳🇱' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', emoji: '🇪🇸' },
  { code: 'CDG', city: 'Paris', country: 'France', emoji: '🇫🇷' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', emoji: '🇩🇪' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', emoji: '🇬🇧' },
  { code: 'MAD', city: 'Madrid', country: 'Spain', emoji: '🇪🇸' },
  { code: 'FCO', city: 'Rome', country: 'Italy', emoji: '🇮🇹' },
  { code: 'IST', city: 'Istanbul', country: 'Türkiye', emoji: '🇹🇷' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', emoji: '🇦🇪' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', emoji: '🇶🇦' },
];

export function airportLabel(code: string): string {
  const a = AIRPORTS.find((x) => x.code === code);
  return a ? `${a.emoji} ${a.code} — ${a.city}` : code;
}

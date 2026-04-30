export interface TerminalActivity {
  id: string;
  activityScore: number; // 0..1 — derived from arrivals/departures/time-of-day
  userCount: number;     // travelers on GateMate currently in this terminal's window
}

export interface AirportActivity {
  airportCode: string;
  airportName: string;
  terminals: TerminalActivity[];
  globalActivityScore: number; // 0..1 — overall liveliness right now
}

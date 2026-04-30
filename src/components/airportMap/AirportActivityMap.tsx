import { useMemo, useState } from 'react';
import type { AirportActivity, TerminalActivity } from '../../types/activity';
import { fetchActivity } from '../../utils/airportActivity';
import ActivityHeader from './ActivityHeader';
import ActivityTooltip from './ActivityTooltip';
import TerminalZone, { type ZonePosition } from './TerminalZone';

interface Props {
  airportCode: string;
  data?: AirportActivity;
}

const VIEW_W = 480;
const VIEW_H = 320;

// Friendly arrangements per terminal count.
const LAYOUTS: Record<number, ZonePosition[]> = {
  2: [
    { x: 150, y: 160, r: 60 },
    { x: 330, y: 160, r: 64 },
  ],
  3: [
    { x: 130, y: 100, r: 56 },
    { x: 360, y: 130, r: 62 },
    { x: 200, y: 240, r: 56 },
  ],
  4: [
    { x: 120, y: 100, r: 52 },
    { x: 360, y: 100, r: 56 },
    { x: 130, y: 230, r: 52 },
    { x: 360, y: 230, r: 56 },
  ],
};

const SPARKLES: { cx: number; cy: number; delay: number }[] = [
  { cx: 60, cy: 50, delay: 0 },
  { cx: 420, cy: 70, delay: 0.6 },
  { cx: 430, cy: 260, delay: 1.2 },
  { cx: 70, cy: 280, delay: 1.8 },
  { cx: 250, cy: 40, delay: 0.3 },
];

export default function AirportActivityMap({ airportCode, data }: Props) {
  const activity = useMemo(() => data ?? fetchActivity(airportCode), [airportCode, data]);
  const [selected, setSelected] = useState<TerminalActivity | null>(null);

  const layout =
    LAYOUTS[activity.terminals.length] ??
    LAYOUTS[3].slice(0, activity.terminals.length);

  return (
    <section className="space-y-3 animate-fade-in">
      <ActivityHeader activity={activity} />

      <div className="relative overflow-hidden rounded-blob border border-white/70 bg-gradient-to-br from-[#fff7ed] via-[#fef3ec] to-[#e0f2fe] p-3 shadow-card">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={`${activity.airportName} activity map`}
          className="h-72 w-full"
        >
          {/* Soft cloud blobs in the background for atmosphere */}
          <defs>
            <radialGradient id="bg-cloud-1" cx="30%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bg-cloud-2" cx="70%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fde7d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fde7d4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="120" cy="80" rx="140" ry="60" fill="url(#bg-cloud-1)" />
          <ellipse cx="380" cy="240" rx="160" ry="70" fill="url(#bg-cloud-2)" />

          {/* Connection lines hub → terminals */}
          {layout.map((p, i) => (
            <path
              key={`link-${i}`}
              d={`M 240 160 Q ${(240 + p.x) / 2} ${(160 + p.y) / 2 - 30} ${p.x} ${p.y}`}
              fill="none"
              stroke="#fed7aa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="3 7"
              opacity="0.7"
            />
          ))}

          {/* Sparkles */}
          {SPARKLES.map((s, i) => (
            <g key={`sp-${i}`}>
              <circle cx={s.cx} cy={s.cy} r="2.4" fill="#fb923c" opacity="0.8">
                <animate
                  attributeName="opacity"
                  values="0.2;1;0.2"
                  dur="2.8s"
                  begin={`${s.delay}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="1.8;3.4;1.8"
                  dur="2.8s"
                  begin={`${s.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {/* Central hub */}
          <g transform="translate(240 160)">
            <circle r="34" fill="#ffffff" opacity="0.85" />
            <circle r="26" fill="#fff7ec" stroke="#fed7aa" strokeWidth="2" />
            <text
              x="0"
              y="-2"
              textAnchor="middle"
              fontFamily="Quicksand, Inter, system-ui, sans-serif"
              fontWeight="700"
              fontSize="14"
              fill="#9a3412"
            >
              {activity.airportCode}
            </text>
            <text
              x="0"
              y="14"
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="600"
              fontSize="9"
              fill="#9a3412"
              opacity="0.7"
            >
              hub
            </text>
          </g>

          {/* Terminals */}
          {activity.terminals.map((t, i) => (
            <TerminalZone
              key={t.id}
              terminal={t}
              position={layout[i] ?? layout[0]}
              active={selected?.id === t.id}
              onSelect={() => setSelected(t)}
            />
          ))}
        </svg>

        {selected && (
          <ActivityTooltip terminal={selected} onClose={() => setSelected(null)} />
        )}

        {/* Soft helper text below the SVG */}
        <p className="px-2 pb-1 pt-2 text-center text-xs text-amber-900/60">
          Tap a terminal to peek at its mood ✨ — no exact locations, just vibes.
        </p>
      </div>
    </section>
  );
}

import type { TerminalActivity } from '../../types/activity';
import { paletteFor } from './colors';

export interface ZonePosition {
  x: number;
  y: number;
  r: number;
}

interface Props {
  terminal: TerminalActivity;
  position: ZonePosition;
  active: boolean;
  onSelect: () => void;
}

export default function TerminalZone({ terminal, position, active, onSelect }: Props) {
  const { x, y, r } = position;
  const palette = paletteFor(terminal.activityScore);
  const gradId = `zone-grad-${terminal.id}`;
  const ringId = `zone-ring-${terminal.id}`;

  // Outer glow oscillates more for higher activity. SMIL keeps the SVG self-contained.
  const glowMin = r + 6;
  const glowMax = r + 8 + terminal.activityScore * 16;
  const dur = 2.4 + (1 - terminal.activityScore) * 1.6;

  return (
    // Outer <g> handles positioning via SVG transform; inner <g> handles the
    // CSS hover scale so they don't fight each other.
    <g transform={`translate(${x} ${y})`}>
      <g
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect();
        }}
        className="cursor-pointer transition-transform duration-300 ease-out hover:scale-[1.04] focus:outline-none"
        style={{ transformOrigin: '0 0' }}
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={palette.inner} />
            <stop offset="100%" stopColor={palette.outer} />
          </radialGradient>
          <radialGradient id={ringId} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor={palette.glow} stopOpacity="0" />
            <stop offset="100%" stopColor={palette.glow} stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* Pulsing glow */}
        <circle cx={0} cy={0} r={glowMax} fill={`url(#${ringId})`} opacity={0.55}>
          <animate
            attributeName="r"
            values={`${glowMin};${glowMax};${glowMin}`}
            dur={`${dur}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0.6;0.25"
            dur={`${dur}s`}
            repeatCount="indefinite"
          />
        </circle>

        {/* Main blob */}
        <circle
          cx={0}
          cy={0}
          r={r}
          fill={`url(#${gradId})`}
          stroke={active ? '#fb7185' : '#ffffff'}
          strokeWidth={active ? 3 : 2}
        />

        {/* Tiny inner sparkle to feel cute */}
        <circle cx={-r * 0.35} cy={-r * 0.35} r={3} fill="#ffffff" opacity={0.8}>
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Label */}
        <text
          x={0}
          y={-2}
          textAnchor="middle"
          fontFamily="Quicksand, Inter, system-ui, sans-serif"
          fontWeight="700"
          fontSize="18"
          fill={palette.ink}
        >
          {terminal.id}
        </text>
        <text
          x={0}
          y={16}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="600"
          fontSize="10"
          fill={palette.ink}
          opacity="0.8"
        >
          {terminal.userCount > 0 ? `${terminal.userCount} here` : 'quiet'}
        </text>
      </g>
    </g>
  );
}

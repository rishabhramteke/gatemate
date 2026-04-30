import type { Vibe } from '../types';

const VIBES: { key: Vibe; label: string; emoji: string }[] = [
  { key: 'coffee', label: 'Coffee', emoji: '☕' },
  { key: 'drinks', label: 'Drinks', emoji: '🍷' },
  { key: 'walk', label: 'Walk', emoji: '🚶' },
  { key: 'chat', label: 'Chat', emoji: '💬' },
  { key: 'dating', label: 'Dating', emoji: '💘' },
  { key: 'friends', label: 'Friends', emoji: '🤝' },
];

interface Props {
  value: Vibe[];
  onChange: (next: Vibe[]) => void;
}

export default function VibeSelector({ value, onChange }: Props) {
  const toggle = (v: Vibe) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {VIBES.map((v) => {
        const active = value.includes(v.key);
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => toggle(v.key)}
            className={`chip ${active ? 'chip-active' : ''}`}
            aria-pressed={active}
          >
            <span aria-hidden>{v.emoji}</span>
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

import { AIRPORTS } from '../utils/airports';

interface Props {
  value: string;
  onChange: (code: string) => void;
  id?: string;
}

export default function AirportSelect({ value, onChange, id = 'airport' }: Props) {
  return (
    <select
      id={id}
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="" disabled>
        Where are you sipping coffee?
      </option>
      {AIRPORTS.map((a) => (
        <option key={a.code} value={a.code}>
          {a.emoji} {a.code} — {a.city}
        </option>
      ))}
    </select>
  );
}

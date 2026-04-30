export interface ZonePalette {
  inner: string;
  outer: string;
  glow: string;
  ring: string;
  ink: string;
}

// Pastel pools — soft sky → warm peach → sunset coral.
export function paletteFor(score: number): ZonePalette {
  if (score < 0.34) {
    return {
      inner: '#f0fbff',
      outer: '#bae6fd',
      glow: '#7dd3fc',
      ring: '#bae6fd',
      ink: '#075985',
    };
  }
  if (score < 0.67) {
    return {
      inner: '#fff7ec',
      outer: '#fed7aa',
      glow: '#fdba74',
      ring: '#fdba74',
      ink: '#9a3412',
    };
  }
  return {
    inner: '#fff1e6',
    outer: '#fdba74',
    glow: '#fb923c',
    ring: '#fb923c',
    ink: '#9a3412',
  };
}

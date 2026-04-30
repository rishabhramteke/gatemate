import type { TerminalActivity } from '../../types/activity';
import { bestWindow, terminalHeadline } from '../../utils/airportActivity';

interface Props {
  terminal: TerminalActivity;
  onClose: () => void;
}

export default function ActivityTooltip({ terminal, onClose }: Props) {
  const headline = terminalHeadline(terminal.activityScore);
  const window = bestWindow(terminal.activityScore);

  return (
    <div className="absolute right-3 top-3 z-10 w-64 max-w-[88%] animate-fade-in glass p-4 shadow-soft">
      <div className="flex items-start justify-between">
        <h3 className="font-display text-base font-bold text-amber-900">Terminal {terminal.id}</h3>
        <button
          onClick={onClose}
          aria-label="Close terminal details"
          className="-m-1 grid h-7 w-7 place-items-center rounded-full text-amber-900/50 transition hover:bg-peach-50 hover:text-peach-600"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-sm font-semibold text-peach-600">{headline}</p>
      <p className="mt-1 text-sm text-amber-900/80">
        {terminal.userCount > 0
          ? `${terminal.userCount} traveler${terminal.userCount === 1 ? '' : 's'} in your time window`
          : 'No travelers yet — try again in the next hour ✨'}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-700/80">
        Best time
      </p>
      <p className="text-sm text-amber-900">{window}</p>
    </div>
  );
}

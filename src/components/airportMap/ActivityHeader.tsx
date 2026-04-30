import type { AirportActivity } from '../../types/activity';
import { activityHeadline } from '../../utils/airportActivity';

interface Props {
  activity: AirportActivity;
}

export default function ActivityHeader({ activity }: Props) {
  const total = activity.terminals.reduce((acc, t) => acc + t.userCount, 0);
  const headline = activityHeadline(activity.globalActivityScore);

  return (
    <header className="glass flex flex-col gap-1 px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-peach-600">Vibe map</p>
        <h2 className="font-display text-lg font-bold text-amber-900">{activity.airportName}</h2>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-sm font-semibold text-amber-900">{headline}</p>
        <p className="text-xs text-amber-900/65">
          {total > 0
            ? `${total} traveler${total === 1 ? '' : 's'} in your time window · you might not be alone this layover ✨`
            : 'Cosy hour · someone might land soon ☁️'}
        </p>
      </div>
    </header>
  );
}

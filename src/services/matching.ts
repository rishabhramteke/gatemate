import type { Gender, InterestedIn, LayoverProfile, MatchView } from '../types';

export function isCompatible(
  viewer: { gender: Gender; interestedIn: InterestedIn },
  other: { gender: Gender; interestedIn: InterestedIn }
): boolean {
  // "friends" is symmetric — both sides must be open to it.
  if (viewer.interestedIn === 'friends' || other.interestedIn === 'friends') {
    return viewer.interestedIn === 'friends' && other.interestedIn === 'friends';
  }

  return wantsGender(viewer.interestedIn, other.gender) &&
    wantsGender(other.interestedIn, viewer.gender);
}

function wantsGender(pref: InterestedIn, gender: Gender): boolean {
  switch (pref) {
    case 'everyone':
      return true;
    case 'women':
      return gender === 'woman';
    case 'men':
      return gender === 'man';
    case 'friends':
      return false; // handled above
  }
}

export function overlapMatches(
  viewer: { id: string | null; layoverStart: Date; layoverEnd: Date; gender: Gender; interestedIn: InterestedIn; airportCode: string },
  candidates: LayoverProfile[],
  now: Date = new Date()
): MatchView[] {
  return candidates
    .filter((c) => c.id !== viewer.id)
    .filter((c) => c.airportCode === viewer.airportCode)
    .filter((c) => c.status === 'active')
    .filter((c) => c.expiresAt.toDate() > now)
    .filter((c) => isCompatible(viewer, c))
    .map((c) => {
      const otherStart = c.layoverStart.toDate();
      const otherEnd = c.layoverEnd.toDate();
      const overlapStart = new Date(Math.max(viewer.layoverStart.getTime(), otherStart.getTime()));
      const overlapEnd = new Date(Math.min(viewer.layoverEnd.getTime(), otherEnd.getTime()));
      const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);
      return { profile: c, overlapStart, overlapEnd, overlapMinutes };
    })
    .filter((m) => m.overlapMinutes > 0)
    .sort((a, b) => b.overlapMinutes - a.overlapMinutes);
}

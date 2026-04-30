import type { Timestamp } from 'firebase/firestore';

export type Gender = 'woman' | 'man' | 'nonbinary' | 'other';
export type InterestedIn = 'women' | 'men' | 'everyone' | 'friends';
export type ProfileStatus = 'pending_verification' | 'active' | 'expired' | 'hidden';
export type Vibe = 'coffee' | 'drinks' | 'walk' | 'chat' | 'dating' | 'friends';

export interface LayoverProfile {
  id: string;
  userId: string;
  nickname: string;
  age: number;
  gender: Gender;
  interestedIn: InterestedIn;
  airportCode: string;
  layoverStart: Timestamp;
  layoverEnd: Timestamp;
  instagram: string;
  email: string;
  emailVerified: boolean;
  flightNumber?: string;
  vibe: Vibe[];
  consent: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: ProfileStatus;
  revealCount: number;
}

// Form-side type — collected on /signup, stashed in localStorage between
// "submit form" and "click email link". No email yet — it's added at /verify.
export interface ProfileDraft {
  nickname: string;
  age: number;
  gender: Gender;
  interestedIn: InterestedIn;
  airportCode: string;
  layoverStart: Date;
  layoverEnd: Date;
  instagram: string;
  flightNumber?: string;
  vibe: Vibe[];
  consent: boolean;
}

export interface MatchView {
  profile: LayoverProfile;
  overlapStart: Date;
  overlapEnd: Date;
  overlapMinutes: number;
}

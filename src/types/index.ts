import type { Timestamp } from 'firebase/firestore';

export type Gender = 'woman' | 'man' | 'nonbinary' | 'other';
export type InterestedIn = 'women' | 'men' | 'everyone' | 'friends';
export type ProfileStatus = 'active' | 'expired' | 'hidden';
export type Vibe = 'coffee' | 'drinks' | 'walk' | 'chat' | 'dating' | 'friends';

export interface LayoverProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  interestedIn: InterestedIn;
  airportCode: string;
  layoverStart: Timestamp;
  layoverEnd: Timestamp;
  instagram: string;
  flightNumber?: string;
  vibe: Vibe[];
  consent: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: ProfileStatus;
  revealCount: number;
}

// Form-side type — uses native Date for the datetime-local inputs.
export interface ProfileDraft {
  name: string;
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

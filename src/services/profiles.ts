import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import type { LayoverProfile, ProfileDraft } from '../types';

const COLLECTION = 'layover_profiles';

export async function createProfile(draft: ProfileDraft): Promise<string> {
  if (!db) throw new Error('Firestore is not configured.');
  if (!draft.consent) throw new Error('Consent is required.');

  const now = Timestamp.now();
  const layoverStart = Timestamp.fromDate(draft.layoverStart);
  const layoverEnd = Timestamp.fromDate(draft.layoverEnd);

  const payload: Omit<LayoverProfile, 'id'> = {
    name: draft.name.trim(),
    age: draft.age,
    gender: draft.gender,
    interestedIn: draft.interestedIn,
    airportCode: draft.airportCode.toUpperCase(),
    layoverStart,
    layoverEnd,
    instagram: normalizeHandle(draft.instagram),
    ...(draft.flightNumber ? { flightNumber: draft.flightNumber.trim().toUpperCase() } : {}),
    vibe: draft.vibe,
    consent: true,
    createdAt: now,
    expiresAt: layoverEnd,
    status: 'active',
    revealCount: 0,
  };

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function listActiveByAirport(airportCode: string): Promise<LayoverProfile[]> {
  if (!db) return [];
  const q = query(
    collection(db, COLLECTION),
    where('airportCode', '==', airportCode.toUpperCase()),
    where('status', '==', 'active'),
    where('expiresAt', '>', Timestamp.now())
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LayoverProfile, 'id'>) }));
}

export async function incrementReveal(profileId: string): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, profileId), { revealCount: increment(1) });
}

export function firebaseReady(): boolean {
  return isFirebaseConfigured;
}

function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

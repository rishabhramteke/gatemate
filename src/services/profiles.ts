import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import type { LayoverProfile, ProfileDraft } from '../types';

const COLLECTION = 'layover_profiles';

/**
 * Writes a verified profile to Firestore. Requires the caller to be signed in
 * via Firebase Auth with a verified email — the security rules enforce that
 * `userId == request.auth.uid` and `email == request.auth.token.email`.
 */
export async function createVerifiedProfile(draft: ProfileDraft): Promise<string> {
  if (!db || !auth) throw new Error('Firebase is not configured.');
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in required.');
  if (!user.emailVerified || !user.email) throw new Error('Email not verified.');
  if (!draft.consent) throw new Error('Consent is required.');

  const now = Timestamp.now();
  const layoverStart = Timestamp.fromDate(draft.layoverStart);
  const layoverEnd = Timestamp.fromDate(draft.layoverEnd);

  const payload: Omit<LayoverProfile, 'id'> = {
    userId: user.uid,
    nickname: draft.nickname.trim(),
    age: draft.age,
    gender: draft.gender,
    interestedIn: draft.interestedIn,
    airportCode: draft.airportCode.toUpperCase(),
    layoverStart,
    layoverEnd,
    instagram: normalizeHandle(draft.instagram),
    email: user.email,
    emailVerified: true,
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
    where('emailVerified', '==', true),
    where('expiresAt', '>', Timestamp.now())
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LayoverProfile, 'id'>) }));
}

export async function getMyLatestActiveProfile(): Promise<LayoverProfile | null> {
  if (!db || !auth?.currentUser) return null;
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', auth.currentUser.uid),
    where('status', '==', 'active'),
    where('expiresAt', '>', Timestamp.now()),
    orderBy('expiresAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<LayoverProfile, 'id'>) };
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

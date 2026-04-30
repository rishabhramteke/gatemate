import type { ProfileDraft } from '../types';

const DRAFT_KEY = 'gatemate.draft.v1';
const EMAIL_KEY = 'gatemate.pendingEmail.v1';

interface SerializedDraft extends Omit<ProfileDraft, 'layoverStart' | 'layoverEnd'> {
  layoverStart: string;
  layoverEnd: string;
}

export function saveDraft(draft: ProfileDraft): void {
  const ser: SerializedDraft = {
    ...draft,
    layoverStart: draft.layoverStart.toISOString(),
    layoverEnd: draft.layoverEnd.toISOString(),
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(ser));
  } catch {
    /* quota / privacy mode — proceed without persistence */
  }
}

export function loadDraft(): ProfileDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const ser = JSON.parse(raw) as SerializedDraft;
    return {
      ...ser,
      layoverStart: new Date(ser.layoverStart),
      layoverEnd: new Date(ser.layoverEnd),
    };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function savePendingEmail(email: string): void {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
}

export function loadPendingEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearPendingEmail(): void {
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

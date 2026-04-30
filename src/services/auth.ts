import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { clearPendingEmail, loadPendingEmail, savePendingEmail } from './storage';

export function authReady(): boolean {
  return auth !== null;
}

function returnUrl(): string {
  // BASE_URL is "/" on Firebase Hosting and "/gatemate/" on GitHub Pages.
  // HashRouter handles routing after the "#", so we always land on /verify.
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  return `${window.location.origin}${base}/#/verify`;
}

export async function sendVerificationLink(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  await sendSignInLinkToEmail(auth, email, {
    url: returnUrl(),
    handleCodeInApp: true,
  });
  savePendingEmail(email);
}

export function isReturningFromEmailLink(): boolean {
  if (!auth) return false;
  return isSignInWithEmailLink(auth, window.location.href);
}

export async function completeEmailLinkSignIn(): Promise<User> {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  let email = loadPendingEmail();
  if (!email) {
    // The user clicked the link on a different device (or cleared storage).
    // Ask them to confirm so Firebase can complete the sign-in.
    email =
      window.prompt('Confirm the email address you used so we can finish signing you in.') ??
      '';
    if (!email) throw new Error('Email is required to verify the link.');
  }
  const result = await signInWithEmailLink(auth, email, window.location.href);
  clearPendingEmail();
  return result.user;
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, cb);
}

export function currentUser(): User | null {
  return auth?.currentUser ?? null;
}

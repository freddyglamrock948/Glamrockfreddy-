import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider with Contacts Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/contacts');
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/user.emails.read');
googleProvider.addScope('https://www.googleapis.com/auth/user.phonenumbers.read');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Auth State Listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-in to get People API token
export const signInWithGoogleContacts = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google OAuth access token from popup credential.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Types for Pizzaplex Contacts
export interface PizzaplexContact {
  id?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  role: 'Superstar VIP' | 'Band Member' | 'Security Officer' | 'Guest' | 'Protégé';
  photoUrl?: string;
  source: 'google_contacts' | 'manual';
  notes?: string;
  createdAt: string;
}

// Fetch Contacts from Google People API
export const fetchGoogleContacts = async (accessToken: string): Promise<PizzaplexContact[]> => {
  const url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=50';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google People API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((conn: any) => {
    const name = conn.names?.[0]?.displayName || 'Unnamed Superstar';
    const email = conn.emailAddresses?.[0]?.value || '';
    const phone = conn.phoneNumbers?.[0]?.value || '';
    const photo = conn.photos?.[0]?.url || '';

    return {
      displayName: name,
      email,
      phoneNumber: phone,
      role: 'Guest',
      photoUrl: photo,
      source: 'google_contacts',
      notes: 'Imported from Google Contacts',
      createdAt: new Date().toISOString()
    };
  });
};

// Create a new contact in Google Contacts
export const createGoogleContact = async (
  accessToken: string,
  contact: { givenName: string; familyName?: string; email?: string; phone?: string }
): Promise<any> => {
  const url = 'https://people.googleapis.com/v1/people:createContact';
  const body: any = {
    names: [{ givenName: contact.givenName, familyName: contact.familyName || '' }]
  };
  if (contact.email) {
    body.emailAddresses = [{ value: contact.email }];
  }
  if (contact.phone) {
    body.phoneNumbers = [{ value: contact.phone }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create Google Contact: ${errText}`);
  }

  return res.json();
};

// Firestore CRUD operations for Pizzaplex Contacts collection
export const getFirestoreContacts = async (): Promise<PizzaplexContact[]> => {
  try {
    const q = query(collection(db, 'pizzaplex_contacts'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as PizzaplexContact[];
  } catch (err) {
    console.warn('Could not load contacts from Firestore, falling back to local state:', err);
    return [];
  }
};

export const saveFirestoreContact = async (contact: PizzaplexContact): Promise<string> => {
  const docRef = await addDoc(collection(db, 'pizzaplex_contacts'), contact);
  return docRef.id;
};

export const deleteFirestoreContact = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'pizzaplex_contacts', id));
};

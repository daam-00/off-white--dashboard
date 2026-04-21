import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_PREFIX = 'offwhite_';
const META_KEY = `${STORAGE_PREFIX}firebase_meta`;
const SYNC_EVENT = 'offwhite-storage-sync';

let isApplyingRemoteState = false;
let syncTimeout: number | undefined;
let isStoragePatched = false;
let stopCurrentSync: (() => void) | undefined;
let currentUser: User | undefined;

type DashboardState = Record<string, string>;

function parseTimestamp(value: string | null) {
  return value ? Number.parseInt(value, 10) || 0 : 0;
}

function getLocalUpdatedAt() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { updatedAt?: string };
    return parseTimestamp(parsed.updatedAt ?? null);
  } catch {
    return 0;
  }
}

function setLocalUpdatedAt(timestamp: string) {
  localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: timestamp }));
}

function parseStoredList(value: string | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function mergeStringListState(remoteState: DashboardState, preservedState: DashboardState, key: string) {
  const merged = Array.from(new Set([...parseStoredList(remoteState[key]), ...parseStoredList(preservedState[key])]));
  return merged.length > 0 ? JSON.stringify(merged.sort()) : undefined;
}

function mergeRecoverableState(remoteState: DashboardState, preservedState: DashboardState) {
  const mergedState = { ...remoteState, ...preservedState };
  const mergedCheckins = mergeStringListState(remoteState, preservedState, 'offwhite_checkins');

  if (mergedCheckins) {
    mergedState.offwhite_checkins = mergedCheckins;
  }

  if (preservedState.offwhite_tutorial_seen === 'true') {
    mergedState.offwhite_tutorial_seen = 'true';
  }

  return mergedState;
}

function getUserDashboardDoc(user: User) {
  return doc(db, 'userDashboards', user.uid);
}

function collectDashboardState() {
  const state: DashboardState = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || !key.startsWith(STORAGE_PREFIX) || key === META_KEY) continue;
    const value = localStorage.getItem(key);
    if (value !== null) state[key] = value;
  }

  return state;
}

function clearLocalDashboardState() {
  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function applyDashboardState(state: DashboardState, updatedAt?: string) {
  isApplyingRemoteState = true;
  try {
    clearLocalDashboardState();
    Object.entries(state).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    if (updatedAt) {
      setLocalUpdatedAt(updatedAt);
    }
  } finally {
    isApplyingRemoteState = false;
  }
}

function dispatchStorageSyncEvent() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function markDashboardStateChanged() {
  if (isApplyingRemoteState) return;
  setLocalUpdatedAt(Date.now().toString());
  dispatchStorageSyncEvent();
}

function patchLocalStorage() {
  if (isStoragePatched) return;

  const storagePrototype = Object.getPrototypeOf(localStorage) as Storage;
  const originalSetItem = storagePrototype.setItem;
  const originalRemoveItem = storagePrototype.removeItem;
  const originalClear = storagePrototype.clear;

  storagePrototype.setItem = function patchedSetItem(key: string, value: string) {
    originalSetItem.call(this, key, value);
    if (!isApplyingRemoteState && key.startsWith(STORAGE_PREFIX) && key !== META_KEY) {
      originalSetItem.call(this, META_KEY, JSON.stringify({ updatedAt: Date.now().toString() }));
      dispatchStorageSyncEvent();
    }
  };

  storagePrototype.removeItem = function patchedRemoveItem(key: string) {
    originalRemoveItem.call(this, key);
    if (!isApplyingRemoteState && key.startsWith(STORAGE_PREFIX) && key !== META_KEY) {
      originalSetItem.call(this, META_KEY, JSON.stringify({ updatedAt: Date.now().toString() }));
      dispatchStorageSyncEvent();
    }
  };

  storagePrototype.clear = function patchedClear() {
    originalClear.call(this);
    if (!isApplyingRemoteState) {
      originalSetItem.call(this, META_KEY, JSON.stringify({ updatedAt: Date.now().toString() }));
      dispatchStorageSyncEvent();
    }
  };

  isStoragePatched = true;
}

async function pushStateToFirestore() {
  if (!currentUser) return;

  const updatedAt = Date.now().toString();
  setLocalUpdatedAt(updatedAt);

  await setDoc(
    getUserDashboardDoc(currentUser),
    {
      ownerUid: currentUser.uid,
      ownerEmail: currentUser.email ?? null,
      state: collectDashboardState(),
      updatedAt,
      syncedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function hydrateFromFirestore(user: User, preservedState: DashboardState, preservedUpdatedAt: number) {
  const snapshot = await getDoc(getUserDashboardDoc(user));

  if (!snapshot.exists()) {
    const updatedAt = Date.now().toString();

    applyDashboardState({}, updatedAt);
    await setDoc(getUserDashboardDoc(user), {
      ownerUid: user.uid,
      ownerEmail: user.email ?? null,
      state: {},
      updatedAt,
      createdAt: serverTimestamp(),
      syncedAt: serverTimestamp(),
    });
    dispatchStorageSyncEvent();
    return;
  }

  const remote = snapshot.data() as {
    state?: DashboardState;
    updatedAt?: string;
  };

  const remoteState = remote.state ?? {};
  const remoteUpdatedAt = parseTimestamp(remote.updatedAt ?? null);

  const hasPreservedState = Object.keys(preservedState).length > 0;
  const shouldKeepPreservedState = preservedUpdatedAt >= remoteUpdatedAt && hasPreservedState;
  const mergedState = hasPreservedState ? mergeRecoverableState(remoteState, preservedState) : remoteState;
  const mergedChanged = JSON.stringify(mergedState) !== JSON.stringify(remoteState);

  if (shouldKeepPreservedState) {
    applyDashboardState(mergedState, preservedUpdatedAt.toString());
    await pushStateToFirestore();
    dispatchStorageSyncEvent();
    return;
  }

  if (mergedChanged) {
    const updatedAt = Date.now().toString();
    applyDashboardState(mergedState, updatedAt);
    await pushStateToFirestore();
    dispatchStorageSyncEvent();
    return;
  }

  applyDashboardState(remoteState, remote.updatedAt);
  dispatchStorageSyncEvent();
}

function scheduleFirestoreSync() {
  if (syncTimeout) window.clearTimeout(syncTimeout);

  syncTimeout = window.setTimeout(() => {
    void pushStateToFirestore();
  }, 400);
}

function flushFirestoreSync() {
  if (syncTimeout) {
    window.clearTimeout(syncTimeout);
    syncTimeout = undefined;
  }
  void pushStateToFirestore();
}

export async function initializeFirebaseSync(user: User) {
  stopCurrentSync?.();
  currentUser = user;
  patchLocalStorage();
  const preservedState = collectDashboardState();
  const preservedUpdatedAt = getLocalUpdatedAt();

  window.addEventListener(SYNC_EVENT, scheduleFirestoreSync);
  window.addEventListener('pagehide', flushFirestoreSync);
  document.addEventListener('visibilitychange', flushFirestoreSync);
  stopCurrentSync = () => {
    window.removeEventListener(SYNC_EVENT, scheduleFirestoreSync);
    window.removeEventListener('pagehide', flushFirestoreSync);
    document.removeEventListener('visibilitychange', flushFirestoreSync);
    if (syncTimeout) {
      window.clearTimeout(syncTimeout);
      syncTimeout = undefined;
    }
  };

  try {
    await hydrateFromFirestore(user, preservedState, preservedUpdatedAt);
  } catch (error) {
    console.error('Firebase sync initialization failed', error);
  }

  return stopCurrentSync;
}

export function resetFirebaseSync() {
  stopCurrentSync?.();
  stopCurrentSync = undefined;
  currentUser = undefined;
  applyDashboardState({});
}

export function syncDashboardStateNow() {
  return pushStateToFirestore();
}

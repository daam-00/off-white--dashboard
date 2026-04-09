import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_PREFIX = 'offwhite_';
const META_KEY = `${STORAGE_PREFIX}firebase_meta`;
const SYNC_EVENT = 'offwhite-storage-sync';
const DASHBOARD_DOC = doc(db, 'dashboards', 'off-white-dashboard');

let isApplyingRemoteState = false;
let syncTimeout: number | undefined;

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

function dispatchStorageSyncEvent() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

function patchLocalStorage() {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  const originalClear = localStorage.clear.bind(localStorage);

  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    if (!isApplyingRemoteState && key.startsWith(STORAGE_PREFIX) && key !== META_KEY) {
      dispatchStorageSyncEvent();
    }
  };

  localStorage.removeItem = (key) => {
    originalRemoveItem(key);
    if (!isApplyingRemoteState && key.startsWith(STORAGE_PREFIX) && key !== META_KEY) {
      dispatchStorageSyncEvent();
    }
  };

  localStorage.clear = () => {
    originalClear();
    if (!isApplyingRemoteState) {
      dispatchStorageSyncEvent();
    }
  };
}

async function pushStateToFirestore() {
  const updatedAt = Date.now().toString();
  setLocalUpdatedAt(updatedAt);

  await setDoc(
    DASHBOARD_DOC,
    {
      state: collectDashboardState(),
      updatedAt,
      syncedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function hydrateFromFirestore() {
  const snapshot = await getDoc(DASHBOARD_DOC);

  if (!snapshot.exists()) {
    if (Object.keys(collectDashboardState()).length > 0) {
      await pushStateToFirestore();
    }
    return;
  }

  const remote = snapshot.data() as {
    state?: DashboardState;
    updatedAt?: string;
  };

  const remoteState = remote.state ?? {};
  const remoteUpdatedAt = parseTimestamp(remote.updatedAt ?? null);
  const localUpdatedAt = getLocalUpdatedAt();
  const hasLocalState = Object.keys(collectDashboardState()).length > 0;

  if (remoteUpdatedAt > localUpdatedAt || !hasLocalState) {
    isApplyingRemoteState = true;
    try {
      Object.entries(remoteState).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      if (remote.updatedAt) {
        setLocalUpdatedAt(remote.updatedAt);
      }
    } finally {
      isApplyingRemoteState = false;
    }

    dispatchStorageSyncEvent();
    return;
  }

  if (hasLocalState) {
    await pushStateToFirestore();
  }
}

function scheduleFirestoreSync() {
  if (syncTimeout) window.clearTimeout(syncTimeout);

  syncTimeout = window.setTimeout(() => {
    void pushStateToFirestore();
  }, 400);
}

export async function initializeFirebaseSync() {
  patchLocalStorage();
  window.addEventListener(SYNC_EVENT, scheduleFirestoreSync);

  try {
    await hydrateFromFirestore();
  } catch (error) {
    console.error('Firebase sync initialization failed', error);
  }
}

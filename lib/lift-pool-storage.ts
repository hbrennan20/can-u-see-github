export type LiftIntent = "need-ride" | "share-uber" | "have-space";

export type LiftCheckIn = {
  id: string;
  flightKey: string;
  name: string;
  intent: LiftIntent;
  destination: string;
  note: string;
  createdAt: string;
};

const STORAGE_KEY = "dub-lift-pool-v1";
const PROFILE_KEY = "dub-lift-pool-profile-v1";

export function flightPoolKey(date: string, internalFlightId: string) {
  return `${date}:${internalFlightId}`;
}

function readAll(): LiftCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LiftCheckIn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: LiftCheckIn[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getCheckInsForFlight(flightKey: string): LiftCheckIn[] {
  return readAll()
    .filter((entry) => entry.flightKey === flightKey)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function countCheckInsForFlight(flightKey: string): number {
  return getCheckInsForFlight(flightKey).length;
}

export function checkInCountsByFlightKey(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of readAll()) {
    counts[entry.flightKey] = (counts[entry.flightKey] ?? 0) + 1;
  }
  return counts;
}

export function addCheckIn(
  input: Omit<LiftCheckIn, "id" | "createdAt">,
): LiftCheckIn {
  const entry: LiftCheckIn = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [...readAll(), entry];
  writeAll(next);
  return entry;
}

export function removeCheckIn(id: string) {
  writeAll(readAll().filter((entry) => entry.id !== id));
}

export function getSavedName(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { name?: string };
    return parsed.name?.trim() ?? "";
  } catch {
    return "";
  }
}

export function saveProfileName(name: string) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: name.trim() }));
}

export function intentLabel(intent: LiftIntent): string {
  switch (intent) {
    case "need-ride":
      return "Need a lift";
    case "share-uber":
      return "Sharing an Uber";
    case "have-space":
      return "Have space in my car";
  }
}

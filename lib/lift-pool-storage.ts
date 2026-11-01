import { destinationById } from "@/lib/destinations";

export type LiftCheckIn = {
  id: string;
  flightKey: string;
  name: string;
  destinationId: string;
  createdAt: string;
};

export type FlightPoolSummary = {
  count: number;
  destinationIds: string[];
};

const STORAGE_KEY = "dub-lift-pool-v2";
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
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry?.flightKey && entry?.destinationId)
      : [];
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

export function poolSummariesByFlightKey(): Record<string, FlightPoolSummary> {
  const summaries: Record<string, FlightPoolSummary> = {};

  for (const entry of readAll()) {
    const current = summaries[entry.flightKey] ?? {
      count: 0,
      destinationIds: [],
    };
    current.count += 1;
    if (!current.destinationIds.includes(entry.destinationId)) {
      current.destinationIds.push(entry.destinationId);
    }
    summaries[entry.flightKey] = current;
  }

  return summaries;
}

export function upsertCheckIn(input: {
  flightKey: string;
  name: string;
  destinationId: string;
}): LiftCheckIn {
  const name = input.name.trim() || "You";
  const existing = readAll();
  const matchIndex = existing.findIndex(
    (entry) => entry.flightKey === input.flightKey && entry.name === name,
  );

  if (matchIndex >= 0) {
    const updated: LiftCheckIn = {
      ...existing[matchIndex],
      destinationId: input.destinationId,
    };
    const next = [...existing];
    next[matchIndex] = updated;
    writeAll(next);
    return updated;
  }

  const entry: LiftCheckIn = {
    id: crypto.randomUUID(),
    flightKey: input.flightKey,
    name,
    destinationId: input.destinationId,
    createdAt: new Date().toISOString(),
  };
  writeAll([...existing, entry]);
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
  window.localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({ name: name.trim() }),
  );
}

export function destinationLabel(destinationId: string) {
  return destinationById(destinationId)?.label ?? destinationId;
}

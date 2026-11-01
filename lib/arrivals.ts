export type DublinArrival = {
  internalFlightId: string;
  flightIdentity: string;
  airportCode: string;
  carrierCode: string;
  carrierName: string;
  scheduledDateTime: string;
  estimatedDateTime?: string;
  originAirportName: string;
  baggageBelt?: string;
  status: number;
  statusMessage: string;
  terminalName?: string;
  isDelayed: boolean;
};

type ArrivalsPage = {
  content: DublinArrival[];
  pagination?: {
    hasNext?: boolean;
    hasPrevious?: boolean;
    earliestTimestamp?: string;
    latestTimestamp?: string;
    earliestId?: string;
    latestId?: string;
  };
  lastUpdated?: string;
};

const API_BASE =
  process.env.DUBLIN_AIRPORT_API_BASE ??
  "https://api.dublinairport.com/dap/flight-listing/arrivals";

function buildUrl(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  return `${API_BASE}?${query.toString()}`;
}

async function fetchArrivalsPage(
  params: Record<string, string | number | undefined>,
): Promise<ArrivalsPage> {
  const response = await fetch(buildUrl(params), {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Dublin Airport API error (${response.status})`);
  }

  return response.json() as Promise<ArrivalsPage>;
}

export async function fetchAllArrivalsForDate(date: string) {
  const byId = new Map<string, DublinArrival>();

  let params: Record<string, string | number | undefined> = {
    date,
    limit: 200,
  };

  while (true) {
    const page = await fetchArrivalsPage(params);
    for (const flight of page.content ?? []) {
      byId.set(flight.internalFlightId, flight);
    }

    const pagination = page.pagination;
    if (!pagination?.hasNext || !pagination.latestTimestamp || !pagination.latestId) {
      break;
    }

    params = {
      date,
      limit: 200,
      after: pagination.latestTimestamp,
      "after-id": pagination.latestId,
    };
  }

  params = { date, limit: 200 };
  let backwardPage = await fetchArrivalsPage(params);
  for (const flight of backwardPage.content ?? []) {
    byId.set(flight.internalFlightId, flight);
  }

  while (backwardPage.pagination?.hasPrevious) {
    const pagination = backwardPage.pagination;
    if (!pagination.earliestTimestamp || !pagination.earliestId) {
      break;
    }

    backwardPage = await fetchArrivalsPage({
      date,
      limit: 200,
      before: pagination.earliestTimestamp,
      "before-id": pagination.earliestId,
    });

    if (!backwardPage.content?.length) {
      break;
    }

    for (const flight of backwardPage.content) {
      byId.set(flight.internalFlightId, flight);
    }
  }

  const flights = [...byId.values()].sort((a, b) =>
    a.scheduledDateTime.localeCompare(b.scheduledDateTime),
  );

  return {
    flights,
    lastUpdated: backwardPage.lastUpdated,
  };
}

export function todayInDublinIsoDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Dublin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatDublinTime(iso: string) {
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDublinDateLabel(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-IE", {
    timeZone: "Europe/Dublin",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function statusVariant(
  statusMessage: string,
): "default" | "secondary" | "destructive" | "outline" {
  const message = statusMessage.toUpperCase();
  if (message.includes("DELAY") || message.includes("CANCEL")) {
    return "destructive";
  }
  if (
    message.includes("LANDED") ||
    message.includes("ARRIVED") ||
    message.includes("BAGGAGE")
  ) {
    return "secondary";
  }
  if (message.includes("EXPECTED")) {
    return "outline";
  }
  return "default";
}

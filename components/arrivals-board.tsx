"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, PlaneLanding, RefreshCw, Search } from "lucide-react";

import { FlightLiftSheet } from "@/components/flight-lift-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type DublinArrival,
  formatDublinTime,
} from "@/lib/arrivals";
import { destinationById } from "@/lib/destinations";
import {
  flightPoolKey,
  type FlightPoolSummary,
  poolSummariesByFlightKey,
} from "@/lib/lift-pool-storage";
import { cn } from "@/lib/utils";

type ArrivalsBoardProps = {
  flights: DublinArrival[];
  date: string;
  dateLabel: string;
  lastUpdated?: string;
};

function statusTone(statusMessage: string) {
  const message = statusMessage.toUpperCase();
  if (message.includes("CANCEL")) return "text-destructive";
  if (message.includes("DELAY")) return "text-orange-600 dark:text-orange-400";
  if (
    message.includes("LANDED") ||
    message.includes("ARRIVED") ||
    message.includes("BAGGAGE")
  ) {
    return "text-teal-700 dark:text-teal-400";
  }
  return "text-muted-foreground";
}

function poolHint(summary?: FlightPoolSummary) {
  if (!summary || summary.count === 0) return null;
  const first = destinationById(summary.destinationIds[0])?.label;
  if (!first) return `${summary.count} sharing a ride`;
  if (summary.destinationIds.length === 1) {
    return `${summary.count} to ${first}`;
  }
  return `${summary.count} sharing rides`;
}

export function ArrivalsBoard({
  flights,
  date,
  dateLabel,
  lastUpdated,
}: ArrivalsBoardProps) {
  const [query, setQuery] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<DublinArrival | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [poolSummaries, setPoolSummaries] = useState<
    Record<string, FlightPoolSummary>
  >({});

  const refreshPoolSummaries = useCallback(() => {
    setPoolSummaries(poolSummariesByFlightKey());
  }, []);

  useEffect(() => {
    refreshPoolSummaries();
  }, [refreshPoolSummaries]);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedFlight(null);
      refreshPoolSummaries();
    }
  };

  const openFlight = (flight: DublinArrival) => {
    setSelectedFlight(flight);
    setSheetOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flights;

    return flights.filter((flight) => {
      const haystack = [
        flight.flightIdentity,
        flight.carrierName,
        flight.originAirportName,
        flight.airportCode,
        flight.terminalName,
        flight.statusMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [flights, query]);

  const updatedLabel = lastUpdated
    ? new Intl.DateTimeFormat("en-IE", {
        timeZone: "Europe/Dublin",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(lastUpdated))
    : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-10 pt-3">
      <header className="sticky top-0 z-10 -mx-4 border-b bg-background/90 px-4 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400">
              <PlaneLanding className="size-4" aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                Dublin Airport
              </p>
            </div>
            <h1 className="text-[1.75rem] font-semibold tracking-tight">
              Arrivals
            </h1>
            <p className="truncate text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-full"
            onClick={() => window.location.reload()}
            aria-label="Refresh arrivals"
          >
            <RefreshCw className="size-5" />
          </Button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Flight or city"
            className="h-12 rounded-2xl pl-10 text-base"
            aria-label="Search arrivals"
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} flights
          {updatedLabel ? ` · ${updatedLabel}` : ""}
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-muted/70 px-6 py-12 text-center text-sm text-muted-foreground">
          Nothing matches that search.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {filtered.map((flight) => {
            const poolKey = flightPoolKey(date, flight.internalFlightId);
            const hint = poolHint(poolSummaries[poolKey]);

            return (
              <li key={flight.internalFlightId}>
                <button
                  type="button"
                  onClick={() => openFlight(flight)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-3.5 text-left ring-1 ring-foreground/8 transition-colors active:bg-muted/60"
                  aria-label={`${flight.flightIdentity} from ${flight.originAirportName}`}
                >
                  <div className="w-[4.25rem] shrink-0">
                    <p className="text-[1.35rem] font-semibold tabular-nums leading-none tracking-tight">
                      {formatDublinTime(flight.scheduledDateTime)}
                    </p>
                    {flight.estimatedDateTime &&
                    flight.estimatedDateTime !== flight.scheduledDateTime ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Est {formatDublinTime(flight.estimatedDateTime)}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">
                      {flight.originAirportName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {flight.flightIdentity}
                      {flight.terminalName ? ` · ${flight.terminalName}` : ""}
                    </p>
                    {hint ? (
                      <p className="mt-1 truncate text-xs font-medium text-teal-700 dark:text-teal-400">
                        {hint}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex max-w-[5.5rem] shrink-0 flex-col items-end gap-2">
                    <span
                      className={cn(
                        "text-right text-[11px] font-medium leading-tight",
                        statusTone(flight.statusMessage),
                      )}
                    >
                      {flight.statusMessage}
                    </span>
                    <ChevronRight
                      className="size-4 text-muted-foreground/70"
                      aria-hidden
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <FlightLiftSheet
        flight={selectedFlight}
        date={date}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}

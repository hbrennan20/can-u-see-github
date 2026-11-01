"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CarFront, PlaneLanding, RefreshCw, Search } from "lucide-react";

import { FlightLiftSheet } from "@/components/flight-lift-sheet";
import {
  type DublinArrival,
  formatDublinTime,
  statusVariant,
} from "@/lib/arrivals";
import {
  checkInCountsByFlightKey,
  flightPoolKey,
} from "@/lib/lift-pool-storage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ArrivalsBoardProps = {
  flights: DublinArrival[];
  date: string;
  dateLabel: string;
  lastUpdated?: string;
};

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
  const [poolCounts, setPoolCounts] = useState<Record<string, number>>({});

  const refreshPoolCounts = useCallback(() => {
    setPoolCounts(checkInCountsByFlightKey());
  }, []);

  useEffect(() => {
    refreshPoolCounts();
  }, [refreshPoolCounts]);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedFlight(null);
      refreshPoolCounts();
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
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 pb-8 pt-4">
      <header className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 pb-4 pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <PlaneLanding className="size-5" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                Dublin Airport
              </p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Arrivals</h1>
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => window.location.reload()}
            aria-label="Refresh arrivals"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flight, airline, origin…"
            className="pl-9"
            aria-label="Search arrivals"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length} of {flights.length} flights
          </span>
          {updatedLabel ? <span>Updated {updatedLabel} (Dublin)</span> : null}
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No arrivals match your search.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((flight) => {
            const poolKey = flightPoolKey(date, flight.internalFlightId);
            const poolCount = poolCounts[poolKey] ?? 0;

            return (
            <li key={flight.internalFlightId}>
              <Card
                className="cursor-pointer overflow-hidden py-0 shadow-sm transition-colors hover:bg-muted/30 active:bg-muted/50"
                onClick={() => openFlight(flight)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFlight(flight);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${flight.flightIdentity} from ${flight.originAirportName}, open ride pool`}
              >
                <CardContent className="grid grid-cols-[4.5rem_1fr_auto] gap-3 px-4 py-3">
                  <div className="flex flex-col justify-center">
                    <p className="text-lg font-semibold tabular-nums leading-none">
                      {formatDublinTime(flight.scheduledDateTime)}
                    </p>
                    {flight.estimatedDateTime &&
                    flight.estimatedDateTime !== flight.scheduledDateTime ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Est. {formatDublinTime(flight.estimatedDateTime)}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">
                      {flight.originAirportName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {flight.carrierName} · {flight.flightIdentity}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      {flight.terminalName ? (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {flight.terminalName}
                        </span>
                      ) : null}
                      {flight.baggageBelt ? (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          Belt {flight.baggageBelt}
                        </span>
                      ) : null}
                      {poolCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          <CarFront className="size-3" aria-hidden />
                          {poolCount} in ride pool
                        </span>
                      ) : (
                        <span className="rounded-full border border-dashed px-2 py-0.5">
                          Tap to share a lift
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex max-w-[7.5rem] items-start justify-end">
                    <Badge
                      variant={statusVariant(flight.statusMessage)}
                      className={cn(
                        "whitespace-normal text-right text-[10px] leading-tight",
                        flight.isDelayed && "border-destructive/40",
                      )}
                    >
                      {flight.statusMessage}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
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

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Live data from Dublin Airport. Times shown in Europe/Dublin. Ride pools
        are saved on this device only.
      </p>
    </div>
  );
}

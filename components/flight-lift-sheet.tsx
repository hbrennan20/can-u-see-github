"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type DublinArrival,
  formatDublinTime,
} from "@/lib/arrivals";
import { DESTINATIONS, destinationById } from "@/lib/destinations";
import {
  destinationLabel,
  flightPoolKey,
  getCheckInsForFlight,
  getSavedName,
  type LiftCheckIn,
  removeCheckIn,
  saveProfileName,
  upsertCheckIn,
} from "@/lib/lift-pool-storage";
import { cn } from "@/lib/utils";

const DestinationMap = dynamic(
  () =>
    import("@/components/destination-map").then((mod) => mod.DestinationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 animate-pulse rounded-2xl bg-muted ring-1 ring-foreground/10" />
    ),
  },
);

type FlightLiftSheetProps = {
  flight: DublinArrival | null;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FlightLiftSheet({
  flight,
  date,
  open,
  onOpenChange,
}: FlightLiftSheetProps) {
  const [name, setName] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [checkIns, setCheckIns] = useState<LiftCheckIn[]>([]);

  const flightKey = flight ? flightPoolKey(date, flight.internalFlightId) : "";
  const selectedDestination = destinationById(destinationId) ?? null;
  const displayName = name.trim() || "You";

  useEffect(() => {
    if (!open || !flightKey) return;

    const savedName = getSavedName();
    setName(savedName);

    const existing = getCheckInsForFlight(flightKey);
    setCheckIns(existing);

    const mine = existing.find(
      (entry) => entry.name === (savedName.trim() || "You"),
    );
    setDestinationId(mine?.destinationId ?? "");
  }, [open, flightKey]);

  const mine = useMemo(
    () => checkIns.find((entry) => entry.name === displayName),
    [checkIns, displayName],
  );

  const goingHere = useMemo(
    () =>
      destinationId
        ? checkIns.filter((entry) => entry.destinationId === destinationId)
        : [],
    [checkIns, destinationId],
  );

  const refreshList = () => {
    if (!flightKey) return;
    setCheckIns(getCheckInsForFlight(flightKey));
  };

  const handleJoin = () => {
    if (!flight || !flightKey || !destinationId) return;
    saveProfileName(displayName);
    upsertCheckIn({
      flightKey,
      name: displayName,
      destinationId,
    });
    refreshList();
  };

  const handleLeave = () => {
    if (!mine) return;
    removeCheckIn(mine.id);
    refreshList();
  };

  if (!flight) return null;

  const alreadyGoingHere = mine?.destinationId === destinationId;
  const canJoin = Boolean(destinationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0"
      >
        <SheetHeader className="shrink-0 gap-1 px-5 pb-3 pt-5 text-left">
          <SheetTitle className="pr-10 text-xl font-semibold tracking-tight">
            Where are you going?
          </SheetTitle>
          <SheetDescription>
            {flight.flightIdentity} from {flight.originAirportName} ·{" "}
            {formatDublinTime(flight.scheduledDateTime)}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <DestinationMap destination={selectedDestination} active={open} />

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Tap a place</p>
            <div className="flex flex-wrap gap-2">
              {DESTINATIONS.map((destination) => {
                const count = checkIns.filter(
                  (entry) => entry.destinationId === destination.id,
                ).length;
                const selected = destination.id === destinationId;

                return (
                  <button
                    key={destination.id}
                    type="button"
                    onClick={() => setDestinationId(destination.id)}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-background text-foreground ring-foreground/10 active:bg-muted",
                    )}
                  >
                    <MapPin className="size-3.5 opacity-70" aria-hidden />
                    {destination.label}
                    {count > 0 ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[11px]",
                          selected
                            ? "bg-primary-foreground/15"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="lift-name" className="mb-2 block text-sm font-medium">
              Your name
            </label>
            <Input
              id="lift-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="So people know who you are"
              autoComplete="given-name"
              className="h-12 rounded-2xl text-base"
            />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium">
              {destinationId
                ? `Going to ${destinationLabel(destinationId)}`
                : "People on this flight"}
            </p>
            {(destinationId ? goingHere : checkIns).length === 0 ? (
              <p className="rounded-2xl bg-muted/70 px-4 py-5 text-sm text-muted-foreground">
                {destinationId
                  ? "Nobody else yet. Join and share the ride."
                  : "Pick a place first."}
              </p>
            ) : (
              <ul className="space-y-2">
                {(destinationId ? goingHere : checkIns).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {destinationLabel(entry.destinationId)}
                      </p>
                    </div>
                    {entry.name === displayName ? (
                      <button
                        type="button"
                        onClick={handleLeave}
                        className="text-sm font-medium text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Leave
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          <Button
            type="button"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            disabled={!canJoin}
            onClick={handleJoin}
          >
            {alreadyGoingHere ? (
              <>
                <Check className="size-4" aria-hidden />
                You&apos;re going to {selectedDestination?.label}
              </>
            ) : selectedDestination ? (
              `Join ride to ${selectedDestination.label}`
            ) : (
              "Pick a place first"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

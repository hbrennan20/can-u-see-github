"use client";

import { useEffect, useMemo, useState } from "react";
import { CarFront, Trash2, Users } from "lucide-react";

import {
  type DublinArrival,
  formatDublinTime,
  statusVariant,
} from "@/lib/arrivals";
import {
  addCheckIn,
  flightPoolKey,
  getCheckInsForFlight,
  getSavedName,
  intentLabel,
  type LiftCheckIn,
  type LiftIntent,
  removeCheckIn,
  saveProfileName,
} from "@/lib/lift-pool-storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type FlightLiftSheetProps = {
  flight: DublinArrival | null;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const INTENTS: { value: LiftIntent; label: string; hint: string }[] = [
  {
    value: "need-ride",
    label: "Need a lift",
    hint: "Looking to join someone heading your way",
  },
  {
    value: "share-uber",
    label: "Share an Uber",
    hint: "Happy to split a taxi from the terminal",
  },
  {
    value: "have-space",
    label: "Have space",
    hint: "Driving and can take passengers",
  },
];

export function FlightLiftSheet({
  flight,
  date,
  open,
  onOpenChange,
}: FlightLiftSheetProps) {
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<LiftIntent>("share-uber");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [checkIns, setCheckIns] = useState<LiftCheckIn[]>([]);

  const flightKey = flight ? flightPoolKey(date, flight.internalFlightId) : "";

  useEffect(() => {
    if (!open || !flightKey) return;
    setName(getSavedName());
    setCheckIns(getCheckInsForFlight(flightKey));
  }, [open, flightKey]);

  const refreshList = () => {
    if (!flightKey) return;
    setCheckIns(getCheckInsForFlight(flightKey));
  };

  const handleQuickCheckIn = () => {
    if (!flight || !flightKey) return;
    const trimmedName = name.trim() || "Anonymous";
    saveProfileName(trimmedName);
    addCheckIn({
      flightKey,
      name: trimmedName,
      intent,
      destination: destination.trim(),
      note: note.trim(),
    });
    setNote("");
    refreshList();
  };

  const handleRemove = (id: string) => {
    removeCheckIn(id);
    refreshList();
  };

  const poolSummary = useMemo(() => {
    const need = checkIns.filter((c) => c.intent === "need-ride").length;
    const share = checkIns.filter((c) => c.intent === "share-uber").length;
    const space = checkIns.filter((c) => c.intent === "have-space").length;
    return { need, share, space, total: checkIns.length };
  }, [checkIns]);

  if (!flight) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl px-4 pb-8"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex flex-wrap items-center gap-2 pr-8">
            <span>{flight.flightIdentity}</span>
            <Badge variant={statusVariant(flight.statusMessage)}>
              {flight.statusMessage}
            </Badge>
          </SheetTitle>
          <SheetDescription className="space-y-1">
            <span className="block">
              {flight.originAirportName} · {flight.carrierName}
            </span>
            <span className="block">
              Arrives {formatDublinTime(flight.scheduledDateTime)} (Dublin)
              {flight.terminalName ? ` · ${flight.terminalName}` : ""}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Ride pool (this device)</h2>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Check in once to organise shared Ubers or lifts for this arrival.
              Saved on this phone only for now — show the list to friends at
              the belt.
            </p>

            {poolSummary.total > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {poolSummary.total} checked in
                </span>
                {poolSummary.share > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                    {poolSummary.share} sharing Uber
                  </span>
                ) : null}
                {poolSummary.need > 0 ? (
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    {poolSummary.need} need a lift
                  </span>
                ) : null}
                {poolSummary.space > 0 ? (
                  <span className="rounded-full bg-muted px-2.5 py-1">
                    {poolSummary.space} with space
                  </span>
                ) : null}
              </div>
            ) : null}

            <ul className="space-y-2">
              {checkIns.length === 0 ? (
                <li className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  No one checked in yet. Be the first.
                </li>
              ) : (
                checkIns.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {intentLabel(entry.intent)}
                        {entry.destination ? ` · ${entry.destination}` : ""}
                      </p>
                      {entry.note ? (
                        <p className="text-xs text-muted-foreground">{entry.note}</p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => handleRemove(entry.id)}
                      aria-label={`Remove ${entry.name} from pool`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <Separator />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CarFront className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Check in</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lift-name">Your name</Label>
              <Input
                id="lift-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="So others recognise you"
                autoComplete="name"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">I am…</legend>
              <div className="grid gap-2">
                {INTENTS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer flex-col rounded-lg border px-3 py-2.5 transition-colors",
                      intent === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="radio"
                        name="lift-intent"
                        value={option.value}
                        checked={intent === option.value}
                        onChange={() => setIntent(option.value)}
                        className="size-4 accent-primary"
                      />
                      {option.label}
                    </span>
                    <span className="pl-6 text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="lift-destination">Heading to (optional)</Label>
              <Input
                id="lift-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. City centre, Dalkey, Maynooth"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lift-note">Note (optional)</Label>
              <Textarea
                id="lift-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Meeting point, WhatsApp, luggage size…"
                rows={2}
              />
            </div>

            <Button
              type="button"
              className="h-11 w-full text-base"
              onClick={handleQuickCheckIn}
            >
              Check in to ride pool
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

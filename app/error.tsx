"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold">Could not load arrivals</h1>
        <p className="text-sm text-muted-foreground">
          Dublin Airport flight data is temporarily unavailable. Try again in a
          moment.
        </p>
        <Button onClick={reset}>Retry</Button>
      </div>
    </main>
  );
}

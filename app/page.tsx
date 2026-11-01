import { connection } from "next/server";

import { ArrivalsBoard } from "@/components/arrivals-board";
import {
  fetchAllArrivalsForDate,
  formatDublinDateLabel,
  todayInDublinIsoDate,
} from "@/lib/arrivals";

export default async function Home() {
  await connection();
  const date = todayInDublinIsoDate();
  const { flights, lastUpdated } = await fetchAllArrivalsForDate(date);

  return (
    <main className="min-h-screen bg-background">
      <ArrivalsBoard
        flights={flights}
        dateLabel={formatDublinDateLabel(date)}
        lastUpdated={lastUpdated}
      />
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { DUBLIN_AIRPORT, type Destination } from "@/lib/destinations";

type DestinationMapProps = {
  destination: Destination | null;
  active: boolean;
};

export function DestinationMap({ destination, active }: DestinationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const destMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const leaflet = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = leaflet.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      leaflet
        .tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          { maxZoom: 18 },
        )
        .addTo(map);

      leaflet
        .circleMarker([DUBLIN_AIRPORT.lat, DUBLIN_AIRPORT.lng], {
          radius: 7,
          color: "#0f172a",
          weight: 2,
          fillColor: "#0f172a",
          fillOpacity: 1,
        })
        .addTo(map);

      map.setView([DUBLIN_AIRPORT.lat, DUBLIN_AIRPORT.lng], 10);
      mapRef.current = map;
      setReady(true);
    }

    void setup();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      destMarkerRef.current = null;
      lineRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active || !ready) return;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 280);

    return () => window.clearTimeout(timer);
  }, [active, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    void import("leaflet").then((leaflet) => {
      destMarkerRef.current?.remove();
      lineRef.current?.remove();
      destMarkerRef.current = null;
      lineRef.current = null;

      if (!destination) {
        map.setView([53.36, -6.26], 10);
        return;
      }

      destMarkerRef.current = leaflet
        .circleMarker([destination.lat, destination.lng], {
          radius: 9,
          color: "#0f766e",
          weight: 3,
          fillColor: "#14b8a6",
          fillOpacity: 1,
        })
        .addTo(map);

      lineRef.current = leaflet
        .polyline(
          [
            [DUBLIN_AIRPORT.lat, DUBLIN_AIRPORT.lng],
            [destination.lat, destination.lng],
          ],
          { color: "#0f766e", weight: 3, opacity: 0.7, dashArray: "6 8" },
        )
        .addTo(map);

      map.fitBounds(
        [
          [DUBLIN_AIRPORT.lat, DUBLIN_AIRPORT.lng],
          [destination.lat, destination.lng],
        ],
        { padding: [28, 28], maxZoom: 12 },
      );
    });
  }, [destination, active, ready]);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      <div ref={containerRef} className="h-44 w-full" />
      <p className="bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        {destination
          ? `Airport → ${destination.label}`
          : "Pick a place to see the route"}
      </p>
    </div>
  );
}

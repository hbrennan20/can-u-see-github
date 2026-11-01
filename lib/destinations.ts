export type Destination = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export const DUBLIN_AIRPORT = {
  id: "dub-airport",
  label: "Dublin Airport",
  lat: 53.4264,
  lng: -6.2499,
} as const;

export const DESTINATIONS: Destination[] = [
  { id: "city-centre", label: "City centre", lat: 53.3498, lng: -6.2603 },
  { id: "temple-bar", label: "Temple Bar", lat: 53.3454, lng: -6.2641 },
  { id: "connolly", label: "Connolly", lat: 53.3518, lng: -6.2496 },
  { id: "heuston", label: "Heuston", lat: 53.3464, lng: -6.2946 },
  { id: "swords", label: "Swords", lat: 53.4597, lng: -6.2181 },
  { id: "blanchardstown", label: "Blanchardstown", lat: 53.3924, lng: -6.3903 },
  { id: "tallaght", label: "Tallaght", lat: 53.2878, lng: -6.3622 },
  { id: "dun-laoghaire", label: "Dún Laoghaire", lat: 53.2941, lng: -6.1347 },
  { id: "howth", label: "Howth", lat: 53.3861, lng: -6.0653 },
  { id: "maynooth", label: "Maynooth", lat: 53.3813, lng: -6.5931 },
  { id: "airport-hotels", label: "Airport hotels", lat: 53.427, lng: -6.241 },
];

export function destinationById(id: string) {
  return DESTINATIONS.find((destination) => destination.id === id);
}

# Dublin Airport Arrivals

Mobile-optimised Next.js app with shadcn/ui that lists **all Dublin Airport (DUB) arrivals for today**, using Dublin Airport’s public flight-listing API.

## Local development

```bash
npm install
npm run dev -- --port 3847
```

Open [http://localhost:3847](http://localhost:3847).

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui

## Data

Arrivals are loaded from `api.dublinairport.com` and paginated server-side for the current calendar day in `Europe/Dublin`. The page revalidates about every 60 seconds.

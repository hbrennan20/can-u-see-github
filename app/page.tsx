export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <main className="w-full max-w-lg space-y-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          Live on Vercel
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          GitHub is connected
        </h1>
        <p className="text-lg leading-relaxed text-zinc-400">
          This app was created from your Cursor cloud agent, pushed to{" "}
          <span className="text-zinc-200">hbrennan20/can-u-see-github</span>,
          and deployed with Vercel.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            href="https://github.com/hbrennan20"
            target="_blank"
            rel="noopener noreferrer"
          >
            View GitHub profile
          </a>
          <a
            className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500"
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel dashboard
          </a>
        </div>
      </main>
    </div>
  );
}

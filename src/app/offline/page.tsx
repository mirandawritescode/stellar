export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="heading-display text-xl">You&apos;re offline</h1>
      <p className="text-muted text-sm">
        Stellar needs a connection to load. Once you&apos;re back online, your saved birth details, tasks,
        and readings will all still be here.
      </p>
    </div>
  );
}

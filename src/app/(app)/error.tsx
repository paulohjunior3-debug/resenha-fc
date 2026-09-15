"use client";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center">
      <p className="font-semibold text-danger">Algo deu errado</p>
      <p className="text-sm text-muted">{error.message || "Tente novamente em instantes."}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Tentar de novo
      </button>
    </div>
  );
}

"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-5xl font-bold text-red-600">500</div>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-gray-600">
        {error?.message || "Unexpected error."}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-100"
        >
          Try Again
        </button>
        <a
          href="/"
          className="rounded-lg bg-green-600 text-white px-4 py-2 font-medium hover:bg-green-700"
        >
          Go Home
        </a>
      </div>

      {error?.digest && (
        <p className="mt-3 text-xs text-gray-500">Error ID: {error.digest}</p>
      )}
    </div>
  );
}

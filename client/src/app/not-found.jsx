import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80dvh] grid place-items-center p-6">
      <div className="text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-2xl font-bold">
          404
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="rounded-xl border px-4 py-2 font-medium hover:bg-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

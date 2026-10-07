import { Link } from "react-router-dom";
import { ArrowLeft, CalendarX2 } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-accent-100 p-6">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-accent-50 p-8 text-center shadow-xl shadow-accent-900/10 sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-700 text-white shadow-sm shadow-accent-900/20">
          <CalendarX2 className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold text-accent-600">404</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or has moved to a
          different address.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-900/20 transition-all duration-150 hover:bg-accent-800 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Sign in instead
          </Link>
        </div>
      </div>
    </main>
  );
}
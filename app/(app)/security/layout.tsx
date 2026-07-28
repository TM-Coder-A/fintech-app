import Link from "next/link";

export default function SecurityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <nav className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <Link
            href="/security"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Security activity
          </Link>

          <Link
            href="/security/sessions"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Active sessions
          </Link>
        </nav>
      </div>

      {children}
    </>
  );
}

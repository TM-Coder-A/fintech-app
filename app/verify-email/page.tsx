import Link from "next/link";

import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

type Props = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const token =
    typeof params.token ===
    "string"
      ? params.token
      : "";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        {token ? (
          <VerifyEmailForm
            token={token}
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-7">
            <h1 className="text-2xl font-bold text-slate-950">
              Invalid verification link
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              This email verification
              link is incomplete.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex font-semibold text-emerald-600"
            >
              Return to login
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

type Props = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
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
          <ResetPasswordForm
            token={token}
          />
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-7">
            <h1 className="text-2xl font-bold">
              Invalid reset link
            </h1>

            <p className="mt-3 text-sm text-slate-600">
              This password reset link
              is incomplete or invalid.
            </p>

            <Link
              href="/forgot-password"
              className="mt-6 inline-flex font-semibold text-emerald-600"
            >
              Request another link
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

import Link from "next/link";
import ProfileForm from "@/components/profile/ProfileForm";
import { getCurrentUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Profile & settings
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your personal information
            and account details.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.4fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
                {user.firstName
                  .charAt(0)
                  .toUpperCase()}
                {user.lastName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                {user.firstName}{" "}
                {user.lastName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal account
              </p>

              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {user.phone ??
                      "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-6 text-white">
              <p className="text-sm text-slate-400">
                Account number
              </p>

              <p className="mt-1 font-mono text-lg font-semibold">
                {user.wallet?.accountNumber ??
                  "Not available"}
              </p>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-sm text-slate-400">
                  Balance
                </p>

                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(
                    Number(
                      user.wallet?.balance ?? 0
                    )
                  )}
                </p>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-sm text-slate-400">
                  Currency
                </p>

                <p className="mt-1 font-medium">
                  {user.wallet?.currency ??
                    "NGN"}
                </p>
              </div>
            </section>
          </aside>

          <div className="space-y-8">
            <Link
              href="/security"
              className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300"
            >
              <div>
                <p className="font-semibold text-slate-950">
                  Security activity
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Review recent logins and sensitive account activity.
                </p>
              </div>

              <span className="text-sm font-semibold text-emerald-600">
                View
              </span>
            </Link>

            <ProfileForm
              initialData={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone ?? "",
            }}
          />
          </div>
        </div>
      </div>
    </main>
  );
}

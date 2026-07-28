import {
  BadgeCheck,
  MailWarning,
} from "lucide-react";

import ResendVerificationButton from "@/components/auth/ResendVerificationButton";
import { getCurrentUser } from "@/lib/current-user";

export default async function EmailSecurityPage() {
  const user =
    await getCurrentUser();

  return (
    <main>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          {user.emailVerified ? (
            <>
              <div className="mb-5 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <BadgeCheck size={26} />
              </div>

              <h1 className="text-3xl font-bold text-slate-950">
                Email verified
              </h1>

              <p className="mt-3 text-slate-600">
                {user.email} has been
                successfully verified.
              </p>

              {user.emailVerifiedAt && (
                <p className="mt-3 text-sm text-slate-500">
                  Verified{" "}
                  {user.emailVerifiedAt.toLocaleString(
                    "en-GB"
                  )}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-5 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-700">
                <MailWarning size={26} />
              </div>

              <h1 className="text-3xl font-bold text-slate-950">
                Verify your email
              </h1>

              <p className="mt-3 text-slate-600">
                Verify {user.email} before
                making outgoing transfers.
              </p>

              <div className="mt-7">
                <ResendVerificationButton />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                During development, use
                the verification-link
                helper to obtain the test
                link.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

import {
  Star,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import RemoveBeneficiaryButton from "@/components/transfer/RemoveBeneficiaryButton";

export default async function BeneficiariesPage() {
  const user =
    await getCurrentUser();

  const beneficiaries =
    await prisma.beneficiary.findMany({
      where: {
        ownerId: user.id,
      },

      include: {
        wallet: {
          include: {
            user: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <main>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <Star size={24} />
          </div>

          <h1 className="text-3xl font-bold text-slate-950">
            Saved recipients
          </h1>

          <p className="mt-2 text-slate-600">
            Manage accounts you have saved
            for quicker transfers.
          </p>
        </div>

        {beneficiaries.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <UserRound
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold">
              No saved recipients
            </p>

            <p className="mt-2 text-sm text-slate-500">
              You can save a verified
              recipient from the transfer
              page.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {beneficiaries.map(
                (beneficiary) => (
                  <div
                    key={beneficiary.id}
                    className="flex items-center justify-between gap-4 px-6 py-5"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {beneficiary.nickname ||
                          `${beneficiary.wallet.user.firstName} ${beneficiary.wallet.user.lastName}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {
                          beneficiary.wallet
                            .accountNumber
                        }
                      </p>
                    </div>

                    <RemoveBeneficiaryButton
                      id={
                        beneficiary.id
                      }
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

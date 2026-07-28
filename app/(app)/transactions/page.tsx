import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCurrency } from "@/lib/format";

import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";

const PAGE_SIZE = 10;

type TransactionsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const user = await getCurrentUser();

  if (!user.wallet) {
    return null;
  }

  const wallet = user.wallet;
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";

  const requestedPage = Number(params.page ?? "1");
  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const walletFilter = {
    OR: [
      {
        senderWalletId: wallet.id,
      },
      {
        receiverWalletId: wallet.id,
      },
    ],
  };

  const filters = {
    AND: [
      walletFilter,

      ...(q
        ? [
            {
              reference: {
                contains: q,
                mode: "insensitive" as const,
              },
            },
          ]
        : []),

      ...(type
        ? [
            {
              type: type as
                | "TRANSFER"
                | "FUNDING"
                | "PAYMENT"
                | "REVERSAL",
            },
          ]
        : []),

      ...(status
        ? [
            {
              status: status as
                | "PENDING"
                | "SUCCESSFUL"
                | "FAILED"
                | "REVERSED",
            },
          ]
        : []),
    ],
  };

  const total =
    await prisma.transaction.count({
      where: filters,
    });

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const transactions =
    await prisma.transaction.findMany({
      where: filters,

      include: {
        senderWallet: {
          include: {
            user: true,
          },
        },

        receiverWallet: {
          include: {
            user: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip:
        (currentPage - 1) *
        PAGE_SIZE,

      take: PAGE_SIZE,
    });

  function makePageUrl(
    targetPage: number
  ) {
    const query = new URLSearchParams();

    if (q) {
      query.set("q", q);
    }

    if (type) {
      query.set("type", type);
    }

    if (status) {
      query.set("status", status);
    }

    query.set(
      "page",
      targetPage.toString()
    );

    return `/transactions?${query.toString()}`;
  }

  return (
    <main>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <PageHeader
          title="Transaction history"
          description="Search and review your wallet activity."
        />

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
          <form
            method="GET"
            className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto]"
          >
            <div>
              <label
                htmlFor="q"
                className="mb-2 block text-sm font-medium"
              >
                Search reference
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="TX-... or FD-..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium"
              >
                Type
              </label>

              <select
                id="type"
                name="type"
                defaultValue={type}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500"
              >
                <option value="">
                  All types
                </option>

                <option value="TRANSFER">
                  Transfer
                </option>

                <option value="FUNDING">
                  Funding
                </option>

                <option value="PAYMENT">
                  Payment
                </option>

                <option value="REVERSAL">
                  Reversal
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-500"
              >
                <option value="">
                  All statuses
                </option>

                <option value="SUCCESSFUL">
                  Successful
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="FAILED">
                  Failed
                </option>

                <option value="REVERSED">
                  Reversed
                </option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
              >
                Apply
              </button>

              <Link
                href="/transactions"
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {total === 1
              ? "1 transaction"
              : `${total} transactions`}
          </p>

          <p className="text-sm text-slate-500">
            Page {currentPage} of{" "}
            {totalPages}
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-slate-950">
                No transactions found
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search
                or filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map(
                (transaction) => {
                  const isFunding =
                    transaction.type ===
                    "FUNDING";

                  const incoming =
                    transaction.receiverWalletId ===
                    wallet.id;

                  const counterparty =
                    incoming
                      ? transaction
                          .senderWallet?.user
                      : transaction
                          .receiverWallet?.user;

                  let title = "";
                  let subtitle = "";

                  if (isFunding) {
                    title =
                      "Wallet funded";

                    subtitle =
                      transaction.narration ??
                      "Wallet funding";
                  } else if (incoming) {
                    title =
                      "Money received";

                    subtitle =
                      counterparty
                        ? `From ${counterparty.firstName} ${counterparty.lastName}`
                        : "Wallet transfer";
                  } else {
                    title =
                      "Money sent";

                    subtitle =
                      counterparty
                        ? `To ${counterparty.firstName} ${counterparty.lastName}`
                        : "Wallet transfer";
                  }

                  return (
                    <Link
                      key={
                        transaction.id
                      }
                      href={`/transactions/${transaction.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={
                            isFunding ||
                            incoming
                              ? "shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-600"
                              : "shrink-0 rounded-xl bg-rose-50 p-3 text-rose-600"
                          }
                        >
                          {isFunding ? (
                            <Plus
                              size={
                                20
                              }
                            />
                          ) : incoming ? (
                            <ArrowDownLeft
                              size={
                                20
                              }
                            />
                          ) : (
                            <ArrowUpRight
                              size={
                                20
                              }
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950">
                            {title}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {
                              subtitle
                            }
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {
                              transaction.reference
                            }
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={
                            isFunding ||
                            incoming
                              ? "font-semibold text-emerald-600"
                              : "font-semibold text-slate-950"
                          }
                        >
                          {isFunding ||
                          incoming
                            ? "+"
                            : "-"}
                          {formatCurrency(
                            Number(
                              transaction.amount
                            )
                          )}
                        </p>

                        <div className="mt-2 flex justify-end">
                          <StatusBadge
                            status={
                              transaction.status ===
                              "SUCCESSFUL"
                                ? "Successful"
                                : transaction.status ===
                                    "FAILED"
                                  ? "Failed"
                                  : transaction.status ===
                                      "REVERSED"
                                    ? "Reversed"
                                    : "Pending"
                            }
                          />
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {transaction.createdAt.toLocaleString(
                            "en-NG"
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            {currentPage > 1 ? (
              <Link
                href={makePageUrl(
                  currentPage - 1
                )}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
              >
                <ChevronLeft
                  size={18}
                />
                Previous
              </Link>
            ) : (
              <span />
            )}

            {currentPage <
            totalPages ? (
              <Link
                href={makePageUrl(
                  currentPage + 1
                )}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold"
              >
                Next
                <ChevronRight
                  size={18}
                />
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

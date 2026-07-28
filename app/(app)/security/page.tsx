import {
  AlertTriangle,

  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

function getActivityDetails(
  action: string,
  success: boolean
) {
  switch (action) {
    case "LOGIN_SUCCESS":
      return {
        title: "Successful login",
        description:
          "Your account was signed in successfully.",
        icon: LogIn,
      };

    case "LOGIN_FAILURE":
      return {
        title: "Failed login attempt",
        description:
          "An unsuccessful login attempt was recorded.",
        icon: AlertTriangle,
      };

    case "LOGOUT":
      return {
        title: "Signed out",
        description:
          "Your account was signed out.",
        icon: LogOut,
      };

    case "PASSWORD_CHANGE":
      return {
        title: "Password changed",
        description:
          "Your account password was changed.",
        icon: KeyRound,
      };

    case "PROFILE_UPDATE":
      return {
        title: "Profile updated",
        description:
          "Your personal account information was updated.",
        icon: UserRound,
      };

    case "BENEFICIARY_ADD":
      return {
        title: "Recipient saved",
        description:
          "A recipient was added to your saved recipients.",
        icon: UserRound,
      };

    case "BENEFICIARY_REMOVE":
      return {
        title: "Recipient removed",
        description:
          "A recipient was removed from your saved recipients.",
        icon: UserRound,
      };

    case "TRANSFER_LIMIT_UPDATE":
      return {
        title: "Transfer limit changed",
        description:
          "Your personal daily transfer limit was updated.",
        icon: ShieldCheck,
      };

    case "TRANSFER_SUCCESS":
      return {
        title: "Transfer completed",
        description:
          "A wallet transfer was completed from your account.",
        icon: WalletCards,
      };

    case "TRANSFER_FAILURE":
      return {
        title: "Transfer attempt failed",
        description:
          "A wallet transfer attempt was unsuccessful.",
        icon: AlertTriangle,
      };

    case "TRANSFER_DUPLICATE":
      return {
        title: "Duplicate transfer request",
        description:
          "A repeated transfer request was safely prevented from moving money twice.",
        icon: ShieldCheck,
      };

    case "FUNDING_SUCCESS":
      return {
        title: "Wallet funded",
        description:
          "Funds were added to your wallet.",
        icon: WalletCards,
      };

    case "FUNDING_FAILURE":
      return {
        title: "Funding attempt failed",
        description:
          "A wallet funding attempt was unsuccessful.",
        icon: AlertTriangle,
      };

    case "FUNDING_DUPLICATE":
      return {
        title: "Duplicate funding request",
        description:
          "A repeated funding request was safely prevented from crediting the wallet twice.",
        icon: ShieldCheck,
      };

    default:
      return {
        title: action
          .replaceAll("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
          ),

        description: success
          ? "Account activity completed successfully."
          : "Account activity was unsuccessful.",

        icon: ShieldCheck,
      };
  }
}

export default async function SecurityPage() {
  const user = await getCurrentUser();

  /*
   * Critical security rule:
   *
   * We query AuditLog using the authenticated
   * user's ID. Another user's audit events are
   * never returned to this page.
   */
  const activity =
    await prisma.auditLog.findMany({
      where: {
        userId: user.id,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 50,
    });

  const successfulEvents =
    activity.filter(
      (event) => event.success
    ).length;

  const failedEvents =
    activity.filter(
      (event) => !event.success
    ).length;

  return (
    <main>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck size={26} />
          </div>

          <h1 className="text-3xl font-bold text-slate-950">
            Security activity
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Review recent security and
            sensitive account activity.
          </p>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Recent events
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {activity.length}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Successful
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {successfulEvents}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">
              Failed
            </p>

            <p className="mt-2 text-3xl font-bold text-rose-600">
              {failedEvents}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Recent account activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing up to your latest 50
              recorded events.
            </p>
          </div>

          {activity.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck
                size={36}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-semibold text-slate-950">
                No security activity yet
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Security events will appear
                here as you use your account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.map((event) => {
                const details =
                  getActivityDetails(
                    event.action,
                    event.success
                  );

                const Icon =
                  details.icon;

                return (
                  <article
                    key={event.id}
                    className="flex gap-4 px-6 py-5"
                  >
                    <div
                      className={
                        event.success
                          ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600"
                      }
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {details.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {
                              details.description
                            }
                          </p>
                        </div>

                        <span
                          className={
                            event.success
                              ? "w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              : "w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                          }
                        >
                          {event.success
                            ? "Successful"
                            : "Failed"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                        <span>
                          {event.createdAt.toLocaleString(
                            "en-GB"
                          )}
                        </span>

                        {event.ipAddress && (
                          <span>
                            IP:{" "}
                            {
                              event.ipAddress
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="font-semibold text-amber-900">
                See something unfamiliar?
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Change your password immediately.
                Changing your password revokes
                previously issued sessions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  ShieldCheck,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";

type LimitData = {
  limits: {
    minimum: number;
    maximumPerTransfer: number;
    platformDailyAmount: number;
    personalDailyAmount:
      | number
      | null;
    effectiveDailyAmount: number;
    dailyCount: number;
  };

  usage: {
    amountUsed: number;
    amountRemaining: number;
    transfersUsed: number;
    transfersRemaining: number;
  };
};

export default function TransferLimits() {
  const [data, setData] =
    useState<LimitData | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;

    async function loadLimits() {
      try {
        const response =
          await fetch(
            "/api/transfer/limits"
          );

        if (!response.ok) {
          return;
        }

        const result =
          await response.json();

        if (
          !cancelled &&
          result.success
        ) {
          setData({
            limits:
              result.limits,
            usage:
              result.usage,
          });
        }
      } catch {
        // Informational only.
      }
    }

    void loadLimits();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex gap-3">
        <div className="rounded-xl bg-white p-2 text-emerald-600">
          <ShieldCheck size={20} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-slate-950">
              Daily transfer limits
            </p>

            <Link
              href="/transfer/settings"
              className="text-xs font-semibold text-emerald-600"
            >
              Manage
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">
                Remaining today
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(
                  data.usage
                    .amountRemaining
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Effective daily limit
              </p>

              <p className="mt-1 font-semibold">
                {formatCurrency(
                  data.limits
                    .effectiveDailyAmount
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Transfers remaining
              </p>

              <p className="mt-1 font-semibold">
                {
                  data.usage
                    .transfersRemaining
                }{" "}
                of{" "}
                {
                  data.limits
                    .dailyCount
                }
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Per transaction
              </p>

              <p className="mt-1 font-semibold">
                Up to{" "}
                {formatCurrency(
                  data.limits
                    .maximumPerTransfer
                )}
              </p>
            </div>
          </div>

          {data.limits
            .personalDailyAmount !==
            null && (
            <p className="mt-4 text-xs text-slate-500">
              You have enabled a
              personal spending limit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

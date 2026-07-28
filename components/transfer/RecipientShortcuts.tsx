"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  Clock3,
  Star,
} from "lucide-react";

type Recipient = {
  id?: string;
  name: string;
  nickname?: string | null;
  accountNumber: string;
};

type Props = {
  onSelect: (
    accountNumber: string
  ) => void;
};

export default function RecipientShortcuts({
  onSelect,
}: Props) {
  const [saved, setSaved] =
    useState<Recipient[]>([]);

  const [recent, setRecent] =
    useState<Recipient[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecipients() {
      try {
        const [
          savedResponse,
          recentResponse,
        ] = await Promise.all([
          fetch(
            "/api/beneficiaries"
          ),

          fetch(
            "/api/recipients/recent"
          ),
        ]);

        if (
          savedResponse.ok
        ) {
          const data =
            await savedResponse.json();

          if (
            !cancelled &&
            data.success
          ) {
            setSaved(
              data.beneficiaries
            );
          }
        }

        if (
          recentResponse.ok
        ) {
          const data =
            await recentResponse.json();

          if (
            !cancelled &&
            data.success
          ) {
            setRecent(
              data.recipients
            );
          }
        }
      } catch {
        // Shortcuts are optional.
      }
    }

    loadRecipients();

    return () => {
      cancelled = true;
    };
  }, []);

  if (
    saved.length === 0 &&
    recent.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      {saved.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Star
                size={17}
                className="text-emerald-600"
              />

              <p className="text-sm font-semibold">
                Saved recipients
              </p>
            </div>

            <Link
              href="/beneficiaries"
              className="text-xs font-semibold text-emerald-600"
            >
              Manage
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {saved.map(
              (recipient) => (
                <button
                  key={
                    recipient.id ??
                    recipient.accountNumber
                  }
                  type="button"
                  onClick={() =>
                    onSelect(
                      recipient.accountNumber
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {recipient.nickname ||
                      recipient.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ••••••
                    {recipient.accountNumber.slice(
                      -4
                    )}
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock3
              size={17}
              className="text-slate-500"
            />

            <p className="text-sm font-semibold">
              Recent recipients
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {recent.map(
              (recipient) => (
                <button
                  key={
                    recipient.accountNumber
                  }
                  type="button"
                  onClick={() =>
                    onSelect(
                      recipient.accountNumber
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-emerald-300"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {recipient.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    ••••••
                    {recipient.accountNumber.slice(
                      -4
                    )}
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

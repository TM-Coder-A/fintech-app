"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Laptop,
  LogOut,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type SessionItem = {
  id: string;
  current: boolean;
  device: string;
  ipAddress: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
};

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SessionsPage() {
  const [
    sessions,
    setSessions,
  ] = useState<SessionItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    revokingId,
    setRevokingId,
  ] = useState<string | null>(
    null
  );

  const [
    revokingAll,
    setRevokingAll,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/sessions")
      .then(async (response) => {
        const result =
          await response.json();

        return {
          ok: response.ok,
          result,
        };
      })
      .then(
        ({ ok, result }) => {
          if (cancelled) {
            return;
          }

          if (!ok) {
            setError(
              result.message ??
                "Unable to load sessions."
            );

            return;
          }

          setSessions(
            result.sessions ?? []
          );
        }
      )
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not reach the server."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function revokeSession(
    id: string
  ) {
    setRevokingId(id);
    setError("");

    try {
      const response =
        await fetch(
          `/api/sessions/${id}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to revoke session."
        );

        return;
      }

      setSessions(
        (current) =>
          current.filter(
            (session) =>
              session.id !== id
          )
      );
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setRevokingId(null);
    }
  }

  async function revokeAll() {
    const confirmed =
      window.confirm(
        "Sign out every device, including this one?"
      );

    if (!confirmed) {
      return;
    }

    setRevokingAll(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/sessions/revoke-all",
          {
            method: "POST",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to sign out all sessions."
        );

        return;
      }

      window.location.assign(
        "/login"
      );
    } catch {
      setError(
        "Could not reach the server."
      );

      setRevokingAll(false);
    }
  }

  return (
    <main>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/security"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
        >
          <ArrowLeft size={18} />
          Back to security
        </Link>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck
                size={24}
              />
            </div>

            <h1 className="text-3xl font-bold text-slate-950">
              Active sessions
            </h1>

            <p className="mt-2 text-slate-600">
              Review devices that are
              currently signed in to your
              account.
            </p>
          </div>

          <button
            type="button"
            onClick={revokeAll}
            disabled={
              revokingAll ||
              sessions.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
          >
            <LogOut size={17} />

            {revokingAll
              ? "Signing out..."
              : "Sign out everywhere"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No active sessions found.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(
              (session) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                        <Laptop
                          size={21}
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            {
                              session.device
                            }
                          </p>

                          {session.current && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              This device
                            </span>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-500">
                          <p>
                            IP:{" "}
                            {session.ipAddress ??
                              "Not available"}
                          </p>

                          <p>
                            Last activity:{" "}
                            {formatDate(
                              session.lastSeenAt
                            )}
                          </p>

                          <p>
                            Signed in:{" "}
                            {formatDate(
                              session.createdAt
                            )}
                          </p>

                          <p>
                            Expires:{" "}
                            {formatDate(
                              session.expiresAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!session.current && (
                      <button
                        type="button"
                        onClick={() =>
                          revokeSession(
                            session.id
                          )
                        }
                        disabled={
                          revokingId ===
                          session.id
                        }
                        className="rounded-xl border border-rose-200 p-2.5 text-rose-600 disabled:opacity-50"
                        aria-label="Revoke session"
                      >
                        <Trash2
                          size={18}
                        />
                      </button>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

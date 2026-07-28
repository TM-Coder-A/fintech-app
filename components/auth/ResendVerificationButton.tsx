"use client";

import { useState } from "react";

export default function ResendVerificationButton() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function resend() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response =
        await fetch(
          "/api/email-verification/resend",
          {
            method: "POST",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to create verification request."
        );

        return;
      }

      setMessage(result.message);
    } catch {
      setError(
        "Could not reach the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={resend}
        disabled={loading}
        className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
      >
        {loading
          ? "Requesting..."
          : "Request New Verification Link"}
      </button>

      {message && (
        <p className="mt-4 text-sm text-emerald-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

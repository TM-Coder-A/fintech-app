"use client";

import {
  useState,
} from "react";

import {
  Check,
  Star,
} from "lucide-react";

export default function SaveBeneficiaryButton({
  accountNumber,
}: {
  accountNumber: string;
}) {
  const [loading, setLoading] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  async function saveRecipient() {
    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/beneficiaries",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              accountNumber,
            }),
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setSaved(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={saveRecipient}
      disabled={
        loading || saved
      }
      className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 disabled:text-slate-500"
    >
      {saved ? (
        <>
          <Check size={15} />
          Saved
        </>
      ) : (
        <>
          <Star size={15} />
          {loading
            ? "Saving..."
            : "Save"}
        </>
      )}
    </button>
  );
}

"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Trash2,
} from "lucide-react";

export default function RemoveBeneficiaryButton({
  id,
}: {
  id: string;
}) {
  const router =
    useRouter();

  const [loading, setLoading] =
    useState(false);

  async function remove() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `/api/beneficiaries/${id}`,
          {
            method: "DELETE",
          }
        );

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 disabled:opacity-50"
    >
      <Trash2 size={17} />

      {loading
        ? "Removing..."
        : "Remove"}
    </button>
  );
}

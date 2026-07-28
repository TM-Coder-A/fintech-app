"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  mobile?: boolean;
}

export default function LogoutButton({
  mobile = false,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);

      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        mobile
          ? "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          : "mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      }
    >
      <LogOut size={18} />
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}

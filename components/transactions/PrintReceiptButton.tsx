"use client";

import { Printer } from "lucide-react";

export default function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white"
    >
      <Printer size={18} />
      Print Receipt
    </button>
  );
}

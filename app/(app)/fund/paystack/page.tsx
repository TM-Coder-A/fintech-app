import Link from "next/link";

import PaystackFundingForm from "@/components/funding/PaystackFundingForm";

export default function PaystackFundingPage() {
  return (
    <main>
      <div className="mx-auto max-w-xl px-6 py-10">
        <Link
          href="/fund"
          className="text-sm font-semibold text-slate-600"
        >
          ← Back to funding
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Add money with Paystack
          </h1>

          <p className="mt-3 text-slate-600">
            Complete a Paystack test
            payment to test the funding
            integration.
          </p>

          <div className="mt-8">
            <PaystackFundingForm />
          </div>
        </section>
      </div>
    </main>
  );
}

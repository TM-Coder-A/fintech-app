import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Send,
  Wallet,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            NovaPay
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="font-medium text-slate-700 hover:text-slate-950"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Create Account
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 font-semibold text-emerald-600">
            Simple. Secure. Fast.
          </p>

          <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            A smarter way to manage your money.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Send money, receive payments, track transactions and manage your
            wallet from one secure platform.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm text-slate-400">Available Balance</p>

          <h2 className="mt-2 text-4xl font-bold">
            £12,480.50
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 p-5">
              <Send className="mb-4" />
              <p className="font-semibold">Send Money</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5">
              <Wallet className="mb-4" />
              <p className="font-semibold">Add Money</p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-slate-400">
              Recent activity
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span>Payment received</span>
              <span className="font-semibold">
                +£450.00
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span>Transfer sent</span>
              <span className="font-semibold">
                -£120.00
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6">
            <Wallet className="mb-4 text-emerald-600" />
            <h3 className="text-xl font-semibold">
              Digital Wallet
            </h3>
            <p className="mt-2 text-slate-600">
              View balances and manage your funds from one dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <Send className="mb-4 text-emerald-600" />
            <h3 className="text-xl font-semibold">
              Fast Transfers
            </h3>
            <p className="mt-2 text-slate-600">
              Send funds securely between users in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6">
            <ShieldCheck className="mb-4 text-emerald-600" />
            <h3 className="text-xl font-semibold">
              Built for Security
            </h3>
            <p className="mt-2 text-slate-600">
              Secure authentication and server-side transaction controls.
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-slate-500">
        © 2026 NovaPay. Demo fintech platform.
      </footer>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  History,
  LayoutDashboard,
  Menu,
  Send,
  User,
  Wallet,
  X,
} from "lucide-react";

import LogoutButton from "./LogoutButton";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/transfer",
    label: "Send Money",
    icon: Send,
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: History,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export default function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
        >
          <div className="rounded-lg bg-emerald-600 p-2 text-white">
            <Wallet size={18} />
          </div>

          <span className="text-xl font-bold text-slate-950">
            NovaPay
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-lg border border-slate-200 p-2"
          aria-label="Toggle navigation"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="space-y-2 border-t border-slate-100 px-5 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-700 hover:bg-slate-50"
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-slate-100 pt-2">
            <LogoutButton mobile />
          </div>
        </nav>
      )}
    </div>
  );
}

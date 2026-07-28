"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  Send,
  User,
  Wallet,
} from "lucide-react";

import LogoutButton from "./LogoutButton";
import { formatCurrency } from "@/lib/format";

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    balance: number;
  };
}

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

export default function Sidebar({
  user,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col p-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="rounded-xl bg-emerald-600 p-2 text-white">
            <Wallet size={22} />
          </div>

          <span className="text-2xl font-bold text-slate-950">
            NovaPay
          </span>
        </Link>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-slate-400">
            Signed in as
          </p>

          <p className="mt-1 font-semibold text-slate-950">
            {user.firstName} {user.lastName}
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-700"
                    : "flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
                }
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-sm text-slate-400">
              Available balance
            </p>

            <p className="mt-1 text-lg font-bold">
              {formatCurrency(user.balance)}
            </p>
          </div>

          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}

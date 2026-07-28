"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  History,
  User,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/transfer",
    label: "Send",
    icon: Send,
  },
  {
    href: "/transactions",
    label: "History",
    icon: History,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex flex-col items-center gap-1 px-2 py-3 text-emerald-600"
                  : "flex flex-col items-center gap-1 px-2 py-3 text-slate-500"
              }
            >
              <Icon size={20} />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

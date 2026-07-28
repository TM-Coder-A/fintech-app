import { ReactNode } from "react";

import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";

interface AppShellProps {
  children: ReactNode;

  user: {
    firstName: string;
    lastName: string;
    balance: number;
  };
}

export default function AppShell({
  children,
  user,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar user={user} />

      <div className="min-w-0 flex-1">
        <MobileHeader />

        <div className="pb-20 lg:pb-0">
          {children}
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <MobileHeader />

        {children}
      </div>
    </div>
  );
}

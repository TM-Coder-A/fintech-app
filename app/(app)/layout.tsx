import { ReactNode } from "react";

import AppShell from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/current-user";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <AppShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.wallet
          ? Number(user.wallet.balance)
          : 0,
      }}
    >
      {children}
    </AppShell>
  );
}

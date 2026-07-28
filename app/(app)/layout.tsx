import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AppShell from "@/components/layout/AppShell";
import { verifySessionToken } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}

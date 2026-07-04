import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const collapsed = cookieStore.get("sidebarCollapsed")?.value === "true";

  return <DashboardShell defaultCollapsed={collapsed}>{children}</DashboardShell>;
}

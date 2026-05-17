import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      {/* <SidebarInset> */}
      <SidebarInset className="h-[98vh] overflow-hidden flex flex-col"> {/* anchor height here */}
        <SiteHeader />
        {/* <main className="flex flex-1 flex-col"> */}
        <main className="flex flex-1 flex-col overflow-hidden min-h-0"> {/* min-h-0 is critical */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

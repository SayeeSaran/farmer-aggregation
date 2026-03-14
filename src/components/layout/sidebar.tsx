"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Leaf, CheckCircle2, Users, Activity,
  FileText, ShieldCheck, Settings, LogOut, TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const farmerNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farms", label: "My Farms", icon: Leaf },
  { href: "/eligibility", label: "Eligibility Check", icon: CheckCircle2 },
  { href: "/pools", label: "Carbon Pools", icon: Users },
  { href: "/reports/new", label: "Submit Report", icon: FileText },
];

const aggregatorNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pools", label: "Manage Pools", icon: Users },
  { href: "/monitoring", label: "dMRV Monitor", icon: Activity },
  { href: "/reports", label: "Reports", icon: FileText },
];

const verifierNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitoring", label: "dMRV Monitor", icon: Activity },
  { href: "/verification", label: "Verification Queue", icon: ShieldCheck },
];

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farms", label: "All Farms", icon: Leaf },
  { href: "/pools", label: "All Pools", icon: Users },
  { href: "/monitoring", label: "dMRV Monitor", icon: Activity },
  { href: "/admin", label: "Admin Panel", icon: Settings },
];

const roleBadgeColor: Record<string, string> = {
  FARMER: "bg-green-100 text-green-800",
  AGGREGATOR: "bg-blue-100 text-blue-800",
  VERIFIER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-red-100 text-red-800",
};

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role ?? "FARMER";

  const navItems =
    role === "ADMIN" ? adminNav :
    role === "AGGREGATOR" ? aggregatorNav :
    role === "VERIFIER" ? verifierNav :
    farmerNav;

  return (
    <aside className="flex flex-col w-64 min-h-screen border-r bg-card px-3 py-4 gap-1">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 mb-4">
        <TreePine className="h-6 w-6 text-green-600" />
        <span className="font-bold text-lg">CarbonFarm</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-green-50 text-green-700"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t pt-3 mt-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-100 text-green-700 text-xs">
              {session?.user?.name?.slice(0, 2).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <Badge className={cn("text-xs px-1.5 py-0 h-4", roleBadgeColor[role])}>
              {role}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground mt-1"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BarChart3,
  Package,
} from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Items", href: "/items", icon: Package },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        background: "#FFFFFF",
        boxShadow: "0 -1px 8px rgba(15, 23, 42, 0.04)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      className="lg:hidden"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "4px 8px" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                padding: "8px 12px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.15s ease",
                flex: 1,
                minWidth: 0,
                color: isActive ? "#4F46E5" : "#94A3B8",
              }}
            >
              <div
                style={{
                  padding: "6px",
                  borderRadius: "10px",
                  background: isActive ? "#EEF2FF" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <item.icon
                  style={{
                    width: "20px",
                    height: "20px",
                    color: isActive ? "#4F46E5" : "#94A3B8",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: isActive ? 700 : 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

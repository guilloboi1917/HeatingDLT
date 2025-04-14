"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Heater, Menu } from "lucide-react";
import path from "path";
import { rule } from "postcss";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      href: "/",
      label: "Wallet",
      active: pathname === "/",
    },

    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/billing",
      label: "Billing",
      active: pathname === "/billing",
    },
    {
      href: "/adminDashboard",
      label: "Admin",
      active: pathname === "/adminDashboard",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Heater className="h-6 w-6" />
            <span className="font-bold inline-block">HeatingDLT</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:underline hover:underline-offset-2",
                  route.active ? "underline underline-offset-2" : ""
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

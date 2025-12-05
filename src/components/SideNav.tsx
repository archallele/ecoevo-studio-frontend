"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Wrench, Folder } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/tools", icon: Wrench, label: "Tools" },
  { href: "/dashboard/projects", icon: Folder, label: "Projects" },
];

export function SideNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const firstInitial = user?.firstName?.[0]?.toUpperCase() || "?";

  return (
    <nav className="fixed left-0 top-0 h-screen w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
      {/* Nav items */}
      <div className="flex-1 flex flex-col items-center gap-1 pt-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg transition-colors ${
                isActive
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] mt-1 font-mono">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Avatar */}
      <div className="pb-2">
        <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-mono font-medium">
          {firstInitial}
        </div>
      </div>
    </nav>
  );
}

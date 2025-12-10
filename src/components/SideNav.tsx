"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Home, Network, Folder, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/tools", icon: Network, label: "Tools" },
  { href: "/dashboard/projects", icon: Folder, label: "Projects" },
];

export function SideNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const firstInitial = user?.firstName?.[0]?.toUpperCase() || "?";

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      {/* Avatar with menu */}
      <div className="pb-2 relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-mono font-medium hover:bg-gray-400 transition-colors cursor-pointer"
        >
          {firstInitial}
        </button>

        {/* Sign out menu */}
        {showMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-mono text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

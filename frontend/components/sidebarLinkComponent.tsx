import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function SidebarLink({
  href,
  icon,
  label,
  sidebarOpen,
}: {
  href: string;
  icon: React.ReactElement;
  label: string;
  sidebarOpen: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={clsx(
          "flex items-center px-4 py-2.5 mx-2 my-1 cursor-pointer rounded-md text-sm font-medium transition-all duration-200 relative",
          isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-md" />
        )}
        <div className="h-4 w-4 shrink-0 flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
        </div>
        {sidebarOpen && <span className="ml-3 truncate">{label}</span>}
      </div>
    </Link>
  );
}

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarLink({
  href,
  icon,
  label,
  sidebarOpen,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sidebarOpen: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <div
        className={clsx(
          "flex items-center px-4 py-3 mx-2 my-1 cursor-pointer rounded-xl font-medium transition-all duration-200",
          isActive
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
      >
        <div className="h-5 w-5">{icon}</div>
        {sidebarOpen && <span className="ml-3">{label}</span>}
      </div>
    </Link>
  );
}

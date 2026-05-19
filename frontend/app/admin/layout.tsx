"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, User, Home, Users, Clipboard, LogOut, X } from "lucide-react";

import { SidebarLink } from "@/components/sidebarLinkComponent";
import API_BASE_URL from "@/lib/api";
import { ModeToggle } from "@/components/ModeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setAdminName(data.name);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(!mobileSidebarOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-14"
          } bg-card backdrop-blur-md border-r border-border text-card-foreground transition-all duration-300 hidden lg:flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold tracking-wide text-foreground">Admin Panel</h1>
          )}
          <button onClick={toggleSidebar} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-8 flex-1">
          <SidebarLink
            href="/admin/dashboard"
            icon={<Home />}
            label="Dashboard"
            sidebarOpen={sidebarOpen}
          />
          <SidebarLink
            href="/admin/users"
            icon={<Users />}
            label="Users"
            sidebarOpen={sidebarOpen}
          />
          <SidebarLink
            href="/admin/tasks"
            icon={<Clipboard />}
            label="Tasks"
            sidebarOpen={sidebarOpen}
          />
        </nav>
      </div>

      {/* Sidebar - Mobile (Slide-in) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-card backdrop-blur-md border-r border-border text-card-foreground z-50 transform transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h1 className="text-xl font-bold tracking-wide">Admin Panel</h1>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8" onClick={closeMobileSidebar}>
          <SidebarLink
            href="/admin/dashboard"
            icon={<Home />}
            label="Dashboard"
            sidebarOpen={true}
          />
          <SidebarLink
            href="/admin/users"
            icon={<Users />}
            label="Users"
            sidebarOpen={true}
          />
          <SidebarLink
            href="/admin/tasks"
            icon={<Clipboard />}
            label="Tasks"
            sidebarOpen={true}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-cyan-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[150px]" />
        </div>
        {/* Top Navbar */}
        <header className="bg-card backdrop-blur-md border-b border-border shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleSidebar}
                className="p-1 lg:hidden text-muted-foreground hover:text-foreground hover:bg-muted rounded"
              >
                <Menu className="h-5 w-5" />
              </button>
              <nav className="text-sm font-medium text-muted-foreground">
                Dashboard
              </nav>
            </div>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-4">
              <ModeToggle />
              
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger className="focus:outline-none">
                  <div className="flex items-center space-x-2 hover:bg-muted p-1 pr-3 rounded-full transition-colors cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {adminName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium">
                      {adminName}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, User, Home, Users, Clipboard, LogOut, X } from "lucide-react";

import { SidebarLink } from "@/components/sidebarLinkComponent";
import API_BASE_URL from "@/lib/api";

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
    <div className="flex h-screen bg-slate-50">
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
          } bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 hidden lg:flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
          )}
          <button onClick={toggleSidebar} className="p-1 text-slate-400 hover:text-white transition-colors">
            <Menu className="h-6 w-6" />
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
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 text-white z-50 transform transition-transform duration-300 lg:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <h1 className="text-xl font-bold text-white tracking-wide">Admin Panel</h1>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
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
        {/* Background Decorators */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/20 blur-3xl"></div>
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-200/20 blur-3xl"></div>
          <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[40%] rounded-full bg-gradient-to-br from-purple-200/20 to-indigo-200/20 blur-3xl"></div>
        </div>
        {/* Top Navbar */}
        <header className="bg-slate-900 border-b border-slate-800 shadow-sm z-10 sticky top-0">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleSidebar}
                className="p-1 lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 rounded"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-lg lg:text-xl font-semibold text-white tracking-wide">
                {adminName} Dashboard
              </h2>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none hover:bg-slate-800 p-1 pr-3 rounded-full transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-300" />
                </div>
                <span className="hidden md:inline text-slate-200 font-medium">
                  {adminName}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

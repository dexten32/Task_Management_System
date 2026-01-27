"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Menu, User, CircleCheck, ListCheck, LogOut, X } from "lucide-react";
import { SidebarLink } from "@/components/sidebarLinkComponent";
import API_BASE_URL from "@/lib/api";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("Employee");
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
        setEmployeeName(data.name);
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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Mobile Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-14"
        } bg-gradient-to-b from-blue-100 to-indigo-100 text-gray-700 transition-all duration-300 hidden lg:block`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-indigo-700">
              Employee Panel
            </h1>
          )}
          <button onClick={toggleSidebar} className="p-1">
            <Menu className="h-6 w-6 text-indigo-600" />
          </button>
        </div>
        <nav className="mt-8">
          <SidebarLink
            href="/employee/dashboard"
            icon={<CircleCheck />}
            label="Dashboard"
            sidebarOpen={true}
          />
          <SidebarLink
            href="/employee/currentTask"
            icon={<CircleCheck />}
            label="Current Tasks"
            sidebarOpen={sidebarOpen}
          />
          <SidebarLink
            href="/employee/previousTask"
            icon={<ListCheck />}
            label="Previous Tasks"
            sidebarOpen={sidebarOpen}
          />
        </nav>
      </div>

      {/* Sidebar - Mobile (Slide-in) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-100 to-indigo-100 text-gray-700 z-50 transform transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-indigo-200">
          <h1 className="text-xl font-bold text-indigo-700">Employee Panel</h1>
          <button onClick={() => setMobileSidebarOpen(false)} className="p-1">
            <X className="h-6 w-6 text-indigo-600" />
          </button>
        </div>
        <nav className="mt-8" onClick={closeMobileSidebar}>
          <SidebarLink
            href="/employee/dashboard"
            icon={<CircleCheck />}
            label="Dashboard"
            sidebarOpen={true}
          />
          <SidebarLink
            href="/employee/currentTask"
            icon={<CircleCheck />}
            label="Current Tasks"
            sidebarOpen={true}
          />
          <SidebarLink
            href="/employee/previousTask"
            icon={<ListCheck />}
            label="Previous Tasks"
            sidebarOpen={true}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-gradient-to-r from-blue-100 to-indigo-100 shadow-sm z-10">
          <div className="flex items-center justify-between px-4 lg:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile Hamburger Button */}
              <button
                onClick={toggleSidebar}
                className="p-1 lg:hidden hover:bg-indigo-50 rounded"
              >
                <Menu className="h-6 w-6 text-indigo-600" />
              </button>
              <h2 className="text-lg lg:text-xl font-semibold text-indigo-700">
                {employeeName} Panel
              </h2>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-7 w-7 text-indigo-600 bg-white rounded-xl p-1" />
                </div>
                <span className="hidden md:inline text-indigo-700 hover:text-indigo-900">
                  {employeeName}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-indigo-100 rounded shadow-lg z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:text-indigo-700 hover:bg-indigo-50"
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

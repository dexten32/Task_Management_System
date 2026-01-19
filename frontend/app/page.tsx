/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ServiceCompanyLanding from "./landingPage/page";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Simulate login callback from landing page
  const handleLogin = (role: "admin" | "employee") => {
    setIsLoggedIn(true);

    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "employee") {
      router.push("/employee/currentTask");
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      {/* Pass the login handler to the landing page */}
      <ServiceCompanyLanding />
    </div>
  );
}

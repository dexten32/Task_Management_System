import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import API_BASE_URL from "@/lib/api";

export const useAuth = (isLogin: boolean) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (retryAfter !== null && retryAfter > 0) {
      interval = setInterval(() => {
        setRetryAfter((prev) => (prev && prev > 1000 ? prev - 1000 : null));
      }, 1000);
    } else if (retryAfter !== null && retryAfter <= 0) {
      setRetryAfter(null);
      setError("");
    }
    return () => clearInterval(interval);
  }, [retryAfter]);

  useEffect(() => {
    setRetryAfter(null);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  }, [isLogin]);

  const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429 && errorData.retryAfterMs) {
        setRetryAfter(errorData.retryAfterMs);
        throw new Error(`Account temporarily locked. Try again in ${Math.ceil(errorData.retryAfterMs / 1000)}s.`);
      }
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("token", data.token);
    const role = data.user?.role?.toUpperCase();

    if (role === "ADMIN") router.push("/admin/dashboard");
    else if (role === "EMPLOYEE") router.push("/employee/dashboard");
    else if (role === "MANAGER") router.push("/manager/dashboard");
    else throw new Error("Unknown user role");

    router.refresh();
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) throw new Error("Passwords don't match!");

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      throw new Error("Password must be 8+ chars, with uppercase, lowercase, number, and special char.");
    }

    const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Signup failed");
    }

    alert("Account created successfully. Please wait for admin approval.");
  };

  return {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    name, setName,
    error, setError,
    isLoading, setIsLoading,
    retryAfter,
    handleLogin,
    handleSignup
  };
};

/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  Mail,
  User,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import API_BASE_URL from "@/lib/api";

export default function ServiceCompanyLanding() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Handle retry countdown
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

  // Reset ReCAPTCHA and form fields when switching between Login and Signup
  useEffect(() => {
    setCaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRetryAfter(null);
    setError(""); // Also clear any previous errors
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryAfter) return; // Prevent submission if timer is running

    setError("");
    setIsLoading(true);

    if (isLogin) {
      // Enforce CAPTCHA to bypass lockout
      if (!captchaToken) {
        setError("Please complete the ReCAPTCHA verification to sign in");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password, captchaToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429 && errorData.retryAfterMs) {
            setRetryAfter(errorData.retryAfterMs);
            setError(`Account temporarily locked. Please try again in ${Math.ceil(errorData.retryAfterMs / 1000)} seconds.`);
          } else {
            setError(errorData.message || "Login failed");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        const role = data.user?.role?.toUpperCase();

        if (role === "ADMIN") {
          router.push("/admin/dashboard");
          router.refresh();
        } else if (role === "EMPLOYEE") {
          router.push("/employee/dashboard");
          router.refresh();
        } else if (role === "MANAGER") {
          router.push("/manager/dashboard");
          router.refresh();
        } else {
          setError("Unknown user role");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Network error. Please try again.");
        setIsLoading(false);
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords don't match!");
        setIsLoading(false);
        return;
      }

      // Strong password validation
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        setError("Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.");
        setIsLoading(false);
        return;
      }

      // Enforce CAPTCHA for signup
      if (!captchaToken) {
        setError("Please complete the ReCAPTCHA verification");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, captchaToken }),
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Signup failed");
          setIsLoading(false);
          return;
        }

        alert("Account created successfully. Please wait for admin approval.");
        setIsLogin(true);
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const features = [
    { icon: Shield, text: "Manage tasks effortlessly" },
    { icon: CheckCircle2, text: "Real-time task tracking" },
    { icon: Sparkles, text: "Achieve more, faster" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Sophisticated background with grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30"></div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.05) 1px, transparent 0)`,
          backgroundSize: "48px 48px",
        }}
      ></div>

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-400/10 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>

      {/* Main Content */}
      <main className="flex-1 flex items-stretch justify-center px-4 py-8 md:py-0 relative z-10">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:block">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16 flex-1">
            {/* Left Side - Branding */}
            <div className="flex-1 text-center md:text-left mb-0 md:mb-0 flex-shrink-0">
              {/* Mobile Logo */}
              <div className="md:hidden flex flex-col items-center justify-center min-h-[18vh]">
                <div className="relative">
                  <div className="relative rounded-2xl">
                    <Image
                      src="/cynox_logo.svg"
                      alt="Cynox Logo"
                      width={1}
                      height={1}
                      className="h-30 w-30 text-white"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Cynox
                  </h1>
                  <div className="text-xs text-gray-500 tracking-widest font-medium">
                    SECURITY
                  </div>
                </div>
              </div>

              {/* Desktop Branding */}
              <div className="hidden md:block select-none">
                <div className="flex items-center space-x-2 mb-2 justify-center md:justify-start group">
                  <div className="relative">
                    <div className="relative rounded-2xl transform hover:scale-110 transition-all duration-300">
                      <Image
                        src="/cynox_logo.svg"
                        alt="Cynox Logo"
                        width={1}
                        height={1}
                        className="h-40 w-40 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      Cynox
                    </span>
                    <div className="text-xs text-gray-500 tracking-widest font-medium">
                      SECURITY
                    </div>
                  </div>
                </div>

                <div className="max-w-xl mx-auto md:mx-0 mb-8">
                  <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                    ORGANIZE.
                    <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      PRIORITIZE. ACHIEVE.
                    </span>
                  </h2>
                  <p className="text-lg text-gray-600">
                    Smart solutions to manage what matters most.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 max-w-xl">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <feature.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-semibold">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Auth Card */}
            <div className="flex-1 max-w-lg mx-auto md:mx-0 md:pt-16 w-full md:mt-0">
              <div className="relative md:pb-0">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-t-3xl md:rounded-3xl blur-2xl opacity-20 transition-opacity duration-500"></div>

                <Card className="relative w-full bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  {/* Decorative header bar */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"></div>

                  <CardHeader className="text-center pb-4 pt-8 px-8 md:pb-4 md:pt-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4 shadow-inner md:flex hidden">
                      <Sparkles className="h-7 w-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl lg:text-3xl md:block ">
                      {isLogin ? "Welcome Back" : "Get Started"}
                    </CardTitle>
                    <p className="text-sm text-gray-500 md:block hidden">
                      {isLogin
                        ? "Enter your credentials to access your account"
                        : "Join us and secure your digital presence"}
                    </p>
                  </CardHeader>

                  <CardContent className="px-8 pb-8 pt-4 md:px-8">
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4 md:space-y-5"
                    >
                      {!isLogin && (
                        <div className="relative md:block">
                          <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Full Name
                          </label>
                          <div className="relative group">
                            <User
                              className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${focusedField === "name"
                                ? "text-blue-600 scale-110"
                                : "text-gray-400"
                                }`}
                            />
                            <Input
                              id="name"
                              type="text"
                              placeholder="John Doe"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              onFocus={() => setFocusedField("name")}
                              onBlur={() => setFocusedField("")}
                              required
                              className="pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                            />
                          </div>
                        </div>
                      )}

                      <div className="relative">
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-gray-700 mb-2 md:block hidden"
                        >
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail
                            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${focusedField === "email"
                              ? "text-blue-600 scale-110"
                              : "text-gray-400"
                              }`}
                          />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField("")}
                            required
                            className="pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label
                          htmlFor="password"
                          className="block text-sm font-semibold text-gray-700 mb-2 md:block hidden"
                        >
                          Password
                        </label>
                        <div className="relative group">
                          <Lock
                            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${focusedField === "password"
                              ? "text-blue-600 scale-110"
                              : "text-gray-400"
                              }`}
                          />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField("")}
                            required
                            minLength={6}
                            className="pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        {!isLogin && (
                          <div className="mt-3 space-y-1.5 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Password requirements:</p>
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium tracking-wide">
                              <div className={`flex items-center space-x-1.5 transition-colors duration-300 ${password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {password.length >= 8 ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                <span>8+ characters</span>
                              </div>
                              <div className={`flex items-center space-x-1.5 transition-colors duration-300 ${/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {/[A-Z]/.test(password) ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                <span>Uppercase letter</span>
                              </div>
                              <div className={`flex items-center space-x-1.5 transition-colors duration-300 ${/[a-z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {/[a-z]/.test(password) ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                <span>Lowercase letter</span>
                              </div>
                              <div className={`flex items-center space-x-1.5 transition-colors duration-300 ${/\d/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {/\d/.test(password) ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                <span>Number</span>
                              </div>
                              <div className={`flex items-center space-x-1.5 col-span-2 transition-colors duration-300 ${/[@$!%*?&]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {/[@$!%*?&]/.test(password) ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                                <span>Special character (@$!%*?&)</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isLogin && (
                        <div className="relative group">
                          <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-semibold text-gray-700 mb-2"
                          >
                            Confirm Password
                          </label>
                          <div className="relative group">
                            <Lock
                              className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${focusedField === "confirmPassword"
                                ? "text-blue-600 scale-110"
                                : "text-gray-400"
                                }`}
                            />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              onFocus={() => setFocusedField("confirmPassword")}
                              onBlur={() => setFocusedField("")}
                              required
                              minLength={6}
                              className="pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100/50 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {isLogin && (
                        <div className="flex justify-between items-center text-sm md:flex hidden">
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                              Remember me
                            </span>
                          </label>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors relative group"
                          >
                            Forgot password?
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                          </button>
                        </div>
                      )}

                      {isLogin && (
                        <div className="flex justify-between items-center text-xs md:hidden">
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                              Remember me
                            </span>
                          </label>
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors relative group"
                          >
                            Forgot password?
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                          </button>
                        </div>
                      )}

                      {error && (
                        <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
                          <p className="text-red-700 text-sm font-medium">
                            {error}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-center w-full overflow-hidden">
                        <div className="transform scale-110 origin-center py-2">
                          <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token) => setCaptchaToken(token)}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || retryAfter !== null}
                        className={`relative w-full group overflow-hidden bg-gradient-to-r ${isLoading || retryAfter !== null
                          ? "from-gray-400 to-gray-500 cursor-not-allowed"
                          : "from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-700"
                          } text-white font-semibold text-lg py-4 md:py-4 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl`}
                      >
                        <span className="flex items-center justify-center space-x-2">
                          {retryAfter !== null ? (
                            <div className="flex items-center space-x-2">
                              <Lock className="w-5 h-5 text-white" />
                              <span>Try again in {Math.ceil(retryAfter / 1000)}s</span>
                            </div>
                          ) : isLoading ? (
                            <div className="flex items-center space-x-2 border-transparent">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <>
                              <span>{isLogin ? "Sign In" : "Create Account"}</span>
                              <svg
                                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </>
                          )}
                        </span>
                      </Button>

                      <div className="relative my-6 md:block hidden">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">
                            {isLogin
                              ? "New to Cynox Security?"
                              : "Already have an account?"}
                          </span>
                        </div>
                      </div>

                      <div className="relative my-4 md:hidden flex items-center justify-center">
                        <span className="text-xs text-gray-500 font-medium">
                          {isLogin ? "New to Cynox?" : "Have an account?"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full px-6 py-4 md:py-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-700 font-semibold rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md md:block hidden"
                      >
                        {isLogin
                          ? "Create new account"
                          : "Sign in to existing account"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-700 font-semibold text-sm rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md md:hidden"
                      >
                        {isLogin ? "Create new account" : "Sign in"}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Trust indicators - Desktop only */}
              <div className="hidden md:flex mt-6 items-center justify-center space-x-8 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure & Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Privacy Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-gray-400 hidden md:block relative z-10">
        © {new Date().getFullYear()} Cynox Security. All rights reserved.
      </footer>
    </div>
  );
}

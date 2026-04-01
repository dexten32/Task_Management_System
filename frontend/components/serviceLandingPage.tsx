/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState } from "react";
import { Mail, Shield, Lock, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import BackgroundOrbs from "./landing/BackgroundOrbs";
import Branding from "./landing/Branding";
import LoginForm from "./landing/LoginForm";
import SignupForm from "./landing/SignupForm";
import { useAuth } from "../hooks/useAuth";

export default function ServiceCompanyLanding() {
  const [isLogin, setIsLogin] = useState(true);
  const [focusedField, setFocusedField] = useState("");
  
  const {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    name, setName,
    error, setError,
    isLoading,
    retryAfter,
    handleLogin,
    handleSignup
  } = useAuth(isLogin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryAfter) return;
    
    setError("");
    // setIsLoading(true); // Handled inside useAuth if we wanted, but let's keep it consistent
    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
        setIsLogin(true); // Switch to login after successful signup
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const features = [
    { icon: Shield, text: "Manage tasks effortlessly" },
    { icon: Mail, text: "Real-time task tracking" }, // Changed icon to Mail as in original list or similar
    { icon: Sparkles, text: "Achieve more, faster" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30"></div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.05) 1px, transparent 0)`,
          backgroundSize: "48px 48px",
        }}
      ></div>
      <BackgroundOrbs />

      {/* Main Content */}
      <main className="flex-1 flex items-stretch justify-center px-4 py-8 md:py-0 relative z-10">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:block">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-12 lg:gap-16 flex-1">
            
            <Branding features={features} />

            {/* Right Side - Auth Card */}
            <div className="flex-1 max-w-lg mx-auto md:mx-0 md:pt-16 w-full md:mt-0">
              <div className="relative md:pb-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-t-3xl md:rounded-3xl blur-2xl opacity-20 transition-opacity duration-500"></div>

                <Card className="relative w-full bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"></div>

                  <CardHeader className="text-center pb-4 pt-8 px-8 md:pb-4 md:pt-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-4 shadow-inner md:flex hidden">
                      <Sparkles className="h-7 w-7 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl lg:text-3xl md:block ">
                      {isLogin ? "Welcome Back" : "Get Started"}
                    </CardTitle>
                    <p className="text-sm text-gray-500 md:block hidden">
                      {isLogin ? "Enter your credentials to access your account" : "Join us and secure your digital presence"}
                    </p>
                  </CardHeader>

                  <CardContent className="px-8 pb-8 pt-4 md:px-8">
                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                      {isLogin ? (
                        <LoginForm
                          email={email} setEmail={setEmail}
                          password={password} setPassword={setPassword}
                          focusedField={focusedField} setFocusedField={setFocusedField}
                        />
                      ) : (
                        <SignupForm
                          name={name} setName={setName}
                          email={email} setEmail={setEmail}
                          password={password} setPassword={setPassword}
                          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                          focusedField={focusedField} setFocusedField={setFocusedField}
                        />
                      )}

                      {isLogin && (
                        <div className="flex justify-between items-center text-sm">
                          <label className="flex items-center space-x-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                            <span className="text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                          </label>
                          <button type="button" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors group">
                            Forgot password?
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                          </button>
                        </div>
                      )}

                      {error && (
                        <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
                          <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading || retryAfter !== null}
                        className={`relative w-full group overflow-hidden bg-gradient-to-r ${
                          isLoading || retryAfter !== null
                            ? "from-gray-400 to-gray-500 cursor-not-allowed"
                            : "from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-700"
                        } text-white font-semibold text-lg py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl`}
                      >
                        <span className="flex items-center justify-center space-x-2">
                          {retryAfter !== null ? (
                            <span>Try again in {Math.ceil(retryAfter / 1000)}s</span>
                          ) : isLoading ? (
                            <span>Processing...</span>
                          ) : (
                            <>
                              <span>{isLogin ? "Sign In" : "Create Account"}</span>
                              <Sparkles className="w-5 h-5" />
                            </>
                          )}
                        </span>
                      </Button>

                      <div className="relative my-6 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <span className="relative px-4 bg-white text-gray-500 text-sm font-medium">
                          {isLogin ? "New to Cynox Security?" : "Already have an account?"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full px-6 py-4 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 shadow-sm"
                      >
                        {isLogin ? "Create new account" : "Sign in to existing account"}
                      </button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 px-4 text-center text-sm text-gray-400 hidden md:block relative z-10">
        © {new Date().getFullYear()} Cynox Security. All rights reserved.
      </footer>
    </div>
  );
}

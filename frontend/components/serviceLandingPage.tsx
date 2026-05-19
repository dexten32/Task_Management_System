"use client";
import React, { useState } from "react";
import { Loader2, Hexagon, Eye, EyeOff, Github, Chrome } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../hooks/useAuth";
import { ModeToggle } from "./ModeToggle";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import API_BASE_URL from "../lib/api";

export default function ServiceCompanyLanding() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setError("");
        const res = await axios.post(`${API_BASE_URL}/users/google-login`, { token: tokenResponse.access_token });
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", user.role);

        if (user.role === "ADMIN") window.location.href = "/admin/dashboard";
        else if (user.role === "MANAGER") window.location.href = "/manager/dashboard";
        else window.location.href = "/employee/dashboard";
      } catch (err: any) {
        setError(err.response?.data?.message || "Google Login failed");
      }
    },
    onError: () => setError("Google Login Failed"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryAfter) return;
    setError("");
    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30 transition-colors duration-300"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Mouse Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 40%)`
        }}
      />

      {/* Ambient Static Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.04] mix-blend-overlay pointer-events-none z-0" />

      {/* Mode Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <ModeToggle />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 flex flex-col items-center py-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-card border border-border p-3.5 rounded-2xl shadow-lg mb-5">
            <Hexagon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            TaskSync Platform
          </h1>
        </div>

        {/* Form Container */}
        <div className="w-full bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-2xl">
          <div className="space-y-1.5 pb-8 pt-8 px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-base text-muted-foreground">
              {isLogin
                ? "Enter your email below to login to your account"
                : "Enter your details below to create your account"}
            </p>
          </div>
          
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="grid gap-2 text-left">
                  <Label htmlFor="name" className="text-foreground font-semibold text-sm">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background border-input text-foreground focus-visible:ring-primary h-12 text-base px-4"
                  />
                </div>
              )}
              <div className="grid gap-2 text-left">
                <Label htmlFor="email" className="text-foreground font-semibold text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-input text-foreground focus-visible:ring-primary h-12 text-base px-4"
                />
              </div>
              <div className="grid gap-2 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-semibold text-sm">Password</Label>
                  {isLogin && (
                    <button type="button" className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background border-input text-foreground pr-12 focus-visible:ring-primary h-12 text-base px-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div className="grid gap-2 text-left">
                  <Label htmlFor="confirmPassword" className="text-foreground font-semibold text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background border-input text-foreground pr-12 focus-visible:ring-primary h-12 text-base px-4"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-bold h-12 text-base mt-4 shadow-md transition-transform hover:scale-[1.01]"
                disabled={isLoading || retryAfter !== null}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Please wait
                  </>
                ) : retryAfter !== null ? (
                  `Try again in ${Math.ceil(retryAfter / 1000)}s`
                ) : (
                  isLogin ? "Sign In" : "Sign Up"
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                <span className="bg-card px-4 py-1 rounded-full border border-border shadow-sm">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button" className="w-full bg-background border-border text-foreground hover:bg-muted h-12 text-base shadow-sm" onClick={() => googleLogin()}>
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
              <Button variant="outline" type="button" className="w-full bg-background border-border text-foreground hover:bg-muted h-12 text-base shadow-sm" onClick={() => googleLogin()}>
                <Chrome className="mr-2 h-5 w-5" />
                Google
              </Button>
            </div>
          </div>
        </div>

        {/* Footer (Below the Card) */}
        <div className="mt-10 flex flex-col items-center space-y-5">
          <p className="text-base text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
          <p className="text-sm text-muted-foreground text-center px-4 max-w-sm leading-relaxed">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

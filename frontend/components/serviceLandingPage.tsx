"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Hexagon, Eye, EyeOff, Github, Chrome, LayoutDashboard, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../hooks/useAuth";
import { ModeToggle } from "./ModeToggle";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import API_BASE_URL from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function ServiceCompanyLanding() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  const features = [
    { icon: LayoutDashboard, title: "Centralized Dashboard", desc: "Manage all your tasks and teams in one unified workspace." },
    { icon: Zap, title: "Lightning Fast", desc: "Built on modern web technologies for a seamless experience." },
    { icon: Shield, title: "Enterprise Grade", desc: "Bank-level security ensuring your data remains protected." },
  ];

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground font-sans selection:bg-primary/30">
      
      {/* Left Column: Brand Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] bg-zinc-950 relative flex-col justify-between overflow-hidden p-12 text-zinc-50 border-r border-border/10 shadow-2xl z-10">
        {/* Interactive Mouse Glow */}
        <motion.div 
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          animate={{
            background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(79, 70, 229, 0.15), transparent 40%)`
          }}
        />

        {/* Ambient Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <motion.div 
            animate={{ 
              y: [0, -20, 0],
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" 
          />
          <motion.div 
            animate={{ 
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" 
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />
        </div>

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
            className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/30 ring-1 ring-white/10"
          >
            <Hexagon className="h-7 w-7 text-white" />
          </motion.div>
          <span className="text-2xl font-bold tracking-tight text-white">TaskSync</span>
        </div>

        {/* Middle: Content */}
        <div className="relative z-10 max-w-lg mt-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 mb-6 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>The new standard for team productivity</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-500"
          >
            Orchestrate your work with precision.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-zinc-400 mb-10 leading-relaxed"
          >
            Join thousands of teams who trust TaskSync to streamline their workflow, boost productivity, and deliver outstanding results on time.
          </motion.p>

          <div className="space-y-6">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
                whileHover={{ x: 5 }}
                className="flex items-start gap-4 group cursor-default"
              >
                <div className="mt-1 p-2.5 bg-white/5 border border-white/10 rounded-xl group-hover:bg-indigo-600/20 group-hover:border-indigo-500/30 transition-colors">
                  <feature.icon className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: Testimonial/Trust */}
        <div className="relative z-10 mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 shadow-sm" src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex text-amber-400 text-sm mb-1 gap-0.5">
                  {[1,2,3,4,5].map(star => <span key={star}>★</span>)}
                </div>
                <span className="text-zinc-300 font-medium tracking-wide">Trusted by 10,000+ top tier teams</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 sm:p-12 relative bg-background/50 dark:bg-background">
        {/* Subtle right side background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Hexagon className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">TaskSync</span>
        </div>

        <div className="absolute top-6 right-6 z-50">
          <ModeToggle />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[540px] relative z-10"
        >
          {/* Main Form Content - Now Without Card Container */}
          <div className="text-center mb-12">
            <motion.div 
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-4">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-lg text-muted-foreground font-medium">
                {isLogin
                  ? "Enter your credentials to access your workspace"
                  : "Enter your details to get started with TaskSync"}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-5 mb-10">
            <Button variant="outline" type="button" className="w-full bg-background hover:bg-muted h-14 text-base transition-all border-border shadow-sm group" onClick={() => googleLogin()}>
              <Github className="mr-3 h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              <span className="font-semibold">GitHub</span>
            </Button>
            <Button variant="outline" type="button" className="w-full bg-background hover:bg-muted h-14 text-base transition-all border-border shadow-sm group" onClick={() => googleLogin()}>
              <Chrome className="mr-3 h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              <span className="font-semibold">Google</span>
            </Button>
          </div>

          <div className="relative mb-10">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label htmlFor="name" className="text-foreground/90 font-bold text-base">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-14 text-lg bg-background/50 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-foreground/90 font-bold text-base">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 text-lg bg-background/50 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/90 font-bold text-base">Password</Label>
                {isLogin && (
                  <button type="button" className="text-base font-semibold text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-14 text-lg pr-12 bg-background/50 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
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

            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <Label htmlFor="confirmPassword" className="text-foreground/90 font-bold text-base">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 text-lg bg-background/50 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 text-base font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2 shadow-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-14 font-bold text-lg mt-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              disabled={isLoading || retryAfter !== null}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Authenticating...
                </>
              ) : retryAfter !== null ? (
                `Try again in ${Math.ceil(retryAfter / 1000)}s`
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-lg text-muted-foreground font-medium">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>

        </motion.div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface SignupFormProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  focusedField: string;
  setFocusedField: (val: string) => void;
}

const SignupForm = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  focusedField,
  setFocusedField,
}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <>
      <div className="relative md:block">
        <Label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
          Full Name
        </Label>
        <div className="relative group">
          <User
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
              focusedField === "name" ? "text-blue-600 scale-110" : "text-muted-foreground"
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
            className="pl-12 pr-4 py-4 rounded-xl transition-all duration-200 bg-background"
          />
        </div>
      </div>

      <div className="relative">
        <Label htmlFor="email" className="hidden md:block text-sm font-semibold text-foreground mb-2">
          Email Address
        </Label>
        <div className="relative group">
          <Mail
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
              focusedField === "email" ? "text-blue-600 scale-110" : "text-muted-foreground"
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
            className="pl-12 pr-4 py-4 rounded-xl transition-all duration-200 bg-background"
          />
        </div>
      </div>

      <div className="relative">
        <Label htmlFor="password" className="hidden md:block text-sm font-semibold text-foreground mb-2">
          Password
        </Label>
        <div className="relative group">
          <Lock
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
              focusedField === "password" ? "text-blue-600 scale-110" : "text-muted-foreground"
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
            className="pl-12 pr-12 py-4 rounded-xl transition-all duration-200 bg-background"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <div className="mt-3 space-y-1.5 p-3 bg-muted rounded-xl border border-border shadow-sm">
          <p className="text-xs font-semibold text-foreground mb-2">Password requirements:</p>
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
      </div>

      <div className="relative group">
        <Label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground mb-2">
          Confirm Password
        </Label>
        <div className="relative group">
          <Lock
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-all duration-200 ${
              focusedField === "confirmPassword" ? "text-blue-600 scale-110" : "text-muted-foreground"
            }`}
          />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField("")}
            required
            minLength={6}
            className="pl-12 pr-12 py-4 rounded-xl transition-all duration-200 bg-background"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </>
  );
};

export default SignupForm;

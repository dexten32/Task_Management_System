import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  focusedField: string;
  setFocusedField: (val: string) => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  focusedField,
  setFocusedField,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
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
      </div>
    </>
  );
};

export default LoginForm;

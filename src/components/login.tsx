import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase-client";

interface LoginFormData {
  email: string;
  password: string;
}

const initialFormData: LoginFormData = {
  email: "",
  password: "",
};

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>(initialFormData);
  const [focused, setFocused] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const routeToSignup = () => {
    navigate("/signup");
  };

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "http://18.61.161.186:4173/home",
      },
    });

    if (error) {
      console.log("Google login error:", error.message);
      setError(error.message);
      return;
    }

    console.log("Google login started:", data);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      console.log("Login failed:", error.message);
      setError(error.message);
      return;
    }

    if (data.session) {
      navigate("/home");
    }

    console.log("Login success:", data);
    setFormData(initialFormData);
  };

  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0E14] flex items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-[380px]">
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Sign in</h2>
        <p className="text-slate-500 text-sm mb-8">New here?</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-400 mb-2"
            >
              Email
            </label>
            <div
              className={`flex items-center gap-2.5 rounded-lg border bg-[#0D1219] px-3.5 h-11 transition-colors ${
                focused === "email"
                  ? "border-teal-300/60 ring-1 ring-teal-300/20"
                  : "border-slate-800"
              }`}
            >
              <Mail
                className="w-4 h-4 text-slate-500 shrink-0"
                strokeWidth={1.75}
              />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleData}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                placeholder="you@company.com"
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-400"
              >
                Password
              </label>
              <a
                href="#"
                className="text-xs text-slate-500 hover:text-teal-300 transition-colors"
              >
                Forgot?
              </a>
            </div>
            <div
              className={`flex items-center gap-2.5 rounded-lg border bg-[#0D1219] px-3.5 h-11 transition-colors ${
                focused === "password"
                  ? "border-teal-300/60 ring-1 ring-teal-300/20"
                  : "border-slate-800"
              }`}
            >
              <Lock
                className="w-4 h-4 text-slate-500 shrink-0"
                strokeWidth={1.75}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleData}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                placeholder="••••••••••"
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50 rounded"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {/* Submit */}
          <button
            type="submit"
            className="group w-full h-11 rounded-lg bg-teal-300 hover:bg-teal-200 text-[#0A0E14] text-sm font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E14] cursor-pointer"
          >
            Sign in
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-7">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] text-slate-600 font-mono">
            or continue with
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* OAuth */}
        <button
          type="button"
          className="w-full h-11 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 text-slate-300 text-sm font-medium flex items-center justify-center gap-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50 cursor-pointer"
          onClick={handleGoogleSignIn}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-4 h-4"
          />
          Google
        </button>

        <button
          type="button"
          className="w-full h-11 my-2 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 text-slate-300 text-sm font-medium flex items-center justify-center gap-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/50 cursor-pointer"
          onClick={() => routeToSignup()}
        >
          Create Account
        </button>
      </div>
    </div>
  );
};

export default Login;

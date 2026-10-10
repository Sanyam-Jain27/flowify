"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Zap, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { BACKEND_URL } from "@/config";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear error message when user modifies input
    if (errorMessage) {
      setErrorMessage(null);
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/user/signin`, formData);
      const rawData = response.data;
      const token = typeof rawData === "string" ? rawData : rawData?.token;

      if (token) {
        localStorage.setItem("token", token);
        router.push("/");
      } else {
        setErrorMessage("Signed in, but no access token received. Please try again.");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message;

        if (status === 400 || status === 401) {
          setErrorMessage(
            "Incorrect email or password. Please double-check your credentials, or create a new account if you haven't registered yet."
          );
        } else if (status === 411) {
          setErrorMessage("Please enter a valid email address and password.");
        } else if (msg) {
          setErrorMessage(msg);
        } else {
          setErrorMessage("Authentication failed. Please check your credentials.");
        }
      } else {
        setErrorMessage("Unable to connect to the server. Please verify your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-wide text-slate-100">
              Flow<span className="text-amber-400">ify</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-slate-400 text-sm">
            Sign in to access your automated workflows and flows
          </p>
        </div>

        {/* Gentle Notice / User Instruction */}
        {errorMessage && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-200 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <input
              type="email"
              name="username"
              placeholder="you@example.com"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors disabled:opacity-60 placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors disabled:opacity-60 placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-amber-400/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Signup Redirect Footer */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

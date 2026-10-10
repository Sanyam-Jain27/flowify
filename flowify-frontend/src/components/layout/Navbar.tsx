"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { Zap, Menu, X, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { BACKEND_URL } from "@/config";
const TOKEN_KEY = "token";

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  // Remembers which token we already fetched the name for, to avoid refetching on every route change
  const fetchedTokenRef = useRef<string | null>(null);

  // Re-check auth on first load AND on every route change
  // (this is what makes the navbar update right after login's router.push("/"))
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        fetchedTokenRef.current = null;
        setIsLoggedIn(false);
        setUserName("");
        setChecking(false);
        return;
      }

      // Same token as before and we already have the name: nothing to do
      if (fetchedTokenRef.current === token) {
        setIsLoggedIn(true);
        setChecking(false);
        return;
      }

      try {
        const res = await axios.get(`${BACKEND_URL}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        fetchedTokenRef.current = token;
        setUserName(res.data?.user?.name ?? "User");
        setIsLoggedIn(true);
      } catch (error) {
        if (cancelled) return;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status === 403 || status === 409) {
          // Token is invalid/expired: clear it
          localStorage.removeItem(TOKEN_KEY);
          fetchedTokenRef.current = null;
          setIsLoggedIn(false);
          setUserName("");
        } else {
          // Backend unreachable: keep the session, show a fallback name
          setIsLoggedIn(true);
          setUserName((prev) => prev || "User");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Keep other tabs in sync (login/logout in another tab)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY) return;
      if (!e.newValue) {
        fetchedTokenRef.current = null;
        setIsLoggedIn(false);
        setUserName("");
      } else {
        // Force a refetch with the new token
        fetchedTokenRef.current = null;
        router.refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    fetchedTokenRef.current = null;
    setIsLoggedIn(false);
    setUserName("");
    setMobileMenuOpen(false);
    router.push("/login");
  };

  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-wide text-slate-100">
            Flow<span className="text-amber-400">ify</span>
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors">
            About
          </Link>
          <Link href="/myflows" className="text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors">
            Your Flows
          </Link>
          <Link href="/createflows" className="text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors">
            Create Flow
          </Link>
        </nav>

        {/* Right: Auth Actions */}
        <div className="hidden md:flex items-center gap-3 min-h-[40px]">
          {checking ? null : isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-full">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                  {initial}
                </div>
                <span className="text-sm font-medium text-slate-200">{userName}</span>
              </div>
              <Button variant="outline" onClick={handleLogout} className="gap-2 text-xs py-2">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="gap-2 text-xs py-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" className="gap-2 text-xs py-2">
                  <UserPlus className="w-4 h-4" /> Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium">
            About
          </Link>
          <Link href="/myflows" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium">
            Your Flows
          </Link>
          <Link href="/createflows" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium">
            Create Flow
          </Link>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {checking ? null : isLoggedIn ? (
              <>
                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 py-2 px-3 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs">
                    {initial}
                  </div>
                  <span className="text-sm font-medium text-slate-200">{userName}</span>
                </div>
                <Button variant="outline" onClick={handleLogout} className="w-full justify-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">Sign In</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full justify-center">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "@/config";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    // check that the token is still valid
    axios
      .get(`${BACKEND_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setAllowed(true))
      .catch((error) => {
        const status = error?.response?.status;
        if (status === 403 || status === 409) {
          localStorage.removeItem("token");
        }
        router.replace("/login");
      });
  }, [router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-500">
        Checking login...
      </main>
    );
  }

  return <>{children}</>;
}
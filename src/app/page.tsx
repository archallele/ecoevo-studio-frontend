"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-right mb-12">
          <h1 className="font-mono text-4xl font-light text-gray-300 leading-tight tracking-tight">
            <span className="block">eco</span>
            <span className="block">evo</span>
            <span className="block">studio</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-gray-500 text-sm font-mono mb-10 text-right">
          An experimental platform for exploring
          <br />
          ecosystem services in the built environment.
        </p>

        {/* Auth */}
        <div className="flex justify-end">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-6 py-2.5 text-sm font-mono text-gray-600 border border-gray-300 rounded hover:border-gray-400 hover:text-gray-800 transition-colors">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <RedirectToDashboard />
          </SignedIn>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-gray-300 text-xs font-mono">
        work in progress
      </footer>
    </main>
  );
}

function RedirectToDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <p className="text-gray-400 text-sm font-mono">Redirecting...</p>
  );
}

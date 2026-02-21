"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

function AuthenticatedRedirect() {
  const router = useRouter();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    storeUser().then(() => {
      router.push("/chat");
    });
  }, [storeUser, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Setting up your account...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthLoading>

      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>

      <Unauthenticated>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
          <div className="w-full max-w-md mx-auto px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8 text-indigo-400"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                LiveChat
              </h1>
              <p className="text-slate-400 text-lg">
                Real-time messaging, beautifully simple.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Instant real-time messaging
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  Group conversations
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  Message reactions & more
                </div>
              </div>

              <div className="mt-8">
                <SignInButton mode="modal">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-base font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25">
                    Get Started
                  </Button>
                </SignInButton>
              </div>
            </div>

            <p className="text-center text-slate-500 text-xs mt-6">
              Sign up or log in to start chatting
            </p>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}

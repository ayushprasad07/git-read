"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">
        Welcome, {session?.user?.name}
      </h1>

      <p className="text-gray-600">
        Install the GitHub App to continue
      </p>

      {/* INSTALL GITHUB APP */}
      <a
        href="/api/install"
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Install GitHub App
      </a>

      <button
        onClick={() => signOut()}
        className="text-sm text-gray-500 underline"
      >
        Logout
      </button>
    </main>
  );
}

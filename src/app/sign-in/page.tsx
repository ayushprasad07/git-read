"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function SignIn() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <main className="h-screen flex items-center justify-center">
        <button
          onClick={() => signIn("github")}
          className="px-6 py-3 bg-black text-white rounded"
        >
          Login with GitHub
        </button>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col items-center justify-center gap-4">
      <p>Logged in as {session.user?.name}</p>
      <button
        onClick={() => signOut()}
        className="px-4 py-2 border rounded"
      >
        Logout
      </button>
    </main>
  );
}

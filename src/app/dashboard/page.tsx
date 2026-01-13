"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

type Repo = {
  _id: string;
  fullName: string;
  name: string;
  defaultBranch: string;
  private: boolean;
  autoSync: boolean;
  installation: string;
  githubRepoId: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  // 🔐 Handle redirect in effect (NOT inline)
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  // 📦 Fetch repos AFTER authentication
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchRepos() {
      try {
        const res = await fetch("/api/github/repos");
        if (res.ok) {
          const data = await res.json();
          console.log("Repo data : ",data);
          setRepos(data.repos || []);
        }
      } catch (err) {
        console.error("Failed to fetch repos");
      } finally {
        setLoadingRepos(false);
      }
    }

    fetchRepos();
  }, [status]);

  // ✅ Safe to return now
  if (status === "loading") {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-10">
      <h1 className="text-2xl font-bold">
        Welcome, {session?.user?.name}
      </h1>

      {loadingRepos ? (
        <p>Loading repositories...</p>
      ) : repos.length === 0 ? (
        <>
          <p className="text-gray-600">
            Install the GitHub App to continue
          </p>

          <a
            href="/api/install"
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Install GitHub App
          </a>
        </>
      ) : (
        <>
          <p className="text-gray-600">
            Select a repository to generate README
          </p>

          <div className="w-full max-w-xl space-y-3">
            {repos.map((repo) => (
              <button
                key={repo._id}
                onClick={() =>
                  router.push(
                    `/dashboard/repos/${repo._id}/readme`
                  )
                }
                className="w-full text-left px-4 py-3 border rounded hover:bg-gray-50"
              >
                {repo.fullName}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => signOut()}
        className="text-sm text-gray-500 underline mt-6"
      >
        Logout
      </button>
    </main>
  );
}

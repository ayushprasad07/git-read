"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { 
  Github,
  LogOut,
  Loader2,
  Package,
  ChevronRight,
  Grid3x3,
  RefreshCw,
  Check,
  Settings,
  FileText,
  Lock,
  LockOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAutoSync, setUpdatingAutoSync] = useState<Record<string, boolean>>({});

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
          // console.log("Repo data: ", data);
          setRepos(data.repos || []);
        } else {
          toast.error("Failed to fetch repositories");
        }
      } catch (err) {
        console.error("Failed to fetch repos");
        toast.error("Failed to fetch repositories");
      } finally {
        setLoadingRepos(false);
        setRefreshing(false);
      }
    }

    fetchRepos();
  }, [status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/github/repos");
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repos || []);
        toast.success("Repositories refreshed");
      } else {
        toast.error("Failed to refresh repositories");
      }
    } catch (err) {
      console.error("Failed to refresh repos");
      toast.error("Failed to refresh repositories");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAutoSyncToggle = async (repoId: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Optimistic update
    setRepos(prev => prev.map(repo => 
      repo._id === repoId ? { ...repo, autoSync: newValue } : repo
    ));
    
    setUpdatingAutoSync(prev => ({ ...prev, [repoId]: true }));
    
    try {
      const res = await fetch(`/api/github/repos/${repoId}/auto-sync`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoSync: newValue }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(
          newValue 
            ? 'Auto-sync enabled for repository' 
            : 'Auto-sync disabled for repository'
        );
      } else {
        // Revert optimistic update on failure
        setRepos(prev => prev.map(repo => 
          repo._id === repoId ? { ...repo, autoSync: currentValue } : repo
        ));
        toast.error(data.message || 'Failed to update auto-sync');
      }
    } catch (error) {
      console.error('Failed to update auto-sync:', error);
      // Revert optimistic update on error
      setRepos(prev => prev.map(repo => 
        repo._id === repoId ? { ...repo, autoSync: currentValue } : repo
      ));
      toast.error('Failed to update auto-sync');
    } finally {
      setUpdatingAutoSync(prev => ({ ...prev, [repoId]: false }));
    }
  };

  // ✅ Safe to return now
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 w-full">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Github className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, {session?.user?.name}
              </h1>
              <p className="text-gray-500 text-sm">
                Manage your GitHub repositories and generate README files
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Repositories</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loadingRepos ? "..." : repos.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Grid3x3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Public Repos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loadingRepos ? "..." : repos.filter(r => !r.private).length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Auto-sync Enabled</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loadingRepos ? "..." : repos.filter(r => r.autoSync).length}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Repositories</h2>
              <p className="text-gray-500 text-sm mt-1">
                Select a repository to generate or manage its README
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {loadingRepos ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-gray-900 mb-4" />
                  <p className="text-gray-500">Loading repositories...</p>
                </motion.div>
              ) : repos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Github className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No repositories found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Install the GitHub App to connect your repositories and start generating beautiful README files.
                  </p>
                  <a
                    href="/api/install"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <Github className="h-5 w-5" />
                    Install GitHub App
                  </a>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                >
                  {repos.map((repo, index) => (
                    <motion.div
                      key={repo._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex flex-col p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <button
                          onClick={() => router.push(`/dashboard/repos/${repo._id}/readme`)}
                          className="flex items-start gap-4 flex-1 text-left"
                        >
                          <div className={`p-2 rounded-lg ${repo.private ? 'bg-red-50' : 'bg-green-50'}`}>
                            {repo.private ? (
                              <Lock className="h-5 w-5 text-red-600" />
                            ) : (
                              <LockOpen className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">
                              {repo.fullName}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${repo.private ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {repo.private ? 'Private' : 'Public'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Branch: {repo.defaultBranch}
                              </span>
                            </div>
                          </div>
                        </button>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-transform mt-1" />
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {updatingAutoSync[repo._id] ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Updating...
                            </div>
                          ) : repo.autoSync ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              <RefreshCw className="h-3 w-3" />
                              Auto-sync enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                              <RefreshCw className="h-3 w-3" />
                              Auto-sync disabled
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`auto-sync-${repo._id}`} className="text-sm text-gray-600">
                            {updatingAutoSync[repo._id] ? "Updating..." : (repo.autoSync ? "On" : "Off")}
                          </Label>
                          <Switch
                            id={`auto-sync-${repo._id}`}
                            checked={repo.autoSync}
                            disabled={updatingAutoSync[repo._id]}
                            onCheckedChange={() => handleAutoSyncToggle(repo._id, repo.autoSync)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/repos/${repo._id}/readme`)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                        >
                          Manage README
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/repos/${repo._id}/settings`)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Auto-sync Explanation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">About Auto-sync</h3>
              <p className="text-blue-700 text-sm mb-3">
                When auto-sync is enabled, your README will be automatically updated whenever you:
              </p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  Push new code to the repository
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  Update package.json or other configuration files
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  Add new features or dependencies
                </li>
              </ul>
              <p className="text-blue-700 text-sm mt-3">
                Disable auto-sync if you prefer to manually update README files.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Need help? Visit our{" "}
            <a href="#" className="text-gray-600 hover:text-gray-900 underline">
              documentation
            </a>{" "}
            or{" "}
            <a href="#" className="text-gray-600 hover:text-gray-900 underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
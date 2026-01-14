"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Github, LogOut, Shield } from "lucide-react";
import Image from "next/image";

export default function SignIn() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <main className="h-screen flex items-center justify-center bg-background">
        {/* Glass morphism card */}
        <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-50 h-50 rounded-2xl overflow-hidden">
                <Image
                  src="/GitRead-Bot.png"
                  alt="GitRead Bot Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Welcome </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to continue to your account
              </p>
            </div>

            {/* GitHub Sign In Button */}
            <Button
              onClick={() => signIn("github")}
              className="w-full h-12 bg-gradient-to-r from-[#03045e] to-[#0077b6] hover:from-[#03045e] hover:to-[#0077b6] cursor-pointer text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/10"
            >
              <Github className="w-5 h-5 mr-2" />
              Continue with GitHub
            </Button>

            {/* Secure Authentication Banner */}
            <div className="relative flex items-center justify-center py-3 px-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm shadow-lg">
              <div className="absolute left-3">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-medium text-foreground/80 tracking-wide">
                Secure Authentication
              </span>
              <div className="absolute right-3 w-1 h-4 bg-gradient-to-b from-green-400 to-blue-400 rounded-full animate-pulse" />
            </div>

            {/* Footer text */}
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="h-screen flex items-center justify-center bg-background">
      {/* User card with glass morphism */}
      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <CardContent className="p-8 space-y-6">
          {/* User avatar placeholder */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {session.user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Welcome message */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
            <p className="text-foreground/80">{session.user?.name}</p>
            <p className="text-muted-foreground text-sm">{session.user?.email}</p>
          </div>

          {/* Logout button */}
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full h-12 bg-white/5 hover:bg-white/10 border border-border rounded-xl transition-all duration-300 transform hover:scale-105"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

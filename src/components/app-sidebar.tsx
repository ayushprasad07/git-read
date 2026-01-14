"use client";

import { Home, GitBranch, LogOut, User, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      {/* Header with GitRead-Bot Logo */}
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative w-15 h-15 rounded-xl overflow-hidden shadow-md border border-gray-200">
            <Image
              src="/GitRead-Bot.png"
              alt="GitRead-Bot"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              GitRead-Bot
            </h1>
            <p className="text-xs text-gray-500">Automated Repo Analysis</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        {/* User Profile Section */}
        {session?.user && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 shadow-sm">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "User"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <GitBranch className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900 truncate max-w-[160px]">
                  {session.user.name || "GitHub User"}
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{session.user.email}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <SidebarGroup className="p-4">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group transition-all duration-200 rounded-lg mb-1 ${
                        isActive
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <a 
                        href={item.url} 
                        className="flex items-center gap-3 px-3 py-5"
                      >
                        <div className={`p-2 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-900'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        
                        <span className={`font-medium transition-all duration-200 ${
                          isActive ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'
                        }`}>
                          {item.title}
                        </span>
                        
                        {isActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Sign Out */}
      <SidebarFooter className="p-4 border-t border-gray-100">
        {session?.user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">GitHub Account</p>
              </div>
            </div>
          </div>
        )}
        
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => signOut()}
            className="w-full group p-5 transition-all duration-200 bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer"
          >
            <div className="flex items-center justify-center gap-3 px-3 py-5">
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="font-medium text-white">
                Sign Out
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            GitRead-Bot v1.0 • {new Date().getFullYear()}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
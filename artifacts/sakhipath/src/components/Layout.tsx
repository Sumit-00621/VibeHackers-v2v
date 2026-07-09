import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { 
  Home, MessageSquare, FileText, BookOpen, GraduationCap, 
  Users, UserCircle, Settings as SettingsIcon, LogOut, Menu, X, Leaf
} from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut, currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'AI Mentor Chat', href: '/chat', icon: MessageSquare },
    { name: 'Resume Analyzer', href: '/resume', icon: FileText },
    { name: 'Learning Hub', href: '/learning', icon: BookOpen },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Mentors', href: '/mentors', icon: Users },
  ];

  const bottomNavigation = [
    { name: 'Profile', href: '/profile', icon: UserCircle },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl text-primary">SakhiPath</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md hover-elevate" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col md:pl-64 min-h-[100dvh] transition-all">
        <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1 rounded-md">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-lg text-primary">SakhiPath</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </header>
        
        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

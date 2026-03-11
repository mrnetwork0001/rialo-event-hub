import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Calendar,
  Send,
  Shield,
  Lightbulb,
  LogIn,
  LogOut,
  Menu,
  X,
  Radio,
  ExternalLink,
  Globe,
  Trophy,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    { icon: Lightbulb, label: "Suggestions", path: "/suggestions" },
    { icon: Send, label: "Submit Event", path: "/submit-event" },
    ...(user
      ? [{ icon: User, label: "My Profile", path: "/profile" }]
      : []),
    ...(isAdmin
      ? [{ icon: Shield, label: "Admin", path: "/admin" }]
      : []),
  ];

  const externalLinks = [
    { icon: Globe, label: "Rialo Discord", url: "https://discord.gg/rialoprotocol" },
    { icon: Globe, label: "Rialo Website", url: "https://rialo.io" },
  ];

  const NavContent = () => (
    <div className="flex h-full flex-col">

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.label}
              onClick={() => {
                navigate(link.path);
                setMobileOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <link.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </button>
          );
        })}
        {externalLinks.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <link.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </a>
        ))}
      </nav>

      {/* Auth */}
      <div className="border-t border-border/50 px-2 py-4">
        {user ? (
          <button
            onClick={() => {
              signOut();
              setMobileOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        ) : (
          <button
            onClick={() => {
              navigate("/auth");
              setMobileOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogIn className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Sign In</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-64 bg-card border-r border-border">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
};

export default Sidebar;

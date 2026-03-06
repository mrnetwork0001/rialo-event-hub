import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Calendar,
  Send,
  Shield,
  LogIn,
  LogOut,
  Menu,
  X,
  Radio,
  ExternalLink,
  Globe,
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
    { icon: Calendar, label: "Events", path: "/", active: true },
    { icon: Send, label: "Submit Event", path: "/submit-event" },
    ...(isAdmin
      ? [{ icon: Shield, label: "Admin", path: "/admin" }]
      : []),
  ];

  const externalLinks = [
    { icon: () => (
      <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/>
      </svg>
    ), label: "Rialo Discord", url: "https://discord.gg/rialoprotocol" },
    { icon: Globe, label: "Rialo Website", url: "https://rialo.io" },
  ];

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
          <Radio className="h-5 w-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold text-foreground truncate">
              Rialo Community
            </h1>
            <p className="text-[10px] text-muted-foreground">Event Hub</p>
          </div>
        )}
      </div>

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
      </nav>

      {/* External links */}
      <div className="border-t border-border/50 px-2 py-4 space-y-1">
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
      </div>

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
              // Sign in button visible but disabled
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/50 cursor-default transition-colors"
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

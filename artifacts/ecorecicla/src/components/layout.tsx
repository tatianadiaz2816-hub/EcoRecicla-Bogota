import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Recycle, 
  CalendarDays, 
  FileText, 
  BarChart3, 
  UserCircle, 
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/utils-eco";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
      { href: "/records", label: "Registros de Reciclaje", icon: FileText },
      { href: "/reports", label: "Reportes y Análisis", icon: BarChart3 },
    ]
  },
  {
    label: "Gestión",
    items: [
      { href: "/events", label: "Jornadas de Recolección", icon: CalendarDays },
      { href: "/users", label: "Usuarios", icon: Users },
      { href: "/complexes", label: "Conjuntos Residenciales", icon: Building2 },
      { href: "/materials", label: "Catálogo de Materiales", icon: Recycle },
    ]
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar_collapsed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("sidebar_collapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("eco_token");
        window.location.href = "/login";
      }
    });
  };

  const isActive = (href: string) =>
    location === href || (href !== "/dashboard" && location.startsWith(href + "/"));

  const SidebarNavItem = ({ item, collapsed: col }: { item: typeof NAV_SECTIONS[0]["items"][0], collapsed: boolean }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    if (col) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={item.href} className="block">
              <button
                className={cn(
                  "w-full flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-150",
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Link href={item.href} className="block" onClick={() => setMobileMenuOpen(false)}>
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
            active
              ? "bg-primary/20 text-primary border-l-2 border-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border-l-2 border-transparent"
          )}
        >
          <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-primary" : "")} />
          <span className="truncate">{item.label}</span>
          {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>
      </Link>
    );
  };

  const SidebarContent = ({ col = false }: { col?: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border h-16 shrink-0",
        col ? "justify-center px-3" : "px-5 gap-3"
      )}>
        {col ? (
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
        ) : (
          <>
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">EcoRecicla</p>
              <p className="text-xs text-sidebar-foreground/50 leading-tight">Bogotá</p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <div className={cn("flex-1 overflow-y-auto py-4 space-y-5", col ? "px-2" : "px-3")}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!col && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35 select-none">
                {section.label}
              </p>
            )}
            <div className={cn("space-y-0.5", col && "flex flex-col items-center gap-0.5")}>
              {section.items.map(item => (
                <SidebarNavItem key={item.href} item={item} collapsed={col} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: User + profile + logout */}
      <div className={cn("border-t border-sidebar-border py-3 shrink-0", col ? "px-2" : "px-3")}>
        {col ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/profile">
                  <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-sidebar-border hover:ring-primary transition-all">
                    <AvatarImage src={user?.photoUrl || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-xs opacity-70">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-sidebar-accent/60">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.photoUrl || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {user?.fullName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{user?.fullName}</p>
                <p className="text-[10px] text-sidebar-foreground/50">
                  {user?.role ? ROLE_LABELS[user.role] : ""}
                </p>
              </div>
            </div>
            <Link href="/profile" className="block" onClick={() => setMobileMenuOpen(false)}>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                <UserCircle className="w-4 h-4 shrink-0" /> Mi Perfil
              </button>
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
              <LogOut className="w-4 h-4 shrink-0" /> Cerrar sesión
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {col && (
        <div className="pb-3 flex justify-center shrink-0">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expandir menú</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 shrink-0 sidebar-transition overflow-hidden",
        collapsed ? "w-[60px]" : "w-60"
      )}>
        <SidebarContent col={collapsed} />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden h-14 border-b bg-sidebar flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">EcoRecicla Bogotá</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-sidebar-accent">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SidebarContent col={false} />
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="p-5 md:p-7 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

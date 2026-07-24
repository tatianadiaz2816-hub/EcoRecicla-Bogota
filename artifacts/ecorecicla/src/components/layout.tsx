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
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Panel de Control", icon: LayoutDashboard },
  { href: "/records", label: "Registros de Reciclaje", icon: FileText },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/events", label: "Jornadas de Recolección", icon: CalendarDays },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/complexes", label: "Conjuntos", icon: Building2 },
  { href: "/materials", label: "Materiales", icon: Recycle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("eco_token");
        window.location.href = "/login";
      }
    });
  };

  const NavLinks = () => (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = location === item.href || location.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="block w-full">
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${isActive ? "font-semibold" : "font-normal text-muted-foreground"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Barra lateral de escritorio */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Recycle className="w-6 h-6" />
            <span>EcoRecicla</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <NavLinks />
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar>
              <AvatarImage src={user?.photoUrl || ""} />
              <AvatarFallback>{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <Link href="/profile" className="block w-full mb-2">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
              <UserCircle className="w-5 h-5" />
              Perfil
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Barra superior móvil */}
        <header className="lg:hidden h-16 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Recycle className="w-5 h-5" />
            <span>EcoRecicla</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col p-0">
              <div className="h-16 flex items-center px-6 border-b">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                  <Recycle className="w-6 h-6" />
                  <span>EcoRecicla</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                <NavLinks />
              </div>
              <div className="p-4 border-t bg-card">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <Avatar>
                    <AvatarImage src={user?.photoUrl || ""} />
                    <AvatarFallback>{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
                <Link href="/profile" className="block w-full mb-2">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>
                    <UserCircle className="w-5 h-5" />
                    Perfil
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

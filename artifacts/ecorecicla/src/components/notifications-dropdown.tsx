import { useState } from "react";
import { useListEvents } from "@workspace/api-client-react";
import { Bell, CalendarDays, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", { weekday: "short", month: "short", day: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function NotificationsDropdown({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);

  // Fetch scheduled events (up to 50) to filter next-7-day ones client-side
  const { data } = useListEvents({ status: "scheduled", pageSize: 50, page: 1 });
  const allScheduled = data?.data || [];

  const upcoming = allScheduled.filter((e) => {
    const days = getDaysUntil(e.date);
    return days >= 0 && days <= 7;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const count = upcoming.length;

  const trigger = collapsed ? (
    <button
      className="relative p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  ) : (
    <button
      className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      aria-label="Notificaciones"
    >
      <Bell className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left">Notificaciones</span>
      {count > 0 && (
        <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none shrink-0">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={8}
        className="w-80 p-0 shadow-xl border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Notificaciones</span>
            {count > 0 && (
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-sm font-medium">Sin jornadas próximas</p>
              <p className="text-xs mt-0.5">No hay eventos en los próximos 7 días.</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcoming.map((event) => {
                const days = getDaysUntil(event.date);
                const urgency = days === 0 ? "text-red-600 bg-red-50" : days <= 2 ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50";
                return (
                  <div key={event.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", urgency)}>
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">{event.eventName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-muted-foreground">{formatDate(event.date)} · {event.hour}</span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", urgency)}>
                            {days === 0 ? "Hoy" : days === 1 ? "Mañana" : `En ${days} días`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Link href="/events" onClick={() => setOpen(false)}>
            <button className="w-full text-xs text-primary hover:underline font-medium py-1">
              Ver todas las jornadas →
            </button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

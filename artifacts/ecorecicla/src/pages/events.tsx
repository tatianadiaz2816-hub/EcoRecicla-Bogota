import { useState, useMemo } from "react";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useListComplexes, getListEventsQueryKey, Event, EventInput } from "@workspace/api-client-react";
import { STATUS_LABELS, formatDate } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreVertical, Pencil, Trash2, CalendarDays, Loader2, Clock, MapPin, Building2, User as UserIcon, ChevronLeft, ChevronRight, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, { cls: string; dot: string }> = {
  scheduled: { cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  completed: { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { cls: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-500" },
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-blue-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const eventSchema = z.object({
  eventName: z.string().min(3, "El nombre de la jornada es obligatorio"),
  complexId: z.coerce.number().min(1, "El conjunto es obligatorio"),
  date: z.string().min(1, "La fecha es obligatoria"),
  hour: z.string().min(1, "La hora es obligatoria"),
  responsiblePerson: z.string().min(2, "La persona responsable es obligatoria"),
  location: z.string().min(2, "El lugar es obligatorio"),
  description: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

// ─────────────────────────────────────────────────────────
// Calendar view
// ─────────────────────────────────────────────────────────
function CalendarView({ events, onEdit, onDelete }: { events: Event[]; onEdit: (e: Event) => void; onDelete: (id: number) => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Map events by date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const e of events) {
      const d = e.date.split("T")[0];
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [events]);

  const todayStr = today.toISOString().split("T")[0];

  const selectedEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  const pad = (n: number) => String(n).padStart(2, "0");

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5">
      {/* Calendar grid */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-1">{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={cn(
                    "relative flex flex-col items-center rounded-lg py-1.5 px-1 min-h-[52px] transition-colors text-sm font-medium",
                    isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground",
                  )}
                >
                  <span className={cn("text-sm leading-none", isToday && !isSelected && "font-bold")}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-primary-foreground/70" : STATUS_DOT[ev.status] || "bg-gray-400")}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className={cn("text-[9px] leading-none", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t justify-center">
            {Object.entries(STATUS_STYLE).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", STATUS_DOT[key])} />
                {STATUS_LABELS[key]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      <div>
        {selectedDay ? (
          <Card className="shadow-sm">
            <CardHeader className="pb-2 px-4 pt-4 border-b">
              <p className="text-sm font-semibold text-foreground">
                {new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date(selectedDay + "T12:00:00"))}
              </p>
              <p className="text-xs text-muted-foreground">{selectedEvents.length} jornada{selectedEvents.length !== 1 ? "s" : ""}</p>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sin jornadas este día.</p>
              ) : selectedEvents.map((ev) => {
                const st = STATUS_STYLE[ev.status] || { cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
                return (
                  <div key={ev.id} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{ev.eventName}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 shrink-0"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => onEdit(ev)} className="gap-2 text-xs"><Pencil className="w-3.5 h-3.5" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive gap-2 text-xs" onClick={() => onDelete(ev.id)}><Trash2 className="w-3.5 h-3.5" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", st.cls)}>
                      <span className={cn("w-1 h-1 rounded-full", st.dot)} />
                      {STATUS_LABELS[ev.status] || ev.status}
                    </span>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{ev.hour}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{ev.location}</p>
                      {ev.complexName && <p className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{ev.complexName}</p>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
              <CalendarDays className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">Seleccione un día</p>
              <p className="text-xs text-center">Haga clic en cualquier fecha del calendario para ver sus jornadas.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function Events() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [complexFilter, setComplexFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: complexesData } = useListComplexes({ pageSize: 100 });
  const complexes = complexesData?.data || [];

  const { data, isLoading } = useListEvents({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    complexId: complexFilter !== "all" ? parseInt(complexFilter) : undefined,
    page, pageSize
  });
  const events = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // For calendar: fetch all events (no pagination) with current filters
  const { data: allEventsData } = useListEvents({
    status: statusFilter !== "all" ? statusFilter : undefined,
    complexId: complexFilter !== "all" ? parseInt(complexFilter) : undefined,
    pageSize: 200, page: 1
  });
  const allEvents = allEventsData?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { eventName: "", complexId: 0, date: new Date().toISOString().split("T")[0], hour: "09:00", responsiblePerson: "", location: "", description: "", status: "scheduled" }
  });

  const openCreate = () => {
    setEditingEvent(null);
    form.reset({ eventName: "", complexId: 0, date: new Date().toISOString().split("T")[0], hour: "09:00", responsiblePerson: "", location: "", description: "", status: "scheduled" });
    setIsModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({ eventName: event.eventName, complexId: event.complexId, date: event.date.split("T")[0], hour: event.hour, responsiblePerson: event.responsiblePerson, location: event.location, description: event.description || "", status: event.status as any });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    const payload: any = { ...values };
    if (!payload.description) delete payload.description;
    payload.date = new Date(values.date).toISOString();

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: payload }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); setIsModalOpen(false); toast({ title: "Jornada actualizada exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    } else {
      createEvent.mutate({ data: payload as EventInput }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); setIsModalOpen(false); toast({ title: "Jornada programada exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteEvent.mutate({ id: deleteId }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); setDeleteId(null); toast({ title: "Jornada eliminada" }); },
      onError: (err: any) => { toast({ variant: "destructive", title: "Error", description: err.message }); setDeleteId(null); }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jornadas de Recolección</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Programe y haga seguimiento a las jornadas de reciclaje por conjunto.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Programar Jornada</Button>
      </div>

      <Tabs defaultValue="lista">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2"><List className="w-4 h-4" /> Lista</TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2"><Grid3X3 className="w-4 h-4" /> Calendario</TabsTrigger>
          </TabsList>

          {/* Shared filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar jornadas..." className="pl-9 h-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={complexFilter} onValueChange={(v) => { setComplexFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[170px] h-9"><SelectValue placeholder="Todos los conjuntos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los conjuntos</SelectItem>
                {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[145px] h-9"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="scheduled">Programada</SelectItem>
                <SelectItem value="completed">Completada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            {total > 0 && <span className="text-xs text-muted-foreground shrink-0">{total} jornada{total !== 1 ? "s" : ""}</span>}
          </div>
        </div>

        {/* LIST TAB */}
        <TabsContent value="lista">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Jornada</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Cuándo</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Lugar</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Responsable</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Estado</TableHead>
                    <TableHead className="pr-5 text-right font-semibold text-xs uppercase tracking-wide">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-5"><Skeleton className="h-6 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                        <TableCell className="pr-5 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <CalendarDays className="w-10 h-10 opacity-20" />
                          <p className="font-medium text-sm">No se encontraron jornadas</p>
                          <p className="text-xs">Ajuste los filtros o programe una nueva jornada.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : events.map((event) => {
                    const st = STATUS_STYLE[event.status] || { cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
                    return (
                      <TableRow key={event.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{event.eventName}</p>
                              {event.description && <p className="text-xs text-muted-foreground line-clamp-1 max-w-[220px] mt-0.5">{event.description}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm font-medium flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary" />{formatDate(event.date)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><Clock className="w-3.5 h-3.5" />{event.hour}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{event.complexName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5" />{event.location}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-sm flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-muted-foreground" />{event.responsiblePerson}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", st.cls)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                            {STATUS_LABELS[event.status] || event.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 pr-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEdit(event)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => setDeleteId(event.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
                  <p className="text-xs text-muted-foreground">Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                      return <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>;
                    })}
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CALENDAR TAB */}
        <TabsContent value="calendario">
          <CalendarView events={allEvents} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Editar Jornada" : "Programar Jornada"}</DialogTitle>
            <DialogDescription>{editingEvent ? "Actualice los detalles de la jornada de recolección." : "Cree una nueva jornada de reciclaje para un conjunto residencial."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="eventName" render={({ field }) => (
                <FormItem><FormLabel>Nombre de la jornada <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Jornada de Reciclaje de Vidrio — Torres del Norte" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="complexId" render={({ field }) => (
                  <FormItem><FormLabel>Conjunto residencial <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent>{complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Programada</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel>Fecha <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="hour" render={({ field }) => (
                  <FormItem><FormLabel>Hora <span className="text-destructive">*</span></FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>Lugar específico <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Lobby principal, Sótano P-1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="responsiblePerson" render={({ field }) => (
                  <FormItem><FormLabel>Persona responsable <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Carlos Rodríguez" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Notas adicionales</FormLabel>
                  <FormControl><Textarea placeholder="Instrucciones especiales, materiales aceptados, requisitos..." className="resize-none h-20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending} className="gap-2">
                  {(createEvent.isPending || updateEvent.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? "Guardar cambios" : "Programar jornada"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jornada?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Considere cambiar el estado a "Cancelada" en lugar de eliminar permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar jornada</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteEvent.isPending}>
              {deleteEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

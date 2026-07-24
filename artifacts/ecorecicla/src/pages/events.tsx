import { useState } from "react";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, useListComplexes, getListEventsQueryKey, Event, EventInput } from "@workspace/api-client-react";
import { STATUS_LABELS, formatDate } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreVertical, Pencil, Trash2, CalendarDays, Loader2, Clock, MapPin, Building2, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, { cls: string; dot: string }> = {
  scheduled: { cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  completed: { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { cls: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-500" },
};

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

      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar jornadas..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <Select value={complexFilter} onValueChange={(v) => { setComplexFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Todos los conjuntos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conjuntos</SelectItem>
                  {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
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
        </CardHeader>
        <CardContent className="p-0 mt-3">
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

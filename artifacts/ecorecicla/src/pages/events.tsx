import { useState } from "react";
import { 
  useListEvents, 
  useCreateEvent, 
  useUpdateEvent, 
  useDeleteEvent,
  useListComplexes,
  getListEventsQueryKey,
  Event,
  EventInput
} from "@workspace/api-client-react";
import { STATUS_LABELS, formatDate } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { 
  Search, 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CalendarDays,
  Loader2,
  Clock,
  MapPin,
  Building2,
  User as UserIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
    page,
    pageSize
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
    defaultValues: {
      eventName: "",
      complexId: 0,
      date: new Date().toISOString().split('T')[0],
      hour: "09:00",
      responsiblePerson: "",
      location: "",
      description: "",
      status: "scheduled",
    }
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    form.reset({
      eventName: "",
      complexId: 0,
      date: new Date().toISOString().split('T')[0],
      hour: "09:00",
      responsiblePerson: "",
      location: "",
      description: "",
      status: "scheduled",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      eventName: event.eventName,
      complexId: event.complexId,
      date: event.date.split('T')[0],
      hour: event.hour,
      responsiblePerson: event.responsiblePerson,
      location: event.location,
      description: event.description || "",
      status: event.status as any,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    const payload: any = { ...values };
    if (!payload.description) delete payload.description;
    payload.date = new Date(values.date).toISOString();

    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Jornada actualizada exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al actualizar la jornada", description: err.message });
        }
      });
    } else {
      createEvent.mutate({ data: payload as EventInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Jornada creada exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al crear la jornada", description: err.message });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteEvent.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        setDeleteId(null);
        toast({ title: "Jornada eliminada exitosamente" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al eliminar la jornada", description: err.message });
        setDeleteId(null);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20">{STATUS_LABELS[status]}</Badge>;
      case "completed": return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20">{STATUS_LABELS[status]}</Badge>;
      case "cancelled": return <Badge variant="destructive">{STATUS_LABELS[status]}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Jornadas de Recolección</h1>
          <p className="text-muted-foreground mt-1">Programe y haga seguimiento a las jornadas de reciclaje.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Programar Jornada
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar jornadas..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={complexFilter} onValueChange={(v) => { setComplexFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todos los conjuntos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conjuntos</SelectItem>
                  {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Nombre de la Jornada</TableHead>
                <TableHead>Cuándo</TableHead>
                <TableHead>Dónde</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-6 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No se encontraron jornadas con los criterios indicados.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="group">
                    <TableCell className="pl-6">
                      <p className="font-medium text-foreground">{event.eventName}</p>
                      {event.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1 max-w-[250px]">{event.description}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 text-primary" />
                          {formatDate(event.date)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {event.hour}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1.5 text-foreground">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {event.complexName}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {event.responsiblePerson}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(event.status)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="sr-only">Abrir menú</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditModal(event)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar jornada
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(event.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Mostrando {Math.min((page - 1) * pageSize + 1, total)} a {Math.min(page * pageSize, total)} de {total} resultados
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Editar Jornada' : 'Programar Jornada'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Actualice los detalles de la jornada de recolección.' : 'Cree una nueva jornada de recolección de materiales para un conjunto.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="eventName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la jornada</FormLabel>
                  <FormControl><Input placeholder="ej. Jornada de Recolección de Vidrio" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="complexId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conjunto residencial</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar conjunto" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Programada</SelectItem>
                        <SelectItem value="completed">Completada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hour" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lugar específico</FormLabel>
                    <FormControl><Input placeholder="ej. Vestíbulo principal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="responsiblePerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona responsable</FormLabel>
                    <FormControl><Input placeholder="ej. Carlos Gómez" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Información adicional..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                  {createEvent.isPending || updateEvent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingEvent ? 'Guardar cambios' : 'Programar jornada'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jornada?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro? Esta acción no se puede deshacer. Puede considerar cancelar la jornada en lugar de eliminarla definitivamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conservar jornada</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteEvent.isPending}>
              {deleteEvent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

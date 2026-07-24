import { useState } from "react";
import { useListComplexes, useCreateComplex, useUpdateComplex, useDeleteComplex, getListComplexesQueryKey, Complex, ComplexInput } from "@workspace/api-client-react";
import { STATUS_LABELS } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreVertical, Pencil, Trash2, Building2, Loader2, MapPin, Phone, Mail, User as UserIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

const complexSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio"),
  address: z.string().min(5, "La dirección es obligatoria"),
  neighborhood: z.string().min(2, "El barrio es obligatorio"),
  administrator: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export default function Complexes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListComplexes({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined, page, pageSize });
  const complexes = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComplex, setEditingComplex] = useState<Complex | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createComplex = useCreateComplex();
  const updateComplex = useUpdateComplex();
  const deleteComplex = useDeleteComplex();

  const form = useForm<z.infer<typeof complexSchema>>({
    resolver: zodResolver(complexSchema),
    defaultValues: { name: "", address: "", neighborhood: "", administrator: "", phone: "", email: "", status: "active" }
  });

  const openCreate = () => {
    setEditingComplex(null);
    form.reset({ name: "", address: "", neighborhood: "", administrator: "", phone: "", email: "", status: "active" });
    setIsModalOpen(true);
  };

  const openEdit = (complex: Complex) => {
    setEditingComplex(complex);
    form.reset({ name: complex.name, address: complex.address, neighborhood: complex.neighborhood, administrator: complex.administrator || "", phone: complex.phone || "", email: complex.email || "", status: complex.status as any });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof complexSchema>) => {
    const payload: any = { ...values };
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.administrator) delete payload.administrator;

    if (editingComplex) {
      updateComplex.mutate({ id: editingComplex.id, data: payload }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() }); setIsModalOpen(false); toast({ title: "Conjunto actualizado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    } else {
      createComplex.mutate({ data: payload as ComplexInput }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() }); setIsModalOpen(false); toast({ title: "Conjunto creado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteComplex.mutate({ id: deleteId }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() }); setDeleteId(null); toast({ title: "Conjunto eliminado" }); },
      onError: (err: any) => { toast({ variant: "destructive", title: "Error", description: err.message }); setDeleteId(null); }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conjuntos Residenciales</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestione los edificios participantes en el programa de reciclaje.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Agregar Conjunto</Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, barrio..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              {total > 0 && <span className="text-xs text-muted-foreground shrink-0">{total} resultado{total !== 1 ? "s" : ""}</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Conjunto</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Ubicación</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Administración</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Estado</TableHead>
                <TableHead className="pr-5 text-right font-semibold text-xs uppercase tracking-wide">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5"><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[70px] rounded-full" /></TableCell>
                    <TableCell className="pr-5 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : complexes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="w-10 h-10 opacity-20" />
                      <p className="font-medium text-sm">No se encontraron conjuntos</p>
                      <p className="text-xs">Ajuste los filtros o registre un nuevo conjunto.</p>
                      {search && <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Limpiar filtros</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : complexes.map((complex) => (
                <TableRow key={complex.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{complex.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">CMP-{complex.id.toString().padStart(4, "0")}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />{complex.address}</p>
                    <p className="text-xs text-muted-foreground pl-5">{complex.neighborhood}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    {complex.administrator || complex.phone || complex.email ? (
                      <div className="space-y-1">
                        {complex.administrator && <p className="text-sm font-medium flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-muted-foreground" />{complex.administrator}</p>}
                        <div className="text-xs text-muted-foreground space-y-0.5 pl-5">
                          {complex.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{complex.phone}</p>}
                          {complex.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{complex.email}</p>}
                        </div>
                      </div>
                    ) : <span className="text-xs text-muted-foreground italic">Sin información</span>}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_STYLE[complex.status] || "bg-gray-100 text-gray-600")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", complex.status === "active" ? "bg-emerald-500" : "bg-gray-400")} />
                      {STATUS_LABELS[complex.status] || complex.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(complex)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => setDeleteId(complex.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
            <DialogTitle>{editingComplex ? "Editar Conjunto" : "Agregar Conjunto"}</DialogTitle>
            <DialogDescription>{editingComplex ? "Actualice la información de este conjunto residencial." : "Registre un nuevo conjunto en el programa de reciclaje."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nombre del conjunto <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Conjunto Residencial Los Pinos" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Dirección <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Cra 15 # 100-25" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="neighborhood" render={({ field }) => (
                  <FormItem><FormLabel>Barrio <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Chapinero" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="bg-muted/40 border rounded-lg p-4 space-y-4">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2"><UserIcon className="w-4 h-4 text-muted-foreground" /> Contacto de Administración <span className="text-xs font-normal text-muted-foreground">(opcional)</span></p>
                <FormField control={form.control} name="administrator" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del administrador</FormLabel><FormControl><Input placeholder="ej. María González López" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="300 123 4567" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Correo electrónico</FormLabel><FormControl><Input type="email" placeholder="admin@conjunto.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Estado <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createComplex.isPending || updateComplex.isPending} className="gap-2">
                  {(createComplex.isPending || updateComplex.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingComplex ? "Guardar cambios" : "Agregar conjunto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conjunto?</AlertDialogTitle>
            <AlertDialogDescription>Los usuarios y registros asociados no se eliminarán, pero podría afectar los datos históricos. Considere cambiar el estado a Inactivo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteComplex.isPending}>
              {deleteComplex.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

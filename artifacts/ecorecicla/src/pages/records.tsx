import { useState } from "react";
import { useListRecords, useCreateRecord, useUpdateRecord, useDeleteRecord, useListComplexes, useListMaterials, useListUsers, getListRecordsQueryKey, RecyclingRecord, RecordInput } from "@workspace/api-client-react";
import { formatWeight, formatDate } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, MoreVertical, Pencil, Trash2, FileText, Loader2, Calendar, Building2, User as UserIcon, Recycle, FilterX, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const recordSchema = z.object({
  residentId: z.coerce.number().min(1, "El residente es obligatorio"),
  complexId: z.coerce.number().min(1, "El conjunto es obligatorio"),
  materialId: z.coerce.number().min(1, "El material es obligatorio"),
  weightKg: z.coerce.number().positive("El peso debe ser mayor a 0"),
  date: z.string().min(1, "La fecha es obligatoria"),
  observation: z.string().optional(),
});

export default function Records() {
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [complexFilter, setComplexFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: complexesData } = useListComplexes({ pageSize: 100 });
  const complexes = complexesData?.data || [];

  const { data: materialsData } = useListMaterials({ pageSize: 100 });
  const materials = materialsData?.data || [];

  const { data: residentsData } = useListUsers({ role: "resident", pageSize: 500 });
  const residents = residentsData?.data || [];

  const { data, isLoading } = useListRecords({
    materialId: materialFilter !== "all" ? parseInt(materialFilter) : undefined,
    complexId: complexFilter !== "all" ? parseInt(complexFilter) : undefined,
    page, pageSize
  });
  const records = data?.data || [];
  const total = data?.total || 0;
  const totalKg = data?.totalKg || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecyclingRecord | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

  const form = useForm<z.infer<typeof recordSchema>>({
    resolver: zodResolver(recordSchema),
    defaultValues: { residentId: 0, complexId: 0, materialId: 0, weightKg: 0, date: new Date().toISOString().split("T")[0], observation: "" }
  });

  const openCreate = () => {
    setEditingRecord(null);
    form.reset({ residentId: 0, complexId: 0, materialId: 0, weightKg: 0, date: new Date().toISOString().split("T")[0], observation: "" });
    setIsModalOpen(true);
  };

  const openEdit = (record: RecyclingRecord) => {
    setEditingRecord(record);
    form.reset({ residentId: record.residentId, complexId: record.complexId, materialId: record.materialId, weightKg: record.weightKg, date: record.date.split("T")[0], observation: record.observation || "" });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof recordSchema>) => {
    const payload: any = { ...values };
    if (!payload.observation) delete payload.observation;
    payload.date = new Date(values.date).toISOString();
    if (editingRecord) {
      updateRecord.mutate({ id: editingRecord.id, data: payload }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() }); setIsModalOpen(false); toast({ title: "Registro actualizado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    } else {
      createRecord.mutate({ data: payload as RecordInput }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() }); setIsModalOpen(false); toast({ title: "Registro creado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteRecord.mutate({ id: deleteId }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() }); setDeleteId(null); toast({ title: "Registro eliminado" }); },
      onError: (err: any) => { toast({ variant: "destructive", title: "Error", description: err.message }); setDeleteId(null); }
    });
  };

  const hasFilters = materialFilter !== "all" || complexFilter !== "all";

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registros de Reciclaje</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registre y monitoree las entregas de materiales por residente.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Registrar Reciclaje</Button>
      </div>

      {/* Stats + Filters Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 border-0 text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-100 mb-1">Peso Total Filtrado</p>
                {isLoading ? <Skeleton className="h-8 w-24 bg-white/20" /> : <h2 className="text-3xl font-bold">{formatWeight(totalKg)}</h2>}
                <p className="text-xs text-emerald-200 mt-1">{total} registro{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
                <Scale className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Filtrar registros</p>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-1 w-full">
                <label className="text-xs text-muted-foreground">Por conjunto</label>
                <Select value={complexFilter} onValueChange={(v) => { setComplexFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Todos los conjuntos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los conjuntos</SelectItem>
                    {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-full">
                <label className="text-xs text-muted-foreground">Por material</label>
                <Select value={materialFilter} onValueChange={(v) => { setMaterialFilter(v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Todos los materiales" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los materiales</SelectItem>
                    {materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="outline" className="shrink-0 gap-2 text-muted-foreground" onClick={() => { setMaterialFilter("all"); setComplexFilter("all"); setPage(1); }}>
                  <FilterX className="h-4 w-4" /> Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Fecha</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Residente</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Conjunto</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Material</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Peso</TableHead>
                <TableHead className="pr-5 text-right font-semibold text-xs uppercase tracking-wide">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5"><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-[70px] ml-auto" /></TableCell>
                    <TableCell className="pr-5 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="w-10 h-10 opacity-20" />
                      <p className="font-medium text-sm">No se encontraron registros</p>
                      <p className="text-xs">{hasFilters ? "Ajuste los filtros para ver más resultados." : "Comience registrando la primera entrega de reciclaje."}</p>
                      {hasFilters && <Button variant="outline" size="sm" onClick={() => { setMaterialFilter("all"); setComplexFilter("all"); }}>Limpiar filtros</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.map((record) => (
                <TableRow key={record.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-5 py-3">
                    <span className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {formatDate(record.date)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {record.residentName}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      {record.complexName}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Recycle className="w-3.5 h-3.5 text-primary shrink-0" />
                      {record.materialName}
                    </span>
                    {record.observation && <p className="text-xs text-muted-foreground max-w-[180px] truncate mt-0.5 pl-5">{record.observation}</p>}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      <Scale className="w-3 h-3" />
                      {formatWeight(record.weightKg)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel className="text-xs">Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(record)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => setDeleteId(record.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total} registros</p>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Editar Registro" : "Registrar Reciclaje"}</DialogTitle>
            <DialogDescription>Complete los datos de la entrega de material reciclable.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="complexId" render={({ field }) => (
                  <FormItem><FormLabel>Conjunto <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent>{complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="residentId" render={({ field }) => {
                  const complexId = form.watch("complexId");
                  const filtered = residents.filter(r => !complexId || r.complexId === complexId);
                  return (
                    <FormItem><FormLabel>Residente <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined} disabled={!complexId}>
                        <FormControl><SelectTrigger><SelectValue placeholder={complexId ? "Seleccionar..." : "Primero el conjunto"} /></SelectTrigger></FormControl>
                        <SelectContent>{filtered.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.fullName}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  );
                }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="materialId" render={({ field }) => (
                  <FormItem><FormLabel>Material <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger></FormControl>
                      <SelectContent>{materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weightKg" render={({ field }) => (
                  <FormItem><FormLabel>Peso (kg) <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem><FormLabel>Fecha de entrega <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="observation" render={({ field }) => (
                <FormItem><FormLabel>Observaciones</FormLabel>
                  <FormControl><Textarea placeholder="Estado del material, observaciones de contaminación, etc." className="resize-none h-20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending} className="gap-2">
                  {(createRecord.isPending || updateRecord.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRecord ? "Guardar cambios" : "Registrar entrega"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>El peso registrado se eliminará permanentemente de las métricas del sistema. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteRecord.isPending}>
              {deleteRecord.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

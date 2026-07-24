import { useState } from "react";
import { 
  useListRecords, 
  useCreateRecord, 
  useUpdateRecord, 
  useDeleteRecord,
  useListComplexes,
  useListMaterials,
  useListUsers,
  getListRecordsQueryKey,
  RecyclingRecord,
  RecordInput
} from "@workspace/api-client-react";
import { formatWeight, formatDate } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  FileText,
  Loader2,
  Calendar,
  Building2,
  User as UserIcon,
  Recycle,
  FilterX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    page,
    pageSize
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
    defaultValues: {
      residentId: 0,
      complexId: 0,
      materialId: 0,
      weightKg: 0,
      date: new Date().toISOString().split('T')[0],
      observation: "",
    }
  });

  const openCreateModal = () => {
    setEditingRecord(null);
    form.reset({
      residentId: 0,
      complexId: 0,
      materialId: 0,
      weightKg: 0,
      date: new Date().toISOString().split('T')[0],
      observation: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: RecyclingRecord) => {
    setEditingRecord(record);
    form.reset({
      residentId: record.residentId,
      complexId: record.complexId,
      materialId: record.materialId,
      weightKg: record.weightKg,
      date: record.date.split('T')[0],
      observation: record.observation || "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof recordSchema>) => {
    const payload: any = { ...values };
    if (!payload.observation) delete payload.observation;
    payload.date = new Date(values.date).toISOString();

    if (editingRecord) {
      updateRecord.mutate({ id: editingRecord.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Registro actualizado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al actualizar el registro", description: err.message });
        }
      });
    } else {
      createRecord.mutate({ data: payload as RecordInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Registro creado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al crear el registro", description: err.message });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteRecord.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecordsQueryKey() });
        setDeleteId(null);
        toast({ title: "Registro eliminado exitosamente" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al eliminar el registro", description: err.message });
        setDeleteId(null);
      }
    });
  };

  const clearFilters = () => {
    setMaterialFilter("all");
    setComplexFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Registros de Reciclaje</h1>
          <p className="text-muted-foreground mt-1">Registre y monitoree el peso de los materiales.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Registrar Reciclaje
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm md:col-span-1 bg-primary text-primary-foreground border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-foreground/80 mb-1">Peso Total Filtrado</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 bg-primary-foreground/20" />
                ) : (
                  <h2 className="text-3xl font-bold">{formatWeight(totalKg)}</h2>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                <Recycle className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-1 w-full">
                <label className="text-xs font-medium text-muted-foreground">Filtrar por conjunto</label>
                <Select value={complexFilter} onValueChange={(v) => { setComplexFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los conjuntos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los conjuntos</SelectItem>
                    {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 w-full">
                <label className="text-xs font-medium text-muted-foreground">Filtrar por material</label>
                <Select value={materialFilter} onValueChange={(v) => { setMaterialFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los materiales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los materiales</SelectItem>
                    {materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(materialFilter !== "all" || complexFilter !== "all") && (
                <Button variant="ghost" className="shrink-0 text-muted-foreground" onClick={clearFilters}>
                  <FilterX className="h-4 w-4 mr-2" /> Limpiar
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
              <TableRow>
                <TableHead className="pl-6">Fecha</TableHead>
                <TableHead>Residente</TableHead>
                <TableHead>Conjunto</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Peso (kg)</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-[60px] ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No se encontraron registros de reciclaje.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} className="group">
                    <TableCell className="pl-6">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(record.date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        {record.residentName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        {record.complexName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Recycle className="w-3.5 h-3.5 text-primary" />
                        {record.materialName}
                      </span>
                      {record.observation && (
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate mt-0.5">{record.observation}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatWeight(record.weightKg)}
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
                          <DropdownMenuItem onClick={() => openEditModal(record)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar registro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(record.id)}>
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
                Mostrando {Math.min((page - 1) * pageSize + 1, total)} a {Math.min(page * pageSize, total)} de {total} registros
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Editar Registro' : 'Registrar Reciclaje'}</DialogTitle>
            <DialogDescription>
              Registre el peso de los materiales entregados por un residente.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="complexId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conjunto</FormLabel>
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
                <FormField control={form.control} name="residentId" render={({ field }) => {
                  const complexId = form.watch("complexId");
                  const filteredResidents = residents.filter(r => !complexId || r.complexId === complexId);
                  
                  return (
                    <FormItem>
                      <FormLabel>Residente</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined} disabled={!complexId}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar residente" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredResidents.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.fullName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="materialId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccionar material" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weightKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Estado del material, contaminación detectada, etc." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending}>
                  {createRecord.isPending || updateRecord.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingRecord ? 'Guardar cambios' : 'Registrar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este registro? Se eliminará permanentemente el peso registrado de las métricas totales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteRecord.isPending}>
              {deleteRecord.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

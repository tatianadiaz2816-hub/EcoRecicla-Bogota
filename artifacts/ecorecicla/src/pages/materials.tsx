import { useState } from "react";
import { useListMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, getListMaterialsQueryKey, Material, MaterialInput } from "@workspace/api-client-react";
import { BIN_COLORS } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreVertical, Pencil, Trash2, Recycle, Loader2, Info, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const materialSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().min(5, "La descripción es obligatoria"),
  recyclingInstructions: z.string().min(5, "Las instrucciones son obligatorias"),
  binColor: z.string().min(1, "El color del contenedor es obligatorio"),
});

const AVAILABLE_COLORS = [
  { id: "blue", name: "Azul — Plásticos" },
  { id: "green", name: "Verde — Vidrio / Orgánicos" },
  { id: "yellow", name: "Amarillo — Metales / Latas" },
  { id: "gray", name: "Gris — Papel / Cartón" },
  { id: "red", name: "Rojo — Peligrosos" },
  { id: "white", name: "Blanco — Vidrio limpio" },
  { id: "brown", name: "Café — Madera" },
  { id: "orange", name: "Naranja — Electrónicos" }
];

const BIN_HEX: Record<string, string> = {
  blue: "#3b82f6", green: "#16a34a", yellow: "#ca8a04", red: "#ef4444",
  gray: "#6b7280", brown: "#92400e", white: "#94a3b8", orange: "#f97316"
};

const BIN_COLOR_LABELS: Record<string, string> = {
  blue: "Azul", green: "Verde", yellow: "Amarillo", gray: "Gris",
  red: "Rojo", white: "Blanco", brown: "Café", orange: "Naranja"
};

export default function Materials() {
  const [search, setSearch] = useState("");
  const [binColorFilter, setBinColorFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListMaterials({ search: search || undefined, page, pageSize });
  const allMaterials = data?.data || [];
  const materials = binColorFilter ? allMaterials.filter(m => m.binColor === binColorFilter) : allMaterials;
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const form = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: { name: "", description: "", recyclingInstructions: "", binColor: "gray" }
  });

  const openCreate = () => {
    setEditingMaterial(null);
    form.reset({ name: "", description: "", recyclingInstructions: "", binColor: "gray" });
    setIsModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditingMaterial(material);
    form.reset({ name: material.name, description: material.description, recyclingInstructions: material.recyclingInstructions, binColor: material.binColor });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof materialSchema>) => {
    if (editingMaterial) {
      updateMaterial.mutate({ id: editingMaterial.id, data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() }); setIsModalOpen(false); toast({ title: "Material actualizado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    } else {
      createMaterial.mutate({ data: values as MaterialInput }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() }); setIsModalOpen(false); toast({ title: "Material creado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMaterial.mutate({ id: deleteId }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() }); setDeleteId(null); toast({ title: "Material eliminado" }); },
      onError: (err: any) => { toast({ variant: "destructive", title: "Error", description: err.message }); setDeleteId(null); }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de Materiales</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure las categorías de reciclaje e instrucciones para los residentes.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm"><Plus className="w-4 h-4" /> Agregar Material</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar materiales..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={binColorFilter || "all"} onValueChange={(v) => { setBinColorFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los contenedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los contenedores</SelectItem>
            {AVAILABLE_COLORS.map(c => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: BIN_HEX[c.id] }} />
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || binColorFilter) && (
          <Button variant="ghost" size="sm" className="text-muted-foreground h-9" onClick={() => { setSearch(""); setBinColorFilter(""); setPage(1); }}>
            Limpiar
          </Button>
        )}
        {total > 0 && <span className="text-xs text-muted-foreground">{total} material{total !== 1 ? "es" : ""}</span>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-1.5 w-full bg-muted animate-pulse" />
              <CardHeader className="pb-2 pt-4">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent><Skeleton className="h-20 w-full rounded-lg" /></CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-base font-semibold text-foreground mb-1">No se encontraron materiales</h3>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              {search || binColorFilter ? `No hay resultados para los filtros aplicados.` : "Comience agregando los materiales reciclables del programa."}
            </p>
            {(search || binColorFilter) ? (
              <Button variant="outline" size="sm" onClick={() => { setSearch(""); setBinColorFilter(""); setPage(1); }}>Limpiar filtros</Button>
            ) : (
              <Button size="sm" onClick={openCreate}>Agregar primer material</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {materials.map((material, i) => {
            const hex = BIN_HEX[material.binColor] || "#6b7280";
            return (
              <Card key={material.id} className="overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200 animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="h-1.5 w-full" style={{ background: hex }} />
                <CardHeader className="pb-2 pt-4 flex-1 relative">
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => openEdit(material)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => setDeleteId(material.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 pr-8">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${hex}20` }}>
                      <Recycle className="w-4 h-4" style={{ color: hex }} />
                    </div>
                    <h3 className="font-bold text-base leading-tight">{material.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-1.5">{material.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                      <Info className="w-3.5 h-3.5" style={{ color: hex }} /> Instrucciones
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{material.recyclingInstructions}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-3 px-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: hex }} />
                    Contenedor {BIN_COLOR_LABELS[material.binColor] || material.binColor}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">#{material.id}</span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Agregar Material"}</DialogTitle>
            <DialogDescription>Defina cómo los residentes deben manejar y depositar este material reciclable.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="ej. Cartón" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="binColor" render={({ field }) => (
                  <FormItem><FormLabel>Color del contenedor <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {AVAILABLE_COLORS.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ background: BIN_HEX[c.id] }} />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Textarea placeholder="Breve descripción del material y qué incluye..." className="resize-none h-20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recyclingInstructions" render={({ field }) => (
                <FormItem><FormLabel>Instrucciones de reciclaje <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Textarea placeholder="Paso a paso para los residentes: limpiar, secar, doblar, depositar..." className="resize-none h-24" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMaterial.isPending || updateMaterial.isPending} className="gap-2">
                  {(createMaterial.isPending || updateMaterial.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingMaterial ? "Guardar cambios" : "Agregar material"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>El material se eliminará del catálogo. Los registros históricos se conservarán, pero ya no estará disponible para nuevos registros.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMaterial.isPending}>
              {deleteMaterial.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

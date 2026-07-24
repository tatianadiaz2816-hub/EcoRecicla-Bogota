import { useState } from "react";
import { 
  useListMaterials, 
  useCreateMaterial, 
  useUpdateMaterial, 
  useDeleteMaterial,
  getListMaterialsQueryKey,
  Material,
  MaterialInput
} from "@workspace/api-client-react";
import { BIN_COLORS } from "@/lib/utils-eco";
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
  Recycle,
  Loader2,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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

const materialSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z.string().min(5, "La descripción es obligatoria"),
  recyclingInstructions: z.string().min(5, "Las instrucciones son obligatorias"),
  binColor: z.string().min(1, "El color del contenedor es obligatorio"),
});

const AVAILABLE_COLORS = [
  { id: "blue", name: "Azul (Plásticos)" },
  { id: "green", name: "Verde (Orgánicos/Vidrio)" },
  { id: "yellow", name: "Amarillo (Metales/Latas)" },
  { id: "gray", name: "Gris (Papel/Cartón)" },
  { id: "red", name: "Rojo (Peligrosos)" },
  { id: "white", name: "Blanco (Vidrio limpio)" },
  { id: "brown", name: "Café (Madera)" },
  { id: "orange", name: "Naranja (Electrónicos)" }
];

const BIN_COLOR_LABELS: Record<string, string> = {
  blue: "Azul",
  green: "Verde",
  yellow: "Amarillo",
  gray: "Gris",
  red: "Rojo",
  white: "Blanco",
  brown: "Café",
  orange: "Naranja"
};

export default function Materials() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListMaterials({
    search: search || undefined,
    page,
    pageSize
  });

  const materials = data?.data || [];
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
    defaultValues: {
      name: "",
      description: "",
      recyclingInstructions: "",
      binColor: "gray",
    }
  });

  const openCreateModal = () => {
    setEditingMaterial(null);
    form.reset({
      name: "",
      description: "",
      recyclingInstructions: "",
      binColor: "gray",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    form.reset({
      name: material.name,
      description: material.description,
      recyclingInstructions: material.recyclingInstructions,
      binColor: material.binColor,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof materialSchema>) => {
    if (editingMaterial) {
      updateMaterial.mutate({ id: editingMaterial.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Material actualizado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al actualizar el material", description: err.message });
        }
      });
    } else {
      createMaterial.mutate({ data: values as MaterialInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Material creado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al crear el material", description: err.message });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteMaterial.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });
        setDeleteId(null);
        toast({ title: "Material eliminado exitosamente" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al eliminar el material", description: err.message });
        setDeleteId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Catálogo de Materiales</h1>
          <p className="text-muted-foreground mt-1">Configure las categorías de reciclaje e instrucciones de manejo.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Material
        </Button>
      </div>

      <div className="flex items-center relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar materiales..."
          className="pl-9 w-full bg-card"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-3 w-full bg-muted animate-pulse" />
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card className="shadow-sm border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Recycle className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No se encontraron materiales</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Comience agregando los materiales que los residentes pueden reciclar.
            </p>
            {search ? (
              <Button variant="outline" onClick={() => setSearch("")}>Limpiar búsqueda</Button>
            ) : (
              <Button onClick={openCreateModal}>Agregar primer material</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {materials.map((material) => (
            <Card key={material.id} className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              <div className={`h-2.5 w-full ${BIN_COLORS[material.binColor] || 'bg-gray-500'}`} />
              <CardHeader className="pb-3 flex-1 relative">
                <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditModal(material)}>
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(material.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2 mb-2 pr-6">
                  <h3 className="font-semibold text-lg leading-none">{material.name}</h3>
                </div>
                <CardDescription className="line-clamp-2">
                  {material.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm flex-1">
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="font-medium flex items-center gap-1.5 text-foreground mb-1">
                    <Info className="w-4 h-4 text-primary" /> Instrucciones
                  </p>
                  <p className="text-muted-foreground line-clamp-3 leading-snug">
                    {material.recyclingInstructions}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t text-xs text-muted-foreground flex justify-between bg-muted/20">
                <span className="flex items-center gap-1.5 capitalize">
                  <span className={`w-2.5 h-2.5 rounded-full ${BIN_COLORS[material.binColor] || 'bg-gray-500'}`}></span>
                  Contenedor {BIN_COLOR_LABELS[material.binColor] || material.binColor}
                </span>
                <span>ID: {material.id}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Editar Material' : 'Agregar Material'}</DialogTitle>
            <DialogDescription>
              Defina cómo los residentes deben manejar y depositar este material.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del material</FormLabel>
                  <FormControl><Input placeholder="ej. Cartón" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="binColor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Color del contenedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_COLORS.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${BIN_COLORS[c.id] || 'bg-gray-500'}`}></span>
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descripción de lo que incluye este material..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="recyclingInstructions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones de reciclaje</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Instrucciones paso a paso para los residentes. ej. Limpiar, secar y aplanar antes de depositar." className="resize-none h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMaterial.isPending || updateMaterial.isPending}>
                  {createMaterial.isPending || updateMaterial.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingMaterial ? 'Guardar cambios' : 'Agregar material'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro? Se eliminará el material del catálogo. Los registros de reciclaje asociados se conservarán, pero el material ya no estará disponible para nuevos registros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMaterial.isPending}>
              {deleteMaterial.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { 
  useListComplexes, 
  useCreateComplex, 
  useUpdateComplex, 
  useDeleteComplex,
  getListComplexesQueryKey,
  Complex,
  ComplexInput
} from "@workspace/api-client-react";
import { STATUS_LABELS } from "@/lib/utils-eco";
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
  Building2,
  Loader2,
  MapPin,
  Phone,
  Mail,
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

  const { data, isLoading } = useListComplexes({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    pageSize
  });

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
    defaultValues: {
      name: "",
      address: "",
      neighborhood: "",
      administrator: "",
      phone: "",
      email: "",
      status: "active",
    }
  });

  const openCreateModal = () => {
    setEditingComplex(null);
    form.reset({
      name: "",
      address: "",
      neighborhood: "",
      administrator: "",
      phone: "",
      email: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (complex: Complex) => {
    setEditingComplex(complex);
    form.reset({
      name: complex.name,
      address: complex.address,
      neighborhood: complex.neighborhood,
      administrator: complex.administrator || "",
      phone: complex.phone || "",
      email: complex.email || "",
      status: complex.status as any,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof complexSchema>) => {
    const payload: any = { ...values };
    if (!payload.email) delete payload.email;
    if (!payload.phone) delete payload.phone;
    if (!payload.administrator) delete payload.administrator;
    
    if (editingComplex) {
      updateComplex.mutate({ id: editingComplex.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Conjunto actualizado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al actualizar el conjunto", description: err.message });
        }
      });
    } else {
      createComplex.mutate({ data: payload as ComplexInput }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() });
          setIsModalOpen(false);
          toast({ title: "Conjunto creado exitosamente" });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error al crear el conjunto", description: err.message });
        }
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteComplex.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListComplexesQueryKey() });
        setDeleteId(null);
        toast({ title: "Conjunto eliminado exitosamente" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al eliminar el conjunto", description: err.message });
        setDeleteId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Conjuntos Residenciales</h1>
          <p className="text-muted-foreground mt-1">Gestione los edificios residenciales participantes.</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Agregar Conjunto
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conjuntos..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Información del Conjunto</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Contacto Administrador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : complexes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No se encontraron conjuntos con los criterios indicados.
                  </TableCell>
                </TableRow>
              ) : (
                complexes.map((complex) => (
                  <TableRow key={complex.id} className="group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-md flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-base">{complex.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID: CMP-{complex.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1.5 text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {complex.address}
                        </p>
                        <p className="text-xs text-muted-foreground pl-5">{complex.neighborhood}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {complex.administrator || complex.phone || complex.email ? (
                        <div className="space-y-1.5">
                          {complex.administrator && (
                            <p className="text-sm font-medium flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              {complex.administrator}
                            </p>
                          )}
                          {(complex.phone || complex.email) && (
                            <div className="text-xs text-muted-foreground space-y-0.5 pl-5">
                              {complex.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {complex.phone}</p>}
                              {complex.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {complex.email}</p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Sin información de contacto</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={complex.status === "active" ? "outline" : "secondary"} 
                             className={complex.status === "active" ? "border-primary text-primary bg-primary/5" : ""}>
                        {STATUS_LABELS[complex.status]}
                      </Badge>
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
                          <DropdownMenuItem onClick={() => openEditModal(complex)}>
                            <Pencil className="w-4 h-4 mr-2" /> Editar conjunto
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(complex.id)}>
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
            <DialogTitle>{editingComplex ? 'Editar Conjunto' : 'Agregar Conjunto'}</DialogTitle>
            <DialogDescription>
              {editingComplex ? 'Actualice los datos de este conjunto residencial.' : 'Registre un nuevo conjunto residencial en el programa de reciclaje.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del conjunto</FormLabel>
                  <FormControl><Input placeholder="ej. Conjunto Residencial Los Pinos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input placeholder="ej. Calle 123 # 45-67" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="neighborhood" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barrio</FormLabel>
                    <FormControl><Input placeholder="ej. Chapinero" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-4 mt-2">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Contacto de Administración (opcional)
                </h4>
                <FormField control={form.control} name="administrator" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del administrador</FormLabel>
                    <FormControl><Input placeholder="ej. María González" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input placeholder="ej. 300 123 4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl><Input type="email" placeholder="admin@lospinos.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createComplex.isPending || updateComplex.isPending}>
                  {createComplex.isPending || updateComplex.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingComplex ? 'Guardar cambios' : 'Agregar conjunto'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conjunto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este conjunto? No se eliminarán los usuarios ni los registros asociados, pero podría generar inconvenientes en los datos históricos. Considere cambiar el estado a Inactivo en su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteComplex.isPending}>
              {deleteComplex.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { 
  useListUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useListComplexes, getListUsersQueryKey,
  User, UserInput, UserInputRole, UserInputStatus
} from "@workspace/api-client-react";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/utils-eco";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, MoreVertical, Pencil, Trash2, ShieldCheck, User as UserIcon, Loader2, Building2, ChevronLeft, ChevronRight, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const userSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio"),
  documentNumber: z.string().min(5, "El número de documento es obligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido"),
  apartment: z.string().optional(),
  complexId: z.coerce.number().optional().nullable(),
  role: z.enum(["admin", "resident"]),
  status: z.enum(["active", "inactive"]),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
});

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 border-violet-200",
  resident: "bg-sky-100 text-sky-700 border-sky-200",
};
const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: complexesData } = useListComplexes({ pageSize: 100 });
  const complexes = complexesData?.data || [];

  const { data, isLoading } = useListUsers({ search: search || undefined, role: roleFilter !== "all" ? roleFilter : undefined, page, pageSize });
  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { fullName: "", documentNumber: "", phone: "", email: "", apartment: "", complexId: null, role: "resident", status: "active", password: "" }
  });

  const openCreate = () => {
    setEditingUser(null);
    form.reset({ fullName: "", documentNumber: "", phone: "", email: "", apartment: "", complexId: null, role: "resident", status: "active", password: "" });
    setIsUserModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.reset({ fullName: user.fullName, documentNumber: user.documentNumber, phone: user.phone || "", email: user.email, apartment: user.apartment || "", complexId: user.complexId || null, role: user.role as any, status: user.status as any, password: "" });
    setIsUserModalOpen(true);
  };

  const onSubmit = (values: z.infer<typeof userSchema>) => {
    const payload: any = { ...values };
    if (!payload.phone) delete payload.phone;
    if (!payload.apartment) delete payload.apartment;
    if (!payload.complexId) delete payload.complexId;
    if (editingUser) {
      if (!payload.password) delete payload.password;
      updateUser.mutate({ id: editingUser.id, data: payload }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); setIsUserModalOpen(false); toast({ title: "Usuario actualizado" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    } else {
      if (!payload.password) { form.setError("password", { message: "Obligatoria para nuevos usuarios" }); return; }
      createUser.mutate({ data: payload as UserInput }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); setIsUserModalOpen(false); toast({ title: "Usuario creado exitosamente" }); },
        onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteUserId) return;
    deleteUser.mutate({ id: deleteUserId }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() }); setDeleteUserId(null); toast({ title: "Usuario eliminado" }); },
      onError: (err: any) => { toast({ variant: "destructive", title: "Error", description: err.message }); setDeleteUserId(null); }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestione residentes y administradores del sistema.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, correo..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Todos los roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="resident">Residente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
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
                <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Usuario</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Contacto</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Conjunto</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Rol</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Estado</TableHead>
                <TableHead className="pr-5 text-right font-semibold text-xs uppercase tracking-wide">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5"><Skeleton className="h-10 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-[140px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[60px] rounded-full" /></TableCell>
                    <TableCell className="pr-5 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UsersIcon className="w-10 h-10 opacity-20" />
                      <p className="font-medium text-sm">No se encontraron usuarios</p>
                      <p className="text-xs">Intente ajustar los filtros de búsqueda.</p>
                      {search && <Button variant="outline" size="sm" onClick={() => { setSearch(""); setRoleFilter("all"); }}>Limpiar filtros</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user.photoUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{user.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.documentNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm">{user.email}</p>
                    {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                  </TableCell>
                  <TableCell className="py-3">
                    {user.complexName ? (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1"><Building2 className="w-3 h-3 text-muted-foreground" />{user.complexName}</p>
                        {user.apartment && <p className="text-xs text-muted-foreground pl-4">Apto {user.apartment}</p>}
                      </div>
                    ) : <span className="text-xs text-muted-foreground italic">Sin conjunto</span>}
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", ROLE_STYLE[user.role] || "bg-gray-100 text-gray-600")}>
                      {user.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_STYLE[user.status] || "bg-gray-100 text-gray-600")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-emerald-500" : "bg-gray-400")} />
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEdit(user)} className="gap-2"><Pencil className="w-4 h-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => setDeleteUserId(user.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Mostrando {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            <DialogDescription>{editingUser ? "Actualice los datos de este usuario." : "Complete los campos para registrar un nuevo usuario."}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Nombre completo <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="documentNumber" render={({ field }) => (
                  <FormItem><FormLabel>Número de documento <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Correo electrónico <span className="text-destructive">*</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="300 123 4567" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel>Rol <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="resident">Residente</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="complexId" render={({ field }) => (
                  <FormItem><FormLabel>Conjunto residencial</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "none" ? null : parseInt(v))} value={field.value ? String(field.value) : "none"}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="none">Ninguno</SelectItem>{complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="apartment" render={({ field }) => (
                  <FormItem><FormLabel>Apartamento</FormLabel><FormControl><Input placeholder="ej. 402B" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>{editingUser ? "Nueva contraseña (dejar vacío para no cambiar)" : <>Contraseña <span className="text-destructive">*</span></>}</FormLabel>
                  <FormControl><Input type="password" placeholder={editingUser ? "••••••••" : "Mínimo 6 caracteres"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createUser.isPending || updateUser.isPending} className="gap-2">
                  {(createUser.isPending || updateUser.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Guardar cambios" : "Crear usuario"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(o) => !o && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta y se revocará el acceso al sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteUser.isPending}>
              {deleteUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Eliminar usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

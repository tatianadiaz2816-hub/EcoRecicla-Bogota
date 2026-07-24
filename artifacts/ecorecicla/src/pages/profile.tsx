import { useState } from "react";
import { useGetProfile, useUpdateProfile, useChangePassword, useUploadProfilePhoto, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircle, Key, Camera, Loader2, ShieldCheck, Building2, Phone, Mail, CheckCircle2, Lock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/utils-eco";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido"),
  apartment: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const ROLE_STYLE: Record<string, { bg: string; text: string; icon: any }> = {
  admin: { bg: "bg-violet-100 border border-violet-200", text: "text-violet-700", icon: ShieldCheck },
  resident: { bg: "bg-sky-100 border border-sky-200", text: "text-sky-700", icon: UserCircle },
};
const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border border-gray-200",
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadPhoto = useUploadProfilePhoto();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
      apartment: profile?.apartment || "",
    }
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast({ title: "Perfil actualizado exitosamente", description: "Sus datos han sido guardados." });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error al actualizar", description: err.message })
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    changePassword.mutate({ data: { currentPassword: values.currentPassword, newPassword: values.newPassword } }, {
      onSuccess: () => {
        passwordForm.reset();
        toast({ title: "Contraseña actualizada", description: "Su contraseña ha sido cambiada exitosamente." });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error al cambiar contraseña", description: err.message })
    });
  };

  const handlePhotoUpdate = () => {
    if (!photoUrlInput.trim()) return;
    uploadPhoto.mutate({ data: { photoUrl: photoUrlInput } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        setPhotoUrlInput("");
        toast({ title: "Foto actualizada" });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[420px] md:col-span-1" />
          <Skeleton className="h-[420px] md:col-span-2" />
        </div>
      </div>
    );
  }

  const roleStyle = profile?.role ? ROLE_STYLE[profile.role] : ROLE_STYLE["resident"];
  const RoleIcon = roleStyle.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Administre la configuración y preferencias de su cuenta.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT: Identity card */}
        <div className="md:col-span-1 space-y-5">
          <Card className="shadow-sm overflow-hidden">
            {/* Cover */}
            <div className="h-20 bg-gradient-to-br from-emerald-600 to-teal-600" />
            <CardContent className="px-5 pb-5 pt-0 text-center relative">
              <div className="relative -mt-11 mb-4 flex justify-center">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                    <AvatarImage src={profile?.photoUrl || ""} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {profile?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground">{profile?.fullName}</h3>
              <p className="text-xs text-muted-foreground mb-4 font-mono">{profile?.documentNumber}</p>

              <div className="flex items-center justify-center gap-2 mb-5">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", roleStyle.bg, roleStyle.text)}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {profile?.role ? ROLE_LABELS[profile.role] : "Usuario"}
                </span>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", STATUS_STYLE[profile?.status || "active"] || "bg-gray-100 text-gray-500")}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", profile?.status === "active" ? "bg-emerald-500" : "bg-gray-400")} />
                  {profile?.status ? STATUS_LABELS[profile.status] : "Desconocido"}
                </span>
              </div>

              <div className="space-y-2.5 text-left">
                {profile?.complexName && (
                  <div className="flex items-center gap-3 text-sm p-2.5 bg-muted/40 rounded-lg">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground text-xs">
                      {profile.complexName}{profile.apartment ? ` · Apto ${profile.apartment}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm p-2.5 bg-muted/40 rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground text-xs truncate">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm p-2.5 bg-muted/40 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground text-xs">{profile.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Foto de Perfil
              </CardTitle>
              <CardDescription className="text-xs">Ingrese la URL de su imagen de perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handlePhotoUpdate}
                  disabled={!photoUrlInput.trim() || uploadPhoto.isPending}
                  size="icon"
                  className="shrink-0"
                >
                  {uploadPhoto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use una URL pública de imagen (.jpg, .png, .webp)</p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Forms */}
        <div className="md:col-span-2 space-y-5">
          {/* Edit profile */}
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Edit className="w-4 h-4 text-primary" /> Información Personal
              </CardTitle>
              <CardDescription className="text-xs">Actualice su nombre, correo y datos de contacto.</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="pt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nombre completo <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Correo electrónico <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Teléfono</FormLabel>
                        <FormControl><Input placeholder="300 123 4567" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="apartment" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Apartamento</FormLabel>
                        <FormControl><Input placeholder="ej. 402B" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-3 px-5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Los campos marcados con <span className="text-destructive">*</span> son obligatorios.</p>
                  <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Guardar cambios
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          {/* Change password */}
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Cambiar Contraseña
              </CardTitle>
              <CardDescription className="text-xs">Actualice su contraseña para mantener su cuenta segura. Use mínimo 6 caracteres.</CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="pt-5 space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel className="text-xs font-semibold">Contraseña actual <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Nueva contraseña <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Confirmar <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-3 px-5 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Cierre sesión después de cambiar la contraseña.</p>
                  <Button type="submit" variant="secondary" disabled={changePassword.isPending} className="gap-2">
                    {changePassword.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Actualizar contraseña
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}

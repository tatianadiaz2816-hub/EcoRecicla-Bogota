import { useState } from "react";
import { 
  useGetProfile, 
  useUpdateProfile, 
  useChangePassword,
  useUploadProfilePhoto,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { 
  UserCircle, 
  Key, 
  Camera, 
  Loader2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/utils-eco";

const profileSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es obligatorio"),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido"),
  apartment: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

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
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  const onProfileSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast({ title: "Perfil actualizado exitosamente", description: "Su información ha sido guardada." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al actualizar", description: err.message });
      }
    });
  };

  const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
    changePassword.mutate({ 
      data: { currentPassword: values.currentPassword, newPassword: values.newPassword } 
    }, {
      onSuccess: () => {
        passwordForm.reset();
        toast({ title: "Contraseña actualizada", description: "Su contraseña ha sido cambiada exitosamente." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al cambiar contraseña", description: err.message });
      }
    });
  };

  const handlePhotoUpdate = () => {
    if (!photoUrlInput.trim()) return;
    uploadPhoto.mutate({ data: { photoUrl: photoUrlInput } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        setPhotoUrlInput("");
        toast({ title: "Foto actualizada", description: "Su foto de perfil ha sido actualizada." });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error al actualizar la foto", description: err.message });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[400px] md:col-span-1" />
          <Skeleton className="h-[400px] md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Administre la configuración y preferencias de su cuenta.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          {/* Tarjeta de identidad */}
          <Card className="shadow-sm overflow-hidden border-t-4 border-t-primary">
            <div className="bg-primary/5 h-24 w-full" />
            <CardContent className="pt-0 relative px-6 pb-6 text-center flex flex-col items-center">
              <div className="relative -mt-12 mb-4">
                <Avatar className="h-24 w-24 border-4 border-card bg-card shadow-sm">
                  <AvatarImage src={profile?.photoUrl || ""} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <h3 className="text-xl font-bold">{profile?.fullName}</h3>
              <p className="text-sm text-muted-foreground mb-4">{profile?.documentNumber}</p>
              
              <div className="flex gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {profile?.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
                  {profile?.role ? ROLE_LABELS[profile.role] : 'Usuario'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 text-gray-700'}`}>
                  {profile?.status ? STATUS_LABELS[profile.status] : 'Desconocido'}
                </span>
              </div>

              <div className="w-full space-y-3 text-left">
                {profile?.complexName && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {profile.complexName} {profile.apartment ? `(Apto ${profile.apartment})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Foto de perfil */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4" /> Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL de la imagen</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://ejemplo.com/foto.jpg" 
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                  />
                  <Button 
                    onClick={handlePhotoUpdate} 
                    disabled={!photoUrlInput.trim() || uploadPhoto.isPending}
                    size="icon"
                  >
                    {uploadPhoto.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Editar perfil */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualice sus datos de contacto e información de apartamento.</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre completo</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo electrónico</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de teléfono</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={profileForm.control} name="apartment" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartamento (opcional)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-4">
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Guardar cambios
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>

          {/* Cambiar contraseña */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" /> Cambiar Contraseña
              </CardTitle>
              <CardDescription>Actualice su contraseña para mantener su cuenta segura.</CardDescription>
            </CardHeader>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                <CardContent className="space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel>Contraseña actual</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel>Confirmar nueva contraseña</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-4">
                  <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
                    {changePassword.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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

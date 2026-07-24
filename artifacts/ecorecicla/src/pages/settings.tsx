import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/lib/api";
import { Settings as SettingsIcon, Building2, User, Lock, Image, Save, Loader2, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    orgName: "",
    orgAddress: "",
    orgPhone: "",
    orgEmail: "",
    logoUrl: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        orgName: settings.orgName || "",
        orgAddress: settings.orgAddress || "",
        orgPhone: settings.orgPhone || "",
        orgEmail: settings.orgEmail || "",
        logoUrl: settings.logoUrl || "",
      });
    }
  }, [settings]);

  const handleSave = (fields: Partial<typeof form>) => {
    updateSettings.mutate(fields, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        toast({ title: "Configuración guardada exitosamente" });
      },
      onError: (e) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  };

  const Field = ({ label, value, onChange, type = "text", placeholder = "" }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" /> Configuración del Sistema
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Administre los datos de la organización y preferencias del sistema.</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="mb-4">
          <TabsTrigger value="empresa" className="gap-2"><Building2 className="w-4 h-4" /> Empresa</TabsTrigger>
          <TabsTrigger value="logo" className="gap-2"><Image className="w-4 h-4" /> Logo</TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2"><User className="w-4 h-4" /> Mi Perfil</TabsTrigger>
          <TabsTrigger value="password" className="gap-2"><Lock className="w-4 h-4" /> Contraseña</TabsTrigger>
        </TabsList>

        {/* TAB: EMPRESA */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de la Organización</CardTitle>
              <CardDescription className="text-xs">Estos datos aparecen en los reportes exportados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nombre de la organización"
                  value={form.orgName}
                  onChange={(v) => setForm((f) => ({ ...f, orgName: v }))}
                  placeholder="EcoRecicla Bogotá"
                />
                <Field
                  label="Correo electrónico"
                  value={form.orgEmail}
                  onChange={(v) => setForm((f) => ({ ...f, orgEmail: v }))}
                  type="email"
                  placeholder="contacto@ecorecicla.gov.co"
                />
                <Field
                  label="Teléfono"
                  value={form.orgPhone}
                  onChange={(v) => setForm((f) => ({ ...f, orgPhone: v }))}
                  placeholder="+57 601 000 0000"
                />
                <Field
                  label="Dirección"
                  value={form.orgAddress}
                  onChange={(v) => setForm((f) => ({ ...f, orgAddress: v }))}
                  placeholder="Calle 26 # 69-76, Bogotá"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => handleSave({ orgName: form.orgName, orgAddress: form.orgAddress, orgPhone: form.orgPhone, orgEmail: form.orgEmail })}
                  disabled={updateSettings.isPending}
                  className="gap-2 min-w-[140px]"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saved ? "Guardado" : "Guardar cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: LOGO */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración del Logo</CardTitle>
              <CardDescription className="text-xs">Ingrese la URL de una imagen para usarla como logo en los reportes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="URL del logo"
                value={form.logoUrl}
                onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))}
                placeholder="https://ejemplo.com/logo.png"
              />

              {/* Live preview */}
              <div className="border rounded-xl bg-muted/30 p-6 flex flex-col items-center gap-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Vista previa</p>
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="max-h-24 max-w-xs object-contain rounded-lg border bg-white p-2"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "";
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                    <Image className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {form.logoUrl ? "Logo cargado correctamente" : "Ingrese una URL válida para previsualizar"}
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave({ logoUrl: form.logoUrl })} disabled={updateSettings.isPending} className="gap-2">
                  {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PERFIL */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perfil del Administrador</CardTitle>
              <CardDescription className="text-xs">Edite su nombre, documento, teléfono y foto de perfil.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                La edición del perfil se realiza desde la página de perfil personal.
              </p>
              <Link href="/profile">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Ir a Mi Perfil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CONTRASEÑA */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-xs">Actualice su contraseña de acceso al sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                El cambio de contraseña está disponible en la sección de perfil personal.
              </p>
              <Link href="/profile">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="w-4 h-4" /> Ir a Mi Perfil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

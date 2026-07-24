import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Leaf, Loader2, Mail, Lock, Recycle, Building, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

const FEATURE_CARDS = [
  { icon: Building, label: "Conjuntos\nResidenciales" },
  { icon: Recycle, label: "Materiales\nReciclables" },
  { icon: BarChart3, label: "Reportes\nEstadísticos" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        localStorage.setItem("eco_token", res.token);
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: "Correo electrónico o contraseña incorrectos.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-[480px] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-10 text-white shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">EcoRecicla Bogotá</p>
              <p className="text-xs text-emerald-200 leading-tight">Sistema de Gestión de Reciclaje</p>
            </div>
          </div>

          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Gestión inteligente del reciclaje residencial
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Transforme la gestión del reciclaje con una plataforma que centraliza la información, facilita el seguimiento de las jornadas y genera indicadores para apoyar la toma de decisiones.
          </p>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {FEATURE_CARDS.map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                <Icon className="w-4 h-4 mx-auto mb-2 text-emerald-200" />
                <p className="text-[10px] text-emerald-100 leading-snug whitespace-pre-line">{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-emerald-300 font-medium">© 2025 EcoRecicla Bogotá</p>
            <p className="text-[10px] text-emerald-400 leading-relaxed">
              Proyecto de Grado · Ingeniería de Sistemas<br />
              Universidad Nacional Abierta y a Distancia – UNAD<br />
              Versión 1.0
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">EcoRecicla Bogotá</p>
              <p className="text-xs text-muted-foreground">Sistema de Gestión de Reciclaje</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Iniciar sesión</h1>
            <p className="text-muted-foreground text-sm mt-1">Ingrese sus credenciales para acceder al sistema.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Correo electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="admin@ecorecicla.com" className="pl-9 h-11" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-9 h-11" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full h-11 text-sm font-semibold shadow-sm" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Autenticando...</>
                ) : "Ingresar al sistema"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-800 mb-3 tracking-wide uppercase">Credenciales de demostración</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-700 font-medium">Correo:</span>
                <span className="text-xs text-emerald-900 font-mono bg-white/70 px-2 py-0.5 rounded-md border border-emerald-100 select-all">admin@ecorecicla.com</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-700 font-medium">Contraseña:</span>
                <span className="text-xs text-emerald-900 font-mono bg-white/70 px-2 py-0.5 rounded-md border border-emerald-100 select-all">admin123</span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">Solo personal autorizado. Acceso restringido.</p>
        </div>
      </div>
    </div>
  );
}

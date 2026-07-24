import { useGetDashboardStats, useGetDashboardMonthlyStats, useGetDashboardRecentActivity, useGetDashboardMaterialBreakdown } from "@workspace/api-client-react";
import { formatWeight, formatDate, BIN_COLORS } from "@/lib/utils-eco";
import { 
  Users, 
  Building2, 
  CalendarDays, 
  FileText, 
  Recycle, 
  Scale,
  Activity,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: monthlyStats, isLoading: monthlyLoading } = useGetDashboardMonthlyStats();
  const { data: recentActivity, isLoading: activityLoading } = useGetDashboardRecentActivity();
  const { data: materialBreakdown, isLoading: breakdownLoading } = useGetDashboardMaterialBreakdown();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Resumen del impacto del programa de reciclaje.</p>
        </div>
        <Link href="/records">
          <Button>
            Registrar Reciclaje
          </Button>
        </Link>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Reciclado" icon={Scale} value={statsLoading ? null : formatWeight(stats?.totalKgRecycled)} desc="Peso acumulado en todos los conjuntos" highlight />
        <StatCard title="Total de Registros" icon={FileText} value={statsLoading ? null : stats?.totalRecords.toLocaleString()} desc="Jornadas de reciclaje registradas" />
        <StatCard title="Total de Materiales" icon={Recycle} value={statsLoading ? null : stats?.totalMaterials.toLocaleString()} desc="Categorías de materiales activas" />
        <StatCard title="Residentes Participantes" icon={Users} value={statsLoading ? null : stats?.totalResidents.toLocaleString()} desc="Registrados en el sistema" />
        <StatCard title="Conjuntos Activos" icon={Building2} value={statsLoading ? null : stats?.totalComplexes.toLocaleString()} desc="Edificios residenciales vinculados" />
        <StatCard title="Jornadas de Recolección" icon={CalendarDays} value={statsLoading ? null : stats?.totalEvents.toLocaleString()} desc="Programadas o completadas" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* GRÁFICA: MENSUAL */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Impacto Mensual</CardTitle>
            <CardDescription>Kilogramos reciclados durante el año en curso</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {monthlyLoading ? (
              <Skeleton className="h-[300px] w-full ml-4" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyStats || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}kg`} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [`${value} kg`, 'Reciclado']}
                    />
                    <Bar dataKey="totalKg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GRÁFICA: DISTRIBUCIÓN POR MATERIAL */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Distribución por Material</CardTitle>
            <CardDescription>Materiales reciclados por peso</CardDescription>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center">
                {(!materialBreakdown || materialBreakdown.length === 0) ? (
                  <div className="text-muted-foreground text-sm flex flex-col items-center">
                    <Recycle className="h-8 w-8 mb-2 opacity-20" />
                    Aún no hay datos disponibles
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={materialBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="totalKg"
                        nameKey="materialName"
                      >
                        {materialBreakdown.map((entry, index) => {
                          let color = "#10b981";
                          if (entry.binColor === "blue") color = "#3b82f6";
                          if (entry.binColor === "green") color = "#10b981";
                          if (entry.binColor === "yellow") color = "#facc15";
                          if (entry.binColor === "red") color = "#ef4444";
                          if (entry.binColor === "gray") color = "#6b7280";
                          if (entry.binColor === "brown") color = "#92400e";
                          if (entry.binColor === "white") color = "#e2e8f0";
                          if (entry.binColor === "orange") color = "#f97316";
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} kg`, 'Peso']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Últimas interacciones del sistema en todos los conjuntos.</CardDescription>
          </div>
          <Link href="/records">
            <Button variant="ghost" size="sm" className="hidden sm:flex gap-1">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-6">
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay actividad reciente para mostrar.
            </div>
          ) : (
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(activity.createdAt)}</span>
                      {activity.weightKg != null && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-foreground">{formatWeight(activity.weightKg)} {activity.materialName}</span>
                        </>
                      )}
                      {activity.residentName && (
                        <>
                          <span>•</span>
                          <span>por {activity.residentName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  desc, 
  icon: Icon,
  highlight = false
}: { 
  title: string, 
  value: string | null, 
  desc: string, 
  icon: any,
  highlight?: boolean
}) {
  return (
    <Card className={`shadow-sm ${highlight ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {desc}
        </p>
      </CardContent>
    </Card>
  );
}

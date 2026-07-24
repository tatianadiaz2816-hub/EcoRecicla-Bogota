import { useGetDashboardStats, useGetDashboardMonthlyStats, useGetDashboardRecentActivity, useGetDashboardMaterialBreakdown, useGetMe, useListEvents } from "@workspace/api-client-react";
import { formatWeight, formatDate, BIN_COLORS } from "@/lib/utils-eco";
import { 
  Users, Building2, CalendarDays, FileText, Recycle, Scale,
  Activity, ArrowRight, TrendingUp, Leaf, Droplets, Wind,
  Clock, MapPin, Plus, Star, ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { cn } from "@/lib/utils";

const EVENT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Programada", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Completada", cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelada", cls: "bg-red-100 text-red-700 border-red-200" },
};

function getBinColor(binColor: string) {
  const map: Record<string, string> = {
    blue: "#3b82f6", green: "#16a34a", yellow: "#ca8a04", red: "#ef4444",
    gray: "#6b7280", brown: "#92400e", white: "#94a3b8", orange: "#f97316",
  };
  return map[binColor] || "#16a34a";
}

export default function Dashboard() {
  const { data: me } = useGetMe();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: monthlyStats, isLoading: monthlyLoading } = useGetDashboardMonthlyStats();
  const { data: recentActivity, isLoading: activityLoading } = useGetDashboardRecentActivity();
  const { data: materialBreakdown, isLoading: breakdownLoading } = useGetDashboardMaterialBreakdown();
  const { data: upcomingEventsData, isLoading: eventsLoading } = useListEvents({ status: "scheduled", pageSize: 4, page: 1 });

  const upcomingEvents = upcomingEventsData?.data || [];

  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const totalKg = stats?.totalKgRecycled || 0;
  const co2Evitado = (totalKg * 2.5).toFixed(1);
  const arboles = Math.round(totalKg * 2.5 / 21);
  const aguaAhorrada = Math.round(totalKg * 10);

  const statCards = [
    { title: "Total Reciclado", value: statsLoading ? null : formatWeight(totalKg), desc: "Peso acumulado histórico", icon: Scale, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100" },
    { title: "Registros", value: statsLoading ? null : stats?.totalRecords.toLocaleString("es-CO"), desc: "Entregas registradas", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", iconBg: "bg-blue-100" },
    { title: "Residentes", value: statsLoading ? null : stats?.totalResidents.toLocaleString("es-CO"), desc: "Participantes activos", icon: Users, color: "text-violet-600", bg: "bg-violet-50 border-violet-100", iconBg: "bg-violet-100" },
    { title: "Conjuntos", value: statsLoading ? null : stats?.totalComplexes.toLocaleString("es-CO"), desc: "Edificios vinculados", icon: Building2, color: "text-orange-600", bg: "bg-orange-50 border-orange-100", iconBg: "bg-orange-100" },
    { title: "Jornadas", value: statsLoading ? null : stats?.totalEvents.toLocaleString("es-CO"), desc: "Programadas o completadas", icon: CalendarDays, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-100", iconBg: "bg-cyan-100" },
    { title: "Materiales", value: statsLoading ? null : stats?.totalMaterials.toLocaleString("es-CO"), desc: "Categorías disponibles", icon: Recycle, color: "text-pink-600", bg: "bg-pink-50 border-pink-100", iconBg: "bg-pink-100" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* BIENVENIDA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{dateFormatted}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Bienvenido, {me?.fullName?.split(" ")[0] || "Administrador"} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Aquí está el resumen de impacto del programa de reciclaje de Bogotá.
          </p>
        </div>
        <Link href="/records">
          <Button className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Registrar Reciclaje
          </Button>
        </Link>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={cn("border animate-fade-in-up shadow-sm hover:shadow-md transition-shadow", card.bg, `animate-fade-in-up-${i + 1}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2 rounded-lg", card.iconBg)}>
                    <Icon className={cn("w-4 h-4", card.color)} />
                  </div>
                  <TrendingUp className={cn("w-3 h-3 opacity-50", card.color)} />
                </div>
                {card.value === null ? (
                  <Skeleton className="h-7 w-20 mb-1" />
                ) : (
                  <p className={cn("text-xl font-bold animate-count-up", card.color)}>{card.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* GRÁFICAS */}
      <div className="grid gap-5 lg:grid-cols-7">
        {/* Área mensual */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Impacto Mensual</CardTitle>
                <CardDescription className="text-xs">Kilogramos reciclados en el año en curso</CardDescription>
              </div>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                  Ver reporte <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pl-0 pt-0">
            {monthlyLoading ? (
              <Skeleton className="h-[260px] w-full ml-4" />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}kg`} />
                    <Tooltip
                      cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      formatter={(value: number) => [`${value} kg`, "Reciclado"]}
                    />
                    <Area dataKey="totalKg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorKg)" dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie por material */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Material</CardTitle>
            <CardDescription className="text-xs">Distribución del total reciclado</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {breakdownLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : !materialBreakdown?.length ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Recycle className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">Sin datos disponibles</p>
              </div>
            ) : (() => {
              const totalKgAll = materialBreakdown.reduce((s, m) => s + m.totalKg, 0);
              return (
                <>
                  {/* Donut chart — shorter height, no built-in legend */}
                  <div className="h-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie
                          data={materialBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={2}
                          dataKey="totalKg"
                          nameKey="materialName"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {materialBreakdown.map((entry, idx) => (
                            <Cell key={idx} fill={getBinColor(entry.binColor)} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, _name: string, props: any) => {
                            const pct = totalKgAll > 0 ? ((v / totalKgAll) * 100).toFixed(1) : "0";
                            return [`${v.toFixed(2)} kg (${pct}%)`, "Peso"];
                          }}
                          contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(var(--border))" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Custom legend — full control over wrapping and overflow */}
                  <div className="mt-3 space-y-1.5 px-1">
                    {[...materialBreakdown]
                      .sort((a, b) => b.totalKg - a.totalKg)
                      .map((m) => {
                        const pct = totalKgAll > 0 ? ((m.totalKg / totalKgAll) * 100).toFixed(1) : "0";
                        const color = getBinColor(m.binColor);
                        return (
                          <div key={m.materialId} className="flex items-center gap-2 min-w-0">
                            {/* Color dot */}
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: color }}
                            />
                            {/* Material name — truncates if needed */}
                            <span className="text-xs text-foreground flex-1 truncate leading-tight">
                              {m.materialName}
                            </span>
                            {/* Percentage pill */}
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 tabular-nums"
                              style={{ background: `${color}20`, color }}
                            >
                              {pct}%
                            </span>
                            {/* kg value */}
                            <span className="text-xs text-muted-foreground shrink-0 tabular-nums w-14 text-right">
                              {m.totalKg.toFixed(1)} kg
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* IMPACTO AMBIENTAL */}
      <Card className="shadow-sm bg-gradient-to-r from-emerald-600 to-teal-600 border-0 text-white">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-5 h-5 text-emerald-200" />
                <p className="font-semibold text-sm text-emerald-100">Impacto Ambiental Acumulado</p>
              </div>
              <p className="text-xs text-emerald-200">Estimaciones basadas en el material reciclado total</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Wind className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs text-emerald-200">CO₂ evitado</span>
                </div>
                {statsLoading ? <Skeleton className="h-7 w-16 mx-auto bg-white/20" /> : (
                  <p className="text-2xl font-bold">{parseFloat(co2Evitado).toLocaleString("es-CO")} kg</p>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Leaf className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs text-emerald-200">Árboles equiv.</span>
                </div>
                {statsLoading ? <Skeleton className="h-7 w-12 mx-auto bg-white/20" /> : (
                  <p className="text-2xl font-bold">{arboles.toLocaleString("es-CO")}</p>
                )}
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Droplets className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs text-emerald-200">Agua ahorrada</span>
                </div>
                {statsLoading ? <Skeleton className="h-7 w-20 mx-auto bg-white/20" /> : (
                  <p className="text-2xl font-bold">{(aguaAhorrada / 1000).toFixed(1)} m³</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* JORNADAS PRÓXIMAS + ACTIVIDAD RECIENTE */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Upcoming events */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Próximas Jornadas
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Recolecciones programadas</CardDescription>
            </div>
            <Link href="/events">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {eventsLoading ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay jornadas próximas.</p>
              </div>
            ) : upcomingEvents.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ev.eventName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDate(ev.date)} · {ev.hour}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {ev.complexName}
                  </p>
                </div>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", EVENT_STATUS_MAP[ev.status]?.cls || "bg-gray-100 text-gray-700")}>
                  {EVENT_STATUS_MAP[ev.status]?.label || ev.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Actividad Reciente
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Últimas entregas y registros del sistema</CardDescription>
            </div>
            <Link href="/records">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Ver todo <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {activityLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !recentActivity?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No hay actividad reciente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={a.id} className={cn("flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-muted/40 hover:border-border transition-all animate-fade-in-up", `animate-fade-in-up-${Math.min(i + 1, 5)}`)}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Recycle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{a.description}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                        {a.weightKg != null && (
                          <span className="text-xs font-semibold text-primary">{formatWeight(a.weightKg)} {a.materialName}</span>
                        )}
                        {a.residentName && (
                          <span className="text-xs text-muted-foreground">por {a.residentName}</span>
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

      {/* TOP MATERIALES */}
      {!breakdownLoading && materialBreakdown && materialBreakdown.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" /> Materiales Más Reciclados
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Ranking por kilogramos totales entregados</CardDescription>
              </div>
              <Link href="/materials">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Catálogo <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {[...materialBreakdown]
                .sort((a, b) => b.totalKg - a.totalKg)
                .slice(0, 5)
                .map((m, i) => {
                  const pct = materialBreakdown.reduce((s, x) => s + x.totalKg, 0);
                  const width = pct > 0 ? Math.round((m.totalKg / pct) * 100) : 0;
                  return (
                    <div key={m.materialName} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: getBinColor(m.binColor) }} />
                        <span className="text-sm font-medium truncate">{m.materialName}</span>
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${width}%`, background: getBinColor(m.binColor) }} />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-20 text-right shrink-0">{formatWeight(m.totalKg)}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{width}%</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from "react";
import { useGetReportSummary, useListComplexes, useListMaterials, useListUsers } from "@workspace/api-client-react";
import { formatWeight, formatDate, BIN_COLORS } from "@/lib/utils-eco";
import * as xlsx from "xlsx";
import { BarChart as BarChartIcon, Download, Filter, FileSpreadsheet, FileText, Scale, Hash, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const BIN_HEX: Record<string, string> = {
  blue: "#3b82f6", green: "#16a34a", yellow: "#ca8a04", red: "#ef4444",
  gray: "#6b7280", brown: "#92400e", white: "#94a3b8", orange: "#f97316"
};

export default function Reports() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [materialId, setMaterialId] = useState<string>("all");
  const [complexId, setComplexId] = useState<string>("all");
  const [residentId, setResidentId] = useState<string>("all");

  const { data: complexesData } = useListComplexes({ pageSize: 100 });
  const complexes = complexesData?.data || [];

  const { data: materialsData } = useListMaterials({ pageSize: 100 });
  const materials = materialsData?.data || [];

  const { data: residentsData } = useListUsers({ role: "resident", pageSize: 500 });
  const residents = residentsData?.data || [];

  const { data: summary, isLoading } = useGetReportSummary({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    materialId: materialId !== "all" ? parseInt(materialId) : undefined,
    complexId: complexId !== "all" ? parseInt(complexId) : undefined,
    residentId: residentId !== "all" ? parseInt(residentId) : undefined,
  });

  const handleExportExcel = () => {
    if (!summary?.records) return;
    const exportData = summary.records.map(r => ({
      ID: r.id,
      Fecha: formatDate(r.date),
      Residente: r.residentName || "Desconocido",
      Conjunto: r.complexName || "Desconocido",
      Material: r.materialName || "Desconocido",
      "Peso (kg)": r.weightKg,
      "Fecha de registro": new Date(r.createdAt).toLocaleString("es-CO"),
      Observaciones: r.observation || ""
    }));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(exportData);
    ws["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 40 }];
    xlsx.utils.book_append_sheet(wb, ws, "Registros_Reciclaje");
    xlsx.writeFile(wb, `EcoRecicla_Reporte_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const hasFilters = dateFrom || dateTo || materialId !== "all" || complexId !== "all" || residentId !== "all";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reportes y Análisis</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analice datos de reciclaje y exporte informes detallados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={!summary || summary.records.length === 0}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Exportar Excel
          </Button>
          <Button className="gap-2" onClick={() => window.print()}>
            <FileText className="w-4 h-4" /> Imprimir PDF
          </Button>
        </div>
      </div>

      <div id="print-root" className="space-y-6">
        {/* FILTROS */}
        <Card className="shadow-sm print:hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filtros del Reporte
              {hasFilters && (
                <button onClick={() => { setDateFrom(""); setDateTo(""); setMaterialId("all"); setComplexId("all"); setResidentId("all"); }} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Limpiar filtros
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fecha desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fecha hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Conjunto</label>
              <Select value={complexId} onValueChange={setComplexId}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conjuntos</SelectItem>
                  {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Material</label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los materiales</SelectItem>
                  {materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Residente</label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los residentes</SelectItem>
                  {residents.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Encabezado impresión */}
        <div className="hidden print:block text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold">EcoRecicla Bogotá — Reporte Oficial</h1>
          <p className="text-gray-600 mt-2">Generado el: {new Date().toLocaleString("es-CO")}</p>
          <div className="text-sm mt-4 grid grid-cols-2 text-left max-w-xl mx-auto">
            <div><strong>Período:</strong></div>
            <div className="text-right">{dateFrom || dateTo ? `${dateFrom || "Inicio"} al ${dateTo || "Fin"}` : "Todo el período"}</div>
            <div>Conjunto: {complexId !== "all" ? complexes.find(c => String(c.id) === complexId)?.name : "Todos"}</div>
            <div className="text-right">Material: {materialId !== "all" ? materials.find(m => String(m.id) === materialId)?.name : "Todos"}</div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Peso Total Reciclado</p>
                  {isLoading ? <Skeleton className="h-10 w-36 mt-1" /> : (
                    <h2 className="text-4xl font-bold text-foreground">{formatWeight(summary?.totalKg)}</h2>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">en el período filtrado</p>
                </div>
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center">
                  <Scale className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total de Registros</p>
                  {isLoading ? <Skeleton className="h-10 w-24 mt-1" /> : (
                    <h2 className="text-4xl font-bold text-foreground">{summary?.totalRecords.toLocaleString("es-CO")}</h2>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">entregas encontradas</p>
                </div>
                <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                  <Hash className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold">Reciclaje por Material</CardTitle>
              <CardDescription className="text-xs">Kilogramos totales por categoría</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? <Skeleton className="h-[280px] w-full" /> : (
                <div className="h-[280px]">
                  {summary?.byMaterial && summary.byMaterial.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.byMaterial} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tickFormatter={(v) => `${v}kg`} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="materialName" width={90} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kg`, "Total"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="totalKg" radius={[0, 6, 6, 0]} maxBarSize={30}>
                          {summary.byMaterial.map((entry, i) => (
                            <Cell key={i} fill={BIN_HEX[entry.binColor] || "#16a34a"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sin datos para mostrar</div>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold">Reciclaje por Conjunto</CardTitle>
              <CardDescription className="text-xs">Comparativa entre edificios participantes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? <Skeleton className="h-[280px] w-full" /> : (
                <div className="h-[280px]">
                  {summary?.byComplex && summary.byComplex.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.byComplex.slice(0, 8)} margin={{ bottom: 50, top: 5, left: 0, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="complexName" angle={-35} textAnchor="end" height={55} tick={{ fontSize: 10 }} interval={0} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={(v) => `${v}kg`} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kg`, "Total"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="totalKg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sin datos para mostrar</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top residentes */}
        {!isLoading && summary?.byResident && summary.byResident.length > 0 && (
          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Top Residentes Recicladores
              </CardTitle>
              <CardDescription className="text-xs">Mayores contribuyentes en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {summary.byResident.slice(0, 8).map((r: any, i: number) => {
                  const max = summary.byResident[0]?.totalKg || 1;
                  const pct = Math.round((r.totalKg / max) * 100);
                  return (
                    <div key={r.residentName} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <span className="text-sm font-medium w-40 shrink-0 truncate">{r.residentName}</span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-primary w-24 text-right shrink-0">{formatWeight(r.totalKg)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla detalle */}
        <Card className="shadow-sm print:break-inside-avoid">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-sm font-semibold">Detalle de Registros</CardTitle>
            <CardDescription className="text-xs print:hidden">Máximo 100 filas. Exporte a Excel para el conjunto completo.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Fecha</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Residente</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Conjunto</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide">Material</TableHead>
                  <TableHead className="pr-5 text-right font-semibold text-xs uppercase tracking-wide">Peso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5} className="p-4"><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                  ))
                ) : !summary?.records || summary.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                      No hay registros que coincidan con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : summary.records.slice(0, 100).map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-5 text-sm">{formatDate(record.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{record.residentName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.complexName}</TableCell>
                    <TableCell className="text-sm">{record.materialName}</TableCell>
                    <TableCell className="pr-5 text-right font-bold text-sm text-emerald-700">{formatWeight(record.weightKg)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {summary?.records && summary.records.length > 100 && (
              <div className="p-4 text-center text-xs text-muted-foreground border-t print:hidden">
                Mostrando los primeros 100 de {summary.records.length} registros. Exporte a Excel para verlos todos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from "react";
import { 
  useGetReportSummary,
  useListComplexes,
  useListMaterials,
  useListUsers,
} from "@workspace/api-client-react";
import { formatWeight, formatDate, BIN_COLORS } from "@/lib/utils-eco";
import * as xlsx from "xlsx";

import { 
  BarChart as BarChartIcon,
  Download,
  Filter,
  FileSpreadsheet,
  FileText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

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
    
    ws['!cols'] = [
      { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 40 }
    ];

    xlsx.utils.book_append_sheet(wb, ws, "Registros_Reciclaje");
    xlsx.writeFile(wb, `EcoRecicla_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes y Análisis</h1>
          <p className="text-muted-foreground mt-1">Genere informes y exporte datos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={!summary || summary.records.length === 0}>
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Exportar Excel
          </Button>
          <Button className="gap-2" onClick={handleExportPDF}>
            <FileText className="w-4 h-4" /> Imprimir PDF
          </Button>
        </div>
      </div>

      <div id="print-root" className="space-y-6">
        {/* FILTROS - ocultos en impresión */}
        <Card className="shadow-sm print:hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtros del Reporte
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
                <SelectTrigger><SelectValue placeholder="Todos los conjuntos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los conjuntos</SelectItem>
                  {complexes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Material</label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Todos los materiales" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los materiales</SelectItem>
                  {materials.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Residente</label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger><SelectValue placeholder="Todos los residentes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los residentes</SelectItem>
                  {residents.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ENCABEZADO DE IMPRESIÓN - visible solo al imprimir */}
        <div className="hidden print:block text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold text-black">EcoRecicla Bogotá — Reporte Oficial</h1>
          <p className="text-gray-600 mt-2">Generado el: {new Date().toLocaleString("es-CO")}</p>
          <div className="text-sm mt-4 grid grid-cols-2 text-left max-w-xl mx-auto">
            <div><strong>Filtros aplicados:</strong></div>
            <div className="text-right">
              {dateFrom || dateTo ? `Fecha: ${dateFrom || 'Inicio'} hasta ${dateTo || 'Fin'}` : 'Fecha: Todo el período'}
            </div>
            <div>Conjunto: {complexId !== 'all' ? complexes.find(c => String(c.id) === complexId)?.name : 'Todos'}</div>
            <div className="text-right">Material: {materialId !== 'all' ? materials.find(m => String(m.id) === materialId)?.name : 'Todos'}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Peso Total Reciclado</p>
              {isLoading ? (
                <Skeleton className="h-10 w-32 mt-2" />
              ) : (
                <h2 className="text-4xl font-bold mt-1 text-foreground">{formatWeight(summary?.totalKg)}</h2>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-secondary">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-muted-foreground">Total de Registros Encontrados</p>
              {isLoading ? (
                <Skeleton className="h-10 w-32 mt-2" />
              ) : (
                <h2 className="text-4xl font-bold mt-1 text-foreground">{summary?.totalRecords.toLocaleString()}</h2>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Por Material</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <div className="h-[300px] w-full">
                  {summary?.byMaterial && summary.byMaterial.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.byMaterial} layout="vertical" margin={{ left: 40, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `${v}kg`} />
                        <YAxis type="category" dataKey="materialName" width={100} tick={{fontSize: 12}} />
                        <Tooltip formatter={(value: number) => [`${value} kg`, 'Total']} />
                        <Bar dataKey="totalKg" radius={[0, 4, 4, 0]} maxBarSize={40}>
                          {summary.byMaterial.map((entry, index) => {
                            let color = "#10b981";
                            if (entry.binColor === "blue") color = "#3b82f6";
                            if (entry.binColor === "yellow") color = "#facc15";
                            if (entry.binColor === "red") color = "#ef4444";
                            if (entry.binColor === "gray") color = "#6b7280";
                            if (entry.binColor === "brown") color = "#92400e";
                            if (entry.binColor === "orange") color = "#f97316";
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos</div>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Por Conjunto</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[300px] w-full" /> : (
                <div className="h-[300px] w-full">
                  {summary?.byComplex && summary.byComplex.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.byComplex.slice(0, 10)} margin={{ bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="complexName" angle={-45} textAnchor="end" height={60} tick={{fontSize: 11}} interval={0} />
                        <YAxis tickFormatter={(v) => `${v}kg`} />
                        <Tooltip formatter={(value: number) => [`${value} kg`, 'Total']} />
                        <Bar dataKey="totalKg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-muted-foreground">Sin datos</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Detalle de Registros</CardTitle>
            <CardDescription className="print:hidden">Tabla de datos con los resultados filtrados. Se muestran máximo 100.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Fecha</TableHead>
                  <TableHead>Residente</TableHead>
                  <TableHead>Conjunto</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right pr-6">Peso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="p-4"><Skeleton className="h-6 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : !summary?.records || summary.records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No hay registros que coincidan con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.records.slice(0, 100).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="pl-6 text-sm">{formatDate(record.date)}</TableCell>
                      <TableCell className="text-sm font-medium">{record.residentName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{record.complexName}</TableCell>
                      <TableCell className="text-sm">{record.materialName}</TableCell>
                      <TableCell className="text-right pr-6 font-medium">{formatWeight(record.weightKg)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {summary?.records && summary.records.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t print:hidden">
                Mostrando los primeros 100 registros. Exporte a Excel para ver los {summary.records.length} en total.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

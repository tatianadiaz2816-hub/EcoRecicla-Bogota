import { useState } from "react";
import { useAuditLogs } from "@/lib/api";
import { ShieldCheck, Search, ChevronLeft, ChevronRight, User, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  login:  { label: "Inicio sesión", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  create: { label: "Crear",         cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  update: { label: "Actualizar",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
  delete: { label: "Eliminar",      cls: "bg-red-100 text-red-700 border-red-200" },
};

const RESOURCE_LABEL: Record<string, string> = {
  auth:     "Autenticación",
  user:     "Usuario",
  complex:  "Conjunto",
  material: "Material",
  event:    "Jornada",
  record:   "Registro",
};

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useAuditLogs({
    search: search || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    resource: resourceFilter !== "all" ? resourceFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const hasFilters = search || actionFilter !== "all" || resourceFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch(""); setActionFilter("all"); setResourceFilter("all");
    setDateFrom(""); setDateTo(""); setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Registro de Auditoría
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historial de acciones realizadas en el sistema.</p>
        </div>
        {total > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            {total.toLocaleString("es-CO")} registro{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-4 px-5">
          <div className="flex flex-col gap-3">
            {/* Row 1: search + action + resource */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por usuario..." className="pl-9" value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Todas las acciones" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  <SelectItem value="login">Inicio sesión</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Todos los recursos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los recursos</SelectItem>
                  <SelectItem value="auth">Autenticación</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="complex">Conjunto</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="event">Jornada</SelectItem>
                  <SelectItem value="record">Registro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Row 2: date range + clear */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Período:</span>
              </div>
              <Input type="date" className="w-full sm:w-[160px] h-9 text-sm" value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <span className="text-xs text-muted-foreground">al</span>
              <Input type="date" className="w-full sm:w-[160px] h-9 text-sm" value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-5 font-semibold text-xs uppercase tracking-wide">Fecha y hora</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Usuario</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Acción</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Recurso</TableHead>
                <TableHead className="pr-5 font-semibold text-xs uppercase tracking-wide">Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j} className={j === 0 ? "pl-5" : j === 4 ? "pr-5" : ""}>
                        <Skeleton className="h-5 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShieldCheck className="w-10 h-10 opacity-20" />
                      <p className="font-medium text-sm">Sin registros de auditoría</p>
                      <p className="text-xs">Las acciones del sistema aparecerán aquí.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => {
                const action = ACTION_LABEL[log.action] || { label: log.action, cls: "bg-gray-100 text-gray-600 border-gray-200" };
                return (
                  <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-5 py-3">
                      <p className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDateTime(log.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-tight">{log.userFullName}</p>
                          {log.userId && <p className="text-[10px] text-muted-foreground">ID {log.userId}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", action.cls)}>
                        {action.label}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-foreground">
                        {RESOURCE_LABEL[log.resource] || log.resource}
                        {log.resourceId ? <span className="text-muted-foreground ml-1 text-xs">#{log.resourceId}</span> : null}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5 py-3">
                      <p className="text-xs text-muted-foreground max-w-[260px] truncate" title={log.details || ""}>
                        {log.details || "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                    <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0 text-xs" onClick={() => setPage(p)}>{p}</Button>
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
    </div>
  );
}

export const BIN_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400 text-yellow-950",
  red: "bg-red-500",
  gray: "bg-gray-500",
  brown: "bg-amber-800",
  white: "bg-slate-200 text-slate-900 border border-slate-300",
  orange: "bg-orange-500"
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  resident: "Residente"
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada"
};

export function formatWeight(kg: number | null | undefined): string {
  if (kg == null) return "0.00 kg";
  return `${kg.toFixed(2)} kg`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", { 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

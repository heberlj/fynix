/** Grupos de tonos (claro → oscuro) para personalizar categorías */
export const GRUPOS_COLORES_CATEGORIA = [
  {
    nombre: "Rojo",
    tonos: ["#fecaca", "#f87171", "#ef4444", "#dc2626", "#991b1b"],
  },
  {
    nombre: "Naranja",
    tonos: ["#fed7aa", "#fdba74", "#f97316", "#ea580c", "#9a3412"],
  },
  {
    nombre: "Ámbar",
    tonos: ["#fde68a", "#fcd34d", "#f59e0b", "#d97706", "#92400e"],
  },
  {
    nombre: "Verde",
    tonos: ["#bbf7d0", "#4ade80", "#22c55e", "#16a34a", "#166534"],
  },
  {
    nombre: "Turquesa",
    tonos: ["#a5f3fc", "#22d3ee", "#06b6d4", "#0891b2", "#155e75"],
  },
  {
    nombre: "Azul",
    tonos: ["#bfdbfe", "#60a5fa", "#3b82f6", "#2563eb", "#1e3a8a"],
  },
  {
    nombre: "Índigo",
    tonos: ["#c7d2fe", "#818cf8", "#6366f1", "#4f46e5", "#312e81"],
  },
  {
    nombre: "Violeta",
    tonos: ["#ddd6fe", "#a78bfa", "#8b5cf6", "#7c3aed", "#4c1d95"],
  },
  {
    nombre: "Rosa",
    tonos: ["#fbcfe8", "#f472b6", "#ec4899", "#db2777", "#9d174d"],
  },
  {
    nombre: "Gris",
    tonos: ["#e2e8f0", "#94a3b8", "#64748b", "#475569", "#1e293b"],
  },
] as const;

export function todosLosColoresCategoria(): string[] {
  return GRUPOS_COLORES_CATEGORIA.flatMap((grupo) => [...grupo.tonos]);
}

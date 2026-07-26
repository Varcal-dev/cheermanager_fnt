// Datos de ejemplo para el módulo de Asistencias (CheerManager)

export type EstadoAsistencia = "presente" | "ausente" | "tarde" | "justificado"

export type Grupo = {
  id: string
  nombre: string
}

export type Deportista = {
  id: string
  nombre: string
  grupoId: string
}

export type Horario = {
  id: string
  nombre: string
  grupoId: string
  // Día(s) y hora en texto legible
  dias: string
  hora: string
}

export type RegistroAsistencia = {
  id: string
  deportistaId: string
  horarioId: string
  fecha: string // ISO yyyy-mm-dd
  estado: EstadoAsistencia
}

export const ESTADOS_ASISTENCIA: {
  value: EstadoAsistencia
  label: string
  variant: "default" | "secondary" | "outline" | "destructive"
}[] = [
  { value: "presente", label: "Presente", variant: "default" },
  { value: "ausente", label: "Ausente", variant: "destructive" },
  { value: "tarde", label: "Tarde", variant: "secondary" },
  { value: "justificado", label: "Justificado", variant: "outline" },
]

export const GRUPOS: Grupo[] = [
  { id: "g1", nombre: "Mini Nivel 1" },
  { id: "g2", nombre: "Youth Nivel 2" },
  { id: "g3", nombre: "Junior Nivel 3" },
  { id: "g4", nombre: "Senior Nivel 5" },
]

export const HORARIOS: Horario[] = [
  { id: "h1", nombre: "Mini Nivel 1 — Tarde", grupoId: "g1", dias: "Lun / Mié", hora: "16:00 - 18:00" },
  { id: "h2", nombre: "Youth Nivel 2 — Tarde", grupoId: "g2", dias: "Mar / Jue", hora: "16:00 - 18:30" },
  { id: "h3", nombre: "Junior Nivel 3 — Noche", grupoId: "g3", dias: "Lun / Mié / Vie", hora: "18:30 - 20:30" },
  { id: "h4", nombre: "Senior Nivel 5 — Noche", grupoId: "g4", dias: "Mar / Jue / Vie", hora: "19:00 - 21:30" },
]

export const DEPORTISTAS: Deportista[] = [
  // Mini Nivel 1
  { id: "a1", nombre: "Valentina Ríos", grupoId: "g1" },
  { id: "a2", nombre: "Sara Gómez", grupoId: "g1" },
  { id: "a3", nombre: "Isabella Torres", grupoId: "g1" },
  { id: "a4", nombre: "Emma Castaño", grupoId: "g1" },
  { id: "a5", nombre: "Mariana López", grupoId: "g1" },
  { id: "a6", nombre: "Luciana Vargas", grupoId: "g1" },
  // Youth Nivel 2
  { id: "a7", nombre: "Samuel Herrera", grupoId: "g2" },
  { id: "a8", nombre: "Antonia Ruiz", grupoId: "g2" },
  { id: "a9", nombre: "Daniela Mejía", grupoId: "g2" },
  { id: "a10", nombre: "Tomás Arango", grupoId: "g2" },
  { id: "a11", nombre: "Salomé Duque", grupoId: "g2" },
  // Junior Nivel 3
  { id: "a12", nombre: "Juan José Peña", grupoId: "g3" },
  { id: "a13", nombre: "Camila Restrepo", grupoId: "g3" },
  { id: "a14", nombre: "Sofía Cardona", grupoId: "g3" },
  { id: "a15", nombre: "Martín Ospina", grupoId: "g3" },
  { id: "a16", nombre: "Gabriela Marín", grupoId: "g3" },
  { id: "a17", nombre: "Nicolás Betancur", grupoId: "g3" },
  // Senior Nivel 5
  { id: "a18", nombre: "Andrés Villa", grupoId: "g4" },
  { id: "a19", nombre: "Laura Zapata", grupoId: "g4" },
  { id: "a20", nombre: "Manuela Osorio", grupoId: "g4" },
  { id: "a21", nombre: "Sebastián Cano", grupoId: "g4" },
]

export const HISTORIAL_EJEMPLO: RegistroAsistencia[] = [
  { id: "r1", deportistaId: "a1", horarioId: "h1", fecha: "2026-07-20", estado: "presente" },
  { id: "r2", deportistaId: "a2", horarioId: "h1", fecha: "2026-07-20", estado: "tarde" },
  { id: "r3", deportistaId: "a3", horarioId: "h1", fecha: "2026-07-20", estado: "ausente" },
  { id: "r4", deportistaId: "a4", horarioId: "h1", fecha: "2026-07-20", estado: "presente" },
  { id: "r5", deportistaId: "a5", horarioId: "h1", fecha: "2026-07-20", estado: "justificado" },
  { id: "r6", deportistaId: "a7", horarioId: "h2", fecha: "2026-07-21", estado: "presente" },
  { id: "r7", deportistaId: "a8", horarioId: "h2", fecha: "2026-07-21", estado: "presente" },
  { id: "r8", deportistaId: "a9", horarioId: "h2", fecha: "2026-07-21", estado: "ausente" },
  { id: "r9", deportistaId: "a10", horarioId: "h2", fecha: "2026-07-21", estado: "tarde" },
  { id: "r10", deportistaId: "a12", horarioId: "h3", fecha: "2026-07-20", estado: "presente" },
  { id: "r11", deportistaId: "a13", horarioId: "h3", fecha: "2026-07-20", estado: "presente" },
  { id: "r12", deportistaId: "a14", horarioId: "h3", fecha: "2026-07-20", estado: "justificado" },
  { id: "r13", deportistaId: "a15", horarioId: "h3", fecha: "2026-07-20", estado: "presente" },
  { id: "r14", deportistaId: "a16", horarioId: "h3", fecha: "2026-07-20", estado: "ausente" },
  { id: "r15", deportistaId: "a18", horarioId: "h4", fecha: "2026-07-21", estado: "presente" },
  { id: "r16", deportistaId: "a19", horarioId: "h4", fecha: "2026-07-21", estado: "tarde" },
  { id: "r17", deportistaId: "a20", horarioId: "h4", fecha: "2026-07-21", estado: "presente" },
  { id: "r18", deportistaId: "a21", horarioId: "h4", fecha: "2026-07-21", estado: "presente" },
  { id: "r19", deportistaId: "a1", horarioId: "h1", fecha: "2026-07-15", estado: "presente" },
  { id: "r20", deportistaId: "a2", horarioId: "h1", fecha: "2026-07-15", estado: "presente" },
  { id: "r21", deportistaId: "a12", horarioId: "h3", fecha: "2026-07-15", estado: "ausente" },
  { id: "r22", deportistaId: "a18", horarioId: "h4", fecha: "2026-07-16", estado: "justificado" },
]

export function nombreGrupo(id: string): string {
  return GRUPOS.find((g) => g.id === id)?.nombre ?? "—"
}

export function nombreHorario(id: string): string {
  return HORARIOS.find((h) => h.id === id)?.nombre ?? "—"
}

export function nombreDeportista(id: string): string {
  return DEPORTISTAS.find((d) => d.id === id)?.nombre ?? "—"
}

export function estadoInfo(estado: EstadoAsistencia) {
  return ESTADOS_ASISTENCIA.find((e) => e.value === estado) ?? ESTADOS_ASISTENCIA[0]
}

export function deportistasDeHorario(horarioId: string): Deportista[] {
  const h = HORARIOS.find((x: { id: string }) => x.id === horarioId)
  if (!h) return []
  return DEPORTISTAS.filter((d: { grupoId: string }) => d.grupoId === h.grupoId)
}

// Formato de fecha legible es-CO
export function fechaLegible(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

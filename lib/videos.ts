// ============================================================
// ARCHIVO DE VÍDEOS DEL CONCURSO
// ============================================================
// Para AÑADIR un vídeo: copia un bloque { id, youtubeId, title, participant }
//   y pégalo al final de la lista (antes del ]; final)
//
// Para ELIMINAR un vídeo: borra el bloque completo del participante
//
// youtubeId: es la parte de la URL de YouTube después de "?v="
//   Ejemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ → youtubeId: "dQw4w9WgXcQ"
//
// category (opcional): para filtrar por categoría si quieres usarlo en el futuro
// ============================================================

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  participant: string;
  instagramHandle?: string;
  category?: string;
}

export const videos: Video[] = [
  // ── EJEMPLO DE PARTICIPANTES ──────────────────────────────
  // Reemplaza estos datos con los de tus participantes reales
  {
    id: "1",
    youtubeId: "dQw4w9WgXcQ",
    title: "Mi proyecto de diseño",
    participant: "Ana García",
    instagramHandle: "@anagarcia",
    category: "Diseño Gráfico",
  },
  {
    id: "2",
    youtubeId: "dQw4w9WgXcQ",
    title: "Ilustración digital",
    participant: "Carlos Martínez",
    instagramHandle: "@carlosmartinez",
    category: "Ilustración",
  },
  {
    id: "3",
    youtubeId: "dQw4w9WgXcQ",
    title: "Branding moderno",
    participant: "Lucía Fernández",
    instagramHandle: "@luciafernandez",
    category: "Branding",
  },
  {
    id: "4",
    youtubeId: "dQw4w9WgXcQ",
    title: "Motion graphics",
    participant: "Pablo López",
    instagramHandle: "@pablolopez",
    category: "Motion",
  },
  {
    id: "5",
    youtubeId: "dQw4w9WgXcQ",
    title: "Fotografía creativa",
    participant: "María Sánchez",
    instagramHandle: "@mariasanchez",
    category: "Fotografía",
  },
  {
    id: "6",
    youtubeId: "dQw4w9WgXcQ",
    title: "UI Design concept",
    participant: "Diego Ruiz",
    instagramHandle: "@diegoruiz",
    category: "UI/UX",
  },
  // ── AÑADE MÁS PARTICIPANTES AQUÍ ─────────────────────────
];

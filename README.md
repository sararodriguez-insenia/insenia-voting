# 🎬 INSENIA Voting Platform

Plataforma de votación para el concurso de vídeos de INSENIA Design School Madrid.

---

## 🚀 GUÍA DE DESPLIEGUE PASO A PASO (sin conocimientos técnicos)

### PASO 1 — Crea una cuenta en GitHub

1. Ve a **github.com** → "Sign up"
2. Crea una cuenta gratuita (email + contraseña)

---

### PASO 2 — Crea la base de datos en Supabase

1. Ve a **supabase.com** → "Start your project" → Inicia sesión con GitHub
2. Haz clic en **"New project"**
3. Ponle nombre: `insenia-voting`
4. Elige una contraseña (guárdala aunque no la necesitarás)
5. Región: **West EU (Ireland)** — es la más cercana a España
6. Espera ~2 minutos a que se cree el proyecto

**Configura la base de datos:**
1. En el menú izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia todo el contenido y pégalo en el editor
5. Haz clic en **"Run"** (▶)
6. Deberías ver "Success"

**Copia tus credenciales:**
1. Ve a **Settings → API** (menú izquierdo)
2. Copia estos tres valores:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → es tu `SUPABASE_SERVICE_ROLE_KEY` ⚠️ nunca compartas este

---

### PASO 3 — Sube el código a GitHub

**Opción A (más fácil): GitHub Desktop**
1. Descarga **GitHub Desktop** (desktop.github.com)
2. File → New Repository → Name: `insenia-voting`
3. Arrastra todos los archivos de esta carpeta a la ventana
4. Escribe un mensaje como "primer commit" y haz clic en "Commit to main"
5. Haz clic en "Publish repository" (desmarcar "Keep this code private" si quieres)

**Opción B: en el navegador**
1. Ve a github.com → "New repository" → nombre: `insenia-voting`
2. Haz clic en "uploading an existing file"
3. Arrastra todos los archivos del proyecto
4. Haz clic en "Commit changes"

---

### PASO 4 — Despliega en Vercel

1. Ve a **vercel.com** → "Sign up" con tu cuenta de GitHub
2. Haz clic en **"Add New Project"**
3. Busca tu repositorio `insenia-voting` y haz clic en **"Import"**
4. En la pantalla de configuración, **no cambies nada** excepto lo siguiente:
5. Abre la sección **"Environment Variables"** y añade estas tres variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | (tu Project URL de Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (tu anon key de Supabase) |
   | `SUPABASE_SERVICE_ROLE_KEY` | (tu service role key de Supabase) |

6. Haz clic en **"Deploy"**
7. Espera ~2 minutos. ¡Listo! Tendrás una URL tipo `insenia-voting.vercel.app`

**Para usar un dominio personalizado (opcional):**
- En Vercel → tu proyecto → Settings → Domains → añade tu dominio

---

## ➕ CÓMO AÑADIR VÍDEOS (sin tocar otra cosa)

Abre el archivo `lib/videos.ts` y añade un bloque como este:

```typescript
{
  id: "7",                          // ← número único, siempre mayor que el anterior
  youtubeId: "dQw4w9WgXcQ",        // ← ID del vídeo de YouTube (ver instrucciones abajo)
  title: "Título del proyecto",
  participant: "Nombre Apellido",
  instagramHandle: "@usuario",      // ← opcional
  category: "Diseño Gráfico",       // ← opcional
},
```

**¿Cómo saco el ID de YouTube?**
- URL del vídeo: `https://www.youtube.com/watch?v=`**`dQw4w9WgXcQ`**
- La parte después de `?v=` es el `youtubeId`
- Los vídeos "ocultos" (unlisted) de YouTube funcionan perfectamente

**Después de guardar el archivo:**
- Si usas GitHub Desktop: haz commit y push
- Vercel redesplegará automáticamente en ~1 minuto

---

## 🎨 CÓMO CAMBIAR COSAS DE DISEÑO

### Cambiar colores
Abre `styles/globals.css`. Las líneas 3-20 tienen las variables de color:
```css
--yellow: #f5bf07;        ← color amarillo principal
--dark: #282828;          ← color oscuro del header
```

### Cambiar el logo
Reemplaza los archivos en la carpeta `public/`:
- `logo_blanco.png` → logo blanco sobre fondo oscuro (cabecera)
- `logo_recortado.jpg` → logo color (imagen OG para redes)

### Cambiar textos del hero
En `pages/index.tsx`, busca el bloque `{/* ── HERO ── */}` y edita los textos.

### Cambiar el título de la página
En `pages/index.tsx`, busca `<title>` y cámbialo.

---

## 🔒 SISTEMA ANTIFRAUDE

El sistema usa estas capas de protección:
1. **Fingerprint por IP + User Agent**: identifica al usuario sin cookies ni login
2. **1 voto por día por fingerprint**: verificado en el servidor (no se puede burlar desde el cliente)
3. **Validación server-side**: el cliente nunca puede falsificar votos
4. **Rate limiting por IP** (Vercel lo aplica automáticamente)

Para más seguridad (opcional futuro): añadir Cloudflare Turnstile (CAPTCHA invisible).

---

## 🔄 ACTUALIZAR LA WEB DESPUÉS DEL LANZAMIENTO

Cualquier cambio que hagas en el código:
1. Edita el archivo en cuestión
2. Guarda y sube a GitHub (commit + push)
3. Vercel lo detecta y redespliega automáticamente (~1 min)

Si quieres que yo haga los cambios: dime exactamente qué quieres cambiar y te daré las instrucciones precisas línea a línea.

---

## 📊 VER LAS ESTADÍSTICAS

Para ver los votos directamente en la base de datos:
1. Ve a Supabase → Table Editor → tabla `votes`
2. Ahí verás todos los votos con timestamp y video_id

Para un panel más visual, puedes usar la sección de Analytics de Supabase (gratuita).

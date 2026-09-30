# Guía de Implementación — El Rincón Del Gamer (ERG)

> Guía paso a paso para que un estudiante convierta el mockup actual (frontend puro con `localStorage`) en una aplicación funcional de verdad, usando **Supabase** como backend. Cada fase explica **qué se hace, con qué archivo (ya creado vacío en el proyecto), qué código va ahí, por qué va ahí, y cómo se manejan los errores**.

## 0. Cómo usar esta guía

Este documento es el complemento **práctico** de [ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md), que es el documento de **diseño** (por qué se eligió cada tecnología, el modelo de datos completo, las políticas RLS explicadas). Aquí no se repite el "por qué" en detalle — se referencia esa sección cuando haga falta — y en cambio se avanza en **orden de ejecución**: lo que se programa primero es lo que hace falta para que lo siguiente funcione.

Ya se creó en el proyecto toda la carpeta/archivo vacíos que necesitas (revisa `src/app/`, `src/bd/`, `assets/js/lib/`, `assets/js/redux/`). Cada fase de esta guía te dice exactamente qué archivo llenar y con qué código.

**Regla de oro mientras programas**: si una operación es una simple *lectura* de datos públicos (ver el feed, ver comunidades, ver mi perfil), se hace **directo desde el frontend con `supabase-js`**. Si una operación combina varias reglas de negocio (crear una comunidad y afiliar al fundador en la misma operación, votar sin poder votar dos veces, enviar un mensaje y notificar a los demás), se hace **a través de la API propia en Express**. Esta guía sigue esa regla en cada fase.

## 1. Requisitos previos

- **Node.js** 18 o superior instalado (`node -v` para comprobarlo). Lo necesitas para correr Express y las herramientas de desarrollo, no para el frontend (que sigue siendo HTML/CSS/JS plano, sin build).
- Una cuenta gratuita en [supabase.com](https://supabase.com).
- Conocimientos base de HTML/CSS/JS (ya los tienes, es lo que usa [app.js](../assets/js/app.js) hoy).
- Un editor de código (VS Code recomendado) y una terminal.

## 2. Fase 0 — Preparar el entorno del proyecto

Antes de escribir cualquier línea de lógica de negocio, el proyecto necesita la infraestructura mínima que hoy no tiene (ver sección 11.1 de [ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md#111-quick-wins--scaffolding-de-proyecto-no-requieren-backend)).

### 2.1 Inicializar `package.json`

En la raíz del proyecto:

```bash
npm init -y
```

Esto crea `package.json`, el archivo que declara las dependencias del proyecto y permite instalar librerías con `npm install`. Sin él, cualquier paquete (`express`, `@supabase/supabase-js`) tendría que cargarse manualmente por CDN.

### 2.2 Instalar las dependencias del backend

```bash
npm install express @supabase/supabase-js zod pino pino-http helmet cors express-rate-limit dotenv swagger-jsdoc swagger-ui-express
npm install -D nodemon jest supertest
```

**Qué es cada una y para qué sirve aquí:**

| Paquete | Para qué se usa en ERG |
| :--- | :--- |
| `express` | El framework de la API propia (`src/app/`) |
| `@supabase/supabase-js` | Hablar con Supabase desde el backend (con la `service_role key`) |
| `zod` | Validar el `body` de cada request antes de tocar la base de datos |
| `pino` / `pino-http` | Logging estructurado de cada request y error |
| `helmet` | Cabeceras HTTP seguras por defecto |
| `cors` | Permitir que el frontend llame a la API |
| `express-rate-limit` | Limitar intentos de login/publicación para frenar abuso |
| `dotenv` | Cargar las variables de `.env` en `process.env` |
| `swagger-jsdoc` / `swagger-ui-express` | Documentar los endpoints en `/api/docs` |
| `nodemon` (dev) | Reiniciar el servidor automáticamente al guardar cambios |
| `jest` / `supertest` (dev) | Pruebas unitarias y de integración |

### 2.3 Scripts en `package.json`

Abre `package.json` y agrega dentro de `"scripts"`:

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/app/server.js",
    "start": "node src/app/server.js",
    "test": "jest"
  }
}
```

`"type": "module"` habilita `import`/`export` (ES Modules) en vez de `require`/`module.exports`, que es la sintaxis que se usa en todo el código de esta guía.

### 2.4 `.gitignore`

Crea el archivo `.gitignore` en la raíz con:

```
node_modules/
.env
*.log
```

Esto evita subir al repositorio las dependencias instaladas y, sobre todo, el archivo `.env` que en la Fase 1 va a contener tu `service_role key` — una credencial que **nunca** debe quedar pública.

### 2.5 Variables de entorno

Crea dos archivos en la raíz:

**`.env.example`** (sí se sube al repositorio, sirve de plantilla):

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5500
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

**`.env`** (con tus valores reales — este NO se sube, ya está en `.gitignore`). Lo llenas en la Fase 1 en cuanto tengas el proyecto de Supabase creado.

## 3. Fase 1 — Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Ponle nombre (`erg` o `el-rincon-del-gamer`), elige una contraseña para la base de datos (guárdala, la pide Postgres, no la vuelves a ver) y una región cercana.
3. Espera 1-2 minutos a que aprovisione el proyecto.
4. Ve a **Project Settings → API**. Ahí están las tres credenciales que necesitas:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY` (segura de exponer en el frontend, RLS la limita)
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (secreta, **solo** va en tu `.env` del backend)
5. Pega esos tres valores en tu `.env`.
6. Ve a **Authentication → Providers** y confirma que **Email** esté habilitado (viene activo por defecto). Ve a **Authentication → URL Configuration** y por ahora deja la `Site URL` apuntando a donde sirvas tu frontend en desarrollo (ej. `http://localhost:5500`).

Con esto ya tienes Postgres + Auth + Storage + Realtime funcionando en la nube, sin instalar nada localmente.

## 4. Fase 2 — Modelar la base de datos (migraciones SQL)

### 4.1 Cómo se aplica una migración

La forma más simple para empezar (sin instalar la Supabase CLI todavía) es usar el **SQL Editor** dentro del panel de Supabase: `SQL Editor → New query`, pegar el SQL, y `Run`. Cada bloque de SQL de esta fase también lo guardas en su archivo correspondiente dentro de `src/bd/migrations/` (ya existe la carpeta, vacía) — por ejemplo `0001_roles_usuarios.sql`, `0002_comunidades.sql`, etc. — para que quede versionado en el repositorio y cualquier compañero pueda reconstruir la base de datos desde cero.

> Si más adelante quieres migraciones automatizadas de verdad, instala la Supabase CLI (`npm install -g supabase`) y usa `supabase migration new <nombre>` + `supabase db push`. Para esta guía, copiar/pegar en el SQL Editor es suficiente y más simple de entender mientras aprendes.

### 4.2 Catálogo de roles y perfil de usuario

Archivo sugerido: `src/bd/migrations/0001_roles_usuarios.sql`

```sql
-- Catálogo de roles
create table public.roles (
  id serial primary key,
  nombre varchar(20) unique not null
);
insert into public.roles (nombre) values ('admin'), ('usuario');

-- Perfil de negocio, 1 a 1 con auth.users
create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  handle varchar(30) unique not null,
  nombre varchar(60) not null,
  bio varchar(280) default '',
  avatar_url text,
  rol_id int not null references public.roles(id) default 2, -- 2 = 'usuario'
  estado varchar(10) not null default 'activo' check (estado in ('activo', 'baneado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  eliminado_en timestamptz
);

-- Trigger: cuando alguien se registra en Auth, se crea su fila en usuarios automáticamente
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, handle, nombre)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Explicación de la función y el trigger** (esto es lo que reemplaza al objeto `sampleUsers` hardcodeado de [login.js](../auth/assets/js/login.js)):
- `handle_new_user()` es una función de Postgres que corre **dentro de la base de datos**, no en tu API. `security definer` significa que se ejecuta con permisos elevados, necesarios porque un usuario recién registrado normalmente no podría insertar en `public.usuarios` por sí mismo.
- El trigger `on_auth_user_created` la dispara automáticamente cada vez que Supabase Auth inserta una fila nueva en `auth.users` (es decir, cada `signUp`). Así nunca te olvidas de crear el perfil de negocio: pase lo que pase en el backend o el frontend, Postgres lo garantiza.
- `new` es la fila que se acaba de insertar en `auth.users`; de ahí sacamos `new.id` (el UUID) y `new.email`.

### 4.3 Preferencias, seguimientos, comunidades

Archivo sugerido: `src/bd/migrations/0002_social.sql`

```sql
create table public.preferencias_usuario (
  usuario_id uuid primary key references public.usuarios(id) on delete cascade,
  tema varchar(20) not null default 'neon-blue',
  cursor_gamer boolean not null default false,
  glow_effect boolean not null default true
);

create table public.seguimientos (
  id serial primary key,
  seguidor_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  seguido_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  estado varchar(10) not null default 'pendiente' check (estado in ('pendiente', 'aceptado')),
  creado_en timestamptz not null default now(),
  unique (seguidor_usuario_id, seguido_usuario_id)
);

create table public.comunidades (
  id serial primary key,
  nombre varchar(80) not null,
  categoria varchar(60) not null,
  descripcion varchar(500) not null,
  avatar_url text,
  banner_url text,
  creador_usuario_id uuid not null references public.usuarios(id),
  creado_en timestamptz not null default now()
);

create table public.comunidad_miembros (
  id serial primary key,
  comunidad_id int not null references public.comunidades(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  rol_comunidad varchar(10) not null default 'miembro' check (rol_comunidad in ('fundador', 'miembro')),
  unido_en timestamptz not null default now(),
  unique (comunidad_id, usuario_id)
);
```

### 4.4 Publicaciones, encuestas, comentarios, likes

Archivo sugerido: `src/bd/migrations/0003_feed.sql`

```sql
create table public.publicaciones (
  id serial primary key,
  autor_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  comunidad_id int references public.comunidades(id) on delete cascade, -- null = feed general
  contenido text,
  enlace_url text,
  media_url text,
  media_tipo varchar(10) check (media_tipo in ('imagen', 'video')),
  creado_en timestamptz not null default now(),
  editado_en timestamptz,
  eliminado_en timestamptz
);
create index idx_publicaciones_comunidad_fecha on public.publicaciones (comunidad_id, creado_en desc);

create table public.encuestas (
  id serial primary key,
  publicacion_id int unique not null references public.publicaciones(id) on delete cascade,
  pregunta varchar(200) not null
);

create table public.encuesta_opciones (
  id serial primary key,
  encuesta_id int not null references public.encuestas(id) on delete cascade,
  texto varchar(100) not null
);

create table public.encuesta_votos (
  id serial primary key,
  encuesta_id int not null references public.encuestas(id) on delete cascade,
  opcion_id int not null references public.encuesta_opciones(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (encuesta_id, usuario_id) -- un voto por encuesta, sin importar la opción
);

create table public.comentarios (
  id serial primary key,
  publicacion_id int not null references public.publicaciones(id) on delete cascade,
  autor_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  contenido varchar(500) not null,
  creado_en timestamptz not null default now(),
  eliminado_en timestamptz
);

create table public.likes (
  id serial primary key,
  publicacion_id int not null references public.publicaciones(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_en timestamptz not null default now(),
  unique (publicacion_id, usuario_id) -- un like por post y por usuario
);
```

### 4.5 Chat, notificaciones, moderación

Archivo sugerido: `src/bd/migrations/0004_chat_moderacion.sql`

```sql
create table public.conversaciones (
  id serial primary key,
  tipo varchar(10) not null check (tipo in ('privada', 'grupal')),
  nombre varchar(80), -- solo aplica si es grupal
  creado_en timestamptz not null default now()
);

create table public.conversacion_participantes (
  id serial primary key,
  conversacion_id int not null references public.conversaciones(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  unido_en timestamptz not null default now(),
  unique (conversacion_id, usuario_id)
);

create table public.mensajes (
  id serial primary key,
  conversacion_id int not null references public.conversaciones(id) on delete cascade,
  autor_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  contenido varchar(2000) not null,
  creado_en timestamptz not null default now()
);
create index idx_mensajes_conversacion_fecha on public.mensajes (conversacion_id, creado_en);

create table public.notificaciones (
  id serial primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo varchar(30) not null,
  contenido varchar(280) not null,
  referencia_tipo varchar(30),
  referencia_id int,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.reportes_moderacion (
  id serial primary key,
  denunciante_usuario_id uuid not null references public.usuarios(id) on delete cascade,
  tipo_objetivo varchar(20) not null check (tipo_objetivo in ('publicacion', 'comentario', 'usuario', 'comunidad')),
  objetivo_id int not null,
  motivo varchar(500) not null,
  estado varchar(15) not null default 'pendiente' check (estado in ('pendiente', 'revisado', 'descartado')),
  revisado_por_usuario_id uuid references public.usuarios(id),
  creado_en timestamptz not null default now()
);
```

Con estos 4 archivos ejecutados en orden en el SQL Editor, ya tienes las 14 tablas + 1 catálogo descritas en la sección 6 de [ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md#6-base-de-datos-relacional).

## 5. Fase 3 — Row Level Security (RLS)

### 5.1 Por qué se hace ahora, antes de programar nada más

Si te saltas esta fase y empiezas a programar el frontend, cualquier persona con la `anon key` (que es pública, va en tu HTML) podría leer o modificar **cualquier fila de cualquier tabla**, porque por defecto Postgres no filtra nada. RLS es la razón por la que la `anon key` es segura de exponer: cada tabla define explícitamente qué puede ver/tocar cada usuario.

### 5.2 Helpers — `src/bd/policies/00_helpers.sql`

Copia esto en el archivo (ya creado, vacío) y ejecútalo en el SQL Editor:

```sql
create or replace function public.rol_actual()
returns text
language sql stable security definer set search_path = public
as $$
  select r.nombre from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.id = auth.uid()
$$;

create or replace function public.es_miembro_comunidad(p_comunidad_id int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.comunidad_miembros
    where comunidad_id = p_comunidad_id and usuario_id = auth.uid()
  )
$$;

create or replace function public.es_participante_conversacion(p_conversacion_id int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.conversacion_participantes
    where conversacion_id = p_conversacion_id and usuario_id = auth.uid()
  )
$$;
```

`auth.uid()` es una función que da Supabase: devuelve el UUID del usuario dueño del JWT que hizo la petición (o `null` si no hay sesión). Es la pieza central de todo RLS en Supabase.

### 5.3 Políticas por tabla

El contenido completo de cada política ya está redactado y explicado en la [sección 4.3 de ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md#43-row-level-security-rls-la-autorización-a-nivel-de-datos). El trabajo de esta fase es mecánico:

1. Abre cada archivo ya creado en `src/bd/policies/` (`usuarios.sql`, `preferencias_usuario.sql`, `seguimientos.sql`, `comunidades.sql`, `comunidad_miembros.sql`, `publicaciones.sql`, `encuestas.sql`, `comentarios.sql`, `likes.sql`, `conversaciones.sql`, `notificaciones.sql`, `reportes_moderacion.sql`).
2. Copia el bloque SQL correspondiente de la sección 4.3 del documento de arquitectura.
3. Pégalo en el archivo y ejecútalo en el SQL Editor de Supabase.
4. Para `encuestas.sql`, además de la tabla `encuestas`, agrega el mismo patrón para `encuesta_opciones` y `encuesta_votos` (lectura pública, escritura solo del propio usuario/autor del post):

```sql
alter table public.encuestas enable row level security;
create policy "encuesta_select_publica" on public.encuestas for select using (true);

alter table public.encuesta_opciones enable row level security;
create policy "opcion_select_publica" on public.encuesta_opciones for select using (true);

alter table public.encuesta_votos enable row level security;
create policy "voto_select_publico" on public.encuesta_votos for select using (true);
create policy "voto_insert_propio" on public.encuesta_votos
for insert with check (usuario_id = auth.uid());
```

### 5.4 Cómo comprobar que una política funciona

En el SQL Editor puedes simular ser un usuario específico:

```sql
select set_config('request.jwt.claim.sub', '<uuid-de-un-usuario>', true);
select * from public.publicaciones; -- ahora corre "como si fueras" ese usuario
```

Si una tabla que debería estar protegida devuelve filas que no le corresponden a ese usuario, la política tiene un error — revísala antes de seguir.

## 6. Fase 4 — Buckets de Storage

En el panel de Supabase, ve a **Storage** y crea 3 buckets (botón "New bucket"):

| Bucket | Público | Para qué |
| :--- | :--- | :--- |
| `avatares` | Sí | Foto de perfil de cada usuario |
| `comunidades` | Sí | Avatar y banner de cada comunidad |
| `publicaciones` | Sí | Imagen/video adjunto a un post |

Se marcan como públicos porque en una red social las imágenes de perfil/posts son visibles para cualquiera que vea el contenido — igual que hoy las imágenes vienen de `ui-avatars.com`/`unsplash.com` sin restricción. La protección real de "quién puede subir" no está en si el archivo es legible, sino en las **políticas de Storage** (equivalentes a RLS, pero para archivos):

```sql
-- Cualquier autenticado puede subir a su propia carpeta dentro del bucket
create policy "avatar_insert_propio" on storage.objects
for insert with check (
  bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatar_select_publico" on storage.objects
for select using (bucket_id = 'avatares');
```

Esto se ejecuta también en el SQL Editor. La convención `(storage.foldername(name))[1] = auth.uid()::text` asume que subes los archivos con una ruta tipo `avatares/<uuid-del-usuario>/foto.png` — así cada usuario solo puede escribir dentro de su propia carpeta.

## 7. Fase 5 — Conectar el frontend a Supabase

### 7.1 Cargar `supabase-js` sin bundler

Como el proyecto no usa un empaquetador (Webpack/Vite), se carga la build ESM de `supabase-js` directo desde un CDN dentro de un `<script type="module">`. No hace falta `npm install` de este paquete en el frontend (esa instalación de la Fase 0 es solo para el backend Express).

### 7.2 `assets/js/lib/supabaseClient.js`

Este archivo ya existe vacío. Complétalo así:

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// La anon key es pública y segura de exponer: RLS decide qué puede hacer.
const SUPABASE_URL = 'https://<tu-proyecto>.supabase.co';
const SUPABASE_ANON_KEY = '<tu-anon-key>';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,   // guarda la sesión para que sobreviva a un refresh de página
    autoRefreshToken: true, // renueva el JWT antes de que expire
  },
});
```

> Sustituye `SUPABASE_URL` y `SUPABASE_ANON_KEY` por los valores reales de tu proyecto (Fase 1). Como es la `anon key`, no pasa nada si queda en el código del frontend — es la contraparte de la `service_role key`, que **nunca** va aquí.

### 7.3 Cómo referenciarlo desde cada página

Cada HTML lo carga con `type="module"` y la ruta relativa correspondiente hasta `assets/js/lib/supabaseClient.js`:

```html
<!-- Desde index.html -->
<script type="module" src="assets/js/lib/supabaseClient.js"></script>

<!-- Desde auth/login.html -->
<script type="module" src="../assets/js/lib/supabaseClient.js"></script>

<!-- Desde auth/panel_control/admin/index.html -->
<script type="module" src="../../../assets/js/lib/supabaseClient.js"></script>
```

Como es un módulo ES, cualquier otro script que lo necesite lo importa con `import { supabase } from '.../supabaseClient.js'` en vez de depender de una variable global.

## 8. Fase 6 — Autenticación real

### 8.1 Reescribir `login.js`

Reemplaza el contenido de [login.js](../auth/assets/js/login.js): quita el objeto `sampleUsers` y la validación manual, y usa Supabase Auth. El manejo de errores es el punto clave de esta fase.

```js
import { supabase } from '../../assets/js/lib/supabaseClient.js';

const loginForm = document.getElementById('loginForm');

// Traduce los mensajes de error de Supabase (en inglés) a algo entendible en español
function mensajeDeError(error) {
  const mapa = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
  };
  return mapa[error.message] || 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const submitBtn = loginForm.querySelector('.btn-submit');

  submitBtn.disabled = true; // evita doble click mientras responde el servidor

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(mensajeDeError(error)); // en el proyecto real, reemplazar por el showToast() de app.js
      return;
    }

    // data.session ya quedó guardada por supabase-js (persistSession: true)
    window.location.href = '../index.html';
  } catch (err) {
    // Error de red, no de credenciales (ej. sin internet)
    console.error('Error de red en login:', err);
    alert('No se pudo conectar con el servidor. Revisa tu conexión.');
  } finally {
    submitBtn.disabled = false;
  }
});
```

**Por qué esta estructura de manejo de errores:**
- `try/catch` separa dos tipos de fallo muy distintos: `error` (la petición llegó al servidor, pero Supabase la rechazó — ej. contraseña incorrecta) contra una excepción atrapada por `catch` (la petición ni siquiera llegó — ej. no hay internet). Mezclarlos confunde al usuario con mensajes que no corresponden al problema real.
- `mensajeDeError()` centraliza la traducción de mensajes técnicos a mensajes que un usuario entiende, en un solo lugar — así no repites `if/else` de mensajes en cada formulario.
- `finally` garantiza que el botón se reactive pase lo que pase, evitando que un error deje el formulario "trabado".

### 8.2 Registro — `auth/register.html`

No existe todavía; créala como una copia de la estructura visual de [login.html](../auth/login.html) cambiando el formulario:

```html
<form id="registerForm">
  <div class="input-group"><input type="text" id="nombre" placeholder="Nombre de jugador*" required></div>
  <div class="input-group"><input type="email" id="email" placeholder="Correo electrónico*" required></div>
  <div class="input-group"><input type="password" id="password" placeholder="Contraseña* (mínimo 6 caracteres)" required minlength="6"></div>
  <button type="submit" class="btn-submit"><span>Crear cuenta</span></button>
</form>
```

Y su script, `auth/assets/js/register.js`:

```js
import { supabase } from '../../assets/js/lib/supabaseClient.js';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } }, // llega como raw_user_meta_data en el trigger de la Fase 2
  });

  if (error) {
    alert(error.message === 'User already registered'
      ? 'Ese correo ya tiene una cuenta.'
      : 'No se pudo crear la cuenta. Intenta de nuevo.');
    return;
  }

  alert('Cuenta creada. Revisa tu correo para confirmarla.');
  window.location.href = 'login.html';
});
```

`options: { data: { nombre } }` es lo que el trigger `handle_new_user()` de la Fase 2 lee como `new.raw_user_meta_data->>'nombre'` para ponerle nombre real al perfil en vez del genérico `user_xxxxxxxx`.

### 8.3 Recuperar contraseña

En [login.html](../auth/login.html), cambia el enlace `<a href="#" class="forgot-password">` por `<a href="forgot-password.html" class="forgot-password">` y crea esa página con un formulario simple de correo:

```js
import { supabase } from '../../assets/js/lib/supabaseClient.js';

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth/reset-password.html',
  });

  // Por seguridad, no reveles si el correo existe o no en el sistema
  alert('Si el correo existe, te enviamos un enlace para restablecer tu contraseña.');
});
```

### 8.4 Proteger `index.html` con la sesión real

Reemplaza el bloque actual:

```html
<script>
    if (!localStorage.getItem('erg_profile')) {
        window.location.href = "auth/login.html";
    }
</script>
```

por una comprobación real de sesión, dentro de un módulo:

```html
<script type="module">
  import { supabase } from './assets/js/lib/supabaseClient.js';

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'auth/login.html';
  }
</script>
```

`getSession()` lee la sesión ya persistida por `supabase-js` (localStorage propio, gestionado internamente — no confundir con el `erg_profile` manual de hoy). Es asíncrona porque puede necesitar renovar el token contra el servidor.

### 8.5 Mantener la sesión sincronizada mientras la app está abierta

En [app.js](../assets/js/app.js), agrega al inicio del `DOMContentLoaded`:

```js
import { supabase } from './lib/supabaseClient.js';

let sesionActual = null;

supabase.auth.onAuthStateChange((event, session) => {
  sesionActual = session;
  if (event === 'SIGNED_OUT') {
    window.location.href = 'auth/login.html';
  }
});
```

Esto reacciona automáticamente si el token expira, si se cierra sesión en otra pestaña, o si se renueva el access token — algo que el `localStorage.getItem('erg_profile')` de hoy no puede hacer porque no sabe nada de expiración.

### 8.6 Cerrar sesión

Reemplaza en `btnSalir` (dentro de [app.js](../assets/js/app.js)):

```js
btnSalir.addEventListener('click', async () => {
  document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
  showToast('Cerrando sesión...', 'linear-gradient(135deg, var(--accent-secondary), #b026ff)');

  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error cerrando sesión:', error); // no bloqueante: igual redirige

  setTimeout(() => {
    window.location.href = 'auth/login.html';
  }, 1500);
});
```

## 9. Fase 7 — Perfil de usuario y roles reales

### 9.1 Cargar el perfil desde la tabla `usuarios`, no desde `localStorage`

Reemplaza `loadProfile()` en [app.js](../assets/js/app.js):

```js
async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error } = await supabase
    .from('usuarios')
    .select('handle, nombre, bio, avatar_url, rol_id, roles(nombre)')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('No se pudo cargar el perfil:', error.message);
    return null;
  }

  // pinta headerAvatar, postAreaAvatar, etc. igual que antes, usando perfil.avatar_url, perfil.nombre...
  const esAdmin = perfil.roles.nombre === 'admin';
  document.getElementById('adminPanelLink').style.display = esAdmin ? 'block' : 'none';

  return perfil;
}
```

`roles(nombre)` es un **join implícito**: `supabase-js` sabe que `usuarios.rol_id` referencia a `roles.id` (por la `foreign key` de la Fase 2) y trae el nombre del rol en la misma consulta, sin que tengas que hacer una segunda llamada.

### 9.2 Guardar cambios del perfil

En [auth/panel_control/usuario/index.html](../auth/panel_control/usuario/index.html), el botón "Guardar Perfil" pasa de escribir en `localStorage` a un `update`:

```js
btnSave.addEventListener('click', async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('usuarios')
    .update({
      nombre: document.getElementById('inputName').value,
      bio: document.getElementById('inputBio').value,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    alert('No se pudo guardar el perfil: ' + error.message);
    return;
  }

  btnSave.textContent = 'Guardado!';
  setTimeout(() => window.location.reload(), 1000);
});
```

Esta operación **no** pasa por Express: es una escritura simple sobre una fila propia, y la política `usuarios_update_propio` de la Fase 3 (sección 5.3) ya garantiza que un usuario solo puede editar su propia fila.

## 10. Fase 8 — Subir archivos a Supabase Storage

Ejemplo con el avatar (mismo patrón aplica a banner de comunidad y media de publicaciones, cambiando el bucket):

```js
async function subirAvatar(file, usuarioId) {
  const extension = file.name.split('.').pop();
  const ruta = `${usuarioId}/${Date.now()}.${extension}`; // carpeta = uuid del usuario (ver política de Storage)

  const { error: errorSubida } = await supabase.storage
    .from('avatares')
    .upload(ruta, file, { upsert: true });

  if (errorSubida) {
    throw new Error('No se pudo subir la imagen: ' + errorSubida.message);
  }

  const { data } = supabase.storage.from('avatares').getPublicUrl(ruta);
  return data.publicUrl; // esto es lo que guardas en usuarios.avatar_url
}
```

Uso dentro del handler del `<input type="file">` (reemplaza el `FileReader`/`base64` actual):

```js
fileAvatar.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const url = await subirAvatar(file, user.id);
    avatarPreview.src = url; // vista previa inmediata
    newAvatarUrl = url;      // se guarda en la tabla usuarios cuando se pulse "Guardar Perfil"
  } catch (err) {
    alert(err.message);
  }
});
```

Este flujo reemplaza por completo el `reader.readAsDataURL(file)` que hoy mete el archivo entero, codificado en base64, dentro de `localStorage` — con el límite de 5-10 MB por navegador que ya causa el mensaje "Ocupa demasiada memoria interna" en el código actual.

## 11. Fase 9 — La API Express: arquitectura, errores, primer endpoint

### 11.1 Por qué en capas

`routes` → `controllers` → `services`. Cada capa tiene una sola responsabilidad:

- **`routes/*.routes.js`**: solo declara qué URL + verbo HTTP dispara qué función. No tiene lógica.
- **`controllers/*.controller.js`**: recibe `req`/`res`, valida la forma del request, llama al `service`, y decide qué responder. No sabe cómo se guarda nada en la base de datos.
- **`services/*.service.js`**: la lógica de negocio pura (habla con Supabase, aplica las reglas). No sabe qué es `req` ni `res` — por eso se puede probar con Jest sin levantar un servidor HTTP (ver Fase 15).

Esto es lo que permite, por ejemplo, cambiar mañana de Express a otro framework sin tocar una sola línea de `services/`.

### 11.2 `src/app/config/env.js` — cargar y validar variables de entorno

```js
import 'dotenv/config';
import { z } from 'zod';

const esquemaEnv = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.string().default('3000'),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
});

// Si falta una variable obligatoria, el servidor no arranca — mejor fallar rápido y claro
// que arrancar "a medias" y fallar en un momento impredecible más adelante.
export const env = esquemaEnv.parse(process.env);
```

### 11.3 `src/app/config/supabaseAdmin.js` — cliente con la `service_role key`

```js
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Este cliente IGNORA las políticas RLS: solo se usa aquí, en el backend, nunca en el frontend.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, // el backend no necesita mantener sesión de navegador
});
```

### 11.4 `src/lib/AppError.js` — el manejo de errores, explicado a fondo

```js
export class AppError extends Error {
  constructor(codigoHttp, codigoError, mensaje) {
    super(mensaje);
    this.codigoHttp = codigoHttp; // ej. 404, 409, 403
    this.codigoError = codigoError; // ej. 'COMUNIDAD_NO_ENCONTRADA' — para que el frontend lo distinga sin parsear texto
    this.esOperacional = true; // marca "error esperado del negocio", distinto de un bug
  }
}
```

**Por qué una clase y no simplemente `throw new Error('mensaje')`:**
- `codigoHttp` le dice a Express qué status devolver (`404`, `409`, `422`...) sin que el `controller` tenga que adivinarlo leyendo el texto del mensaje.
- `codigoError` es una cadena estable (`VOTO_DUPLICADO`, `COMUNIDAD_NO_ENCONTRADA`) que el **frontend** puede usar en un `switch` para decidir qué hacer, sin depender del texto exacto del mensaje (que puede cambiar de idioma o redacción).
- `esOperacional = true` distingue un error de negocio esperado (ej. "ya votaste") de un bug real (ej. una referencia `null` no controlada). Esto importa en el siguiente archivo.

### 11.5 `src/app/middlewares/error.middleware.js`

```js
import { AppError } from '../../lib/AppError.js';

export function errorMiddleware(err, req, res, next) {
  req.log?.error(err); // Pino ya adjuntó req.log gracias a pino-http

  if (err instanceof AppError) {
    return res.status(err.codigoHttp).json({
      success: false,
      error: { code: err.codigoError, message: err.message },
    });
  }

  // Error no controlado (bug real): nunca se expone el detalle interno al cliente
  return res.status(500).json({
    success: false,
    error: { code: 'ERROR_INTERNO', message: 'Ocurrió un error inesperado. Intenta más tarde.' },
  });
}
```

Este middleware se registra **al final** de todos los `app.use(...)` en `app.js` (Express reconoce un middleware de error por tener 4 parámetros: `(err, req, res, next)`). Cualquier `throw` o `Promise` rechazada dentro de un `controller` async (si usas el patrón `asyncHandler` de abajo) termina aquí.

### 11.6 `src/app/middlewares/auth.middleware.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // formato: "Bearer <token>"

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'NO_AUTENTICADO', 'Falta el token de autenticación.'));
  }

  const token = authHeader.slice('Bearer '.length);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return next(new AppError(401, 'TOKEN_INVALIDO', 'La sesión no es válida o expiró.'));
  }

  const { data: perfil } = await supabaseAdmin
    .from('usuarios')
    .select('rol_id, roles(nombre)')
    .eq('id', user.id)
    .single();

  req.user = { id: user.id, rol: perfil?.roles?.nombre ?? 'usuario' };
  next();
}
```

`next(new AppError(...))` es el patrón estándar de Express para pasar un error al `errorMiddleware` sin tener que hacer `try/catch` en cada middleware — Express detecta que se le pasó un argumento a `next()` y salta directo al manejador de errores.

### 11.7 `src/app/middlewares/roles.middleware.js`

```js
import { AppError } from '../../lib/AppError.js';

export function soloRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new AppError(403, 'ROL_NO_AUTORIZADO', 'No tienes permiso para esta acción.'));
    }
    next();
  };
}
```

Se usa como `soloRol('admin')` en las rutas que lo necesiten (ver Fase 10.7).

### 11.8 `src/app/middlewares/rateLimit.middleware.js`

```js
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const limitadorGeneral = rateLimit({
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS),
  max: Number(env.RATE_LIMIT_MAX),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'DEMASIADAS_PETICIONES', message: 'Espera un momento antes de volver a intentar.' } },
});
```

### 11.9 Un helper para no repetir `try/catch` en cada controller

`src/lib/asyncHandler.js`:

```js
// Envuelve un controller async: si la Promise rechaza, el error va directo al errorMiddleware
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### 11.10 `src/app/app.js`

```js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { limitadorGeneral } from './middlewares/rateLimit.middleware.js';
import comunidadesRouter from './routes/comunidades.routes.js';
import publicacionesRouter from './routes/publicaciones.routes.js';
import encuestasRouter from './routes/encuestas.routes.js';
import mensajesRouter from './routes/mensajes.routes.js';
import reportesRouter from './routes/reportes.routes.js';
import adminRouter from './routes/admin.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(pinoHttp());
app.use(limitadorGeneral);

app.get('/api/v1/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/comunidades', comunidadesRouter);
app.use('/api/v1/publicaciones', publicacionesRouter);
app.use('/api/v1/encuestas', encuestasRouter);
app.use('/api/v1/mensajes', mensajesRouter);
app.use('/api/v1/reportes', reportesRouter);
app.use('/api/v1/admin', adminRouter);

// Siempre al final: captura todo lo que los routers anteriores dejaron pasar como error
app.use(errorMiddleware);
```

### 11.11 `src/app/server.js`

```js
import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`ERG API escuchando en http://localhost:${env.PORT}`);
});
```

Arráncalo con `npm run dev` (usa `nodemon`, definido en la Fase 0.3).

### 11.12 Primer endpoint completo: `POST /api/v1/comunidades`

Este es el ejemplo de referencia — el resto de endpoints de la Fase 10 siguen exactamente este mismo patrón de 4 archivos.

**`src/app/validators/comunidad.validator.js`**

```js
import { z } from 'zod';

export const crearComunidadSchema = z.object({
  nombre: z.string().min(3).max(80),
  categoria: z.string().min(2).max(60),
  descripcion: z.string().min(10).max(500),
  avatar_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});
```

**`src/app/services/comunidades.service.js`**

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function crearComunidad(datos, usuarioId) {
  // 1. Crear la comunidad
  const { data: comunidad, error: errorComunidad } = await supabaseAdmin
    .from('comunidades')
    .insert({ ...datos, creador_usuario_id: usuarioId })
    .select()
    .single();

  if (errorComunidad) {
    throw new AppError(500, 'ERROR_CREAR_COMUNIDAD', 'No se pudo crear la comunidad.');
  }

  // 2. Afiliar al creador como fundador — si esto falla, la comunidad queda "huérfana",
  //    por eso ambos pasos viven en un mismo service: es una sola operación de negocio.
  const { error: errorMiembro } = await supabaseAdmin
    .from('comunidad_miembros')
    .insert({ comunidad_id: comunidad.id, usuario_id: usuarioId, rol_comunidad: 'fundador' });

  if (errorMiembro) {
    // Revertimos la comunidad creada para no dejar datos inconsistentes
    await supabaseAdmin.from('comunidades').delete().eq('id', comunidad.id);
    throw new AppError(500, 'ERROR_AFILIAR_FUNDADOR', 'No se pudo completar la creación de la comunidad.');
  }

  return comunidad;
}
```

> Nota para el estudiante: esto es una **transacción manual** (crear + revertir si falla el segundo paso). Postgres soporta transacciones reales con `BEGIN`/`COMMIT` a través de una función `rpc`, que es la forma más robusta de hacerlo — se deja como mejora en la sección de "siguientes pasos" al final de esta guía, porque para aprender el patrón routes→controllers→services el enfoque manual de arriba es más fácil de seguir primero.

**`src/app/controllers/comunidades.controller.js`**

```js
import { crearComunidadSchema } from '../validators/comunidad.validator.js';
import { crearComunidad } from '../services/comunidades.service.js';
import { AppError } from '../../lib/AppError.js';

export async function crearComunidadController(req, res) {
  const parseo = crearComunidadSchema.safeParse(req.body);

  if (!parseo.success) {
    throw new AppError(422, 'DATOS_INVALIDOS', parseo.error.issues[0].message);
  }

  const comunidad = await crearComunidad(parseo.data, req.user.id);

  res.status(201).json({ success: true, data: comunidad });
}
```

`safeParse` (en vez de `parse`) evita que Zod lance una excepción directamente: te da `{ success, data }` o `{ success, error }`, y así el `controller` decide explícitamente qué `AppError` lanzar con un mensaje claro para el usuario.

**`src/app/routes/comunidades.routes.js`**

```js
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { crearComunidadController } from '../controllers/comunidades.controller.js';

const router = Router();

router.post('/', authMiddleware, asyncHandler(crearComunidadController));

export default router;
```

Con esto, `POST /api/v1/comunidades` ya es un endpoint real, protegido (requiere sesión), validado (Zod) y con errores estandarizados.

## 12. Fase 10 — Completar los demás endpoints (mismo patrón)

Replica exactamente la estructura de la Fase 11.12 (`validator` → `service` → `controller` → `route`) para cada uno de estos. Se muestra el `service` de cada uno — que es donde vive la parte interesante de la lógica de negocio — y tú completas el `validator`/`controller`/`route` siguiendo el mismo molde.

### 12.1 Dar/quitar like — `src/app/services/likes.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function alternarLike(publicacionId, usuarioId) {
  const { data: existente } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('publicacion_id', publicacionId)
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  if (existente) {
    await supabaseAdmin.from('likes').delete().eq('id', existente.id);
    return { conLike: false };
  }

  const { data: post } = await supabaseAdmin
    .from('publicaciones')
    .select('autor_usuario_id')
    .eq('id', publicacionId)
    .single();

  if (!post) throw new AppError(404, 'PUBLICACION_NO_ENCONTRADA', 'La publicación no existe.');

  await supabaseAdmin.from('likes').insert({ publicacion_id: publicacionId, usuario_id: usuarioId });

  if (post.autor_usuario_id !== usuarioId) {
    await supabaseAdmin.from('notificaciones').insert({
      usuario_id: post.autor_usuario_id,
      tipo: 'like',
      contenido: 'A alguien le gustó tu publicación',
      referencia_tipo: 'publicacion',
      referencia_id: publicacionId,
    });
  }

  return { conLike: true };
}
```

Nota el patrón "alternar" (*toggle*): se busca si ya existe, y según eso se borra o se crea — así el mismo endpoint sirve para dar y quitar like, y la restricción `unique (publicacion_id, usuario_id)` de la Fase 2 es la última línea de defensa por si dos clics llegan casi al mismo tiempo.

### 12.2 Votar en una encuesta — `src/app/services/encuestas.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function votarEncuesta(encuestaId, opcionId, usuarioId) {
  const { error } = await supabaseAdmin
    .from('encuesta_votos')
    .insert({ encuesta_id: encuestaId, opcion_id: opcionId, usuario_id: usuarioId });

  if (error) {
    // El código 23505 de Postgres = violación de restricción "unique"
    if (error.code === '23505') {
      throw new AppError(409, 'VOTO_DUPLICADO', 'Ya votaste en esta encuesta.');
    }
    throw new AppError(500, 'ERROR_VOTAR', 'No se pudo registrar tu voto.');
  }

  const { data: opciones } = await supabaseAdmin
    .from('encuesta_opciones')
    .select('id, texto, encuesta_votos(count)')
    .eq('encuesta_id', encuestaId);

  return opciones;
}
```

Aquí el manejo de errores **no** revisa primero si ya existe (como en los likes): deja que la restricción `unique` de la base de datos sea la que detecte el duplicado (más confiable ante peticiones simultáneas) y traduce el código de error `23505` de Postgres a un `AppError` con sentido de negocio.

### 12.3 Crear comentario — `src/app/services/comentarios.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function crearComentario(publicacionId, contenido, usuarioId) {
  const { data: post } = await supabaseAdmin
    .from('publicaciones')
    .select('autor_usuario_id')
    .eq('id', publicacionId)
    .single();

  if (!post) throw new AppError(404, 'PUBLICACION_NO_ENCONTRADA', 'La publicación no existe.');

  const { data: comentario, error } = await supabaseAdmin
    .from('comentarios')
    .insert({ publicacion_id: publicacionId, autor_usuario_id: usuarioId, contenido })
    .select()
    .single();

  if (error) throw new AppError(500, 'ERROR_COMENTAR', 'No se pudo publicar el comentario.');

  if (post.autor_usuario_id !== usuarioId) {
    await supabaseAdmin.from('notificaciones').insert({
      usuario_id: post.autor_usuario_id,
      tipo: 'comentario',
      contenido: 'Alguien comentó tu publicación',
      referencia_tipo: 'publicacion',
      referencia_id: publicacionId,
    });
  }

  return comentario;
}
```

### 12.4 Enviar mensaje — `src/app/services/mensajes.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function enviarMensaje(conversacionId, contenido, usuarioId) {
  const { data: participante } = await supabaseAdmin
    .from('conversacion_participantes')
    .select('id')
    .eq('conversacion_id', conversacionId)
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  if (!participante) {
    throw new AppError(403, 'NO_PARTICIPANTE', 'No perteneces a esta conversación.');
  }

  const { data: mensaje, error } = await supabaseAdmin
    .from('mensajes')
    .insert({ conversacion_id: conversacionId, autor_usuario_id: usuarioId, contenido })
    .select()
    .single();

  if (error) throw new AppError(500, 'ERROR_ENVIAR_MENSAJE', 'No se pudo enviar el mensaje.');

  // Realtime (Fase 12) se encarga de avisar a los demás participantes sin código adicional aquí:
  // Supabase emite el evento INSERT automáticamente a quien esté suscrito a esta tabla.
  return mensaje;
}
```

### 12.5 Crear una denuncia — `src/app/services/reportes.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function crearReporte({ tipoObjetivo, objetivoId, motivo }, denuncianteId) {
  const { data: reporte, error } = await supabaseAdmin
    .from('reportes_moderacion')
    .insert({
      tipo_objetivo: tipoObjetivo,
      objetivo_id: objetivoId,
      motivo,
      denunciante_usuario_id: denuncianteId,
    })
    .select()
    .single();

  if (error) throw new AppError(500, 'ERROR_CREAR_REPORTE', 'No se pudo registrar la denuncia.');
  return reporte;
}
```

### 12.6 Endpoints de administración — `src/app/services/admin.service.js`

```js
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { AppError } from '../../lib/AppError.js';

export async function cambiarEstadoUsuario(usuarioId, nuevoEstado) {
  if (!['activo', 'baneado'].includes(nuevoEstado)) {
    throw new AppError(422, 'ESTADO_INVALIDO', 'El estado debe ser "activo" o "baneado".');
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .update({ estado: nuevoEstado })
    .eq('id', usuarioId)
    .select()
    .single();

  if (error) throw new AppError(500, 'ERROR_ACTUALIZAR_USUARIO', 'No se pudo actualizar el usuario.');
  return data;
}

export async function obtenerEstadisticas() {
  const [{ count: totalUsuarios }, { count: postsHoy }, { count: reportesPendientes }] = await Promise.all([
    supabaseAdmin.from('usuarios').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('publicaciones').select('*', { count: 'exact', head: true })
      .gte('creado_en', new Date().toISOString().slice(0, 10)),
    supabaseAdmin.from('reportes_moderacion').select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
  ]);

  return { totalUsuarios, postsHoy, reportesPendientes };
}
```

Estas dos funciones reemplazan, respectivamente, los botones "Banear"/"Restaurar" sin `onclick` y los números `42.5K`/`1,284`/`3` escritos a mano en [admin/index.html](../auth/panel_control/admin/index.html). La ruta de `cambiarEstadoUsuario` va protegida con `authMiddleware` **y** `soloRol('admin')` (Fase 11.7):

```js
// src/app/routes/admin.routes.js
router.patch('/usuarios/:id/estado', authMiddleware, soloRol('admin'), asyncHandler(cambiarEstadoController));
router.get('/stats', authMiddleware, soloRol('admin'), asyncHandler(statsController));
```

## 13. Fase 11 — Conectar el frontend a los datos reales

### 13.1 Lecturas directas (feed, comunidades) — sin pasar por Express

```js
// Traer el feed general (comunidad_id nulo), más reciente primero
async function cargarFeed() {
  const { data: posts, error } = await supabase
    .from('publicaciones')
    .select(`
      id, contenido, enlace_url, media_url, media_tipo, creado_en,
      usuarios ( handle, nombre, avatar_url ),
      likes ( count ),
      comentarios ( count )
    `)
    .is('comunidad_id', null)
    .order('creado_en', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error cargando el feed:', error.message);
    showToast('No se pudo cargar el feed. Intenta de nuevo.', '#ff4d4d');
    return [];
  }

  return posts;
}
```

### 13.2 Escrituras de negocio — a través de la API Express

Para las operaciones que viven en `src/app/`, el frontend llama con `fetch`, adjuntando el JWT de la sesión activa en el header `Authorization`:

```js
async function llamarApi(ruta, metodo, cuerpo) {
  const { data: { session } } = await supabase.auth.getSession();

  const respuesta = await fetch(`http://localhost:3000/api/v1${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const json = await respuesta.json();

  if (!json.success) {
    // json.error.code y json.error.message vienen del AppError del backend (Fase 9.4)
    throw new Error(json.error.message);
  }

  return json.data;
}

// Uso real, reemplazando btnLaunchCommunity en app.js
btnLaunchCommunity.addEventListener('click', async () => {
  try {
    const nueva = await llamarApi('/comunidades', 'POST', {
      nombre: comFormName.value.trim(),
      categoria: comFormCategory.value.trim(),
      descripcion: comFormDesc.value.trim(),
      avatar_url: currentComAvatarUrl,
      banner_url: currentComBannerUrl,
    });

    showToast(`¡Comunidad "${nueva.nombre}" fundada con éxito!`, 'linear-gradient(135deg, var(--accent-primary), #00bbff)');
    loadCommunities(); // recarga la lista, ahora consultando la tabla real
  } catch (err) {
    showToast(err.message, '#ff4d4d'); // reutiliza el sistema de toasts que ya existe en app.js
  }
});
```

`llamarApi()` centraliza el patrón "pedir el token, llamar, revisar `success`, lanzar si falló" — así cada botón del frontend (publicar, votar, comentar, enviar mensaje, denunciar) se reduce a un `try { await llamarApi(...) } catch { showToast(...) }`, reutilizando el sistema de `showToast()` que **ya existe** en [app.js](../assets/js/app.js) en vez de inventar uno nuevo.

## 14. Fase 12 — Tiempo real con Supabase Realtime

### 14.1 Chat en vivo

```js
function suscribirseAConversacion(conversacionId, alRecibirMensaje) {
  const canal = supabase
    .channel(`conversacion-${conversacionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
      filter: `conversacion_id=eq.${conversacionId}`,
    }, (payload) => {
      alRecibirMensaje(payload.new); // payload.new es la fila recién insertada
    })
    .subscribe();

  return () => supabase.removeChannel(canal); // función de "limpieza" al cerrar el chat
}
```

### 14.2 Muro de comunidad en vivo

Mismo patrón, cambiando la tabla y el filtro:

```js
supabase
  .channel(`comunidad-${comunidadId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'publicaciones',
    filter: `comunidad_id=eq.${comunidadId}`,
  }, (payload) => pintarNuevoPostEnElMuro(payload.new))
  .subscribe();
```

Esto reemplaza tener que llamar `loadCommunityPosts()` manualmente cada vez: en cuanto alguien más publica, el evento llega solo.

## 15. Fase 13 — (Opcional) Redux Toolkit

Esta fase es **opcional** y conviene dejarla para el final, cuando ya todo funcione con `supabase-js` + funciones sueltas como en las fases anteriores. Redux Toolkit aporta valor cuando el estado se vuelve difícil de sincronizar entre muchas partes de la pantalla (ej. el contador de notificaciones en el header, la lista completa en el dropdown, y una página dedicada, todos mostrando el mismo dato) — no es indispensable para que el proyecto funcione.

**Importante**: Redux Toolkit está pensado para proyectos con un empaquetador (Vite, Webpack). Sin uno, usarlo desde un CDN es más incómodo. Si decides seguir esta fase, lo más simple es primero agregar Vite al proyecto (`npm create vite@latest` en una carpeta aparte, o `npm install vite` y un `vite.config.js` mínimo) para poder hacer `import { configureStore } from '@reduxjs/toolkit'` de forma normal.

Ejemplo mínimo de `assets/js/redux/slices/authSlice.js` una vez tengas el bundler:

```js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { usuario: null, rol: null, cargando: true },
  reducers: {
    sesionEstablecida(state, action) {
      state.usuario = action.payload.usuario;
      state.rol = action.payload.rol;
      state.cargando = false;
    },
    sesionCerrada(state) {
      state.usuario = null;
      state.rol = null;
    },
  },
});

export const { sesionEstablecida, sesionCerrada } = authSlice.actions;
export default authSlice.reducer;
```

Y se conecta al `onAuthStateChange` de la Fase 8.5 despachando `sesionEstablecida`/`sesionCerrada` en vez de solo actualizar una variable local. El resto de slices (`feedSlice`, `comunidadesSlice`, `chatSlice`, `notificacionesSlice`) siguen el mismo patrón: un estado inicial + reducers que actualizan ese estado a partir de lo que llega de Supabase.

## 16. Fase 14 — Panel de administración con datos reales

En [admin/index.html](../auth/panel_control/admin/index.html), reemplaza los valores fijos del HTML por una carga real al abrir la página:

```html
<script type="module">
  import { supabase } from '../../../assets/js/lib/supabaseClient.js';

  const { data: { session } } = await supabase.auth.getSession();
  const respuesta = await fetch('http://localhost:3000/api/v1/admin/stats', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const { success, data, error } = await respuesta.json();

  if (!success) {
    alert('No se pudieron cargar las estadísticas: ' + error.message);
  } else {
    document.querySelector('.header-stats .stat-card:nth-child(1) .value').textContent = data.totalUsuarios;
    document.querySelector('.header-stats .stat-card:nth-child(2) .value').textContent = data.postsHoy;
    document.querySelector('.header-stats .stat-card:nth-child(4) .value').textContent = data.reportesPendientes;
  }
</script>
```

Los botones de la tabla ("Editar"/"Banear") pasan de no tener `onclick` a llamar `llamarApi('/admin/usuarios/' + id + '/estado', 'PATCH', { estado: 'baneado' })` (función definida en la Fase 11.2).

## 17. Fase 15 — Pruebas automatizadas

### 17.1 Prueba unitaria de un `service`

`src/tests/unit/likes.service.test.js`:

```js
import { jest } from '@jest/globals';

// Se simula (mock) el cliente de Supabase para no depender de una base de datos real en este test
jest.unstable_mockModule('../../app/config/supabaseAdmin.js', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const { alternarLike } = await import('../../app/services/likes.service.js');
const { supabaseAdmin } = await import('../../app/config/supabaseAdmin.js');

test('si ya existe el like, alternarLike lo quita', async () => {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 1 } }) }) }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
  });

  const resultado = await alternarLike(10, 'uuid-usuario');
  expect(resultado.conLike).toBe(false);
});
```

### 17.2 Prueba de integración de un endpoint

`src/tests/integration/comunidades.test.js`:

```js
import request from 'supertest';
import { app } from '../../app/app.js';

test('POST /api/v1/comunidades sin token responde 401', async () => {
  const respuesta = await request(app)
    .post('/api/v1/comunidades')
    .send({ nombre: 'Test', categoria: 'RPG', descripcion: 'Una comunidad de prueba con más de 10 caracteres' });

  expect(respuesta.status).toBe(401);
  expect(respuesta.body.success).toBe(false);
  expect(respuesta.body.error.code).toBe('NO_AUTENTICADO');
});
```

Corre ambas con `npm test`.

## 18. Checklist final

- [ ] `package.json`, `.gitignore`, `.env`/`.env.example` creados (Fase 0)
- [ ] Proyecto de Supabase creado, credenciales en `.env` (Fase 1)
- [ ] Las 4 migraciones SQL ejecutadas sin error (Fase 2)
- [ ] RLS activado y probado en todas las tablas (Fase 3)
- [ ] Los 3 buckets de Storage creados con sus políticas (Fase 4)
- [ ] `supabaseClient.js` completo y cargado desde cada HTML (Fase 5)
- [ ] Login, registro, recuperar contraseña y logout funcionando de verdad (Fase 6)
- [ ] El perfil se lee/edita desde la tabla `usuarios`, no desde `localStorage` (Fase 7)
- [ ] Avatares/banners/media suben a Storage, no a base64 (Fase 8)
- [ ] `npm run dev` levanta la API Express sin errores, `/api/v1/health` responde `200` (Fase 9)
- [ ] Los endpoints de comunidades, likes, encuestas, comentarios, mensajes, reportes y admin responden y devuelven errores en el formato estándar (Fase 10)
- [ ] El feed y las comunidades del frontend leen datos reales (Fase 11)
- [ ] El chat y el muro de comunidad se actualizan solos con Realtime (Fase 12)
- [ ] El panel de administración muestra estadísticas reales, no inventadas (Fase 14)
- [ ] Al menos una prueba unitaria y una de integración corren con `npm test` (Fase 15)

Para lo que quede pendiente después de este checklist (transacciones reales con `rpc`, sistema de amistad/seguimiento completo en la UI, subida de múltiples adjuntos por post, etc.), revisa la sección 11 de [ARQUITECTURA_BACKEND.md](ARQUITECTURA_BACKEND.md#11-brechas-actuales-del-proyecto-checklist-priorizado), que ya las tiene priorizadas.

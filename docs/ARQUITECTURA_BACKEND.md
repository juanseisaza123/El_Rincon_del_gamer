# Arquitectura de Backend y Base de Datos — El Rincón Del Gamer (ERG)

> Propuesta de estructura para pasar de un mockup estático (frontend puro en la raíz del repositorio) a una aplicación con backend real sobre **Supabase**, autenticación segura y base de datos relacional normalizada. Cada sección explica **qué es** el elemento, **para qué sirve** y **por qué se eligió** para este proyecto.

## 1. Contexto

ERG es una red social para gamers con 2 roles: **Administrador** y **Usuario**. Hoy toda la aplicación es un mockup frontend:

- El login en [login.js](../auth/assets/js/login.js) valida contra un objeto `sampleUsers` escrito a mano (`admin`/`admin123`, `gamer`/`gamer123`), y cualquier otro usuario con más de 3 caracteres y contraseña de 4+ caracteres entra igual, con rol `user` por defecto.
- Todo el estado — perfil, publicaciones, comentarios, likes, comunidades, muros de comunidad, ajustes de tema — vive en `localStorage` (`erg_profile`, `erg_posts`, `erg_com_posts`, `erg_comments_<postId>`, `erg_communities`, `erg_settings`), gestionado desde [app.js](../assets/js/app.js). Esto es local al navegador: se pierde al limpiar datos y no se sincroniza entre dispositivos ni se comparte entre usuarios reales.
- Las imágenes y videos adjuntos a publicaciones, avatares y banners de comunidad se guardan como **Data URI en base64 directamente dentro de `localStorage`**, lo cual explica los `try/catch` de "Ocupa demasiada memoria interna" que ya aparecen en el código: el navegador tiene un límite de ~5-10 MB por origen.
- El chat ([index.html](../index.html) → `#chatModal`) es una maqueta visual: la lista de conversaciones está hardcodeada (`LuisGamer`, `Comunidad VR`) y "Empezar nuevo chat" no crea nada real.
- Las notificaciones del `#notifDropdown` son 2 elementos fijos en el HTML, no datos reales.
- El panel de administración ([auth/panel_control/admin/index.html](../auth/panel_control/admin/index.html)) muestra estadísticas y una tabla de usuarios **completamente inventadas** (`42.5K` usuarios, `1,284` posts hoy, `DarkKnight88`, etc.), sin ninguna conexión a datos reales.
- Los contadores de "Seguidores"/"Siguiendo" (124/89) en `#perfil-usuario` y la notificación de "solicitud" de `LuisGamer` insinúan un sistema de seguimiento/amistad que aún no existe como dato real.

**Decisión de arquitectura**: se usará **Supabase** como plataforma de backend (Postgres administrado + Auth + Storage + Realtime), y **Express** se mantiene como capa de API propia solo para la lógica de negocio que Supabase no resuelve por sí solo (crear una comunidad y afiliar a su fundador en una sola operación, votar en una encuesta sin duplicar el voto, enviar un mensaje y notificar a los demás participantes). No se reimplementa manualmente el login/JWT/hash de contraseñas: eso ya lo da Supabase Auth de forma segura y probada.

## 2. Stack propuesto

| Capa | Tecnología | Qué es / para qué sirve aquí |
| :--- | :--- | :--- |
| Backend as a Service | **Supabase** | Plataforma que da, sobre un proyecto de Postgres administrado: autenticación (Supabase Auth), almacenamiento de archivos (Supabase Storage), eventos en tiempo real (Supabase Realtime) y una API REST/GraphQL autogenerada (PostgREST) protegida por Row Level Security. Evita reimplementar infraestructura que no aporta valor diferencial al proyecto. |
| Base de datos | PostgreSQL (el motor de Supabase) | El dominio (usuarios, publicaciones, comunidades, comentarios, likes, conversaciones) tiene relaciones 1:1, 1:N y N:M muy claras (un post tiene muchos comentarios, un usuario pertenece a muchas comunidades, un usuario sigue a muchos usuarios), así que un modelo relacional normalizado encaja mejor que amontonar arrays anidados como se hace hoy en `localStorage`. |
| Autenticación | **Supabase Auth** | Servicio de autenticación integrado: registra usuarios, guarda su contraseña ya hasheada (bcrypt internamente), emite y renueva **JWT** firmados, y expone `signUp`, `signInWithPassword`, `resetPasswordForEmail`, etc. Reemplaza por completo el objeto `sampleUsers` de [login.js](../auth/assets/js/login.js): **no se escribe código propio de hashing ni de firma de tokens**. |
| Autorización a nivel de datos | **Row Level Security (RLS)** de Postgres | Reglas SQL que Postgres aplica automáticamente a cada consulta según quién esté autenticado (ej. "solo el dueño de una conversación puede leer sus mensajes"). Es la primera línea de defensa: aunque alguien llame directo a la API autogenerada de Supabase, no puede ver datos que no le correspondan. |
| Framework web (API propia) | Express | Capa de Node.js para endpoints con lógica que sí necesita ejecutarse en el servidor (crear comunidad + membresía en una transacción, registrar un voto único en una encuesta, enviar un mensaje y notificar a los demás participantes, calcular las estadísticas reales del panel admin). Usa la `service_role key` de Supabase, que nunca se expone al frontend. |
| Cliente de Supabase | `@supabase/supabase-js` | Librería oficial para hablar con Supabase desde el frontend (con la `anon key`, respetando RLS) y desde Express (con la `service_role key`, para operaciones administrativas que se saltan RLS de forma controlada, como banear a un usuario). |
| Validación de entrada | Zod o Joi | Verifica que el `body`/`params` de cada request a la API propia (Express) tenga la forma esperada (ej. que `contenido` de un post no esté vacío) antes de tocar la base de datos. |
| Almacenamiento de archivos | **Supabase Storage** | Buckets de archivos con políticas de acceso tipo RLS. Reemplaza el patrón actual de meter el `base64` del `FileReader` directo en `localStorage`: avatares, banners de comunidad y multimedia de publicaciones se suben a Storage y solo se guarda su URL en la base de datos, sin límite de 5-10 MB por navegador. |
| Tiempo real | **Supabase Realtime** | Permite suscribirse desde el frontend a cambios en una tabla (ej. `mensajes` de una conversación, o `publicaciones` de una comunidad) vía WebSocket, sin montar un servidor Socket.IO aparte. Así el chat y el muro de una comunidad se actualizan en vivo, cosa que hoy no existe. |
| Documentación de API | swagger-jsdoc + swagger-ui-express | Documenta específicamente los endpoints propios de Express; los endpoints CRUD simples ya los documenta Supabase automáticamente en su propio panel. |
| Pruebas | Jest + Supertest | Jest ejecuta pruebas unitarias sobre `services/`; Supertest simula peticiones HTTP reales contra las `routes/` de Express sin levantar un servidor aparte. |
| Logging | Pino | Registra cada request y error del servidor Express en formato estructurado (JSON). |
| Seguridad HTTP | Helmet + CORS + express-rate-limit | Cabeceras seguras por defecto, control de qué dominios pueden llamar la API propia, y límite de intentos para frenar fuerza bruta en login/registro y spam de publicaciones. |
| Estado en frontend | Redux Toolkit (+ RTK Query) | Reemplaza gradualmente las lecturas/escrituras directas a `localStorage` de [app.js](../assets/js/app.js): sesión (sincronizada con `supabase.auth.onAuthStateChange`), feed, comunidades, chat y notificaciones, con cacheo e invalidación automática. |
| Migraciones de BD | Supabase CLI (`supabase migration new/up`) | Versiona los cambios de esquema (tablas, políticas RLS, funciones) como archivos SQL directos sobre Postgres/Supabase. |

## 3. Estructura de carpetas propuesta

**Regla de separación del proyecto**: `src/` es **exclusivamente backend** (API Express + esquema/migraciones de Supabase). El resto del repositorio — [index.html](../index.html), [auth/](../auth/), [assets/](../assets/), `docs/` — sigue siendo el **frontend estático**, tal como ya está documentado en el [README](../README.md). A diferencia de otros proyectos, aquí **no existe una carpeta `public/`**: los archivos se sirven directamente desde la raíz, así que el frontend no se mueve de lugar; solo se le agrega el cliente de Supabase (y, si se adopta, Redux) dentro de `assets/js/`, que es la carpeta que la [arquitectura actual](architecture.md) ya designa como recursos estáticos globales.

De las carpetas de `src/` que hoy existen vacías, `app`, `bd` y `lib` se usan para el backend. `components` y `hooks` quedan **sin uso por ahora**: están pensadas para una eventual migración del frontend a un framework como React; mientras el frontend siga siendo HTML/JS plano, no se llenan, para no romper la regla de separación anterior.

### 3.1 Backend — `src/`

```
src/
├── app/                        # API propia en Express (solo lógica de negocio)
│   ├── server.js               # Punto de entrada: levanta el puerto
│   ├── app.js                  # Configuración de Express: middlewares globales y montaje de rutas
│   ├── config/
│   │   ├── supabaseAdmin.js    # Cliente de Supabase con service_role key (solo backend)
│   │   ├── env.js              # Carga y valida las variables de .env con Zod/Joi
│   │   └── swagger.js          # Configuración de la documentación interactiva
│   ├── routes/                 # Solo los recursos que necesitan lógica de negocio propia
│   │   ├── comunidades.routes.js
│   │   ├── publicaciones.routes.js
│   │   ├── encuestas.routes.js
│   │   ├── mensajes.routes.js
│   │   ├── reportes.routes.js
│   │   └── admin.routes.js
│   ├── controllers/             # Reciben req/res, validan la forma de la petición y llaman a services
│   ├── services/                # Lógica de negocio pura (reglas del dominio, sin conocer Express)
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Verifica el JWT emitido por Supabase Auth y adjunta req.user
│   │   ├── roles.middleware.js  # Autorización por rol (segunda capa, además de RLS)
│   │   ├── error.middleware.js  # Captura errores y responde en un formato único
│   │   └── rateLimit.middleware.js  # Límite de intentos en rutas sensibles
│   └── validators/              # Esquemas de validación de entrada por recurso
│
├── bd/                          # Todo lo relativo al esquema de Supabase/Postgres
│   ├── migrations/              # Archivos SQL versionados (tablas, índices, triggers) — gestionados con Supabase CLI
│   ├── policies/                # Políticas de Row Level Security, un archivo por tabla (ver sección 4.3)
│   │   ├── 00_helpers.sql
│   │   ├── usuarios.sql
│   │   ├── preferencias_usuario.sql
│   │   ├── seguimientos.sql
│   │   ├── comunidades.sql
│   │   ├── comunidad_miembros.sql
│   │   ├── publicaciones.sql
│   │   ├── encuestas.sql
│   │   ├── comentarios.sql
│   │   ├── likes.sql
│   │   ├── conversaciones.sql
│   │   ├── notificaciones.sql
│   │   └── reportes_moderacion.sql
│   ├── seed.sql                 # Datos de prueba (reemplaza a `sampleUsers` y a la tabla mockeada del panel admin)
│   └── diagrama-er.md           # Diagrama entidad-relación (ver sección 6)
│
├── lib/                          # Utilidades compartidas SOLO del backend (ej. clase AppError, cálculo de porcentajes de encuesta)
├── tests/
│   ├── unit/                    # Pruebas de services (lógica de negocio aislada)
│   └── integration/             # Pruebas de endpoints de la API propia con Supertest
└── documentacion/                # (opcional) espejo interno; el documento fuente vive en docs/
```

**Regla de dependencia**: `routes` → `controllers` → `services` → tablas de Supabase. Los `controllers` nunca acceden directamente a Supabase, y los `services` nunca conocen `req`/`res`.

**Qué pasa por Express y qué no**: no todo necesita pasar por la API propia. Consultas simples (leer el feed, leer mis notificaciones, listar comunidades) pueden ir **directo del frontend a Supabase** con `supabase-js`, protegidas por RLS. Express se reserva para operaciones que combinan varias reglas de negocio (fundar comunidad + afiliar al fundador, votar sin duplicar, enviar mensaje + notificar).

### 3.2 Frontend — raíz del proyecto

```
El Rincon Del Gamer/
├── index.html                              # Feed / Dashboard (ya existe)
├── auth/
│   ├── login.html                          # Ya existe
│   ├── assets/{css,js}/                    # login.js deja de usar `sampleUsers` hardcodeado
│   └── panel_control/
│       ├── admin/index.html                # Deja de mostrar stats/usuarios inventados
│       └── usuario/
│           ├── index.html                  # Editar perfil
│           └── configuracion.html          # Tema, cursor, glow, seguridad, notificaciones
├── assets/                                  # Ya existe — compartido para toda la app
│   ├── css/style.css
│   └── js/
│       ├── app.js                          # Orquestador; progresivamente delega en los módulos de abajo
│       ├── lib/
│       │   └── supabaseClient.js           # ⭐ Cliente de Supabase (anon key), una sola instancia
│       └── redux/                          # ⭐ (si se adopta Redux Toolkit)
│           ├── store.js
│           ├── api/apiSlice.js             # RTK Query: llama a Supabase directo o a la API Express según el caso
│           └── slices/
│               ├── authSlice.js            # usuario logueado, rol, sesión (sync con Supabase Auth)
│               ├── feedSlice.js            # publicaciones, likes, comentarios
│               ├── comunidadesSlice.js
│               ├── chatSlice.js
│               └── notificacionesSlice.js
└── docs/
    └── ARQUITECTURA_BACKEND.md             # Este documento
```

`supabaseClient.js` se carga con `<script type="module" src="assets/js/lib/supabaseClient.js">` desde [index.html](../index.html) y con la ruta relativa correspondiente desde cada página anidada (ej. `../../../assets/js/lib/supabaseClient.js` desde `auth/panel_control/admin/index.html`), igual que hoy [admin/index.html](../auth/panel_control/admin/index.html) referencia `../../../assets/css/style.css`.

Si más adelante el equipo decide migrar el frontend a un framework (React, por ejemplo), recién ahí se retomarían `src/components` y `src/hooks` (hoy sin uso) como código fuente que se compila hacia la raíz del proyecto.

## 4. Autenticación y seguridad

### 4.1 Flujo de autenticación con Supabase Auth

1. **Registro**: `supabase.auth.signUp({ email, password })` desde [login.html](../auth/login.html) (autoservicio, "¿Es tu primera vez en ERG? Regístrate"). Supabase guarda el usuario en `auth.users` con la contraseña ya hasheada — **el proyecto nunca maneja ni ve la contraseña en texto plano**.
2. **Login**: `supabase.auth.signInWithPassword({ email, password })` reemplaza por completo el objeto `sampleUsers` y la rama "genérica" de [login.js](../auth/assets/js/login.js) que aceptaba cualquier usuario/contraseña de más de 3-4 caracteres. Supabase devuelve un **access token JWT** de corta duración y un **refresh token**, que `supabase-js` renueva automáticamente.
3. **Perfil con rol**: `auth.users` solo tiene datos de autenticación. Por eso se crea `public.usuarios`, con `id` igual al `id` de `auth.users` (relación 1 a 1), donde vive `rol_id`, `handle`, `nombre`, `bio`, `avatar_url`, `estado`. Un **trigger** en Postgres (`on auth.users insert`) crea automáticamente la fila en `public.usuarios` cuando alguien se registra, con `rol_id` = "usuario" por defecto y `handle` generado a partir del correo (equivalente a la línea `"@" + username.toLowerCase().replace(...)` de `login.js`, pero como regla del servidor, no del cliente).
4. **`auth.middleware.js`**: toma el header `Authorization: Bearer <token>`, llama a `supabase.auth.getUser(token)` para validar el JWT, y consulta `public.usuarios` para armar `req.user = { id, rol }`.
5. **`roles.middleware.js`**: recibe una lista de roles permitidos (ej. `soloRol('admin')` para las rutas de `/api/v1/admin/*`) y responde `403 Forbidden` si no corresponde. Es una **segunda capa** además de RLS.
6. **Logout / refresh**: los maneja `supabase-js` automáticamente; el botón "Cerrar sesión" de [app.js](../assets/js/app.js) pasa de hacer `localStorage.clear()` a llamar `supabase.auth.signOut()`.

### 4.2 Recuperación de contraseña

`supabase.auth.resetPasswordForEmail(correo, { redirectTo: '.../auth/reset-password.html' })` envía un correo con un enlace de un solo uso (plantilla personalizable desde el panel de Supabase). El enlace "¿Has olvidado tu contraseña?" de [login.html](../auth/login.html), hoy sin funcionalidad (`href="#"`), pasa a llamar a esta función. No hace falta una tabla propia ni un servicio de correo aparte.

### 4.3 Row Level Security (RLS): la autorización a nivel de datos

RLS son reglas SQL que Postgres evalúa en cada `SELECT`/`INSERT`/`UPDATE`/`DELETE`, usando `auth.uid()` (el id del usuario autenticado, inyectado a partir del JWT). Con `alter table ... enable row level security;`, una tabla sin políticas explícitas **no devuelve nada** a nadie salvo a la `service_role key` (que usa Express) — "seguro por defecto". Estas políticas viven versionadas en `src/bd/policies/`.

#### 4.3.1 Funciones auxiliares (`00_helpers.sql`)

```sql
-- Rol del usuario autenticado
create or replace function public.rol_actual()
returns text
language sql stable security definer set search_path = public
as $$
  select r.nombre
  from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.id = auth.uid()
$$;

-- ¿El usuario autenticado pertenece a esta comunidad?
create or replace function public.es_miembro_comunidad(p_comunidad_id int)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.comunidad_miembros
    where comunidad_id = p_comunidad_id and usuario_id = auth.uid()
  )
$$;

-- ¿El usuario autenticado participa en esta conversación?
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

#### 4.3.2 `usuarios.sql`

```sql
alter table public.usuarios enable row level security;

-- Los perfiles son públicos dentro de la red social (como cualquier red social real)
create policy "usuarios_select_publico" on public.usuarios
for select using (estado = 'activo' or id = auth.uid() or rol_actual() = 'admin');

-- Cada quien edita solo su propio perfil
create policy "usuarios_update_propio" on public.usuarios
for update using (id = auth.uid());

-- Administrador administra todos los perfiles (incluye banear/desbanear)
create policy "usuarios_admin_todo" on public.usuarios
for all using (rol_actual() = 'admin');
```

> Nota: RLS trabaja a nivel de **fila**, no de columna — `usuarios_update_propio` no evita por sí sola que un usuario cambie su propio `rol_id` o `estado`. Para eso se revoca el privilegio de columna (`revoke update (rol_id, estado) on public.usuarios from authenticated;`) y solo la `service_role key` (Express, endpoint `PATCH /api/v1/admin/usuarios/:id/estado`) puede tocarlas.

#### 4.3.3 `preferencias_usuario.sql`

```sql
-- Reemplaza el `erg_settings` de localStorage (tema, cursor gamer, glow)
alter table public.preferencias_usuario enable row level security;

create policy "preferencias_select_propia" on public.preferencias_usuario
for select using (usuario_id = auth.uid());

create policy "preferencias_upsert_propia" on public.preferencias_usuario
for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
```

#### 4.3.4 `seguimientos.sql`

```sql
-- Sistema de "Seguidores"/"Siguiendo" que hoy solo son números fijos en el HTML del perfil
alter table public.seguimientos enable row level security;

create policy "seguimiento_select_publico" on public.seguimientos
for select using (true);

create policy "seguimiento_insert_propio" on public.seguimientos
for insert with check (seguidor_usuario_id = auth.uid());

create policy "seguimiento_delete_propio" on public.seguimientos
for delete using (seguidor_usuario_id = auth.uid());
```

#### 4.3.5 `comunidades.sql` y `comunidad_miembros.sql`

```sql
-- Descubrir comunidades es público (como "Explorar" en el sidebar)
alter table public.comunidades enable row level security;
create policy "comunidad_select_publica" on public.comunidades
for select using (true);
create policy "comunidad_insert_autenticado" on public.comunidades
for insert with check (creador_usuario_id = auth.uid());
create policy "comunidad_update_creador_o_admin" on public.comunidades
for update using (creador_usuario_id = auth.uid() or rol_actual() = 'admin');

alter table public.comunidad_miembros enable row level security;
create policy "miembros_select_publico" on public.comunidad_miembros
for select using (true);
create policy "miembros_unirse" on public.comunidad_miembros
for insert with check (usuario_id = auth.uid());
create policy "miembros_salir" on public.comunidad_miembros
for delete using (usuario_id = auth.uid() or rol_actual() = 'admin');
```

#### 4.3.6 `publicaciones.sql`

```sql
alter table public.publicaciones enable row level security;

-- Feed general (comunidad_id nulo) visible para todos; posts de comunidad, solo para miembros
create policy "publicacion_select" on public.publicaciones
for select using (
  comunidad_id is null
  or es_miembro_comunidad(comunidad_id)
  or rol_actual() = 'admin'
);

create policy "publicacion_insert_propia" on public.publicaciones
for insert with check (
  autor_usuario_id = auth.uid()
  and (comunidad_id is null or es_miembro_comunidad(comunidad_id))
);

create policy "publicacion_update_delete_propia" on public.publicaciones
for update using (autor_usuario_id = auth.uid() or rol_actual() = 'admin');

create policy "publicacion_delete_propia" on public.publicaciones
for delete using (autor_usuario_id = auth.uid() or rol_actual() = 'admin');
```

#### 4.3.7 `comentarios.sql` y `likes.sql`

```sql
alter table public.comentarios enable row level security;
create policy "comentario_select_publico" on public.comentarios
for select using (true);
create policy "comentario_insert_propio" on public.comentarios
for insert with check (autor_usuario_id = auth.uid());
create policy "comentario_delete_propio" on public.comentarios
for delete using (autor_usuario_id = auth.uid() or rol_actual() = 'admin');

-- Reemplaza el contador de likes que hoy cualquiera puede incrementar sin límite en el DOM
alter table public.likes enable row level security;
create policy "like_select_publico" on public.likes
for select using (true);
create policy "like_insert_propio" on public.likes
for insert with check (usuario_id = auth.uid());
create policy "like_delete_propio" on public.likes
for delete using (usuario_id = auth.uid());
```

#### 4.3.8 `conversaciones.sql` (incluye `conversacion_participantes` y `mensajes`)

```sql
alter table public.conversaciones enable row level security;
create policy "conversacion_select_participante" on public.conversaciones
for select using (es_participante_conversacion(id));

alter table public.conversacion_participantes enable row level security;
create policy "participantes_select_propio" on public.conversacion_participantes
for select using (es_participante_conversacion(conversacion_id));

alter table public.mensajes enable row level security;
create policy "mensaje_select_participante" on public.mensajes
for select using (es_participante_conversacion(conversacion_id));
create policy "mensaje_insert_participante" on public.mensajes
for insert with check (
  autor_usuario_id = auth.uid() and es_participante_conversacion(conversacion_id)
);
```

#### 4.3.9 `notificaciones.sql`

```sql
alter table public.notificaciones enable row level security;

-- Reemplaza los 2 elementos hardcodeados del #notifDropdown
create policy "notificacion_select_propia" on public.notificaciones
for select using (usuario_id = auth.uid());
create policy "notificacion_update_propia" on public.notificaciones
for update using (usuario_id = auth.uid());

-- No hay policy de INSERT para usuarios normales: las crea el backend Express
-- con la service_role key, como parte de otra operación (dar like, comentar, etc.)
```

#### 4.3.10 `reportes_moderacion.sql`

```sql
alter table public.reportes_moderacion enable row level security;

create policy "reporte_insert_autenticado" on public.reportes_moderacion
for insert with check (denunciante_usuario_id = auth.uid());

create policy "reporte_select_propio_o_admin" on public.reportes_moderacion
for select using (denunciante_usuario_id = auth.uid() or rol_actual() = 'admin');

create policy "reporte_update_admin" on public.reportes_moderacion
for update using (rol_actual() = 'admin');
```

### 4.4 Manejo de errores estandarizado (API propia)

```json
{
  "success": false,
  "error": {
    "code": "VOTO_DUPLICADO",
    "message": "Ya votaste en esta encuesta"
  }
}
```

Una clase `AppError` (código HTTP + código de error + mensaje) que los `services` lanzan cuando algo de negocio falla, capturada por `error.middleware.js`. Los errores no controlados se loguean con Pino y se responden como `500` genérico.

### 4.5 Protección HTTP adicional (API propia)

- **Helmet**: cabeceras HTTP recomendadas por defecto.
- **CORS**: solo el dominio donde se sirve el frontend puede llamar a la API de Express.
- **express-rate-limit**: límite de peticiones por IP en registro/login y en creación de publicaciones/comentarios, para frenar spam y fuerza bruta.
- **Validación de entrada** (Zod/Joi en `validators/`): corta datos malformados antes de que lleguen a `services`.

## 5. Archivos multimedia y tiempo real

- **Avatares y banners**: hoy `btnUploadComAvatar`/`btnUploadComBanner` y `fileAvatar` en [app.js](../assets/js/app.js) leen el archivo con `FileReader` y lo guardan como `base64` en `localStorage` (`currentComAvatarData`, `currentComBannerData`, `profile.avatar`). Con **Supabase Storage**, esos mismos `<input type="file">` suben el archivo a un bucket (`avatares`, `comunidades`) desde el frontend (`supabase.storage.from('avatares').upload(...)`) y solo se guarda la URL resultante en `usuarios.avatar_url` o `comunidades.avatar_url`/`banner_url`. Se eliminan los límites de tamaño del navegador y el riesgo de perder el archivo al limpiar caché.
- **Media de publicaciones**: igual, el `mediaInput` (`accept="image/*,video/*"`) sube a un bucket `publicaciones` en vez de generar un Data URI gigante; se guarda `media_url` y `media_tipo` en la fila del post.
- **Tiempo real**: con **Supabase Realtime** el chat se suscribe a `INSERT`s en `mensajes` filtrados por `conversacion_id`, y el muro de una comunidad se suscribe a `INSERT`s en `publicaciones` filtrados por `comunidad_id` — reemplazando la recarga manual de `loadCommunityPosts()`. Es opcional para una primera versión: se puede empezar con `GET`s normales y agregar la suscripción después.

## 6. Base de datos relacional

### 6.1 Entidades identificadas

| Entidad | Descripción |
| :--- | :--- |
| `auth.users` | Tabla interna de Supabase Auth. No se modifica directamente. |
| `roles` | Catálogo: `admin`, `usuario` |
| `usuarios` | Perfil de negocio 1 a 1 con `auth.users`: handle, nombre, bio, avatar, rol, estado |
| `preferencias_usuario` | Tema, cursor gamer, glow effect — reemplaza `erg_settings` |
| `seguimientos` | Relación N:M reflexiva sobre `usuarios` (quién sigue a quién) — sustenta los contadores de Seguidores/Siguiendo |
| `comunidades` | Reemplaza `erg_communities` |
| `comunidad_miembros` | Puente N:M entre `usuarios` y `comunidades` |
| `publicaciones` | Reemplaza `erg_posts` y `erg_com_posts` (unificadas: `comunidad_id` nulo = feed general) |
| `encuestas` / `encuesta_opciones` / `encuesta_votos` | Reemplaza el bloque `#encuestaContainer`, con voto único real en vez del `onclick` que fuerza "100%" |
| `comentarios` | Reemplaza `erg_comments_<postId>` |
| `likes` | Reemplaza el contador plano del `.like-btn` |
| `conversaciones` / `conversacion_participantes` / `mensajes` | Reemplaza el `#chatModal` hardcodeado |
| `notificaciones` | Reemplaza los 2 `.dropdown-item` fijos del `#notifDropdown` |
| `reportes_moderacion` | Sustenta el badge "Reportes: 3" y la sección "Seguridad" del panel admin, hoy sin datos reales |

### 6.2 Diagrama entidad-relación

```mermaid
erDiagram
    AUTH_USERS ||--|| USUARIOS : "perfil de"
    ROLES ||--o{ USUARIOS : clasifica
    USUARIOS ||--|| PREFERENCIAS_USUARIO : configura
    USUARIOS ||--o{ SEGUIMIENTOS : "sigue"
    USUARIOS ||--o{ COMUNIDADES : funda
    USUARIOS ||--o{ COMUNIDAD_MIEMBROS : participa
    COMUNIDADES ||--o{ COMUNIDAD_MIEMBROS : tiene
    USUARIOS ||--o{ PUBLICACIONES : publica
    COMUNIDADES ||--o{ PUBLICACIONES : contiene
    PUBLICACIONES ||--o| ENCUESTAS : incluye
    ENCUESTAS ||--o{ ENCUESTA_OPCIONES : tiene
    ENCUESTA_OPCIONES ||--o{ ENCUESTA_VOTOS : recibe
    USUARIOS ||--o{ ENCUESTA_VOTOS : vota
    PUBLICACIONES ||--o{ COMENTARIOS : recibe
    USUARIOS ||--o{ COMENTARIOS : escribe
    PUBLICACIONES ||--o{ LIKES : recibe
    USUARIOS ||--o{ LIKES : da
    USUARIOS ||--o{ CONVERSACION_PARTICIPANTES : participa
    CONVERSACIONES ||--o{ CONVERSACION_PARTICIPANTES : incluye
    CONVERSACIONES ||--o{ MENSAJES : contiene
    USUARIOS ||--o{ MENSAJES : envia
    USUARIOS ||--o{ NOTIFICACIONES : recibe
    USUARIOS ||--o{ REPORTES_MODERACION : denuncia

    AUTH_USERS {
        uuid id PK "gestionada por Supabase Auth"
        varchar email
        varchar encrypted_password "hash interno, no se toca"
    }
    ROLES {
        int id PK
        varchar nombre
    }
    USUARIOS {
        uuid id PK_FK "= auth.users.id"
        varchar handle UK
        varchar nombre
        varchar bio
        varchar avatar_url
        int rol_id FK
        varchar estado "activo | baneado"
        datetime creado_en
        datetime actualizado_en
        datetime eliminado_en "soft delete"
    }
    PREFERENCIAS_USUARIO {
        uuid usuario_id PK_FK
        varchar tema
        boolean cursor_gamer
        boolean glow_effect
    }
    SEGUIMIENTOS {
        int id PK
        uuid seguidor_usuario_id FK
        uuid seguido_usuario_id FK
        varchar estado "pendiente | aceptado"
        datetime creado_en
    }
    COMUNIDADES {
        int id PK
        varchar nombre
        varchar categoria
        varchar descripcion
        varchar avatar_url
        varchar banner_url
        uuid creador_usuario_id FK
        datetime creado_en
    }
    COMUNIDAD_MIEMBROS {
        int id PK
        int comunidad_id FK
        uuid usuario_id FK
        varchar rol_comunidad "fundador | miembro"
        datetime unido_en
    }
    PUBLICACIONES {
        int id PK
        uuid autor_usuario_id FK
        int comunidad_id FK "nulo = feed general"
        varchar contenido
        varchar enlace_url
        varchar media_url
        varchar media_tipo "imagen | video"
        datetime creado_en
        datetime editado_en
        datetime eliminado_en
    }
    ENCUESTAS {
        int id PK
        int publicacion_id FK UK
        varchar pregunta
    }
    ENCUESTA_OPCIONES {
        int id PK
        int encuesta_id FK
        varchar texto
    }
    ENCUESTA_VOTOS {
        int id PK
        int encuesta_id FK
        int opcion_id FK
        uuid usuario_id FK
        datetime creado_en
    }
    COMENTARIOS {
        int id PK
        int publicacion_id FK
        uuid autor_usuario_id FK
        varchar contenido
        datetime creado_en
        datetime eliminado_en
    }
    LIKES {
        int id PK
        int publicacion_id FK
        uuid usuario_id FK
        datetime creado_en
    }
    CONVERSACIONES {
        int id PK
        varchar tipo "privada | grupal"
        varchar nombre "solo grupal"
        datetime creado_en
    }
    CONVERSACION_PARTICIPANTES {
        int id PK
        int conversacion_id FK
        uuid usuario_id FK
        datetime unido_en
    }
    MENSAJES {
        int id PK
        int conversacion_id FK
        uuid autor_usuario_id FK
        varchar contenido
        datetime creado_en
    }
    NOTIFICACIONES {
        int id PK
        uuid usuario_id FK
        varchar tipo
        varchar contenido
        varchar referencia_tipo
        int referencia_id
        boolean leida
        datetime creado_en
    }
    REPORTES_MODERACION {
        int id PK
        uuid denunciante_usuario_id FK
        varchar tipo_objetivo "publicacion | comentario | usuario | comunidad"
        int objetivo_id
        varchar motivo
        varchar estado "pendiente | revisado | descartado"
        uuid revisado_por_usuario_id FK
        datetime creado_en
    }
```

### 6.3 Explicación tabla por tabla

- **`auth.users`**: gestionada por Supabase Auth. El proyecto solo referencia su `id` (UUID) desde `public.usuarios`.
- **`roles`**: catálogo (`admin`, `usuario`) en vez de un booleano `isAdmin`, para poder agregar roles nuevos (ej. moderador) sin migrar el esquema.
- **`usuarios`**: perfil de negocio, con `id` que es a la vez clave primaria y llave foránea hacia `auth.users.id`. `estado` reemplaza el badge visual `badge-active`/`badge-banned` del panel admin con un dato real. `eliminado_en` implementa *soft delete*: no se borra la fila para no romper el historial de publicaciones ya hechas.
- **`preferencias_usuario`**: extiende a `usuarios` 1 a 1, separada porque son datos de configuración de interfaz, no de identidad — así una consulta de "quién es este usuario" no arrastra sus preferencias de tema.
- **`seguimientos`**: relación **reflexiva** (ambas columnas apuntan a `usuarios`). El campo `estado` distingue una solicitud pendiente (el ícono `fa-user-plus` de la notificación actual) de una ya aceptada, dando sustento real a los contadores "124 Seguidores / 89 Siguiendo" que hoy son texto fijo en el HTML.
- **`comunidades`**: reemplaza el array `erg_communities`. `creador_usuario_id` identifica quién la fundó.
- **`comunidad_miembros`**: resuelve la relación **muchos a muchos** entre usuarios y comunidades — hoy el mockup no tiene concepto real de "unirse", solo de "fundar". `rol_comunidad` distingue al fundador de un miembro cualquiera.
- **`publicaciones`**: unifica `erg_posts` y `erg_com_posts` en una sola tabla; `comunidad_id` nulo indica que es del feed general, igual que hoy `community-post` es la clase CSS que distingue un post de comunidad de uno normal. `media_url`/`media_tipo` reemplazan el Data URI en base64.
- **`encuestas`/`encuesta_opciones`/`encuesta_votos`**: separadas en tres tablas porque una encuesta tiene muchas opciones y cada opción recibe muchos votos; el resultado (%) se calcula agregando `encuesta_votos`, no simulando un clic que pone "100%" como hace hoy el `onclick` inline del botón de opción.
- **`comentarios`**: reemplaza las claves `erg_comments_<postId>` de `localStorage`, ahora relacionadas por clave foránea real en vez de por convención de nombre de clave.
- **`likes`**: reemplaza el contador de texto plano del botón, que hoy cualquiera puede incrementar sin límite haciendo clic repetido; con esta tabla, un usuario solo puede dar un like por publicación (ver sección 6.4).
- **`conversaciones`/`conversacion_participantes`/`mensajes`**: dan sustento real al `#chatModal`, que hoy es una lista hardcodeada de dos conversaciones sin lógica de envío.
- **`notificaciones`**: reemplaza los 2 `<div class="dropdown-item">` fijos en el HTML de [index.html](../index.html), con `referencia_tipo`/`referencia_id` apuntando al post, comentario o solicitud de seguimiento que la originó.
- **`reportes_moderacion`**: sustenta el badge "Reportes: 3" y el ítem de menú "Seguridad" del panel admin, que hoy no tienen ningún dato detrás.

### 6.4 Reglas de integridad clave

- `usuarios.handle` **único**.
- `estado` en `usuarios`: `CHECK`/`ENUM('activo', 'baneado')`.
- `media_tipo` en `publicaciones`: `CHECK`/`ENUM('imagen', 'video')`, coherente con el `accept="image/*,video/*"` del input actual.
- `estado` en `reportes_moderacion`: `ENUM('pendiente', 'revisado', 'descartado')`.
- Índice único compuesto en `likes (publicacion_id, usuario_id)`: impide que el mismo usuario dé like dos veces al mismo post (a diferencia del contador actual, que no tiene ningún control).
- Índice único compuesto en `encuesta_votos (encuesta_id, usuario_id)`: un usuario vota una sola vez por encuesta, sin importar cuántas opciones tenga.
- Índice único compuesto en `comunidad_miembros (comunidad_id, usuario_id)` y en `seguimientos (seguidor_usuario_id, seguido_usuario_id)`: evita duplicar la misma membresía o el mismo seguimiento.
- Índice único compuesto en `conversacion_participantes (conversacion_id, usuario_id)`.
- `usuarios.id` referencia a `auth.users.id` con `ON DELETE CASCADE`; en la práctica **no se elimina** a un usuario con historial, se desactiva con `estado = 'baneado'`.
- Índice compuesto en `publicaciones (comunidad_id, creado_en desc)` para pintar rápido el feed y el muro de cada comunidad ordenados por fecha.
- **RLS habilitado en todas las tablas de negocio**, con políticas como las de la sección 4.3.

### 6.5 Normalización aplicada

**1FN (Primera Forma Normal)**: cada columna guarda un único valor atómico. Hoy `erg_posts` guarda literalmente el **HTML completo** de cada publicación como una cadena de texto en un array — lo opuesto a estar normalizado. Con la tabla `publicaciones`, cada dato (texto, autor, enlace, media) vive en su propia columna, y el HTML se genera en el frontend a partir de esos datos, nunca al revés.

**2FN (Segunda Forma Normal)**: toda columna no clave depende de la clave primaria completa. Por eso `rol_comunidad` (fundador/miembro) vive en `comunidad_miembros` — depende del *par* usuario-comunidad, no solo de uno de los dos — y no se duplica dentro de `comunidades` ni de `usuarios`.

**3FN (Tercera Forma Normal)**: se eliminan dependencias transitivas.
- El **nombre del rol** de un usuario no se repite en cada fila de `usuarios` (a diferencia del objeto `sampleUsers` de hoy, donde `role: "admin"` es una cadena suelta sin catálogo detrás); se referencia por `rol_id` a la tabla `roles`.
- Los **comentarios de un post** no se guardan como un array embebido dentro del post (como pasaría si se serializara `erg_comments_<postId>` junto al post), sino en su propia tabla `comentarios` relacionada por `publicacion_id`, evitando que actualizar un comentario obligue a reescribir el post completo.
- Las **credenciales de acceso** se separan por completo en `auth.users` (responsabilidad de Supabase Auth), en vez de mezclarse con el perfil de negocio como hoy ocurre en el objeto `profile` guardado en `erg_profile`.

Con esto el esquema evita **redundancia** (el mismo dato repetido en varios lugares, como el nombre de usuario que hoy aparece copiado dentro de cada HTML de post guardado) y **anomalías de actualización** (cambiar el nombre de un usuario hoy no actualiza los posts que ya publicó, porque su nombre quedó "congelado" dentro del HTML guardado).

## 7. Endpoints de la API propia (Express)

Solo se listan los que necesitan lógica de negocio del lado del servidor; las lecturas simples (ver el feed, mis notificaciones, la lista de comunidades) pueden ir directo del frontend a Supabase vía `supabase-js`, protegidas por RLS.

| Método | Ruta | Rol(es) | Descripción |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/health` | Público | Chequeo de salud del servidor y de la conexión a Supabase |
| POST | `/api/v1/comunidades` | Usuario autenticado | Crea la comunidad y afilia a su creador como `fundador` en una sola transacción |
| POST | `/api/v1/publicaciones` | Usuario autenticado | Crea la publicación y, si trae encuesta, la encuesta + sus opciones en la misma operación |
| POST | `/api/v1/publicaciones/:id/like` | Usuario autenticado | Alterna el like (insertar/eliminar en `likes`) y notifica al autor del post |
| POST | `/api/v1/encuestas/:id/votar` | Usuario autenticado | Registra un voto validando que el usuario no haya votado antes en esa encuesta |
| POST | `/api/v1/comentarios` | Usuario autenticado | Crea el comentario y notifica al autor del post |
| POST | `/api/v1/conversaciones` | Usuario autenticado | Crea una conversación (privada o grupal) y agrega a los participantes |
| POST | `/api/v1/mensajes` | Participante de la conversación | Envía un mensaje y dispara el evento realtime para los demás participantes |
| POST | `/api/v1/reportes` | Usuario autenticado | Registra una denuncia de moderación sobre un post, comentario, usuario o comunidad |
| PATCH | `/api/v1/admin/usuarios/:id/estado` | Administrador | Banea/reactiva a un usuario (usa la `service_role key`, ignora RLS de forma controlada) |
| GET | `/api/v1/admin/stats` | Administrador | Estadísticas reales del panel (usuarios totales, posts de hoy, reportes pendientes) para reemplazar los valores fijos `42.5K`, `1,284`, etc. de [admin/index.html](../auth/panel_control/admin/index.html) |

La autorización por rol se aplica con `roles.middleware.js` sobre estas rutas, además de RLS en la base de datos.

## 8. Integración con Redux

- `authSlice`: `{ usuario, rol, isAuthenticated }`, sincronizado con `supabase.auth.onAuthStateChange((event, session) => ...)`. Redux solo necesita saber si hay sesión y el rol; `supabase-js` administra el token internamente.
- `feedSlice`, `comunidadesSlice`, `chatSlice`, `notificacionesSlice`: reemplazan las lecturas/escrituras directas a `erg_posts`, `erg_communities`, y el estado hardcodeado del chat/notificaciones en [app.js](../assets/js/app.js), poblados desde Supabase (lecturas simples) o desde la API de Express (operaciones del punto 7).
- Recomendado usar **RTK Query** con dos `baseQuery` si hace falta: uno que llama directo a Supabase (`supabase-js`) para lecturas simples, y otro que llama a la API de Express para las operaciones de negocio.
- El `supabaseClient.js` en `assets/js/lib/` usa la **anon key** (pública, segura de exponer porque RLS limita lo que puede hacer); la **service_role key** solo vive en `src/app/config/supabaseAdmin.js` y jamás se sube al frontend.

## 9. Calidad y operación

- **Pruebas** (`tests/`): `unit/` prueba reglas de negocio de `services/` (ej. "no se puede votar dos veces en la misma encuesta") con mocks del cliente de Supabase. `integration/` usa Supertest contra los endpoints reales de Express, apuntando a un proyecto de Supabase de pruebas.
- **Logging** (Pino): cada request a la API propia queda registrado (método, ruta, status, tiempo de respuesta); los errores quedan con su stack trace en el log del servidor, nunca en la respuesta al cliente.
- **Documentación de API** (Swagger en `/api/docs`): documenta los endpoints propios de Express; los CRUD que Supabase autogenera se documentan solos en el panel de Supabase.
- **Variables de entorno** (`.env`, con `.env.example` versionado):
  - Frontend: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
  - Backend Express: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secreta), `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.
  - Nunca se sube el `.env` real al repositorio, y la `service_role key` nunca se usa en código que corra en el navegador.
- **Entorno local**: `supabase start` (Supabase CLI) levanta una copia local de Postgres + Auth + Storage con Docker por debajo, para desarrollar y correr migraciones sin tocar el proyecto de producción.

## 10. Próximos pasos

1. Crear el proyecto en Supabase y definir las migraciones SQL de la sección 6 (tablas + índices) con `supabase migration new`.
2. Escribir y probar las políticas de RLS de la sección 4.3, empezando por `usuarios`, `publicaciones` y `mensajes`.
3. Migrar el login de [login.js](../auth/assets/js/login.js) para usar `supabase.auth.signInWithPassword` en vez de `sampleUsers`, y crear el trigger que genera la fila en `public.usuarios` al registrarse.
4. Reemplazar el flujo de subida de avatares/banners/media (`FileReader` → base64 en `localStorage`) por subidas reales a **Supabase Storage** en [app.js](../assets/js/app.js).
5. Levantar la API propia en Express (`src/app/`) solo para `comunidades`, `publicaciones` (con encuestas) y `mensajes`, y sustituir los arrays de `localStorage` usados hoy por llamadas reales.
6. Definir el `seed.sql` equivalente a los usuarios y datos de muestra actuales (`admin`/`gamer`, comunidades y posts de ejemplo) para desarrollo/pruebas.
7. Conectar el panel de administración a `GET /api/v1/admin/stats` en vez de los valores fijos hardcodeados en el HTML.
8. Agregar pruebas de integración mínimas para "crear comunidad" y "votar en encuesta" antes de seguir sumando endpoints.

## 11. Brechas actuales del proyecto (checklist priorizado)

Las secciones 1-10 cubren el backend a fondo. Esta sección amplía el diagnóstico a **todo el proyecto**, agrupado por prioridad — desde lo que se puede resolver en minutos sin backend, hasta lo que depende de tener Supabase funcionando.

### 11.1 Quick wins — scaffolding de proyecto (no requieren backend)

No existen hoy en el repositorio:

- **`package.json`**: sin él no hay forma de instalar dependencias (`@supabase/supabase-js`, Redux Toolkit, etc.), correr un linter o definir scripts (`npm run dev`); cualquier librería quedaría forzada a cargarse por CDN.
- **`.gitignore`**: riesgo de subir `node_modules/` o un `.env` con la `service_role key` por accidente en cuanto exista backend.
- **`favicon`**: la pestaña del navegador queda sin ícono.
- **`assets/image/`**: el [README](../README.md) y [architecture.md](architecture.md) la documentan como parte de la estructura, pero no existe en el repositorio — hoy todas las imágenes dependen de servicios externos (`ui-avatars.com`, `images.unsplash.com`), lo cual es frágil si esos servicios cambian o se caen.
- **`LICENSE`**: si el proyecto va a compartirse o subirse a un repositorio público, falta declarar los términos de uso del código.

### 11.2 Flujos de autenticación incompletos en la UI

- En [login.html](../auth/login.html), "¿Es tu primera vez en ERG? Regístrate" y "¿Has olvidado tu contraseña?" son enlaces `href="#"` sin página ni handler detrás.
- No existe una pantalla de registro (`auth/register.html`) ni de reseteo de contraseña.
- [login.js](../auth/assets/js/login.js) valida solo longitud de texto (`username.length > 3`, `password.length >= 4`), sin verificar formato de correo ni fuerza de contraseña — esto se resuelve de raíz al migrar a `supabase.auth.signInWithPassword`/`signUp` (sección 4.1) más `validators/` en la API propia (sección 3.1).

### 11.3 Funcionalidad que hoy es solo maqueta visual

Ya identificada en las secciones 5-7 como parte del reemplazo por tablas reales, pero vale listarla como inventario de "lo que el usuario ve pero no funciona":

- **Chat** (`#chatModal` en [index.html](../index.html)): lista de conversaciones hardcodeada (`LuisGamer`, `Comunidad VR`); el botón "Empezar nuevo chat" no crea nada.
- **Notificaciones** (`#notifDropdown`): 2 `<div>` fijos en el HTML, no hay dato real detrás.
- **Panel admin** ([admin/index.html](../auth/panel_control/admin/index.html)): estadísticas (`42.5K` usuarios, `1,284` posts, `0.8 ms` de latencia), la tabla de "Usuarios Recientes" y los "Avisos Recientes" de seguridad están escritos a mano en el HTML.
- Los botones de acción de esa tabla (ícono de lápiz "Editar", ícono de prohibido "Banear", ícono de "Restaurar") no tienen `addEventListener` — son puramente decorativos.
- Los ítems del menú lateral del admin ("Usuarios", "Comunidades", "Seguridad", "Reportes", "Ajustes Sistema") son `href="#"` sin sección asociada, salvo "Dashboard".

### 11.4 Backend real

Cubierto en detalle por las secciones 2 a 10 de este documento: Supabase (Auth + Postgres + Storage + Realtime), API propia en Express, RLS por tabla, y el orden de migración sugerido en la sección 10. Es el bloque de mayor esfuerzo y el que desbloquea todo lo demás (11.2 y 11.3 dependen de que esto exista).

### 11.5 Calidad y accesibilidad

- No hay carpeta `tests/` con contenido: cero pruebas automatizadas hoy.
- Varias imágenes generadas dinámicamente en [app.js](../assets/js/app.js) no llevan `alt` descriptivo.
- Los modales (chat, comentarios, noticias) no manejan foco de teclado ni cierre con `Esc`, lo que dificulta su uso con teclado o lector de pantalla.
- Gran parte de [index.html](../index.html) usa estilos `style="..."` inline en vez de clases CSS, lo que va a complicar mantener y sobrescribir estilos a medida que el proyecto crezca.

### 11.6 Contenido legal/institucional

- Los enlaces a "Acuerdo del usuario" y "Política de privacidad" en [login.html](../auth/login.html) no llevan a ninguna página. Si el proyecto se presenta como una red social real (aunque sea un proyecto académico), normalmente se espera al menos un documento básico de términos y privacidad.

### 11.7 Orden de prioridad recomendado

1. **11.1 (quick wins)** — se puede hacer hoy mismo, sin depender de nada más, y reduce riesgo (`.gitignore`) desde ya.
2. **11.4 (backend real)** — sección 10 de este documento ya trae el orden detallado (Supabase → RLS → login → Storage → API Express → seed → panel admin → tests).
3. **11.3 (mock → dato real)** — se resuelve como consecuencia natural de completar el punto 2; no requiere trabajo adicional de diseño, solo conectar la UI existente a los endpoints/tablas ya definidos en este documento.
4. **11.2 (registro/recuperación de contraseña)** — depende de tener Supabase Auth activo (punto 2); una vez está, son dos pantallas cortas.
5. **11.5 y 11.6 (calidad, accesibilidad, legal)** — no bloquean el funcionamiento del proyecto; se abordan como pulido antes de una entrega o publicación final.

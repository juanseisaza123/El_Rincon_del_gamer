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
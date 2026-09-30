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
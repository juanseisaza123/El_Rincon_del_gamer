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
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
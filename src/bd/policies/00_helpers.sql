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
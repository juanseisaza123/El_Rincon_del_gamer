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
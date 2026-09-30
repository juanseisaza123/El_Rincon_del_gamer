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
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
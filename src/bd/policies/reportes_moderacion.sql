alter table public.reportes_moderacion enable row level security;

create policy "reporte_insert_autenticado" on public.reportes_moderacion
for insert with check (denunciante_usuario_id = auth.uid());

create policy "reporte_select_propio_o_admin" on public.reportes_moderacion
for select using (denunciante_usuario_id = auth.uid() or rol_actual() = 'admin');

create policy "reporte_update_admin" on public.reportes_moderacion
for update using (rol_actual() = 'admin');
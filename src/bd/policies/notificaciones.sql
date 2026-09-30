alter table public.notificaciones enable row level security;

-- Reemplaza los 2 elementos hardcodeados del #notifDropdown
create policy "notificacion_select_propia" on public.notificaciones
for select using (usuario_id = auth.uid());
create policy "notificacion_update_propia" on public.notificaciones
for update using (usuario_id = auth.uid());

-- No hay policy de INSERT para usuarios normales: las crea el backend Express
-- con la service_role key, como parte de otra operación (dar like, comentar, etc.)
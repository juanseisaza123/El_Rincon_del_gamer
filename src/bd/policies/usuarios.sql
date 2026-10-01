alter table public.usuarios enable row level security;

-- Los perfiles son públicos dentro de la red social (como cualquier red social real)
create policy "usuarios_select_publico" on public.usuarios
for select using (estado = 'activo' or id = auth.uid() or rol_actual() = 'admin');

-- Cada quien edita solo su propio perfil
create policy "usuarios_update_propio" on public.usuarios
for update using (id = auth.uid());

-- Administrador administra todos los perfiles (incluye banear/desbanear)
create policy "usuarios_admin_todo" on public.usuarios
for all using (rol_actual() = 'admin');
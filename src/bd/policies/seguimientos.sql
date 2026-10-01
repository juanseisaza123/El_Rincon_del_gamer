-- Sistema de "Seguidores"/"Siguiendo" que hoy solo son números fijos en el HTML del perfil
alter table public.seguimientos enable row level security;

create policy "seguimiento_select_publico" on public.seguimientos
for select using (true);

create policy "seguimiento_insert_propio" on public.seguimientos
for insert with check (seguidor_usuario_id = auth.uid());

create policy "seguimiento_delete_propio" on public.seguimientos
for delete using (seguidor_usuario_id = auth.uid());
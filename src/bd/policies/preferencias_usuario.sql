-- Reemplaza el `erg_settings` de localStorage (tema, cursor gamer, glow)
alter table public.preferencias_usuario enable row level security;

create policy "preferencias_select_propia" on public.preferencias_usuario
for select using (usuario_id = auth.uid());

create policy "preferencias_upsert_propia" on public.preferencias_usuario
for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
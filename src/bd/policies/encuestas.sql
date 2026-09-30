alter table public.encuestas enable row level security;
create policy "encuesta_select_publica" on public.encuestas for select using (true);

alter table public.encuesta_opciones enable row level security;
create policy "opcion_select_publica" on public.encuesta_opciones for select using (true);

alter table public.encuesta_votos enable row level security;
create policy "voto_select_publico" on public.encuesta_votos for select using (true);
create policy "voto_insert_propio" on public.encuesta_votos
for insert with check (usuario_id = auth.uid());
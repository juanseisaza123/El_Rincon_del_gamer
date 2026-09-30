alter table public.conversaciones enable row level security;
create policy "conversacion_select_participante" on public.conversaciones
for select using (es_participante_conversacion(id));

alter table public.conversacion_participantes enable row level security;
create policy "participantes_select_propio" on public.conversacion_participantes
for select using (es_participante_conversacion(conversacion_id));

alter table public.mensajes enable row level security;
create policy "mensaje_select_participante" on public.mensajes
for select using (es_participante_conversacion(conversacion_id));
create policy "mensaje_insert_participante" on public.mensajes
for insert with check (
  autor_usuario_id = auth.uid() and es_participante_conversacion(conversacion_id)
);
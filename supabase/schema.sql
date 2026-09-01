-- =====================================================================
--  Diário de Obra CAPE — esquema do banco (Supabase / PostgreSQL)
--  Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- =====================================================================

-- ---------- perfis -------------------------------------------------
create table if not exists public.perfis (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null default '',
  crea        text,
  criado_em   timestamptz not null default now()
);

-- cria o perfil automaticamente quando um usuário é criado
create or replace function public.cria_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.cria_perfil();

-- ---------- obras --------------------------------------------------
create table if not exists public.obras (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  endereco     text,
  contratante  text,
  executante   text,
  rt           text,
  crea         text,
  art          text,
  inicio       date,
  prazo        text,
  criado_por   uuid not null references auth.users (id) on delete restrict,
  criado_em    timestamptz not null default now()
);

-- ---------- membros da obra ----------------------------------------
-- papel: 'gestor' administra a obra e o time; 'campo' lança diários.
create table if not exists public.obra_membros (
  obra_id   uuid not null references public.obras (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  papel     text not null default 'campo' check (papel in ('gestor', 'campo')),
  criado_em timestamptz not null default now(),
  primary key (obra_id, user_id)
);

create index if not exists obra_membros_user_idx on public.obra_membros (user_id);

-- ---------- diários ------------------------------------------------
create table if not exists public.diarios (
  id             uuid primary key default gen_random_uuid(),
  obra_id        uuid not null references public.obras (id) on delete cascade,
  data           date not null,
  folha          text not null default '',
  clima          jsonb not null default '{"manha":"Bom","tarde":"Bom","horasParadas":"","obs":""}'::jsonb,
  efetivo        jsonb not null default '[]'::jsonb,
  servicos       jsonb not null default '[]'::jsonb,
  materiais      jsonb not null default '[]'::jsonb,
  ocorrencias    text not null default '',
  fotos_qtd      text not null default '',
  fotos_assunto  text not null default '',
  ass_rt         text not null default '',
  ass_enc        text not null default '',
  ass_cont       text not null default '',
  autor_id       uuid not null references auth.users (id) on delete restrict,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (obra_id, data)
);

create index if not exists diarios_obra_data_idx on public.diarios (obra_id, data desc);

create or replace function public.toca_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists ao_atualizar_diario on public.diarios;
create trigger ao_atualizar_diario
  before update on public.diarios
  for each row execute function public.toca_atualizado_em();

-- =====================================================================
--  Row Level Security
-- =====================================================================
alter table public.perfis        enable row level security;
alter table public.obras         enable row level security;
alter table public.obra_membros  enable row level security;
alter table public.diarios       enable row level security;

-- função auxiliar: o usuário participa da obra?
create or replace function public.participa_da_obra(p_obra uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.obra_membros m
    where m.obra_id = p_obra and m.user_id = auth.uid()
  );
$$;

create or replace function public.gerencia_a_obra(p_obra uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.obra_membros m
    where m.obra_id = p_obra and m.user_id = auth.uid() and m.papel = 'gestor'
  );
$$;

-- ---------- perfis ----------
drop policy if exists perfis_leitura on public.perfis;
create policy perfis_leitura on public.perfis
  for select using (
    id = auth.uid()
    or exists (
      select 1 from public.obra_membros a
      join public.obra_membros b on a.obra_id = b.obra_id
      where a.user_id = auth.uid() and b.user_id = perfis.id
    )
  );

drop policy if exists perfis_atualiza on public.perfis;
create policy perfis_atualiza on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- obras ----------
drop policy if exists obras_leitura on public.obras;
create policy obras_leitura on public.obras
  for select using (public.participa_da_obra(id));

drop policy if exists obras_insere on public.obras;
create policy obras_insere on public.obras
  for insert with check (criado_por = auth.uid());

drop policy if exists obras_atualiza on public.obras;
create policy obras_atualiza on public.obras
  for update using (public.gerencia_a_obra(id)) with check (public.gerencia_a_obra(id));

drop policy if exists obras_apaga on public.obras;
create policy obras_apaga on public.obras
  for delete using (public.gerencia_a_obra(id));

-- ---------- membros ----------
drop policy if exists membros_leitura on public.obra_membros;
create policy membros_leitura on public.obra_membros
  for select using (public.participa_da_obra(obra_id));

-- o primeiro membro (o próprio criador) e os convites do gestor
drop policy if exists membros_insere on public.obra_membros;
create policy membros_insere on public.obra_membros
  for insert with check (
    user_id = auth.uid() or public.gerencia_a_obra(obra_id)
  );

drop policy if exists membros_apaga on public.obra_membros;
create policy membros_apaga on public.obra_membros
  for delete using (public.gerencia_a_obra(obra_id) or user_id = auth.uid());

-- ---------- diários ----------
drop policy if exists diarios_leitura on public.diarios;
create policy diarios_leitura on public.diarios
  for select using (public.participa_da_obra(obra_id));

drop policy if exists diarios_insere on public.diarios;
create policy diarios_insere on public.diarios
  for insert with check (public.participa_da_obra(obra_id) and autor_id = auth.uid());

drop policy if exists diarios_atualiza on public.diarios;
create policy diarios_atualiza on public.diarios
  for update using (public.participa_da_obra(obra_id)) with check (public.participa_da_obra(obra_id));

drop policy if exists diarios_apaga on public.diarios;
create policy diarios_apaga on public.diarios
  for delete using (public.gerencia_a_obra(obra_id) or autor_id = auth.uid());

-- =====================================================================
--  Funções de aplicação
-- =====================================================================

-- Cria a obra e já matricula quem criou como gestor, em uma transação só.
create or replace function public.criar_obra(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;

  insert into public.obras (nome, criado_por)
  values (coalesce(nullif(trim(p_nome), ''), 'Obra sem nome'), auth.uid())
  returning id into v_id;

  insert into public.obra_membros (obra_id, user_id, papel)
  values (v_id, auth.uid(), 'gestor');

  return v_id;
end;
$$;

-- Adiciona um funcionário à obra pelo e-mail dele (ele precisa já ter conta).
create or replace function public.adicionar_membro(p_obra uuid, p_email text, p_papel text default 'campo')
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid;
begin
  if not public.gerencia_a_obra(p_obra) then
    raise exception 'somente o gestor da obra pode adicionar pessoas';
  end if;

  select id into v_user from auth.users where lower(email) = lower(trim(p_email));

  if v_user is null then
    return 'nao_encontrado';
  end if;

  insert into public.obra_membros (obra_id, user_id, papel)
  values (p_obra, v_user, case when p_papel = 'gestor' then 'gestor' else 'campo' end)
  on conflict (obra_id, user_id) do update set papel = excluded.papel;

  return 'ok';
end;
$$;

revoke all on function public.criar_obra(text) from public;
revoke all on function public.adicionar_membro(uuid, text, text) from public;
grant execute on function public.criar_obra(text) to authenticated;
grant execute on function public.adicionar_membro(uuid, text, text) to authenticated;

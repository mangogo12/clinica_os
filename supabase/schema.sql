-- ============================================================
-- ClinicaOS — Schema completo
-- Rodar no SQL Editor do Supabase (service_role)
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- busca textual

-- ─── Enum types ──────────────────────────────────────────────────────────────

create type plano_tipo         as enum ('starter', 'pro', 'enterprise');
create type status_clinica     as enum ('ativo', 'suspenso', 'cancelado', 'pendente');
create type papel_membro       as enum ('admin', 'atendente', 'profissional', 'financeiro');
create type status_membro      as enum ('ativo', 'inativo', 'pendente');
create type status_profissional as enum ('ativo', 'inativo', 'licenca_medica', 'ferias');
create type status_paciente    as enum ('ativo', 'inativo', 'alta', 'em_tratamento', 'aguardando');
create type fonte_paciente     as enum ('agendamento_publico', 'cadastro_manual', 'indicacao', 'convenio');
create type status_agendamento as enum ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'falta');
create type origem_agendamento as enum ('dashboard', 'publica', 'api');
create type tipo_transacao     as enum ('entrada', 'saida');
create type status_transacao   as enum ('confirmado', 'pendente', 'cancelado', 'pago', 'processando');
create type categoria_financeira as enum ('consulta', 'exame', 'procedimento', 'convenio', 'aluguel', 'salario', 'material', 'marketing', 'outros');
create type acao_auditoria     as enum ('visualizar_paciente', 'criar_agendamento', 'editar_agendamento', 'cancelar_agendamento', 'visualizar_financeiro', 'criar_transacao', 'deletar_registro', 'login', 'logout');

-- ─── Clínicas (tenant root) ──────────────────────────────────────────────────

create table clinicas (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  subdominio      text not null unique,
  logo_url        text,
  plano           plano_tipo not null default 'starter',
  status          status_clinica not null default 'pendente',
  cnpj            text,
  telefone        text,
  email           text,
  endereco        jsonb,
  configuracoes   jsonb not null default '{}'::jsonb,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- ─── Perfis de usuário (espelha auth.users) ───────────────────────────────────

create table perfis_usuario (
  id              uuid primary key references auth.users(id) on delete cascade,
  nome_completo   text not null,
  email           text not null,
  avatar_url      text,
  telefone        text,
  criado_em       timestamptz not null default now()
);

-- ─── Membros da clínica (RBAC) ────────────────────────────────────────────────

create table membros_clinica (
  id          uuid primary key default uuid_generate_v4(),
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  papel       papel_membro not null default 'atendente',
  status      status_membro not null default 'pendente',
  criado_em   timestamptz not null default now(),
  unique(clinica_id, usuario_id)
);

-- ─── Profissionais ────────────────────────────────────────────────────────────

create table profissionais (
  id                    uuid primary key default uuid_generate_v4(),
  clinica_id            uuid not null references clinicas(id) on delete cascade,
  membro_id             uuid references membros_clinica(id),
  nome                  text not null,
  especialidade         text not null,
  registro_profissional text,
  foto_url              text,
  status                status_profissional not null default 'ativo',
  horario_inicio        time not null default '08:00',
  horario_fim           time not null default '18:00',
  dias_atendimento      int[] not null default '{1,2,3,4,5}', -- 0=dom,6=sab
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- ─── Serviços ─────────────────────────────────────────────────────────────────

create table servicos (
  id                uuid primary key default uuid_generate_v4(),
  clinica_id        uuid not null references clinicas(id) on delete cascade,
  nome              text not null,
  descricao         text,
  duracao_minutos   int not null default 30,
  preco             numeric(10,2) not null default 0,
  ativo             boolean not null default true,
  icone             text,
  popular           boolean not null default false,
  criado_em         timestamptz not null default now()
);

-- ─── Pacientes / CRM ─────────────────────────────────────────────────────────

create table pacientes (
  id                          uuid primary key default uuid_generate_v4(),
  clinica_id                  uuid not null references clinicas(id) on delete cascade,
  nome                        text not null,
  cpf                         text,
  email                       text,
  telefone                    text not null,
  data_nascimento             date,
  status                      status_paciente not null default 'aguardando',
  fonte                       fonte_paciente not null default 'cadastro_manual',
  profissional_responsavel_id uuid references profissionais(id),
  ultima_consulta             date,
  observacoes                 text,
  consentimento_lgpd          boolean not null default false,
  criado_em                   timestamptz not null default now(),
  atualizado_em               timestamptz not null default now()
);

-- índices de busca
create index idx_pacientes_nome      on pacientes using gin(nome gin_trgm_ops);
create index idx_pacientes_cpf       on pacientes(cpf) where cpf is not null;
create index idx_pacientes_clinica   on pacientes(clinica_id);

-- ─── Agendamentos ─────────────────────────────────────────────────────────────

create table agendamentos (
  id                   uuid primary key default uuid_generate_v4(),
  clinica_id           uuid not null references clinicas(id) on delete cascade,
  paciente_id          uuid not null references pacientes(id),
  profissional_id      uuid not null references profissionais(id),
  servico_id           uuid not null references servicos(id),
  data_hora_inicio     timestamptz not null,
  data_hora_fim        timestamptz not null,
  status               status_agendamento not null default 'agendado',
  observacoes          text,
  origem               origem_agendamento not null default 'dashboard',
  confirmado_em        timestamptz,
  cancelado_em         timestamptz,
  motivo_cancelamento  text,
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);

create index idx_agendamentos_clinica    on agendamentos(clinica_id);
create index idx_agendamentos_data       on agendamentos(clinica_id, data_hora_inicio);
create index idx_agendamentos_profissional on agendamentos(profissional_id, data_hora_inicio);

-- ─── Financeiro — Transações ──────────────────────────────────────────────────

create table transacoes (
  id                  uuid primary key default uuid_generate_v4(),
  clinica_id          uuid not null references clinicas(id) on delete cascade,
  tipo                tipo_transacao not null,
  descricao           text not null,
  valor               numeric(10,2) not null,
  categoria           categoria_financeira not null default 'outros',
  status              status_transacao not null default 'pendente',
  data_transacao      date not null,
  agendamento_id      uuid references agendamentos(id),
  paciente_id         uuid references pacientes(id),
  referencia_externa  text,
  criado_por          uuid references auth.users(id),
  criado_em           timestamptz not null default now()
);

create index idx_transacoes_clinica on transacoes(clinica_id, data_transacao);

-- ─── Contas a vencer ─────────────────────────────────────────────────────────

create table contas_vencer (
  id          uuid primary key default uuid_generate_v4(),
  clinica_id  uuid not null references clinicas(id) on delete cascade,
  descricao   text not null,
  valor       numeric(10,2) not null,
  vencimento  date not null,
  pago        boolean not null default false,
  pago_em     timestamptz,
  criado_em   timestamptz not null default now()
);

-- ─── Leads de agendamento público ─────────────────────────────────────────────

create table leads (
  id              uuid primary key default uuid_generate_v4(),
  clinica_id      uuid not null references clinicas(id) on delete cascade,
  nome            text not null,
  email           text,
  telefone        text not null,
  servico_id      uuid references servicos(id),
  profissional_id uuid references profissionais(id),
  mensagem        text,
  convertido      boolean not null default false,
  criado_em       timestamptz not null default now()
);

-- ─── Auditoria ───────────────────────────────────────────────────────────────

create table auditoria (
  id          uuid primary key default uuid_generate_v4(),
  clinica_id  uuid references clinicas(id) on delete set null,
  usuario_id  uuid references auth.users(id) on delete set null,
  acao        acao_auditoria not null,
  tabela      text,
  registro_id text,
  detalhes    jsonb,
  ip_address  inet,
  criado_em   timestamptz not null default now()
);

create index idx_auditoria_clinica on auditoria(clinica_id, criado_em desc);

-- ─── Triggers: atualizado_em automático ──────────────────────────────────────

create or replace function trigger_set_updated_at()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end;
$$;

create trigger trg_clinicas_updated
  before update on clinicas
  for each row execute procedure trigger_set_updated_at();

create trigger trg_profissionais_updated
  before update on profissionais
  for each row execute procedure trigger_set_updated_at();

create trigger trg_pacientes_updated
  before update on pacientes
  for each row execute procedure trigger_set_updated_at();

create trigger trg_agendamentos_updated
  before update on agendamentos
  for each row execute procedure trigger_set_updated_at();

-- ─── Trigger: criar perfil ao registrar usuário ───────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfis_usuario (id, nome_completo, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Helper: setar app.clinica_id na sessão ───────────────────────────────────

create or replace function set_clinica_id(p_clinica_id uuid)
returns void language plpgsql security definer as $$
begin
  perform set_config('app.clinica_id', p_clinica_id::text, true);
end;
$$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table clinicas            enable row level security;
alter table perfis_usuario      enable row level security;
alter table membros_clinica     enable row level security;
alter table profissionais       enable row level security;
alter table servicos            enable row level security;
alter table pacientes           enable row level security;
alter table agendamentos        enable row level security;
alter table transacoes          enable row level security;
alter table contas_vencer       enable row level security;
alter table leads               enable row level security;
alter table auditoria           enable row level security;

-- Função auxiliar: obter clinica_id da sessão
create or replace function current_clinica_id() returns uuid language sql stable as $$
  select nullif(current_setting('app.clinica_id', true), '')::uuid;
$$;

-- Função auxiliar: papel do usuário na clínica atual
create or replace function current_user_papel() returns text language sql stable security definer as $$
  select papel::text from membros_clinica
  where clinica_id = current_clinica_id()
    and usuario_id = auth.uid()
    and status = 'ativo'
  limit 1;
$$;

-- ── clinicas ──
create policy "membro pode ver propria clinica"
  on clinicas for select
  using (id = current_clinica_id());

create policy "admin pode editar clinica"
  on clinicas for update
  using (id = current_clinica_id() and current_user_papel() = 'admin');

-- ── perfis_usuario ──
create policy "usuario ve proprio perfil"
  on perfis_usuario for select
  using (id = auth.uid());

create policy "usuario edita proprio perfil"
  on perfis_usuario for update
  using (id = auth.uid());

-- ── membros_clinica ──
create policy "membro ve membros da clinica"
  on membros_clinica for select
  using (clinica_id = current_clinica_id());

create policy "admin gerencia membros"
  on membros_clinica for all
  using (clinica_id = current_clinica_id() and current_user_papel() = 'admin');

-- ── profissionais ──
create policy "todos membros veem profissionais"
  on profissionais for select
  using (clinica_id = current_clinica_id());

create policy "admin e atendente gerenciam profissionais"
  on profissionais for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'atendente'));

-- ── servicos ──
create policy "todos membros veem servicos"
  on servicos for select
  using (clinica_id = current_clinica_id());

create policy "admin gerencia servicos"
  on servicos for all
  using (clinica_id = current_clinica_id() and current_user_papel() = 'admin');

-- ── pacientes ──
create policy "membros veem pacientes da clinica"
  on pacientes for select
  using (clinica_id = current_clinica_id());

create policy "profissional ve somente seus pacientes"
  on pacientes for select
  using (
    clinica_id = current_clinica_id()
    and (
      current_user_papel() in ('admin', 'atendente', 'financeiro')
      or profissional_responsavel_id in (
        select id from profissionais
        where membro_id in (
          select id from membros_clinica where usuario_id = auth.uid()
        )
      )
    )
  );

create policy "admin e atendente gerenciam pacientes"
  on pacientes for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'atendente'));

-- ── agendamentos ──
create policy "membros veem agendamentos"
  on agendamentos for select
  using (clinica_id = current_clinica_id());

create policy "admin e atendente gerenciam agendamentos"
  on agendamentos for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'atendente'));

create policy "profissional ve propria agenda"
  on agendamentos for select
  using (
    clinica_id = current_clinica_id()
    and profissional_id in (
      select id from profissionais
      where membro_id in (
        select id from membros_clinica where usuario_id = auth.uid()
      )
    )
  );

-- ── transacoes ──
create policy "financeiro e admin veem transacoes"
  on transacoes for select
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'financeiro'));

create policy "financeiro e admin gerenciam transacoes"
  on transacoes for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'financeiro'));

-- ── contas_vencer ──
create policy "financeiro e admin veem contas"
  on contas_vencer for select
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'financeiro'));

create policy "financeiro e admin gerenciam contas"
  on contas_vencer for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'financeiro'));

-- ── auditoria (somente leitura para admin) ──
create policy "admin ve auditoria"
  on auditoria for select
  using (clinica_id = current_clinica_id() and current_user_papel() = 'admin');

-- ── leads (público — insert via service_role) ──
-- Sem política pública; inserção via service_role apenas

-- ─── Seed: clínica demo ────────────────────────────────────────────────────

insert into clinicas (nome, subdominio, plano, status, email, telefone) values
  ('Clínica Central', 'central', 'pro', 'ativo', 'contato@clinicacentral.com', '(11) 3000-0001'),
  ('Unidade Sul', 'sul', 'starter', 'ativo', 'sul@clinicacentral.com', '(11) 3000-0002'),
  ('Centro Pediátrico', 'pediatria', 'starter', 'pendente', null, null);

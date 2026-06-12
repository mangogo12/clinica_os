create table if not exists profissionais_servicos (
  id              uuid primary key default uuid_generate_v4(),
  clinica_id      uuid not null references clinicas(id) on delete cascade,
  profissional_id uuid not null references profissionais(id) on delete cascade,
  servico_id      uuid not null references servicos(id) on delete cascade,
  criado_em       timestamptz not null default now(),
  unique(profissional_id, servico_id)
);

create index if not exists idx_profissionais_servicos_profissional on profissionais_servicos(profissional_id);
create index if not exists idx_profissionais_servicos_clinica on profissionais_servicos(clinica_id);

alter table profissionais_servicos enable row level security;

drop policy if exists "todos membros veem profissionais_servicos" on profissionais_servicos;
create policy "todos membros veem profissionais_servicos"
  on profissionais_servicos for select
  using (clinica_id = current_clinica_id());

drop policy if exists "admin e atendente gerenciam profissionais_servicos" on profissionais_servicos;
create policy "admin e atendente gerenciam profissionais_servicos"
  on profissionais_servicos for all
  using (clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'atendente'));

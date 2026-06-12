-- Controle diário de ponto: registros de entrada/saída dos membros da clínica

create type tipo_ponto as enum ('entrada', 'saida');

create table registros_ponto (
  id            uuid primary key default uuid_generate_v4(),
  clinica_id    uuid not null references clinicas(id) on delete cascade,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  tipo          tipo_ponto not null,
  registrado_em timestamptz not null default now(),
  criado_em     timestamptz not null default now()
);

create index idx_registros_ponto_usuario_dia on registros_ponto(clinica_id, usuario_id, registrado_em desc);
create index idx_registros_ponto_clinica_data on registros_ponto(clinica_id, registrado_em desc);

alter table registros_ponto enable row level security;

-- Cada membro registra e visualiza apenas o próprio ponto
create policy "usuario registra proprio ponto"
  on registros_ponto for insert
  with check (usuario_id = auth.uid() and clinica_id = current_clinica_id());

create policy "usuario ve proprio ponto"
  on registros_ponto for select
  using (usuario_id = auth.uid() and clinica_id = current_clinica_id());

-- Perfis de gestão visualizam o ponto de toda a clínica
create policy "gestores veem ponto da clinica"
  on registros_ponto for select
  using (
    clinica_id = current_clinica_id()
    and current_user_papel() in ('admin', 'financeiro', 'medico_admin')
  );

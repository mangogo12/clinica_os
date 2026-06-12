-- Corrige policies de registros_ponto: current_clinica_id() é uma config de
-- sessão (set_config local), que não persiste entre requisições separadas do
-- PostgREST. As policies passam a validar via auth.uid() + membros_clinica.

drop policy if exists "usuario registra proprio ponto" on registros_ponto;
drop policy if exists "usuario ve proprio ponto" on registros_ponto;
drop policy if exists "gestores veem ponto da clinica" on registros_ponto;

create policy "usuario registra proprio ponto"
  on registros_ponto for insert
  with check (
    usuario_id = auth.uid()
    and exists (
      select 1 from membros_clinica m
      where m.clinica_id = registros_ponto.clinica_id
        and m.usuario_id = auth.uid()
        and m.status = 'ativo'
    )
  );

create policy "usuario ve proprio ponto"
  on registros_ponto for select
  using (usuario_id = auth.uid());

create policy "gestores veem ponto da clinica"
  on registros_ponto for select
  using (
    exists (
      select 1 from membros_clinica m
      where m.clinica_id = registros_ponto.clinica_id
        and m.usuario_id = auth.uid()
        and m.status = 'ativo'
        and m.papel in ('admin', 'financeiro', 'medico_admin')
    )
  );

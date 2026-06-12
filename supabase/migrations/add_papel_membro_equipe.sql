-- Novos cargos de equipe: médico e médico administrador.
-- 'profissional' deixa de ser usado para novos cadastros (vira 'medico').
alter type papel_membro add value if not exists 'medico';
alter type papel_membro add value if not exists 'medico_admin';

update membros_clinica set papel = 'medico' where papel = 'profissional';

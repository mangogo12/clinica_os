-- Permite que pacientes.status espelhe diretamente status_agendamento,
-- mantendo os dois sempre com o mesmo valor.
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'agendado';
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'confirmado';
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'em_atendimento';
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'concluido';
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'cancelado';
ALTER TYPE status_paciente ADD VALUE IF NOT EXISTS 'falta';

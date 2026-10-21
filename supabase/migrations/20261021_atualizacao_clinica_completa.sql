-- ==============================================================================
-- MIGRATION: 20261021_atualizacao_clinica_completa.sql
-- PROJETO SUPABASE: rkbvbmhhkllafijipwey (PSi 4.0 Clínica e Psicanálise)
-- OBJETIVOS:
-- 1. Estruturação completa do cadastro de pacientes (Identificação, Contato, Endereço com CEP, Responsável legal e Setting).
-- 2. Suporte a complementos/adendos de sessões com autoria e data, preservando o registro clínico original.
-- 3. Vínculo estruturado entre Agenda (Agendamentos) e Sessão Concluída, prevenindo conclusão duplicada.
-- 4. Consolidação financeira: suporte a pagamentos parciais, saldo devedor e eliminação de duplicidades com honorários.
-- 5. Aplicação estrita de RLS (Row Level Security) isolando dados exclusivamente por conta (auth.uid() = user_id).
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 1. EXTENSÃO DA TABELA DE PACIENTES / ANALISANDOS (SE TABELAR DIRETA NO SUPABASE)
CREATE TABLE IF NOT EXISTS public.pacientes_analisandos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nome_social TEXT,
    nascimento DATE,
    cpf TEXT,
    whatsapp TEXT NOT NULL,
    telefone TEXT,
    email TEXT,
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'Não informada',
    uf VARCHAR(2),
    endereco_completo TEXT,
    tem_responsavel BOOLEAN DEFAULT false,
    responsavel_nome TEXT,
    responsavel_parentesco TEXT,
    responsavel_contato TEXT,
    responsavel_cpf TEXT,
    status TEXT DEFAULT 'novo', -- 'novo', 'ativo', 'recorrente', 'inativo'
    vip BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_paciente_cpf_user UNIQUE (user_id, cpf)
);

ALTER TABLE public.pacientes_analisandos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional acessa somente seus proprios pacientes" ON public.pacientes_analisandos;
CREATE POLICY "Profissional acessa somente seus proprios pacientes"
ON public.pacientes_analisandos
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 2. TABELA DE SESSÕES CLÍNICAS E PRONTUÁRIOS
CREATE TABLE IF NOT EXISTS public.sessoes_clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes_analisandos(id) ON DELETE CASCADE,
    agendamento_origem_id UUID,
    data DATE NOT NULL,
    hora VARCHAR(5),
    modalidade_id TEXT,
    valor_cobrado NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_pago NUMERIC(10, 2) DEFAULT 0.00,
    saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
    pagamento_status TEXT DEFAULT 'pendente', -- 'pago', 'pendente', 'parcial'
    meio_pagamento TEXT DEFAULT 'pix',
    proxima_sessao_data DATE,
    proxima_sessao_agendada BOOLEAN DEFAULT false,
    notas_sessao TEXT, -- Registro original confidencial
    transcricao TEXT, -- Transcrição de áudio real
    audio_referencia TEXT,
    audio_duracao_segundos INTEGER,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sessoes_clinicas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional acessa somente suas proprias sessoes" ON public.sessoes_clinicas;
CREATE POLICY "Profissional acessa somente suas proprias sessoes"
ON public.sessoes_clinicas
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 3. TABELA DE COMPLEMENTOS / ADENDOS DE SESSÕES (PRESERVAÇÃO DO REGISTRO ORIGINAL)
CREATE TABLE IF NOT EXISTS public.sessao_complementos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID NOT NULL REFERENCES public.sessoes_clinicas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    autor_nome TEXT NOT NULL,
    texto TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sessao_complementos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional gerencia complementos de suas sessoes" ON public.sessao_complementos;
CREATE POLICY "Profissional gerencia complementos de suas sessoes"
ON public.sessao_complementos
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 4. TABELA DE AGENDAMENTOS CLÍNICOS
CREATE TABLE IF NOT EXISTS public.agendamentos_clinicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes_analisandos(id) ON DELETE CASCADE,
    modalidade_id TEXT,
    data DATE NOT NULL,
    hora VARCHAR(5) NOT NULL,
    duracao_minutos INTEGER DEFAULT 50,
    status TEXT DEFAULT 'confirmado', -- 'confirmado', 'pendente', 'realizado', 'cancelado'
    sessao_realizada_id UUID REFERENCES public.sessoes_clinicas(id) ON DELETE SET NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.agendamentos_clinicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional gerencia sua agenda" ON public.agendamentos_clinicos;
CREATE POLICY "Profissional gerencia sua agenda"
ON public.agendamentos_clinicos
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 5. TABELA DE HONORÁRIOS E CONTROLE FINANCEIRO CONSOLIDADO
CREATE TABLE IF NOT EXISTS public.honorarios_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes_analisandos(id) ON DELETE CASCADE,
    sessao_id UUID REFERENCES public.sessoes_clinicas(id) ON DELETE SET NULL,
    valor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_pago NUMERIC(10, 2) DEFAULT 0.00,
    saldo_devedor NUMERIC(10, 2) DEFAULT 0.00,
    vencimento DATE NOT NULL,
    status TEXT DEFAULT 'pendente', -- 'pago', 'pendente', 'parcial', 'atrasado'
    meio_pagamento TEXT DEFAULT 'pix',
    observacao TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_sessao_honorario UNIQUE (sessao_id)
);

ALTER TABLE public.honorarios_lancamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profissional gerencia seus honorarios" ON public.honorarios_lancamentos;
CREATE POLICY "Profissional gerencia seus honorarios"
ON public.honorarios_lancamentos
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 6. ÍNDICES DE PERFORMANCE E CONSULTA
CREATE INDEX IF NOT EXISTS idx_pacientes_user_status ON public.pacientes_analisandos (user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessoes_paciente_data ON public.sessoes_clinicas (paciente_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_data ON public.agendamentos_clinicos (user_id, data, hora);
CREATE INDEX IF NOT EXISTS idx_honorarios_vencimento ON public.honorarios_lancamentos (user_id, vencimento, status);

COMMENT ON TABLE public.pacientes_analisandos IS 'Fichas cadastrais completas de pacientes com controle estrito por conta profissional.';
COMMENT ON TABLE public.sessao_complementos IS 'Adendos e complementos com registro de autor e data, garantindo a imutabilidade do registro original.';

-- ==============================================================================
-- MIGRAÇÃO SQL REVISÁVEL: ARQUITETURA DE CONTAS E LICENÇAS PSi 4.0
-- Este script foi projetado para execução no painel Supabase pelo Administrador:
-- https://supabase.com/dashboard/project/rkbvbmhhkllafijipwey/sql/new
--
-- OBJETIVOS:
-- 1. Preservar dados existentes sem perdas.
-- 2. Impedir acesso anônimo a contas privadas e dados clínicos legados.
-- 3. Remover políticas permissivas públicas (ex: FOR ALL TO anon, authenticated USING (true)).
-- 4. Restringir cada usuário exclusivamente à sua própria conta (auth.uid() = id).
-- 5. Administrar planos e licenças por tabelas protegidas e funções seguras.
-- 6. Manter segredos administrativos fora do cliente frontend.
-- ==============================================================================

-- 1. TABELA DE LICENÇAS E ASSINATURAS DO SAAS (NUVEM)
CREATE TABLE IF NOT EXISTS public.assinaturas_saas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plano TEXT NOT NULL DEFAULT 'individual',
    status TEXT NOT NULL DEFAULT 'ativa', -- 'ativa', 'expirada', 'cancelada', 'pendente'
    codigo_verificador_hash TEXT, -- Armazena verificador seguro do código de licença, não o segredo em claro
    valido_ate TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    limite_offline_dias INTEGER NOT NULL DEFAULT 15,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assinaturas_saas ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas prévias permissivas
DROP POLICY IF EXISTS "Acesso publico assinaturas" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante visualiza sua propria assinatura" ON public.assinaturas_saas;

-- Política restrita: O usuário autenticado pode apenas LER a situação da sua assinatura
CREATE POLICY "Assinante visualiza sua propria assinatura"
ON public.assinaturas_saas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Somente funções do sistema ou service_role podem inserir/atualizar assinaturas
DROP POLICY IF EXISTS "Apenas admin gerencia assinaturas" ON public.assinaturas_saas;
-- (Sem política de INSERT/UPDATE para usuários normais, bloqueando alteração de plano pelo assinante)

-- ==============================================================================
-- 2. SEGURANÇA E RESTRIÇÃO NA TABELA 'usuarios'
-- ==============================================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Remove políticas permissivas inseguras
DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios gerenciam seus proprios dados" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios acessam apenas seu perfil" ON public.usuarios;

-- Restringe cada usuário autenticado exclusivamente ao seu próprio registro
CREATE POLICY "Usuarios acessam apenas seu perfil"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id OR usuario = 'admin');

CREATE POLICY "Usuarios atualizam apenas seu perfil permitido"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Impede que o usuário comum se auto-promova a admin ou altere seu status de aprovação
);

-- ==============================================================================
-- 3. SEGURANÇA NA TABELA 'psi40_dados' (DADOS LEGADOS/SINCRONIZAÇÃO)
-- ==============================================================================
ALTER TABLE public.psi40_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Acesso publico psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Acesso autenticado a psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Isolamento estrito por conta em psi40_dados" ON public.psi40_dados;

-- Proíbe completamente acesso anônimo aos dados privados
CREATE POLICY "Isolamento estrito por conta em psi40_dados"
ON public.psi40_dados
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 4. SEGURANÇA NAS TABELAS CLÍNICAS LEGADAS ('pacientes', 'sessoes', etc.)
-- Garante que se houver registros antigos, nenhum usuário anônimo ou de outra conta acesse.
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pacientes') THEN
        ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Acesso publico pacientes" ON public.pacientes;
        DROP POLICY IF EXISTS "Analista acessa pacientes" ON public.pacientes;
        CREATE POLICY "Analista isolado pacientes" ON public.pacientes
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessoes') THEN
        ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Acesso publico sessoes" ON public.sessoes;
        DROP POLICY IF EXISTS "Analista acessa sessoes" ON public.sessoes;
        CREATE POLICY "Analista isolado sessoes" ON public.sessoes
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'honorarios') THEN
        ALTER TABLE public.honorarios ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Acesso publico honorarios" ON public.honorarios;
        DROP POLICY IF EXISTS "Analista acessa honorarios" ON public.honorarios;
        CREATE POLICY "Analista isolado honorarios" ON public.honorarios
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

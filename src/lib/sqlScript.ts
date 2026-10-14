export const SQL_MIGRACAO_NOVO_SUPABASE = `-- ==============================================================================
-- SCRIPT DE INICIALIZAÇÃO PARA NOVO PROJETO SUPABASE - PSi 4.0
-- Execute este script no SQL Editor do seu projeto Supabase:
-- Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABELA DE LICENÇAS E ASSINATURAS DO SAAS (NUVEM)
CREATE TABLE IF NOT EXISTS public.assinaturas_saas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plano TEXT NOT NULL DEFAULT 'individual',
    status TEXT NOT NULL DEFAULT 'ativa', -- 'ativa', 'expirada', 'cancelada', 'pendente'
    codigo_verificador_hash TEXT,
    valido_ate TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    limite_offline_dias INTEGER NOT NULL DEFAULT 15,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assinaturas_saas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico assinaturas" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante visualiza sua propria assinatura" ON public.assinaturas_saas;

CREATE POLICY "Assinante visualiza sua propria assinatura"
ON public.assinaturas_saas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    usuario TEXT,
    nome TEXT,
    email TEXT,
    crp TEXT,
    telefone TEXT,
    role TEXT DEFAULT 'psicologo',
    status TEXT DEFAULT 'ativo',
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios acessam apenas seu perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios atualizam apenas seu perfil permitido" ON public.usuarios;

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
WITH CHECK (auth.uid() = id);

-- 3. TABELA DE BACKUP/SINCRONIZAÇÃO SEGURA
CREATE TABLE IF NOT EXISTS public.psi40_dados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    dados_criptografados JSONB NOT NULL,
    versao INTEGER DEFAULT 1,
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.psi40_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Isolamento estrito por conta em psi40_dados" ON public.psi40_dados;

CREATE POLICY "Isolamento estrito por conta em psi40_dados"
ON public.psi40_dados
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

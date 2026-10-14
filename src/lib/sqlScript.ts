export const SQL_MIGRACAO_NOVO_SUPABASE = `-- ==============================================================================
-- SCRIPT DE INICIALIZAÇÃO E POLÍTICAS RLS - NOVO PROJETO SUPABASE (PSi 4.0)
-- Projeto: rkbvbmhhkllafijipwey (https://rkbvbmhhkllafijipwey.supabase.co)
-- Execute no SQL Editor do seu projeto Supabase:
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
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_assinatura_user UNIQUE (user_id)
);

ALTER TABLE public.assinaturas_saas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico assinaturas" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante visualiza sua propria assinatura" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante insere sua assinatura inicial" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante atualiza sua propria assinatura" ON public.assinaturas_saas;

-- Políticas RLS estritas: apenas o próprio usuário autenticado pode acessar
CREATE POLICY "Assinante visualiza sua propria assinatura"
ON public.assinaturas_saas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Assinante insere sua assinatura inicial"
ON public.assinaturas_saas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assinante atualiza sua propria assinatura"
ON public.assinaturas_saas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Usuarios inserem seu proprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios atualizam apenas seu perfil permitido" ON public.usuarios;

CREATE POLICY "Usuarios acessam apenas seu perfil"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuarios inserem seu proprio perfil"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

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
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_tipo UNIQUE (user_id, tipo)
);

ALTER TABLE public.psi40_dados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Acesso publico psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Acesso autenticado a psi40_dados" ON public.psi40_dados;
DROP POLICY IF EXISTS "Isolamento estrito por conta em psi40_dados" ON public.psi40_dados;

CREATE POLICY "Isolamento estrito por conta em psi40_dados"
ON public.psi40_dados
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. TRIGGER AUTOMÁTICO: CRIA PERFIL E ASSINATURA AO REGISTRAR EM auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Sincroniza dados do perfil de assinante em public.usuarios de forma segura
  BEGIN
    INSERT INTO public.usuarios (id, email, nome, crp, role, status)
    VALUES (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'crp',
      'psicologo',
      'ativo'
    )
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      crp = coalesce(EXCLUDED.crp, public.usuarios.crp),
      atualizado_em = timezone('utc'::text, now());
  EXCEPTION WHEN OTHERS THEN
    -- Não aborta o cadastro em auth.users caso a tabela ainda não exista ou esteja sendo alterada
    RAISE WARNING 'Aviso ao provisionar usuario em public.usuarios: %', SQLERRM;
  END;

  -- 2. Sincroniza assinatura SaaS inicial de 30 dias de teste
  BEGIN
    INSERT INTO public.assinaturas_saas (user_id, plano, status, valido_ate)
    VALUES (
      new.id,
      'individual',
      'ativa',
      now() + interval '30 days'
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Não aborta o cadastro em auth.users para evitar "Database error saving new user"
    RAISE WARNING 'Aviso ao provisionar assinatura em public.assinaturas_saas: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

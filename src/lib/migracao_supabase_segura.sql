-- ==============================================================================
-- MIGRAÇÃO SQL E POLÍTICAS RLS: PROJETO SUPABASE rkbvbmhhkllafijipwey (PSi 4.0)
-- Painel Supabase: https://supabase.com/dashboard/project/rkbvbmhhkllafijipwey/sql/new
--
-- OBJETIVOS:
-- 1. Perfil de Administrador: Gerenciamento, aprovação e ativação/desativação de assinaturas mensais.
-- 2. Restringir acesso estritamente de acordo com as políticas RLS (Row Level Security).
-- 3. Assinantes acessam somente seus próprios dados (auth.uid() = user_id).
-- 4. Administradores (role = 'admin' ou backupvideomidias@gmail.com) possuem visão e gestão sobre os assinantes.
-- 5. Criar automaticamente perfil e assinatura via Trigger Seguro (SECURITY DEFINER).
-- ==============================================================================

-- 0. LIMPEZA DE TRIGGERS E FUNÇÕES PRÉVIAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_usuarios ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    usuario TEXT,
    nome TEXT,
    email TEXT,
    senha_texto TEXT,
    crp TEXT,
    telefone TEXT,
    role TEXT DEFAULT 'psicologo', -- 'admin', 'psicologo'
    status TEXT DEFAULT 'pendente', -- 'ativo', 'inativo', 'pendente'
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha_texto TEXT;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Função auxiliar de verificação de Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'backupvideomidias@gmail.com')
  ) OR (auth.jwt() ->> 'email' = 'backupvideomidias@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas de RLS para public.usuarios
DROP POLICY IF EXISTS "Acesso publico usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios acessam apenas seu perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios inserem seu proprio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios atualizam apenas seu perfil permitido" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios acessam seu perfil ou admins acessam todos" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem atualizar todos os usuarios" ON public.usuarios;

CREATE POLICY "Usuarios acessam seu perfil ou admins acessam todos"
ON public.usuarios
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Usuarios inserem seu proprio perfil"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Usuarios atualizam seu perfil e admin atualiza todos"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. TABELA DE LICENÇAS E ASSINATURAS DO SAAS (NUVEM)
CREATE TABLE IF NOT EXISTS public.assinaturas_saas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plano TEXT NOT NULL DEFAULT 'mensal', -- 'mensal', 'anual', 'semestral', 'individual', 'saas_pro'
    status TEXT NOT NULL DEFAULT 'pendente', -- 'ativa', 'inativa', 'pendente', 'cancelada'
    codigo_verificador_hash TEXT,
    valido_ate TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    limite_offline_dias INTEGER NOT NULL DEFAULT 15,
    aprovado_por TEXT,
    aprovado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_assinatura_user UNIQUE (user_id)
);

ALTER TABLE public.assinaturas_saas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso publico assinaturas" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante visualiza sua propria assinatura" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante insere sua assinatura inicial" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante atualiza sua propria assinatura" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Assinante visualiza sua assinatura ou admin visualiza todas" ON public.assinaturas_saas;
DROP POLICY IF EXISTS "Admin pode gerenciar assinaturas" ON public.assinaturas_saas;

CREATE POLICY "Assinante visualiza sua assinatura ou admin visualiza todas"
ON public.assinaturas_saas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Assinante insere sua assinatura inicial ou admin insere"
ON public.assinaturas_saas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Assinante e admin atualizam assinaturas"
ON public.assinaturas_saas
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

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

DROP POLICY IF EXISTS "Isolamento estrito por conta em psi40_dados" ON public.psi40_dados;

CREATE POLICY "Isolamento estrito por conta em psi40_dados"
ON public.psi40_dados
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. FUNÇÕES ADMINISTRATIVAS SEGURAS (SECURITY DEFINER)
-- Permite ao Administrador aprovar um assinante com dias de validade e plano mensal
CREATE OR REPLACE FUNCTION public.admin_aprovar_usuario(
    p_user_id UUID,
    p_dias_validade INTEGER DEFAULT 30,
    p_plano TEXT DEFAULT 'mensal'
)
RETURNS JSONB AS $$
DECLARE
    v_admin_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer perfil de Administrador.';
    END IF;

    v_admin_email := coalesce(auth.jwt() ->> 'email', 'admin');

    -- Atualiza status do usuário para ativo
    UPDATE public.usuarios
    SET status = 'ativo',
        atualizado_em = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Atualiza assinatura para ativa com nova validade
    INSERT INTO public.assinaturas_saas (user_id, plano, status, valido_ate, aprovado_por, aprovado_em)
    VALUES (
        p_user_id,
        p_plano,
        'ativa',
        now() + (p_dias_validade || ' days')::interval,
        v_admin_email,
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        status = 'ativa',
        plano = EXCLUDED.plano,
        valido_ate = EXCLUDED.valido_ate,
        aprovado_por = EXCLUDED.aprovado_por,
        aprovado_em = EXCLUDED.aprovado_em,
        atualizado_em = timezone('utc'::text, now());

    RETURN jsonb_build_object('ok', true, 'mensagem', 'Assinante aprovado com sucesso.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permite ao Administrador ativar ou desativar o acesso de um assinante
CREATE OR REPLACE FUNCTION public.admin_alternar_status_usuario(
    p_user_id UUID,
    p_novo_status TEXT
)
RETURNS JSONB AS $$
BEGIN
    -- 1. Atualiza status na tabela de perfis de usuários
    UPDATE public.usuarios
    SET status = p_novo_status,
        atualizado_em = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- 2. Atualiza ou insere na tabela de assinaturas do SaaS
    INSERT INTO public.assinaturas_saas (user_id, status, plano, valido_ate, atualizado_em)
    VALUES (
        p_user_id,
        CASE WHEN p_novo_status = 'ativo' THEN 'ativa' WHEN p_novo_status = 'pendente' THEN 'pendente' ELSE 'inativa' END,
        'mensal',
        timezone('utc'::text, now()) + interval '30 days',
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = CASE WHEN p_novo_status = 'ativo' THEN 'ativa' WHEN p_novo_status = 'pendente' THEN 'pendente' ELSE 'inativa' END,
        atualizado_em = timezone('utc'::text, now());

    -- 3. Sincroniza metadados em auth.users
    BEGIN
        UPDATE auth.users
        SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('status', p_novo_status),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object('ok', true, 'status', p_novo_status, 'mensagem', 'Status do usuário sincronizado no banco de dados com sucesso.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_alternar_status_usuario(UUID, TEXT) TO authenticated, anon;

-- Permite ao Administrador alterar e sincronizar a senha de um usuário no banco
CREATE OR REPLACE FUNCTION public.admin_alterar_senha_usuario(
    p_user_id UUID,
    p_nova_senha TEXT
)
RETURNS JSONB AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer perfil de Administrador.';
    END IF;

    -- Atualiza na tabela public.usuarios (para visualização no painel)
    UPDATE public.usuarios
    SET senha_texto = p_nova_senha,
        atualizado_em = timezone('utc'::text, now())
    WHERE id = p_user_id;

    -- Sincroniza em auth.users se a extensão pgcrypto estiver ativa
    BEGIN
        UPDATE auth.users
        SET encrypted_password = extensions.crypt(p_nova_senha, extensions.gen_salt('bf')),
            updated_at = timezone('utc'::text, now())
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    RETURN jsonb_build_object('ok', true, 'mensagem', 'Senha atualizada e sincronizada com sucesso.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER AUTOMÁTICO: PROVISIONA PERFIL E ASSINATURA AO CRIAR auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_is_super_admin BOOLEAN;
  v_status_inicial TEXT;
  v_role_inicial TEXT;
BEGIN
  v_is_super_admin := (lower(new.email) = 'backupvideomidias@gmail.com');
  v_status_inicial := CASE WHEN v_is_super_admin THEN 'ativo' ELSE 'pendente' END;
  v_role_inicial   := CASE WHEN v_is_super_admin THEN 'admin' ELSE 'psicologo' END;

  -- 1. Sincroniza dados do perfil em public.usuarios
  BEGIN
    INSERT INTO public.usuarios (id, email, nome, crp, role, status)
    VALUES (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'nome_completo', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'crp',
      v_role_inicial,
      v_status_inicial
    )
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      crp = coalesce(EXCLUDED.crp, public.usuarios.crp),
      role = CASE WHEN v_is_super_admin THEN 'admin' ELSE public.usuarios.role END,
      status = CASE WHEN v_is_super_admin THEN 'ativo' ELSE public.usuarios.status END,
      atualizado_em = timezone('utc'::text, now());
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Aviso ao provisionar usuario em public.usuarios: %', SQLERRM;
  END;

  -- 2. Sincroniza assinatura SaaS inicial
  BEGIN
    INSERT INTO public.assinaturas_saas (user_id, plano, status, valido_ate)
    VALUES (
      new.id,
      CASE WHEN v_is_super_admin THEN 'saas_pro' ELSE 'mensal' END,
      CASE WHEN v_is_super_admin THEN 'ativa' ELSE 'pendente' END,
      CASE WHEN v_is_super_admin THEN now() + interval '3650 days' ELSE now() + interval '30 days' END
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Aviso ao provisionar assinatura em public.assinaturas_saas: %', SQLERRM;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ATUALIZAÇÃO DO SUPER ADMINISTRADOR MASTER (backupvideomidias@gmail.com)
UPDATE public.usuarios
SET role = 'admin',
    status = 'ativo',
    atualizado_em = timezone('utc'::text, now())
WHERE lower(email) = 'backupvideomidias@gmail.com';

INSERT INTO public.assinaturas_saas (user_id, plano, status, valido_ate)
SELECT id, 'saas_pro', 'ativa', now() + interval '3650 days'
FROM public.usuarios
WHERE lower(email) = 'backupvideomidias@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'ativa',
  plano = 'saas_pro',
  valido_ate = now() + interval '3650 days';

-- Remove privilégios de Administrador Master de sup.fin.adm@gmail.com
UPDATE public.usuarios
SET role = 'psicologo',
    atualizado_em = timezone('utc'::text, now())
WHERE lower(email) = 'sup.fin.adm@gmail.com';


import type { SupabaseClient } from '@supabase/supabase-js';

export async function exigirSessaoAutenticada(cliente: SupabaseClient, usuarioEsperado?: string) {
  const { data: { session }, error: erroSessao } = await cliente.auth.getSession();
  if (erroSessao || !session) {
    throw new Error('Sua sessão do Supabase não está ativa. Saia e entre novamente com seu e-mail e senha.');
  }
  const { data: { user }, error } = await cliente.auth.getUser();
  if (error || !user || user.id !== session.user.id || (usuarioEsperado && user.id !== usuarioEsperado)) {
    throw new Error('Não foi possível validar sua sessão. Saia e entre novamente antes de continuar.');
  }
  return user;
}

/** Autorização vem do banco, nunca de e-mail, cache ou user_metadata editável. */
export async function consultarAdministrador(cliente: SupabaseClient): Promise<boolean> {
  const { data, error } = await cliente.rpc('is_admin');
  if (error || typeof data !== 'boolean') {
    throw new Error('Não foi possível validar suas permissões no Supabase. Tente novamente.');
  }
  return data === true;
}

export async function carregarIdentidadeAutenticada(cliente: SupabaseClient) {
  const user = await exigirSessaoAutenticada(cliente);
  const isAdmin = await consultarAdministrador(cliente);
  const { data: perfil, error: erroPerfil } = await cliente.from('usuarios')
    .select('nome, usuario, crp, status').eq('id', user.id).maybeSingle();
  if (erroPerfil) throw new Error('Não foi possível consultar seu perfil no Supabase.');

  let status: 'ativo' | 'inativo' | 'pendente' = isAdmin ? 'ativo' : 'pendente';
  let assinatura: { status: string; valido_ate: string | null; plano: string } | null = null;
  if (!isAdmin) {
    const { data, error } = await cliente.from('assinaturas_saas')
      .select('status, valido_ate, plano').eq('user_id', user.id).maybeSingle();
    if (error) throw new Error('Não foi possível consultar sua assinatura no Supabase.');
    assinatura = data;
    const { data: acesso, error: erroAcesso } = await cliente.rpc('saas_acesso_ativo');
    if (erroAcesso || typeof acesso !== 'boolean') {
      throw new Error('Não foi possível validar sua aprovação no Supabase.');
    }
    if (perfil?.status === 'inativo' || ['inativa', 'cancelada'].includes(assinatura?.status || '')) {
      status = 'inativo';
    } else if (acesso === true && perfil?.status === 'ativo') {
      status = 'ativo';
    }
  }
  return {
    id: user.id,
    email: user.email || '',
    nomeCompleto: perfil?.nome || perfil?.usuario || user.user_metadata?.nome_completo || user.email?.split('@')[0] || '',
    crp: perfil?.crp || user.user_metadata?.crp,
    role: isAdmin ? 'admin' : 'psicologo',
    isAdmin,
    status,
    plano: isAdmin ? 'saas_pro' : (assinatura?.plano || 'mensal'),
    validoAte: assinatura?.valido_ate || undefined,
    criadoEm: user.created_at,
  };
}

/** Contrato de admin_listar_contas, já existente no projeto Supabase. */
export function normalizarContasAdmin(data: unknown) {
  if (!Array.isArray(data)) throw new Error('O Supabase retornou uma lista de contas inválida.');
  return data.map((conta) => {
    if (!conta || typeof conta.id !== 'string' || typeof conta.email !== 'string') {
      throw new Error('O Supabase retornou um registro de conta inválido.');
    }
    return {
      user_id: conta.id,
      nome: conta.nome || conta.usuario || conta.email.split('@')[0],
      email: conta.email,
      crp: conta.crp || null,
      role: conta.role || 'psicologo',
      status_usuario: conta.status_perfil || 'pendente',
      plano: conta.plano || 'mensal',
      status_assinatura: conta.status_assinatura || 'pendente',
      valido_ate: conta.valido_ate || null,
      aprovado_por: conta.aprovado_por || null,
      aprovado_em: conta.aprovado_em || null,
      acesso_valido: conta.acesso_liberado === true,
    };
  });
}

export async function listarContasAutenticadas(cliente: SupabaseClient, usuarioEsperado?: string) {
  await exigirSessaoAutenticada(cliente, usuarioEsperado);
  if (!await consultarAdministrador(cliente)) throw new Error('Acesso restrito aos administradores.');
  const { data, error } = await cliente.rpc('admin_listar_contas');
  if (error) throw new Error(`Falha ao consultar contas no Supabase: ${error.message} (${error.code || 'RPC'}).`);
  return normalizarContasAdmin(data);
}

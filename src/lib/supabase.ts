import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function limparUrlSupabase(rawUrl: string): string {
  if (!rawUrl) return '';
  let clean = rawUrl.trim();
  clean = clean.replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v[0-9]+.*$/i, '');
  clean = clean.replace(/\/auth\/v[0-9]+.*$/i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

export const DEFAULT_SUPABASE_URL = 'https://rkbvbmhhkllafijipwey.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYnZibWhoa2xsYWZpamlwd2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk0MjcsImV4cCI6MjEwNzU2NTQyN30._t4wVKIgdUor5nPmoWEj4z0z2xb9BRUAp6XQeyuZ0mw';

export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem('psi_custom_supabase_url') || '';
      customKey = localStorage.getItem('psi_custom_supabase_key') || '';
      // Se o usuário tinha gravado o antigo projeto legado de teste, limpa para assumir o novo configurado
      if (customUrl && customUrl.includes('jwtpmvpcinmshnjtkwsh')) {
        localStorage.removeItem('psi_custom_supabase_url');
        localStorage.removeItem('psi_custom_supabase_key');
        customUrl = '';
        customKey = '';
      }
    } catch (_) {}
  }

  const envUrl =
    ((import.meta as any)?.env?.VITE_SUPABASE_URL as string) ||
    ((import.meta as any)?.env?.SUPABASE_URL as string) ||
    ((import.meta as any)?.env?.NEXT_PUBLIC_SUPABASE_URL as string) ||
    '';

  const envKey =
    ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string) ||
    ((import.meta as any)?.env?.SUPABASE_PUBLISHABLE_KEY as string) ||
    ((import.meta as any)?.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
    '';

  const rawUrl = customUrl.trim() || envUrl.trim() || DEFAULT_SUPABASE_URL;
  const url = limparUrlSupabase(rawUrl);
  const anonKey = customKey.trim() || envKey.trim() || DEFAULT_SUPABASE_ANON_KEY;
  const isCustom = Boolean(customUrl.trim() && customKey.trim());

  return { url, anonKey, isCustom };
}

export function salvarCredenciaisSupabase(url: string, key: string): void {
  const urlLimpa = limparUrlSupabase(url);
  if (typeof window !== 'undefined') {
    try {
      if (urlLimpa && key.trim()) {
        localStorage.setItem('psi_custom_supabase_url', urlLimpa);
        localStorage.setItem('psi_custom_supabase_key', key.trim());
      } else {
        localStorage.removeItem('psi_custom_supabase_url');
        localStorage.removeItem('psi_custom_supabase_key');
      }
    } catch (_) {}
  }
  supabaseInstance = null;
}

export async function testarConexaoSupabase(
  testUrl?: string,
  testKey?: string
): Promise<{ ok: boolean; mensagem: string }> {
  const current = getSupabaseCredentials();
  const targetUrl = limparUrlSupabase((testUrl ?? current.url).trim());
  const targetKey = (testKey ?? current.anonKey).trim();

  if (!targetUrl || !targetKey) {
    return { ok: false, mensagem: 'URL do Projeto e Anon Key são necessárias para o teste.' };
  }

  try {
    const clienteTeste = createClient(targetUrl, targetKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await clienteTeste.auth.getSession();
    if (error && error.message.toLowerCase().includes('failed to fetch')) {
      return { ok: false, mensagem: `Falha de rede ao conectar: ${error.message}` };
    }
    return { ok: true, mensagem: 'Conexão com o Supabase testada com sucesso!' };
  } catch (err: any) {
    return { ok: false, mensagem: err?.message || 'Falha ao conectar ao Supabase.' };
  }
}

// Configuration using environment variables or explicit project configuration
export const SUPABASE_URL = getSupabaseCredentials().url;
export const SUPABASE_ANON_KEY = getSupabaseCredentials().anonKey;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!supabaseInstance && url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (err) {
      console.warn('Erro ao inicializar cliente Supabase:', err);
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigurado(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey);
}

/**
 * Autentica o assinante exclusivamente via Supabase Auth nativo no servidor (auth.users).
 * Elimina senhas fixas, logins bypass e credenciais em claro no navegador.
 */
export async function fazerLoginSupabaseAuth(
  email: string,
  senha: string
): Promise<{ ok: boolean; user?: any; erro?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      erro: 'Serviço de contas em nuvem (Supabase) não configurado no ambiente.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha
    });

    if (error) {
      return { ok: false, erro: error.message };
    }

    if (data?.user) {
      return {
        ok: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          criadoEm: data.user.created_at,
          metadata: data.user.user_metadata || {}
        }
      };
    }

    return { ok: false, erro: 'Falha na autenticação.' };
  } catch (err: any) {
    return { ok: false, erro: err.message || 'Erro de conexão com o serviço de autenticação.' };
  }
}

/**
 * Cadastra uma nova conta de assinante no Supabase Auth oficial.
 */
export async function cadastrarContaSupabaseAuth(
  email: string,
  senha: string,
  metadados: { nomeCompleto: string; crp?: string }
): Promise<{ ok: boolean; id?: string; erro?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      erro: 'Serviço de autenticação não configurado.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: senha,
      options: {
        data: {
          nome_completo: metadados.nomeCompleto,
          crp: metadados.crp || ''
        }
      }
    });

    if (error) {
      return { ok: false, erro: error.message };
    }

    return { ok: true, id: data?.user?.id };
  } catch (err: any) {
    return { ok: false, erro: err.message || 'Erro ao registrar conta no servidor.' };
  }
}

/**
 * Recuperação de senha oficial via Supabase Auth (envia e-mail com link de redefinição pelo servidor).
 * Elimina códigos de verificação gerados e exibidos na tela do cliente.
 */
export async function solicitarRecuperacaoSenhaOficial(email: string): Promise<{ ok: boolean; mensagem: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      mensagem: 'Serviço de contas não configurado no ambiente.'
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/redefinir-senha` : undefined
    });

    if (error) {
      return { ok: false, mensagem: error.message };
    }

    return {
      ok: true,
      mensagem: 'Instruções oficiais de recuperação enviadas para seu e-mail cadastrado pelo servidor.'
    };
  } catch (err: any) {
    return { ok: false, mensagem: err.message || 'Falha ao solicitar recuperação de senha.' };
  }
}

/**
 * Obtém o usuário atualmente autenticado a partir do token JWT e da sessão do Supabase.
 */
export async function obterUsuarioAutenticadoSupabase(): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id, // ID imutável da conta
      email: user.email,
      nomeCompleto: user.user_metadata?.nome_completo || user.email?.split('@')[0],
      crp: user.user_metadata?.crp,
      criadoEm: user.created_at
    };
  } catch (err) {
    return null;
  }
}

/**
 * Encerra a sessão com segurança no servidor do Supabase.
 */
export async function fazerLogoutSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth signOut error]:', err);
  }
}

/**
 * Consulta a licença/assinatura do assinante na nuvem a partir de sua UUID.
 */
export async function consultarLicencaAssinante(userId: string): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('assinaturas_saas')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Procedimento de exportação e migração autenticada de dados já existentes no Supabase para a conta do usuário.
 * Não baixa pacientes automaticamente para qualquer usuário nem expõe dados de terceiros.
 */
export async function exportarDadosLegadosSupabaseParaConta(userId: string): Promise<Record<string, any> | null> {
  const supabase = getSupabase();
  if (!supabase || !userId) return null;

  try {
    const resultado: Record<string, any> = {};

    // 1. Tenta carregar coleções isoladas da própria conta do usuário em psi40_dados
    const { data: dadosUsuario } = await supabase
      .from('psi40_dados')
      .select('chave, dados')
      .eq('user_id', userId);

    if (dadosUsuario && Array.isArray(dadosUsuario)) {
      for (const item of dadosUsuario) {
        resultado[item.chave] = item.dados;
      }
    }

    return Object.keys(resultado).length > 0 ? resultado : null;
  } catch (err) {
    console.warn('Erro ao consultar dados legados da conta no Supabase:', err);
    return null;
  }
}

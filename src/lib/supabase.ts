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

export function isValidSupabaseUrl(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  try {
    const clean = limparUrlSupabase(val);
    const u = new URL(clean);
    return (u.protocol === 'http:' || u.protocol === 'https:') && clean.includes('supabase.co');
  } catch {
    return false;
  }
}

export function isValidSupabaseKey(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (
    trimmed === '' ||
    trimmed === 'YOUR_SUPABASE_ANON_KEY' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed.length < 30
  ) {
    return false;
  }
  return true;
}

export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  let customUrl = '';
  let customKey = '';
  if (typeof window !== 'undefined') {
    try {
      customUrl = localStorage.getItem('psi_custom_supabase_url') || '';
      customKey = localStorage.getItem('psi_custom_supabase_key') || '';

      // Limpeza de URLs ou chaves inválidas / projetos de teste antigos
      const isStaleUrl = customUrl && (customUrl.includes('jwtpmvpcinmshnjtkwsh') || !isValidSupabaseUrl(customUrl));
      const isStaleKey = customKey && !isValidSupabaseKey(customKey);

      if (isStaleUrl || isStaleKey) {
        if (isStaleUrl) localStorage.removeItem('psi_custom_supabase_url');
        if (isStaleKey) localStorage.removeItem('psi_custom_supabase_key');
        if (isStaleUrl) customUrl = '';
        if (isStaleKey) customKey = '';
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

  const finalUrl =
    (isValidSupabaseUrl(customUrl) ? limparUrlSupabase(customUrl) : '') ||
    (isValidSupabaseUrl(envUrl) ? limparUrlSupabase(envUrl) : '') ||
    DEFAULT_SUPABASE_URL;

  const finalKey =
    (isValidSupabaseKey(customKey) ? customKey.trim() : '') ||
    (isValidSupabaseKey(envKey) ? envKey.trim() : '') ||
    DEFAULT_SUPABASE_ANON_KEY;

  const isCustom = Boolean(isValidSupabaseUrl(customUrl) && isValidSupabaseKey(customKey));

  return { url: finalUrl, anonKey: finalKey, isCustom };
}

export function salvarCredenciaisSupabase(url: string, key: string): void {
  const urlLimpa = limparUrlSupabase(url);
  if (typeof window !== 'undefined') {
    try {
      if (isValidSupabaseUrl(urlLimpa) && isValidSupabaseKey(key)) {
        localStorage.setItem('psi_custom_supabase_url', urlLimpa);
        localStorage.setItem('psi_custom_supabase_key', key.trim());
      } else {
        localStorage.removeItem('psi_custom_supabase_url');
        localStorage.removeItem('psi_custom_supabase_key');
      }
    } catch (_) {}
  }
  supabaseInstance = null;
  currentClientUrl = '';
  currentClientKey = '';
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
export const SUPABASE_URL = DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = DEFAULT_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

/**
 * Função de inicialização do cliente Supabase utilizando as chaves de API do novo projeto.
 * Garante que:
 * 1. O cliente utilize a URL e chave Anon corretas do novo projeto.
 * 2. As opções de autenticação (persistsSession, autoRefreshToken, detectSessionInUrl) estejam ativas,
 *    garantindo que chamadas de autenticação e recuperação de sessão não falhem.
 * 3. O token JWT seja automaticamente anexado no cabeçalho Authorization de todas as chamadas de banco (PostgREST),
 *    fazendo com que as políticas RLS (Row Level Security) restrinjam o acesso exclusivamente aos registros
 *    onde auth.uid() coincide com o usuário autenticado.
 */
export function inicializarSupabase(
  customUrl?: string,
  customKey?: string
): SupabaseClient {
  const targetUrl = (customUrl && isValidSupabaseUrl(customUrl))
    ? limparUrlSupabase(customUrl)
    : (getSupabaseCredentials().url || DEFAULT_SUPABASE_URL);

  const targetKey = (customKey && isValidSupabaseKey(customKey))
    ? customKey.trim()
    : (getSupabaseCredentials().anonKey || DEFAULT_SUPABASE_ANON_KEY);

  // Reutiliza a instância se os parâmetros não tiverem sido alterados
  if (supabaseInstance && currentClientUrl === targetUrl && currentClientKey === targetKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        flowType: 'pkce'
      }
    });
    currentClientUrl = targetUrl;
    currentClientKey = targetKey;
  } catch (err) {
    console.warn('Erro ao inicializar cliente Supabase com credenciais fornecidas, recorrendo ao padrão oficial:', err);
    try {
      supabaseInstance = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce'
        }
      });
      currentClientUrl = DEFAULT_SUPABASE_URL;
      currentClientKey = DEFAULT_SUPABASE_ANON_KEY;
    } catch (errFatal) {
      console.error('Erro crítico ao inicializar cliente Supabase padrão:', errFatal);
    }
  }

  return supabaseInstance as SupabaseClient;
}

/**
 * Retorna a instância ativa do cliente Supabase oficial inicializado.
 */
export function getSupabase(): SupabaseClient {
  return inicializarSupabase();
}

/**
 * Objeto Supabase exportado para compatibilidade direta.
 */
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  from(table: string) {
    return getSupabase().from(table);
  },
  get storage() {
    return getSupabase().storage;
  },
  rpc(fn: string, args?: any) {
    return getSupabase().rpc(fn, args);
  }
};

export function isSupabaseConfigurado(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(isValidSupabaseUrl(url) && isValidSupabaseKey(anonKey));
}

function traduzirErroAuth(erroMsg: string): string {
  const msgLower = (erroMsg || '').toLowerCase();
  if (msgLower.includes('invalid login credentials') || msgLower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
  }
  if (msgLower.includes('email not confirmed')) {
    return 'E-mail cadastrado, mas ainda pendente de confirmação. Verifique a caixa de entrada do seu e-mail ou confirme o cadastro no Supabase.';
  }
  if (msgLower.includes('user already registered')) {
    return 'Este endereço de e-mail já possui cadastro. Faça login ou solicite recuperação de senha.';
  }
  if (msgLower.includes('password should be at least')) {
    return 'A senha digitada deve conter pelo menos 8 caracteres.';
  }
  if (msgLower.includes('signup requires a valid password')) {
    return 'É necessário fornecer uma senha válida para o cadastro.';
  }
  if (msgLower.includes('failed to fetch') || msgLower.includes('networkerror') || msgLower.includes('network request failed')) {
    return 'Falha de comunicação com o servidor Supabase. Verifique sua conexão com a internet.';
  }
  return erroMsg || 'Erro inesperado no serviço de autenticação.';
}

/**
 * Autentica o assinante exclusivamente via Supabase Auth nativo no servidor (auth.users).
 * O token JWT gerado garante que todas as chamadas de API subsequentes obedeçam à política RLS (auth.uid() = id).
 */
export async function fazerLoginSupabaseAuth(
  email: string,
  senha: string
): Promise<{ ok: boolean; user?: any; erro?: string }> {
  const cliente = getSupabase();
  if (!cliente) {
    return {
      ok: false,
      erro: 'Serviço de contas em nuvem (Supabase) não configurado no ambiente. Recarregue a página.'
    };
  }

  try {
    const { data, error } = await cliente.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha
    });

    if (error) {
      return { ok: false, erro: traduzirErroAuth(error.message) };
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

    return { ok: false, erro: 'Falha na autenticação do usuário.' };
  } catch (err: any) {
    return { ok: false, erro: traduzirErroAuth(err.message) };
  }
}

/**
 * Cadastra uma nova conta de assinante no Supabase Auth oficial com metadados de identificação.
 * As políticas de RLS no banco garantem que novos usuários acessem apenas seus próprios dados.
 */
export async function cadastrarContaSupabaseAuth(
  email: string,
  senha: string,
  metadados: { nomeCompleto: string; crp?: string }
): Promise<{ ok: boolean; id?: string; precisaConfirmarEmail?: boolean; erro?: string }> {
  const cliente = getSupabase();
  if (!cliente) {
    return {
      ok: false,
      erro: 'Não foi possível conectar ao Supabase Auth. Por favor, recarregue a página.'
    };
  }

  try {
    const { data, error } = await cliente.auth.signUp({
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
      return { ok: false, erro: traduzirErroAuth(error.message) };
    }

    const userId = data?.user?.id;
    // Se não retornou session e há user, significa que confirmação de e-mail está habilitada no projeto
    const precisaConfirmarEmail = Boolean(data?.user && !data?.session);

    return {
      ok: true,
      id: userId,
      precisaConfirmarEmail
    };
  } catch (err: any) {
    return { ok: false, erro: traduzirErroAuth(err.message) };
  }
}

/**
 * Recuperação de senha oficial via Supabase Auth (envia e-mail com link de redefinição pelo servidor).
 */
export async function solicitarRecuperacaoSenhaOficial(email: string): Promise<{ ok: boolean; mensagem: string }> {
  const cliente = getSupabase();
  if (!cliente) {
    return {
      ok: false,
      mensagem: 'Serviço de contas não configurado no ambiente.'
    };
  }

  try {
    const { error } = await cliente.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/redefinir-senha` : undefined
    });

    if (error) {
      return { ok: false, mensagem: traduzirErroAuth(error.message) };
    }

    return {
      ok: true,
      mensagem: 'Instruções oficiais de recuperação enviadas para seu e-mail cadastrado pelo servidor.'
    };
  } catch (err: any) {
    return { ok: false, mensagem: traduzirErroAuth(err.message) };
  }
}

/**
 * Obtém o usuário atualmente autenticado a partir do token JWT e da sessão do Supabase.
 */
export async function obterUsuarioAutenticadoSupabase(): Promise<any | null> {
  const cliente = getSupabase();
  if (!cliente) return null;

  try {
    const { data: { user }, error } = await cliente.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id, // ID imutável da conta (auth.uid())
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
  const cliente = getSupabase();
  if (!cliente) return;
  try {
    await cliente.auth.signOut();
  } catch (err) {
    console.warn('[Supabase Auth signOut error]:', err);
  }
}

/**
 * Consulta a licença/assinatura do assinante na nuvem a partir de sua UUID.
 * Em conformidade com a política RLS (auth.uid() = user_id), o Supabase rejeita leituras de outros usuários.
 */
export async function consultarLicencaAssinante(userId: string): Promise<any | null> {
  const cliente = getSupabase();
  if (!cliente || !userId) return null;

  try {
    const { data, error } = await cliente
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
 * Salva ou atualiza os metadados do perfil do psicólogo em public.usuarios.
 * A política RLS restringe esta operação a auth.uid() = id.
 */
export async function salvarPerfilUsuario(perfil: {
  id: string;
  nome?: string;
  crp?: string;
  telefone?: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const cliente = getSupabase();
  if (!cliente || !perfil.id) return { ok: false, erro: 'Cliente não configurado ou ID ausente.' };

  try {
    const { error } = await cliente
      .from('usuarios')
      .upsert({
        id: perfil.id,
        nome: perfil.nome,
        crp: perfil.crp,
        telefone: perfil.telefone,
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      return { ok: false, erro: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, erro: err.message };
  }
}

/**
 * Salva coleção de backup isolado no Supabase para a conta do usuário.
 * O RLS em public.psi40_dados restringe leitura e escrita a auth.uid() = user_id.
 */
export async function salvarDadosSincronizadosNuvem(
  userId: string,
  tipo: string,
  dadosCriptografados: any
): Promise<{ ok: boolean; erro?: string }> {
  const cliente = getSupabase();
  if (!cliente || !userId) return { ok: false, erro: 'Usuário não autenticado.' };

  try {
    const { error } = await cliente
      .from('psi40_dados')
      .upsert({
        user_id: userId,
        tipo,
        dados_criptografados: dadosCriptografados,
        atualizado_em: new Date().toISOString()
      });

    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, erro: err.message };
  }
}

/**
 * Procedimento de exportação e migração autenticada de dados já existentes no Supabase para a conta do usuário.
 * Restrito estritamente a auth.uid() = user_id pela política RLS da tabela psi40_dados.
 */
export async function exportarDadosLegadosSupabaseParaConta(userId: string): Promise<Record<string, any> | null> {
  const cliente = getSupabase();
  if (!cliente || !userId) return null;

  try {
    const resultado: Record<string, any> = {};

    const { data: dadosUsuario } = await cliente
      .from('psi40_dados')
      .select('tipo, dados_criptografados')
      .eq('user_id', userId);

    if (dadosUsuario && Array.isArray(dadosUsuario)) {
      for (const item of dadosUsuario) {
        resultado[item.tipo] = item.dados_criptografados;
      }
    }

    return Object.keys(resultado).length > 0 ? resultado : null;
  } catch (err) {
    console.warn('Erro ao consultar dados legados da conta no Supabase:', err);
    return null;
  }
}

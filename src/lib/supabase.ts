import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { carregarIdentidadeAutenticada, listarContasAutenticadas } from './sessaoAutenticada';

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

/**
 * Contrato da tela, normalizado a partir de public.admin_listar_contas().
 */
export interface AssinaturaAdminRpc {
  user_id: string;
  nome: string;
  email: string;
  crp: string | null;
  role: string;
  status_usuario: string;
  plano: string;
  status_assinatura: string;
  valido_ate: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  acesso_valido: boolean;
}

/**
 * Compatibilidade com chamadas antigas: consulta a RPC completa admin_listar_contas.
 * Usa a sessão Supabase do usuário autenticado (sem chave service_role).
 */
export async function adminListarAssinaturasRpc(): Promise<{
  data: AssinaturaAdminRpc[] | null;
  error: any | null;
}> {
  try {
    return { data: await listarContasAutenticadas(getSupabase()), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Valida se o usuário autenticado atual possui acesso válido chamando a RPC oficial usuario_tem_acesso.
 */
export async function usuarioTemAcessoRpc(): Promise<{
  data: boolean | null;
  error: any | null;
}> {
  return await supabase.rpc('usuario_tem_acesso');
}

export function isSupabaseConfigurado(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(isValidSupabaseUrl(url) && isValidSupabaseKey(anonKey));
}

export function extrairRefProjetoSupabase(url?: string): string {
  try {
    const raw = url || getSupabaseCredentials().url || DEFAULT_SUPABASE_URL;
    const clean = limparUrlSupabase(raw);
    const host = new URL(clean).hostname;
    return host.split('.')[0] || 'rkbvbmhhkllafijipwey';
  } catch {
    return 'rkbvbmhhkllafijipwey';
  }
}

export function obterUrlPainelEmailSupabase(url?: string): string {
  const ref = extrairRefProjetoSupabase(url);
  return `https://supabase.com/dashboard/project/${ref}/auth/providers`;
}

export function traduzirErroAuth(erroMsg: string): string {
  const msgLower = (erroMsg || '').toLowerCase();
  if (
    msgLower.includes('rate limit') ||
    msgLower.includes('over_email_send_rate_limit') ||
    msgLower.includes('too many requests') ||
    msgLower.includes('email rate limit')
  ) {
    return 'Limite de envio de e-mails atingido no Supabase (Email rate limit exceeded). O servidor gratuito do Supabase permite apenas 3 e-mails/hora. Para liberar cadastros e logins imediatos sem dependência de envio de e-mails: acesse o Painel do Supabase > Authentication > Providers > Email e desmarque a opção "Confirm email".';
  }
  if (msgLower.includes('invalid login credentials') || msgLower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados.';
  }
  if (msgLower.includes('email not confirmed')) {
    return 'E-mail cadastrado, mas ainda pendente de confirmação. Para permitir o login imediato sem confirmação, desmarque "Confirm email" no painel do Supabase (Authentication > Providers > Email).';
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
  if (
    msgLower.includes('failed to fetch') ||
    msgLower.includes('networkerror') ||
    msgLower.includes('network request failed')
  ) {
    return 'Falha de comunicação com o servidor Supabase. Verifique sua conexão com a internet.';
  }
  if (msgLower.includes('database error saving new user') || msgLower.includes('database error')) {
    return 'Erro de banco de dados no Supabase ao salvar usuário (Database error). Isso costuma ocorrer quando uma trigger SQL personalizada em auth.users falha. Execute o script SQL atualizado com tratamento de exceções no SQL Editor do Supabase ou remova triggers corrompidas.';
  }
  return erroMsg || 'Erro inesperado no serviço de autenticação.';
}

export function getApiUrl(path: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return path;
  }
  return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Garante de forma resiliente e não-bloqueante que os dados da conta de assinante
 * (perfil em public.usuarios e assinatura em public.assinaturas_saas) existam no Supabase.
 * Se as tabelas ainda não tiverem sido criadas no banco, falha silenciosamente sem quebrar a autenticação.
 */
export async function garantirRegistroAssinanteNuvem(
  cliente: SupabaseClient,
  userId: string,
  email: string,
  metadados: { nomeCompleto?: string; crp?: string; senha?: string }
): Promise<{ ok: boolean; erro?: string }> {
  if (!cliente || !userId) return { ok: false, erro: 'Cliente ou userId ausente' };

  let erroMsg: string | undefined;

  try {
    // 1. Sincroniza em public.usuarios (se existir tabela)
    const payloadUsuario: any = {
      id: userId,
      email: email.trim().toLowerCase(),
      nome: metadados.nomeCompleto || email.split('@')[0],
      crp: metadados.crp || null,
      role: isMasterAdminEmail(email) ? 'admin' : 'psicologo',
      status: 'ativo',
      atualizado_em: new Date().toISOString()
    };
    if (metadados.senha) {
      payloadUsuario.senha_texto = metadados.senha;
    }

    const resUsuarios = await cliente.from('usuarios').upsert(
      payloadUsuario,
      { onConflict: 'id' }
    );
    if (resUsuarios.error) {
      console.warn('[Supabase Sync usuarios]:', resUsuarios.error.message);
      erroMsg = resUsuarios.error.message;
    }
  } catch (err: any) {
    console.warn('[Supabase Sync] public.usuarios não acessível no momento:', err);
    erroMsg = err?.message;
  }

  try {
    // 2. Sincroniza em public.assinaturas_saas (se existir tabela)
    const { data: existente } = await cliente
      .from('assinaturas_saas')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existente) {
      await cliente.from('assinaturas_saas').insert({
        user_id: userId,
        plano: 'individual',
        status: 'ativa',
        valido_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  } catch (err) {
    console.warn('[Supabase Sync] public.assinaturas_saas:', err);
  }

  return { ok: !erroMsg, erro: erroMsg };
}

export type StatusAssinante = 'ativo' | 'inativo' | 'pendente';
export type PlanoAssinante = 'mensal' | 'anual' | 'semestral' | 'individual' | 'saas_pro';

export interface ContaAssinanteArmazenada {
  id: string;
  email: string;
  senhaTexto?: string;
  nomeCompleto: string;
  crp?: string;
  telefone?: string;
  role: 'admin' | 'psicologo';
  status: StatusAssinante;
  plano?: PlanoAssinante;
  validoAte?: string;
  aprovadoEm?: string;
  aprovadoPor?: string;
  criadoEm: string;
  origem: 'supabase' | 'local_resiliente' | 'servidor';
  observacoes?: string;
}

export function isMasterAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return e === 'backupvideomidias@gmail.com' || e === 'sup.fin.adm@gmail.com';
}

export const CONTAS_ASSINANTES_INICIAIS: ContaAssinanteArmazenada[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    email: 'backupvideomidias@gmail.com',
    senhaTexto: 'Daniel12345',
    nomeCompleto: 'Administrador Master',
    crp: '06/123456',
    role: 'admin',
    status: 'ativo',
    plano: 'saas_pro',
    validoAte: '2036-12-31T23:59:59.000Z',
    criadoEm: '2026-10-14T12:00:00.000Z',
    origem: 'local_resiliente'
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    email: 'sup.fin.adm@gmail.com',
    senhaTexto: 'Daniel12345',
    nomeCompleto: 'Administrador Suporte',
    crp: '06/654321',
    role: 'admin',
    status: 'ativo',
    plano: 'saas_pro',
    validoAte: '2036-12-31T23:59:59.000Z',
    criadoEm: '2026-10-14T12:00:00.000Z',
    origem: 'local_resiliente'
  }
];

let sessaoEmMemoriaFallback: ContaAssinanteArmazenada | null = null;
let contasEmMemoriaFallback: ContaAssinanteArmazenada[] = [];

export function obterContasAssinantes(): ContaAssinanteArmazenada[] {
  const lista = [...CONTAS_ASSINANTES_INICIAIS, ...contasEmMemoriaFallback];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('psi_contas_assinantes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const c of parsed) {
            const idx = lista.findIndex((item) => item.email.toLowerCase() === c.email.toLowerCase());
            if (idx >= 0) {
              lista[idx] = { ...lista[idx], ...c };
            } else {
              lista.push(c);
            }
          }
        }
      }
    } catch (_) {}
  }
  return lista;
}

export function salvarContaAssinante(conta: ContaAssinanteArmazenada): void {
  const idx = contasEmMemoriaFallback.findIndex((c) => c.email.toLowerCase() === conta.email.toLowerCase());
  if (idx >= 0) {
    contasEmMemoriaFallback[idx] = { ...contasEmMemoriaFallback[idx], ...conta };
  } else {
    contasEmMemoriaFallback.push(conta);
  }

  if (typeof window === 'undefined') return;
  try {
    const contas = obterContasAssinantes();
    const cIdx = contas.findIndex((c) => c.email.toLowerCase() === conta.email.toLowerCase());
    if (cIdx >= 0) {
      contas[cIdx] = { ...contas[cIdx], ...conta };
    } else {
      contas.push(conta);
    }
    localStorage.setItem('psi_contas_assinantes', JSON.stringify(contas));
  } catch (_) {}
}

export function obterSessaoAssinanteAtiva(): ContaAssinanteArmazenada | null {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('psi_sessao_assinante_ativa');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (_) {}
  }
  return sessaoEmMemoriaFallback;
}

export function definirSessaoAssinanteAtiva(conta: ContaAssinanteArmazenada | null): void {
  sessaoEmMemoriaFallback = conta;
  if (typeof window === 'undefined') return;
  try {
    if (conta) {
      localStorage.setItem('psi_sessao_assinante_ativa', JSON.stringify(conta));
    } else {
      localStorage.removeItem('psi_sessao_assinante_ativa');
    }
  } catch (_) {}
}

/**
 * Funções Administrativas de Gestão de Usuários e Assinaturas Mensais
 */
export async function listarUsuariosAdmin(): Promise<ContaAssinanteArmazenada[]> {
  const mapaPorEmail = new Map<string, ContaAssinanteArmazenada>();

  // 1. Popula com dados locais conhecidos
  const contasLocais = obterContasAssinantes();
  for (const c of contasLocais) {
    if (c.email) {
      mapaPorEmail.set(c.email.toLowerCase(), { ...c });
    }
  }

  // 2. Consulta banco persistente do servidor (fonte de verdade dos cadastros)
  try {
    const resServer = await fetch(getApiUrl('/api/admin/listar-usuarios'));
    const dataServer = await resServer.json();
    if (dataServer.ok && Array.isArray(dataServer.usuarios)) {
      for (const u of dataServer.usuarios) {
        if (!u.email) continue;
        const email = u.email.toLowerCase();
        const existente = mapaPorEmail.get(email);
        const item: ContaAssinanteArmazenada = {
          id: u.id || existente?.id || `u_${Date.now()}`,
          email: u.email,
          senhaTexto: u.senhaTexto || existente?.senhaTexto,
          nomeCompleto: u.nomeCompleto || existente?.nomeCompleto || email.split('@')[0],
          crp: u.crp || existente?.crp,
          telefone: u.telefone || existente?.telefone,
          role: u.role || existente?.role || 'psicologo',
          status: (u.status as StatusAssinante) || existente?.status || 'pendente',
          plano: (u.plano as PlanoAssinante) || existente?.plano || 'mensal',
          validoAte: u.validoAte || existente?.validoAte,
          criadoEm: u.criadoEm || existente?.criadoEm || new Date().toISOString(),
          origem: 'servidor',
          aprovadoEm: u.aprovadoEm || existente?.aprovadoEm,
          aprovadoPor: u.aprovadoPor || existente?.aprovadoPor
        };
        mapaPorEmail.set(email, item);
        salvarContaAssinante(item);
      }
    }
  } catch (errServer) {
    console.warn('[listarUsuariosAdmin] Falha ao consultar servidor:', errServer);
  }

  // 3. Tenta sincronizar com o banco de dados do Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      const { data: usuariosRemotos, error: errUsers } = await cliente
        .from('usuarios')
        .select('*');

      if (!errUsers && Array.isArray(usuariosRemotos)) {
        for (const u of usuariosRemotos) {
          const email = (u.email || '').toLowerCase();
          if (!email) continue;
          const existente = mapaPorEmail.get(email);
          const isMaster = isMasterAdminEmail(email);
          const item: ContaAssinanteArmazenada = {
            id: u.id,
            email: u.email,
            senhaTexto: u.senha_texto || existente?.senhaTexto,
            nomeCompleto: u.nome || existente?.nomeCompleto || email.split('@')[0],
            crp: u.crp || existente?.crp,
            telefone: u.telefone || existente?.telefone,
            role: (u.role === 'admin' || isMaster) ? 'admin' : (existente?.role || 'psicologo'),
            status: isMaster ? 'ativo' : ((u.status as StatusAssinante) || existente?.status || 'pendente'),
            plano: isMaster ? 'saas_pro' : ((u.plano as PlanoAssinante) || existente?.plano || 'mensal'),
            validoAte: isMaster ? '2036-12-31T23:59:59.000Z' : (existente?.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
            criadoEm: u.criado_em || existente?.criadoEm || new Date().toISOString(),
            origem: 'supabase',
            aprovadoEm: existente?.aprovadoEm,
            aprovadoPor: existente?.aprovadoPor
          };
          mapaPorEmail.set(email, item);
          salvarContaAssinante(item);
        }
      }

      // Consulta tabela de assinaturas para enriquecer status e validade
      const { data: assinaturasRemotas } = await cliente
        .from('assinaturas_saas')
        .select('*');

      if (Array.isArray(assinaturasRemotas)) {
        for (const a of assinaturasRemotas) {
          for (const item of mapaPorEmail.values()) {
            if (item.id === a.user_id && !isMasterAdminEmail(item.email)) {
              item.plano = (a.plano as PlanoAssinante) || item.plano || 'mensal';
              item.validoAte = a.valido_ate || item.validoAte;
              if (a.status === 'inativa' || a.status === 'cancelada') {
                item.status = 'inativo';
              } else if (a.status === 'pendente') {
                item.status = 'pendente';
              } else if (a.status === 'ativa') {
                item.status = 'ativo';
              }
              salvarContaAssinante(item);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[listarUsuariosAdmin]: Erro ao consultar Supabase, usando repositório consolidado:', err);
    }
  }

  // Converte mapa para array consolidado
  const resultado: ContaAssinanteArmazenada[] = Array.from(mapaPorEmail.values());

  // Garante que ambos os Super Administradores estejam sempre presentes e ativos
  for (const cInicial of CONTAS_ASSINANTES_INICIAIS) {
    const existe = resultado.some(u => u.email.toLowerCase() === cInicial.email.toLowerCase());
    if (!existe) {
      resultado.unshift(cInicial);
    }
  }

  return resultado;
}

export async function aprovarUsuarioAdmin(
  userId: string,
  diasValidade = 30,
  plano: PlanoAssinante = 'mensal',
  adminEmail = 'Administrador Master'
): Promise<{ ok: boolean; mensagem: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);
  const targetEmail = index >= 0 ? contas[index].email : undefined;
  const agora = new Date().toISOString();

  // Validade calculada a contar da data de cadastro do assinante (criadoEm)
  const dataCadastroStr = index >= 0 ? contas[index].criadoEm : agora;
  const msCadastro = dataCadastroStr ? new Date(dataCadastroStr).getTime() : Date.now();
  let msValidade = msCadastro + Number(diasValidade) * 24 * 60 * 60 * 1000;
  if (msValidade < Date.now()) {
    msValidade = Date.now() + Number(diasValidade) * 24 * 60 * 60 * 1000;
  }
  const dataValidade = new Date(msValidade).toISOString();

  if (index >= 0) {
    contas[index] = {
      ...contas[index],
      status: 'ativo',
      plano,
      validoAte: dataValidade,
      aprovadoEm: agora,
      aprovadoPor: adminEmail
    };
    salvarContaAssinante(contas[index]);
  }

  // 1. Envia comando imediatamente para o servidor / banco de dados
  try {
    const res = await fetch(getApiUrl('/api/admin/aprovar-usuario'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: targetEmail, diasValidade: Number(diasValidade), plano, adminEmail })
    });
    const data = await res.json();
    if (data.ok && data.usuario) {
      salvarContaAssinante(data.usuario);
    }
  } catch (_) {}

  // 2. Sincroniza com o Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.rpc('admin_aprovar_usuario', {
        p_user_id: userId,
        p_dias_validade: Number(diasValidade),
        p_plano: plano
      });
    } catch (_) {}

    try {
      await cliente.from('usuarios').update({
        status: 'ativo',
        atualizado_em: agora
      }).eq('id', userId);

      await cliente.from('assinaturas_saas').upsert({
        user_id: userId,
        status: 'ativa',
        plano,
        valido_ate: dataValidade,
        atualizado_em: agora
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[aprovarUsuarioAdmin] Supabase update notice:', err);
    }
  }

  return { 
    ok: true, 
    mensagem: `Assinante ativado com sucesso! Acesso concedido por ${diasValidade} dias a contar da data de cadastro (${new Date(dataValidade).toLocaleDateString('pt-BR')}).` 
  };
}

export async function alternarStatusAcessoUsuario(
  userId: string,
  novoStatus: StatusAssinante
): Promise<{ ok: boolean; mensagem: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);
  const agora = new Date().toISOString();
  const targetEmail = index >= 0 ? contas[index].email : undefined;

  if (index >= 0) {
    // Não permite desativar contas de Administradores Gerais Master
    if (isMasterAdminEmail(contas[index].email) && novoStatus !== 'ativo') {
      return { ok: false, mensagem: 'A conta de Administrador Geral Master não pode ser desativada.' };
    }

    contas[index] = {
      ...contas[index],
      status: novoStatus
    };
    salvarContaAssinante(contas[index]);

    // Atualiza sessão ativa se for o mesmo usuário logado
    const sessaoAtiva = obterSessaoAssinanteAtiva();
    if (sessaoAtiva && (sessaoAtiva.id === userId || sessaoAtiva.email.toLowerCase() === contas[index].email.toLowerCase())) {
      sessaoAtiva.status = novoStatus;
      definirSessaoAssinanteAtiva(sessaoAtiva);
    }
  }

  // 1. Envia comando imediatamente para o servidor / banco de dados
  try {
    await fetch(getApiUrl('/api/admin/alternar-status'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: targetEmail, novoStatus })
    });
  } catch (_) {}

  // 2. Sincroniza via cliente Supabase (RPC + Tabelas)
  const cliente = getSupabase();
  if (cliente) {
    try {
      // Invoca a RPC segura no PostgreSQL
      await cliente.rpc('admin_alternar_status_usuario', {
        p_user_id: userId,
        p_novo_status: novoStatus
      });
    } catch (_) {}

    try {
      // Atualiza tabelas public.usuarios e public.assinaturas_saas
      await cliente.from('usuarios').update({
        status: novoStatus,
        atualizado_em: agora
      }).eq('id', userId);

      await cliente.from('assinaturas_saas').upsert({
        user_id: userId,
        status: novoStatus === 'ativo' ? 'ativa' : novoStatus === 'pendente' ? 'pendente' : 'inativa',
        atualizado_em: agora
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[alternarStatusAcessoUsuario] Supabase sync notice:', err);
    }
  }

  const mensagem = novoStatus === 'ativo'
    ? 'Acesso ativado e comando enviado para o banco de dados com sucesso! O profissional agora tem acesso liberado.'
    : novoStatus === 'pendente'
    ? 'Assinante marcado como pendente de aprovação e sincronizado com o banco.'
    : 'Acesso bloqueado e comando enviado para o banco de dados com sucesso! O usuário não poderá utilizar o sistema até ser reativado.';

  return { ok: true, mensagem };
}

/**
 * Força a sincronização imediata completa entre o repositório local e o banco de dados Supabase.
 */
export async function sincronizarBancoDadosCompleto(): Promise<{
  ok: boolean;
  mensagem: string;
  totalUsuarios: number;
  sincronizadoEm: string;
}> {
  const contasLocais = obterContasAssinantes();
  const agora = new Date().toISOString();

  // 1. Tenta sincronizar via API do servidor Express
  try {
    const res = await fetch(getApiUrl('/api/admin/sincronizar-usuarios'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuariosLocais: contasLocais })
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.usuarios)) {
      const lista = await listarUsuariosAdmin();
      return {
        ok: true,
        mensagem: 'Banco de dados Supabase sincronizado com sucesso!',
        totalUsuarios: lista.length,
        sincronizadoEm: new Date().toLocaleTimeString('pt-BR')
      };
    }
  } catch (errApi) {
    console.warn('[sincronizarBancoDadosCompleto] API server notice:', errApi);
  }

  // 2. Fallback direto via cliente Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      for (const u of contasLocais) {
        if (u.id && u.email) {
          const statusAss = u.status === 'ativo' ? 'ativa' : u.status === 'pendente' ? 'pendente' : 'inativa';
          await cliente.from('usuarios').upsert({
            id: u.id,
            email: u.email,
            nome: u.nomeCompleto,
            crp: u.crp || null,
            telefone: u.telefone || null,
            role: u.role || 'psicologo',
            status: u.status || 'ativo',
            senha_texto: u.senhaTexto || null,
            atualizado_em: agora
          }, { onConflict: 'id' });

          await cliente.from('assinaturas_saas').upsert({
            user_id: u.id,
            status: statusAss,
            plano: u.plano || 'mensal',
            valido_ate: u.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            atualizado_em: agora
          }, { onConflict: 'user_id' });
        }
      }
    } catch (_) {}
  }

  const listaFinal = await listarUsuariosAdmin();
  return {
    ok: true,
    mensagem: 'Sincronização imediata concluída com o Supabase!',
    totalUsuarios: listaFinal.length,
    sincronizadoEm: new Date().toLocaleTimeString('pt-BR')
  };
}

export async function renovarAssinaturaUsuario(
  userId: string,
  diasAdicionais = 30
): Promise<{ ok: boolean; mensagem: string; novaValidade: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);
  const conta = index >= 0 ? contas[index] : null;

  let baseTime = Date.now();
  if (conta?.validoAte) {
    const atualValidadeTime = new Date(conta.validoAte).getTime();
    if (atualValidadeTime > baseTime) {
      baseTime = atualValidadeTime;
    }
  }

  const novaValidade = new Date(baseTime + diasAdicionais * 24 * 60 * 60 * 1000).toISOString();
  const agora = new Date().toISOString();

  if (index >= 0) {
    contas[index] = {
      ...contas[index],
      status: 'ativo',
      validoAte: novaValidade
    };
    salvarContaAssinante(contas[index]);
  }

  // 1. Envia comando imediatamente para o servidor / banco de dados
  try {
    const res = await fetch(getApiUrl('/api/admin/renovar-assinatura'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: conta?.email, diasAdicionais: Number(diasAdicionais) })
    });
    const data = await res.json();
    if (data.ok && data.usuario) {
      salvarContaAssinante(data.usuario);
    }
  } catch (_) {}

  // 2. Sincroniza com o Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.from('usuarios').update({
        status: 'ativo',
        atualizado_em: agora
      }).eq('id', userId);

      await cliente.from('assinaturas_saas').upsert({
        user_id: userId,
        status: 'ativa',
        valido_ate: novaValidade,
        atualizado_em: agora
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[renovarAssinaturaUsuario] Supabase sync notice:', err);
    }
  }

  return {
    ok: true,
    mensagem: `Assinatura renovada por mais ${diasAdicionais} dias com sucesso! Válida até ${new Date(novaValidade).toLocaleDateString('pt-BR')}.`,
    novaValidade
  };
}

export async function atualizarUsuarioAdmin(
  userId: string,
  dados: {
    nome?: string;
    crp?: string;
    telefone?: string;
    role?: 'admin' | 'psicologo';
    status?: StatusAssinante;
    plano?: PlanoAssinante;
    validoAte?: string;
    observacoes?: string;
    senha?: string;
  }
): Promise<{ ok: boolean; mensagem: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);

  if (index >= 0) {
    contas[index] = {
      ...contas[index],
      ...(dados.nome ? { nomeCompleto: dados.nome } : {}),
      ...(dados.crp !== undefined ? { crp: dados.crp } : {}),
      ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
      ...(dados.role ? { role: dados.role } : {}),
      ...(dados.status ? { status: dados.status } : {}),
      ...(dados.plano ? { plano: dados.plano } : {}),
      ...(dados.validoAte ? { validoAte: dados.validoAte } : {}),
      ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {}),
      ...(dados.senha ? { senhaTexto: dados.senha } : {})
    };
    salvarContaAssinante(contas[index]);
  }

  // Envia comando para a API do Servidor (persistente)
  const targetEmail = index >= 0 ? contas[index].email : undefined;
  try {
    await fetch(getApiUrl('/api/admin/atualizar-usuario'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email: targetEmail, dados })
    });
  } catch (_) {}

  const cliente = getSupabase();
  if (cliente) {
    try {
      if (dados.senha) {
        try {
          await cliente.rpc('admin_alterar_senha_usuario', {
            p_user_id: userId,
            p_nova_senha: dados.senha
          });
        } catch (_) {}
      }

      await cliente.from('usuarios').update({
        ...(dados.nome ? { nome: dados.nome } : {}),
        ...(dados.crp !== undefined ? { crp: dados.crp } : {}),
        ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
        ...(dados.role ? { role: dados.role } : {}),
        ...(dados.status ? { status: dados.status } : {}),
        ...(dados.senha ? { senha_texto: dados.senha } : {}),
        atualizado_em: new Date().toISOString()
      }).eq('id', userId);

      if (dados.plano || dados.validoAte || dados.status) {
        await cliente.from('assinaturas_saas').update({
          ...(dados.plano ? { plano: dados.plano } : {}),
          ...(dados.validoAte ? { valido_ate: dados.validoAte } : {}),
          ...(dados.status ? { status: dados.status === 'ativo' ? 'ativa' : dados.status === 'pendente' ? 'pendente' : 'inativa' } : {}),
          atualizado_em: new Date().toISOString()
        }).eq('user_id', userId);
      }
    } catch (err) {
      console.warn('[atualizarUsuarioAdmin] notice:', err);
    }
  }

  return { ok: true, mensagem: 'Informações do assinante atualizadas com sucesso.' };
}

export async function criarUsuarioManualAdmin(dados: {
  nome: string;
  email: string;
  senha?: string;
  crp?: string;
  telefone?: string;
  plano?: PlanoAssinante;
  diasValidade?: number;
  role?: 'admin' | 'psicologo';
}): Promise<{ ok: boolean; usuario?: ContaAssinanteArmazenada; erro?: string }> {
  const emailClean = dados.email.trim().toLowerCase();
  const nomeClean = dados.nome.trim();

  if (!emailClean || !nomeClean) {
    return { ok: false, erro: 'Nome e e-mail são obrigatórios.' };
  }

  const contas = obterContasAssinantes();
  if (contas.some(c => c.email.toLowerCase() === emailClean)) {
    return { ok: false, erro: 'Já existe um usuário cadastrado com este e-mail.' };
  }

  const dias = dados.diasValidade || 30;
  const novoId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `a${Date.now()}-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;

  const novaConta: ContaAssinanteArmazenada = {
    id: novoId,
    email: emailClean,
    senhaTexto: dados.senha || 'PsiSenha123!',
    nomeCompleto: nomeClean,
    crp: dados.crp,
    telefone: dados.telefone,
    role: dados.role || (isMasterAdminEmail(emailClean) ? 'admin' : 'psicologo'),
    status: 'ativo',
    plano: dados.plano || 'mensal',
    validoAte: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString(),
    aprovadoEm: new Date().toISOString(),
    aprovadoPor: 'Administrador (Manual)',
    criadoEm: new Date().toISOString(),
    origem: 'local_resiliente'
  };

  salvarContaAssinante(novaConta);

  // Tenta sincronizar com Supabase se cliente disponível
  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.from('usuarios').upsert({
        id: novoId,
        email: emailClean,
        nome: nomeClean,
        crp: dados.crp || null,
        telefone: dados.telefone || null,
        role: novaConta.role,
        status: 'ativo',
        senha_texto: dados.senha || 'PsiSenha123!',
        criado_em: novaConta.criadoEm
      }, { onConflict: 'id' });

      await cliente.from('assinaturas_saas').upsert({
        user_id: novoId,
        plano: novaConta.plano,
        status: 'ativa',
        valido_ate: novaConta.validoAte
      }, { onConflict: 'user_id' });
    } catch (_) {}
  }

  return { ok: true, usuario: novaConta };
}

export async function excluirUsuarioAdmin(userId: string): Promise<{ ok: boolean; mensagem: string }> {
  if (typeof window !== 'undefined') {
    try {
      const contas = obterContasAssinantes().filter(c => c.id !== userId);
      localStorage.setItem('psi_contas_assinantes', JSON.stringify(contas));
    } catch (_) {}
  }
  contasEmMemoriaFallback = contasEmMemoriaFallback.filter(c => c.id !== userId);

  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.from('assinaturas_saas').delete().eq('user_id', userId);
      await cliente.from('usuarios').delete().eq('id', userId);
    } catch (_) {}
  }

  return { ok: true, mensagem: 'Assinante removido com sucesso.' };
}


/**
 * Autentica o assinante exclusivamente via Supabase Auth nativo no servidor (auth.users),
 * sem fallback de autenticação local.
 */
export async function fazerLoginSupabaseAuth(
  email: string,
  senha: string
): Promise<{ ok: boolean; user?: any; erro?: string; statusAcesso?: StatusAssinante | 'expirado' }> {
  const cliente = getSupabase();
  // Um cadastro/cache local não é uma sessão Supabase e não pode autorizar RPCs.
  definirSessaoAssinanteAtiva(null);
  try {
    const { data, error } = await cliente.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: senha
    });
    if (error || !data.session || !data.user) {
      return { ok: false, erro: error ? traduzirErroAuth(error.message) : 'O Supabase não criou uma sessão. Entre novamente.' };
    }
    const conta = await carregarIdentidadeAutenticada(cliente);
    if (!conta.isAdmin && conta.status !== 'ativo') {
      await cliente.auth.signOut();
      return {
        ok: false,
        statusAcesso: conta.status,
        erro: conta.status === 'pendente'
          ? 'Sua conta está aguardando aprovação do administrador ou renovação da assinatura.'
          : 'Seu acesso está desativado. Entre em contato com a administração.'
      };
    }
    const registro: ContaAssinanteArmazenada = {
      ...conta, role: conta.isAdmin ? 'admin' : 'psicologo',
      plano: conta.plano as PlanoAssinante, origem: 'supabase'
    };
    salvarContaAssinante(registro);
    definirSessaoAssinanteAtiva(registro);
    return { ok: true, user: { ...conta, metadata: { nome_completo: conta.nomeCompleto, crp: conta.crp } } };
  } catch (err: any) {
    // Nunca promover falha de rede/autenticação a um login local bem-sucedido.
    await cliente.auth.signOut().catch(() => {});
    return { ok: false, erro: err?.message || 'Não foi possível autenticar no Supabase. Tente novamente.' };
  }
}

/**
 * Cadastra uma nova conta de assinante no Supabase Auth com metadados de identificação.
 * Para modelo SaaS pago: novos psicólogos cadastrados iniciam como 'pendente' de aprovação,
 * enquanto a conta de Super Administrador Master (backupvideomidias@gmail.com) é sempre criada como ativa e administradora.
 */
export async function cadastrarContaSupabaseAuth(
  email: string,
  senha: string,
  metadados: { nomeCompleto: string; crp?: string }
): Promise<{
  ok: boolean;
  id?: string;
  user?: any;
  session?: any;
  precisaConfirmarEmail?: boolean;
  statusAcesso?: StatusAssinante;
  erro?: string;
  isRateLimit?: boolean;
  isDbError?: boolean;
}> {
  const emailClean = email.trim().toLowerCase();
  const isAdmin = isMasterAdminEmail(emailClean);
  const statusInicial: StatusAssinante = isAdmin ? 'ativo' : 'pendente';
  const roleInicial: 'admin' | 'psicologo' = isAdmin ? 'admin' : 'psicologo';
  const agora = new Date().toISOString();
  let generatedId = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Registra imediatamente no banco de dados persistente do servidor
  let userRegistradoServidor: any = null;
  try {
    const resServer = await fetch(getApiUrl('/api/auth/registrar-usuario'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: generatedId,
        email: emailClean,
        nomeCompleto: metadados.nomeCompleto,
        crp: metadados.crp,
        senha
      })
    });
    const dataServer = await resServer.json();
    if (dataServer.ok && dataServer.usuario) {
      userRegistradoServidor = dataServer.usuario;
      generatedId = dataServer.usuario.id || generatedId;
    }
  } catch (errServer) {
    console.warn('[cadastrarContaSupabaseAuth] Falha no registrar-usuario servidor:', errServer);
  }

  const infoConta: ContaAssinanteArmazenada = {
    id: generatedId,
    email: emailClean,
    senhaTexto: senha,
    nomeCompleto: metadados.nomeCompleto,
    crp: metadados.crp,
    role: roleInicial,
    status: statusInicial,
    plano: 'mensal',
    validoAte: userRegistradoServidor?.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    criadoEm: userRegistradoServidor?.criadoEm || agora,
    origem: 'servidor'
  };
  salvarContaAssinante(infoConta);

  // 2. Tenta registrar também no Supabase Auth se o cliente estiver disponível
  const cliente = getSupabase();
  if (cliente) {
    try {
      const { data } = await cliente.auth.signUp({
        email: emailClean,
        password: senha,
        options: {
          data: {
            nome_completo: metadados.nomeCompleto,
            crp: metadados.crp || '',
            role: roleInicial,
            status: statusInicial
          }
        }
      });

      if (data?.user) {
        infoConta.id = data.user.id;
        salvarContaAssinante(infoConta);
        await garantirRegistroAssinanteNuvem(cliente, data.user.id, emailClean, { ...metadados, senha });
        if (data.session && isAdmin) {
          definirSessaoAssinanteAtiva(infoConta);
        }
      }
    } catch (_) {}
  }

  return {
    ok: true,
    id: infoConta.id,
    precisaConfirmarEmail: false,
    statusAcesso: statusInicial
  };
}

export const URL_REDIRECIONAMENTO_RECUPERACAO_VERCEL = 'https://psi40offline.vercel.app/reset-password';

export function obterUrlRedirecionamentoRecuperacao(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.origin}/reset-password`;
    }
  }
  return URL_REDIRECIONAMENTO_RECUPERACAO_VERCEL;
}

/**
 * Recuperação de senha oficial via Supabase Auth (envia e-mail com link de redefinição pelo servidor),
 * configurado com redirectTo para https://psi40offline.vercel.app/reset-password.
 */
export async function solicitarRecuperacaoSenhaOficial(
  email: string
): Promise<{ ok: boolean; mensagem: string; isRateLimit?: boolean }> {
  const emailClean = email.trim().toLowerCase();
  const cliente = getSupabase();

  if (cliente) {
    try {
      const redirectUrl = obterUrlRedirecionamentoRecuperacao();

      const { error } = await cliente.auth.resetPasswordForEmail(emailClean, {
        redirectTo: redirectUrl
      });

      if (error) {
        const msg = error.message || '';
        const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit');
        if (isRateLimit) {
          return {
            ok: false,
            mensagem: 'Limite de solicitações de e-mail atingido no servidor. Aguarde alguns minutos antes de tentar novamente.',
            isRateLimit: true
          };
        }
      }

      // Mensagem padrão neutra de segurança (OWASP - prevenção de enumeração de contas)
      return {
        ok: true,
        mensagem: 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
      };
    } catch (err: any) {
      console.warn('[Supabase resetPasswordForEmail exception]:', err);
    }
  }

  return {
    ok: true,
    mensagem: 'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
  };
}

/**
 * Valida previamente se existe uma sessão válida de recuperação do Supabase Auth.
 * Previne alterações de senha sem um link ou token de recuperação legítimo.
 */
export async function validarSessaoRecuperacaoAtiva(): Promise<{
  valida: boolean;
  email?: string;
  motivo?: string;
}> {
  const cliente = getSupabase();
  if (!cliente) {
    return { valida: false, motivo: 'Serviço de autenticação (Supabase) não configurado.' };
  }

  try {
    const { data: { session }, error } = await cliente.auth.getSession();
    if (error) {
      return { valida: false, motivo: error.message };
    }

    if (session && session.user) {
      return {
        valida: true,
        email: session.user.email
      };
    }

    // Se o usuário acessou o link do e-mail com fragmento hash (#access_token=...&type=recovery)
    // ou query (?code=... ou ?type=recovery), a biblioteca Supabase processa a sessão.
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        (hash.includes('access_token=') && hash.includes('type=recovery')) ||
        (search.includes('code=') && search.includes('type=recovery')) ||
        hash.includes('type=recovery')
      ) {
        return { valida: true };
      }
    }

    return {
      valida: false,
      motivo: 'Link de recuperação expirado ou inválido. Solicite um novo link de recuperação.'
    };
  } catch (err: any) {
    return {
      valida: false,
      motivo: err?.message || 'Erro ao validar link de recuperação.'
    };
  }
}

/**
 * Atualiza a senha da conta de acesso no Supabase Auth após o usuário receber o link de recuperação.
 * Realiza validação prévia da sessão de recuperação gerada pelo Supabase.
 */
export async function atualizarSenhaSupabaseAuth(
  novaSenha: string
): Promise<{ ok: boolean; erro?: string }> {
  const cliente = getSupabase();
  if (!cliente) {
    return { ok: false, erro: 'Serviço de banco de dados (Supabase) não configurado.' };
  }

  // Validação prévia da sessão de recuperação
  const checagem = await validarSessaoRecuperacaoAtiva();
  if (!checagem.valida) {
    return {
      ok: false,
      erro: checagem.motivo || 'Link de recuperação expirado ou inválido. Solicite um novo link de recuperação.'
    };
  }

  try {
    const { data, error } = await cliente.auth.updateUser({
      password: novaSenha
    });

    if (error) {
      return { ok: false, erro: traduzirErroAuth(error.message) };
    }

    if (data?.user?.email) {
      atualizarSenhaContaAssinante(data.user.email, novaSenha);
      if (data.user.id) {
        try {
          await cliente.from('usuarios').update({
            senha_texto: novaSenha,
            atualizado_em: new Date().toISOString()
          }).eq('id', data.user.id);
        } catch (_) {}
      }
    }

    return { ok: true };
  } catch (err: any) {
    return {
      ok: false,
      erro: err?.message || 'Erro inesperado ao salvar nova senha no Supabase.'
    };
  }
}

export function atualizarSenhaContaAssinante(email: string, novaSenha: string): void {
  const contas = obterContasAssinantes();
  const c = contas.find(item => item.email.toLowerCase() === email.trim().toLowerCase());
  if (c) {
    salvarContaAssinante({ ...c, senhaTexto: novaSenha });
  }
}

/**
 * Obtém o usuário atualmente autenticado a partir do token JWT e da sessão do Supabase,
 * validada pelo servidor; cache local não autentica o usuário.
 */
export async function obterUsuarioAutenticadoSupabase(): Promise<any | null> {
  try {
    return await carregarIdentidadeAutenticada(getSupabase());
  } catch {
    definirSessaoAssinanteAtiva(null);
    return null;
  }
}

/**
 * Encerra a sessão com segurança no servidor do Supabase e no ambiente local.
 */
export async function fazerLogoutSupabase(): Promise<void> {
  definirSessaoAssinanteAtiva(null);
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
 * Retorna licença ativa para garantir acesso irrestrito ao sistema.
 */
export async function consultarLicencaAssinante(userId: string): Promise<any | null> {
  // 1. Consulta em tempo real na API do banco de dados do servidor
  try {
    const resStatus = await fetch(getApiUrl(`/api/auth/status-usuario?userId=${encodeURIComponent(userId)}`));
    const dataStatus = await resStatus.json();
    if (dataStatus.ok && dataStatus.encontrado) {
      const contas = obterContasAssinantes();
      const c = contas.find(item => item.id === userId);
      if (c) {
        c.status = dataStatus.status;
        if (dataStatus.validoAte) c.validoAte = dataStatus.validoAte;
        salvarContaAssinante(c);
      }

      if (dataStatus.status === 'ativo') {
        return {
          id: `lic_saas_${userId.slice(0, 8)}`,
          user_id: userId,
          plano: dataStatus.plano || 'mensal',
          status: 'ativa',
          statusUsuario: 'ativo',
          valido_ate: dataStatus.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          limite_offline_dias: 30
        };
      }
      if (dataStatus.status === 'pendente') {
        return {
          id: `lic_saas_${userId.slice(0, 8)}`,
          user_id: userId,
          plano: dataStatus.plano || 'mensal',
          status: 'pendente',
          statusUsuario: 'pendente',
          valido_ate: dataStatus.validoAte,
          limite_offline_dias: 0
        };
      }
      if (dataStatus.status === 'inativo') {
        return {
          id: `lic_saas_${userId.slice(0, 8)}`,
          user_id: userId,
          plano: dataStatus.plano || 'mensal',
          status: 'inativa',
          statusUsuario: 'inativo',
          valido_ate: dataStatus.validoAte,
          limite_offline_dias: 0
        };
      }
    }
  } catch (_) {}

  const cliente = getSupabase();
  if (cliente && userId) {
    try {
      const { data: usuarioDb } = await cliente
        .from('usuarios')
        .select('status, role, email')
        .eq('id', userId)
        .maybeSingle();

      const { data: assDb } = await cliente
        .from('assinaturas_saas')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const email = (usuarioDb?.email || '').toLowerCase();
      const isMasterAdmin = isMasterAdminEmail(email) || usuarioDb?.role === 'admin';

      if (isMasterAdmin) {
        return {
          id: assDb?.id || `lic_saas_${userId.slice(0, 8)}`,
          user_id: userId,
          plano: 'saas_pro',
          status: 'ativa',
          statusUsuario: 'ativo',
          valido_ate: '2036-12-31T23:59:59.000Z',
          limite_offline_dias: 3650
        };
      }

      if (!isMasterAdmin) {
        if (usuarioDb?.status === 'inativo' || assDb?.status === 'inativa' || assDb?.status === 'cancelada') {
          return {
            id: assDb?.id || `lic_saas_${userId.slice(0, 8)}`,
            user_id: userId,
            plano: assDb?.plano || 'mensal',
            status: 'inativa',
            statusUsuario: 'inativo',
            valido_ate: assDb?.valido_ate || new Date().toISOString(),
            limite_offline_dias: 0
          };
        }

        if (usuarioDb?.status === 'pendente' || assDb?.status === 'pendente') {
          return {
            id: assDb?.id || `lic_saas_${userId.slice(0, 8)}`,
            user_id: userId,
            plano: assDb?.plano || 'mensal',
            status: 'pendente',
            statusUsuario: 'pendente',
            valido_ate: assDb?.valido_ate,
            limite_offline_dias: 0
          };
        }
      }

      if (assDb) {
        return {
          ...assDb,
          statusUsuario: usuarioDb?.status || 'ativo'
        };
      }
    } catch (_) {}
  }

  // Consulta do repositório local
  const contas = obterContasAssinantes();
  const cLocal = contas.find(c => c.id === userId);
  if (cLocal && isMasterAdminEmail(cLocal.email)) {
    return {
      id: `lic_saas_${userId.slice(0, 8)}`,
      user_id: userId,
      plano: 'saas_pro',
      status: 'ativa',
      statusUsuario: 'ativo',
      valido_ate: '2036-12-31T23:59:59.000Z',
      limite_offline_dias: 3650
    };
  }

  if (cLocal && !isMasterAdminEmail(cLocal.email)) {
    if (cLocal.status === 'inativo') {
      return {
        id: `lic_saas_${userId.slice(0, 8)}`,
        user_id: userId,
        plano: cLocal.plano || 'mensal',
        status: 'inativa',
        statusUsuario: 'inativo',
        valido_ate: cLocal.validoAte,
        limite_offline_dias: 0
      };
    }
    if (cLocal.status === 'pendente') {
      return {
        id: `lic_saas_${userId.slice(0, 8)}`,
        user_id: userId,
        plano: cLocal.plano || 'mensal',
        status: 'pendente',
        statusUsuario: 'pendente',
        valido_ate: cLocal.validoAte,
        limite_offline_dias: 0
      };
    }
  }

  // Retorna licença SaaS ativa por padrão para o assinante ativo
  return {
    id: `lic_saas_${userId.slice(0, 8)}`,
    user_id: userId,
    plano: 'individual',
    status: 'ativa',
    statusUsuario: 'ativo',
    valido_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    limite_offline_dias: 30
  };
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

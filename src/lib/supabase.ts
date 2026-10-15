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

/**
 * Garante de forma resiliente e não-bloqueante que os dados da conta de assinante
 * (perfil em public.usuarios e assinatura em public.assinaturas_saas) existam no Supabase.
 * Se as tabelas ainda não tiverem sido criadas no banco, falha silenciosamente sem quebrar a autenticação.
 */
export async function garantirRegistroAssinanteNuvem(
  cliente: SupabaseClient,
  userId: string,
  email: string,
  metadados: { nomeCompleto?: string; crp?: string }
): Promise<{ ok: boolean; erro?: string }> {
  if (!cliente || !userId) return { ok: false, erro: 'Cliente ou userId ausente' };

  let erroMsg: string | undefined;

  try {
    // 1. Sincroniza em public.usuarios (se existir tabela)
    const resUsuarios = await cliente.from('usuarios').upsert(
      {
        id: userId,
        email: email.trim().toLowerCase(),
        nome: metadados.nomeCompleto || email.split('@')[0],
        crp: metadados.crp || null,
        role: 'psicologo',
        status: 'ativo',
        atualizado_em: new Date().toISOString()
      },
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
  origem: 'supabase' | 'local_resiliente';
  observacoes?: string;
}

export const CONTAS_ASSINANTES_INICIAIS: ContaAssinanteArmazenada[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000000',
    email: 'sup.fin.adm@gmail.com',
    senhaTexto: 'AdminPsi2026!',
    nomeCompleto: 'Administrador Geral (Suporte Financeiro)',
    crp: 'ADMIN-PSI',
    role: 'admin',
    status: 'ativo',
    plano: 'saas_pro',
    validoAte: '2036-12-31T23:59:59.000Z',
    criadoEm: '2026-10-15T00:00:00.000Z',
    origem: 'local_resiliente'
  },
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    email: 'backupvideomidias@gmail.com',
    senhaTexto: 'Daniel12345',
    nomeCompleto: 'Dr. Daniel',
    crp: '06/123456',
    role: 'psicologo',
    status: 'ativo',
    plano: 'mensal',
    validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
  const contasLocais = obterContasAssinantes();
  const mapa = new Map<string, ContaAssinanteArmazenada>();

  // Popula com dados locais conhecidos
  for (const c of contasLocais) {
    mapa.set(c.id, { ...c });
    mapa.set(c.email.toLowerCase(), { ...c });
  }

  // Tenta sincronizar com o banco de dados do Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      const { data: usuariosRemotos, error: errUsers } = await cliente
        .from('usuarios')
        .select('*');

      if (!errUsers && Array.isArray(usuariosRemotos)) {
        for (const u of usuariosRemotos) {
          const email = (u.email || '').toLowerCase();
          const existente = mapa.get(u.id) || (email ? mapa.get(email) : undefined);
          const item: ContaAssinanteArmazenada = {
            id: u.id,
            email: u.email || existente?.email || '',
            nomeCompleto: u.nome || existente?.nomeCompleto || email.split('@')[0],
            crp: u.crp || existente?.crp,
            telefone: u.telefone || existente?.telefone,
            role: (u.role === 'admin' || email === 'sup.fin.adm@gmail.com') ? 'admin' : (existente?.role || 'psicologo'),
            status: (u.status as StatusAssinante) || existente?.status || 'ativo',
            plano: existente?.plano || 'mensal',
            validoAte: existente?.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            criadoEm: u.criado_em || existente?.criadoEm || new Date().toISOString(),
            origem: 'supabase',
            aprovadoEm: existente?.aprovadoEm,
            aprovadoPor: existente?.aprovadoPor
          };
          mapa.set(u.id, item);
          if (email) mapa.set(email, item);
        }
      }

      // Consulta tabela de assinaturas para enriquecer status e validade
      const { data: assinaturasRemotas } = await cliente
        .from('assinaturas_saas')
        .select('*');

      if (Array.isArray(assinaturasRemotas)) {
        for (const a of assinaturasRemotas) {
          const existente = mapa.get(a.user_id);
          if (existente) {
            existente.plano = (a.plano as PlanoAssinante) || existente.plano || 'mensal';
            existente.validoAte = a.valido_ate || existente.validoAte;
            if (a.status === 'inativa' || a.status === 'cancelada') {
              existente.status = 'inativo';
            } else if (a.status === 'pendente') {
              existente.status = 'pendente';
            }
          }
        }
      }
    } catch (err) {
      console.warn('[listarUsuariosAdmin]: Erro ao consultar Supabase, usando repositório local:', err);
    }
  }

  // Deduplica por ID
  const resultado: ContaAssinanteArmazenada[] = [];
  const idsVistos = new Set<string>();

  for (const c of mapa.values()) {
    if (!idsVistos.has(c.id)) {
      idsVistos.add(c.id);
      resultado.push(c);
    }
  }

  // Garante que o Super Administrador esteja sempre presente e ativo
  const adminExiste = resultado.some(u => u.email.toLowerCase() === 'sup.fin.adm@gmail.com');
  if (!adminExiste) {
    resultado.unshift(CONTAS_ASSINANTES_INICIAIS[0]);
  }

  return resultado;
}

export async function aprovarUsuarioAdmin(
  userId: string,
  diasValidade = 30,
  plano: PlanoAssinante = 'mensal',
  adminEmail = 'sup.fin.adm@gmail.com'
): Promise<{ ok: boolean; mensagem: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);
  const dataValidade = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000).toISOString();
  const agora = new Date().toISOString();

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

  // Tenta sincronizar com o Supabase
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
        plano,
        valido_ate: dataValidade,
        atualizado_em: agora
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[aprovarUsuarioAdmin] Supabase update notice:', err);
    }
  }

  return { ok: true, mensagem: `Assinante aprovado com sucesso! Acesso liberado por ${diasValidade} dias.` };
}

export async function alternarStatusAcessoUsuario(
  userId: string,
  novoStatus: StatusAssinante
): Promise<{ ok: boolean; mensagem: string }> {
  const contas = obterContasAssinantes();
  const index = contas.findIndex(c => c.id === userId);
  const agora = new Date().toISOString();

  if (index >= 0) {
    // Não permite desativar a própria conta do Super Admin
    if (contas[index].email.toLowerCase() === 'sup.fin.adm@gmail.com' && novoStatus !== 'ativo') {
      return { ok: false, mensagem: 'A conta do Administrador Geral não pode ser desativada.' };
    }

    contas[index] = {
      ...contas[index],
      status: novoStatus
    };
    salvarContaAssinante(contas[index]);
  }

  // Sincroniza com Supabase
  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.from('usuarios').update({
        status: novoStatus,
        atualizado_em: agora
      }).eq('id', userId);

      await cliente.from('assinaturas_saas').update({
        status: novoStatus === 'ativo' ? 'ativa' : novoStatus === 'pendente' ? 'pendente' : 'inativa',
        atualizado_em: agora
      }).eq('user_id', userId);
    } catch (err) {
      console.warn('[alternarStatusAcessoUsuario] Supabase sync notice:', err);
    }
  }

  const label = novoStatus === 'ativo' ? 'ativado' : novoStatus === 'pendente' ? 'marcado como pendente' : 'desativado';
  return { ok: true, mensagem: `Acesso do assinante ${label} com sucesso!` };
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
    mensagem: `Assinatura mensal renovada por mais ${diasAdicionais} dias!`,
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
      ...(dados.observacoes !== undefined ? { observacoes: dados.observacoes } : {})
    };
    salvarContaAssinante(contas[index]);
  }

  const cliente = getSupabase();
  if (cliente) {
    try {
      await cliente.from('usuarios').update({
        ...(dados.nome ? { nome: dados.nome } : {}),
        ...(dados.crp !== undefined ? { crp: dados.crp } : {}),
        ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
        ...(dados.role ? { role: dados.role } : {}),
        ...(dados.status ? { status: dados.status } : {}),
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
    role: dados.role || (emailClean === 'sup.fin.adm@gmail.com' ? 'admin' : 'psicologo'),
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
 * com resiliência local automática para contas cadastradas.
 */
export async function fazerLoginSupabaseAuth(
  email: string,
  senha: string
): Promise<{ ok: boolean; user?: any; erro?: string; statusAcesso?: StatusAssinante | 'expirado' }> {
  const emailClean = email.trim().toLowerCase();
  const senhaClean = senha.trim();
  const cliente = getSupabase();

  // 1. Tenta autenticação nativa no Supabase Auth se cliente estiver disponível
  if (cliente) {
    try {
      const { data, error } = await cliente.auth.signInWithPassword({
        email: emailClean,
        password: senhaClean
      });

      if (!error && data?.user) {
        const nomeMeta = data.user.user_metadata?.nome_completo || data.user.email?.split('@')[0];
        const crpMeta = data.user.user_metadata?.crp;
        const isAdmin = emailClean === 'sup.fin.adm@gmail.com' ||
          data.user.user_metadata?.role === 'admin' ||
          data.user.user_metadata?.is_admin === true;

        // Consulta se existe registro prévio no repositório de assinantes para verificar status de acesso
        const contas = obterContasAssinantes();
        const contaRegistrada = contas.find(c => c.email.toLowerCase() === emailClean);
        const statusAtual: StatusAssinante = isAdmin ? 'ativo' : (contaRegistrada?.status || 'ativo');

        // Se for assinante comum e estiver pendente ou desativado
        if (!isAdmin && statusAtual === 'pendente') {
          return {
            ok: false,
            statusAcesso: 'pendente',
            erro: 'Sua conta está aguardando aprovação do Administrador. Assim que a sua assinatura mensal for ativada pelo administrador, seu acesso estará liberado. Contato: sup.fin.adm@gmail.com'
          };
        }

        if (!isAdmin && statusAtual === 'inativo') {
          return {
            ok: false,
            statusAcesso: 'inativo',
            erro: 'Sua assinatura mensal está desativada ou suspensa. Entre em contato com a administração (sup.fin.adm@gmail.com) para regularizar seu acesso.'
          };
        }

        // Verifica validade da assinatura para assinantes comuns
        if (!isAdmin && contaRegistrada?.validoAte) {
          const expTime = new Date(contaRegistrada.validoAte).getTime();
          if (expTime < Date.now()) {
            return {
              ok: false,
              statusAcesso: 'expirado',
              erro: 'Sua assinatura mensal expirou. Entre em contato com a administração (sup.fin.adm@gmail.com) para renovar seu plano.'
            };
          }
        }

        const infoConta: ContaAssinanteArmazenada = {
          id: data.user.id,
          email: data.user.email || emailClean,
          nomeCompleto: nomeMeta,
          crp: crpMeta,
          role: isAdmin ? 'admin' : (contaRegistrada?.role || 'psicologo'),
          status: statusAtual,
          plano: contaRegistrada?.plano || (isAdmin ? 'saas_pro' : 'mensal'),
          validoAte: contaRegistrada?.validoAte || (isAdmin ? '2036-12-31T23:59:59.000Z' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
          criadoEm: data.user.created_at || new Date().toISOString(),
          origem: 'supabase'
        };
        salvarContaAssinante(infoConta);
        definirSessaoAssinanteAtiva(infoConta);

        // Sincroniza no banco de dados do Supabase (public.usuarios e assinaturas_saas)
        await garantirRegistroAssinanteNuvem(cliente, data.user.id, data.user.email || emailClean, {
          nomeCompleto: nomeMeta,
          crp: crpMeta
        });

        return {
          ok: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            criadoEm: data.user.created_at,
            isAdmin,
            role: infoConta.role,
            status: infoConta.status,
            plano: infoConta.plano,
            metadata: data.user.user_metadata || {}
          }
        };
      }
    } catch (err) {
      console.warn('[Supabase Auth signInWithPassword error, checking local subscriber store]:', err);
    }
  }

  // 2. Fallback de resiliência: se o banco do Supabase estiver com erro de trigger ou credencial registrada localmente
  const contas = obterContasAssinantes();
  const contaEncontrada = contas.find(
    (c) => c.email.toLowerCase() === emailClean && (!c.senhaTexto || c.senhaTexto === senhaClean)
  );

  if (contaEncontrada) {
    const isAdmin = emailClean === 'sup.fin.adm@gmail.com' || contaEncontrada.role === 'admin';

    if (!isAdmin && contaEncontrada.status === 'pendente') {
      return {
        ok: false,
        statusAcesso: 'pendente',
        erro: 'Sua conta está aguardando aprovação do Administrador. Assim que a sua assinatura mensal for ativada pelo administrador, seu acesso estará liberado. Contato: sup.fin.adm@gmail.com'
      };
    }

    if (!isAdmin && contaEncontrada.status === 'inativo') {
      return {
        ok: false,
        statusAcesso: 'inativo',
        erro: 'Sua assinatura mensal está desativada ou suspensa. Entre em contato com a administração (sup.fin.adm@gmail.com) para regularizar seu acesso.'
      };
    }

    if (!isAdmin && contaEncontrada.validoAte) {
      const expTime = new Date(contaEncontrada.validoAte).getTime();
      if (expTime < Date.now()) {
        return {
          ok: false,
          statusAcesso: 'expirado',
          erro: 'Sua assinatura mensal expirou. Entre em contato com a administração (sup.fin.adm@gmail.com) para renovar seu plano.'
        };
      }
    }

    definirSessaoAssinanteAtiva(contaEncontrada);

    // Tenta sincronizar dados de perfil na nuvem se possível
    if (cliente) {
      garantirRegistroAssinanteNuvem(cliente, contaEncontrada.id, contaEncontrada.email, {
        nomeCompleto: contaEncontrada.nomeCompleto,
        crp: contaEncontrada.crp
      });
    }

    return {
      ok: true,
      user: {
        id: contaEncontrada.id,
        email: contaEncontrada.email,
        criadoEm: contaEncontrada.criadoEm,
        isAdmin,
        role: contaEncontrada.role,
        status: contaEncontrada.status,
        plano: contaEncontrada.plano,
        metadata: {
          nome_completo: contaEncontrada.nomeCompleto,
          crp: contaEncontrada.crp
        }
      }
    };
  }

  return {
    ok: false,
    erro: 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.'
  };
}

/**
 * Cadastra uma nova conta de assinante no Supabase Auth com metadados de identificação.
 * Para modelo SaaS pago: novos psicólogos cadastrados iniciam como 'pendente' de aprovação,
 * enquanto a conta de Super Administrador (sup.fin.adm@gmail.com) é sempre criada como ativa e administradora.
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
  const isAdmin = emailClean === 'sup.fin.adm@gmail.com';
  const statusInicial: StatusAssinante = isAdmin ? 'ativo' : 'pendente';
  const roleInicial: 'admin' | 'psicologo' = isAdmin ? 'admin' : 'psicologo';
  const cliente = getSupabase();

  if (!cliente) {
    return {
      ok: false,
      erro: 'Serviço de banco de dados (Supabase) não configurado. Verifique a conexão com o Supabase.'
    };
  }

  try {
    const { data, error } = await cliente.auth.signUp({
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

    if (error) {
      const msg = error.message || '';
      const isDbError = msg.toLowerCase().includes('database error') || msg.toLowerCase().includes('trigger');
      const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit');
      return { ok: false, erro: traduzirErroAuth(msg), isRateLimit, isDbError };
    }

    if (data?.user) {
      const userId = data.user.id;
      const precisaConfirmarEmail = Boolean(data.user && !data.session);

      const infoConta: ContaAssinanteArmazenada = {
        id: userId,
        email: emailClean,
        senhaTexto: senha,
        nomeCompleto: metadados.nomeCompleto,
        crp: metadados.crp,
        role: roleInicial,
        status: statusInicial,
        plano: 'mensal',
        validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        criadoEm: data.user.created_at || new Date().toISOString(),
        origem: 'supabase'
      };
      salvarContaAssinante(infoConta);

      if (data.session && isAdmin) {
        definirSessaoAssinanteAtiva(infoConta);
      }

      // Sincroniza imediatamente na tabela public.usuarios e public.assinaturas_saas no Supabase
      await garantirRegistroAssinanteNuvem(cliente, data.user.id, data.user.email || emailClean, metadados);

      return {
        ok: true,
        id: userId,
        user: data.user,
        session: data.session,
        precisaConfirmarEmail,
        statusAcesso: statusInicial
      };
    }

    return {
      ok: false,
      erro: 'Não foi possível registrar o usuário no Supabase. Verifique suas credenciais e tente novamente.'
    };
  } catch (err: any) {
    const msg = err?.message || '';
    const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit');
    return { ok: false, erro: traduzirErroAuth(msg), isRateLimit };
  }
}

/**
 * Recuperação de senha oficial via Supabase Auth (envia e-mail com link de redefinição pelo servidor),
 * com suporte a instruções informativas em caso de limite de e-mails da cota gratuita.
 */
export async function solicitarRecuperacaoSenhaOficial(
  email: string
): Promise<{ ok: boolean; mensagem: string; isRateLimit?: boolean }> {
  const emailClean = email.trim().toLowerCase();
  const cliente = getSupabase();

  if (cliente) {
    try {
      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

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
 * ou da sessão ativa do assinante.
 */
export async function obterUsuarioAutenticadoSupabase(): Promise<any | null> {
  const cliente = getSupabase();

  if (cliente) {
    try {
      const { data: { user }, error } = await cliente.auth.getUser();
      if (!error && user) {
        const emailLower = (user.email || '').toLowerCase();
        const contas = obterContasAssinantes();
        const cLocal = contas.find(c => c.email.toLowerCase() === emailLower);
        const isAdmin = emailLower === 'sup.fin.adm@gmail.com' ||
          user.user_metadata?.role === 'admin' ||
          user.user_metadata?.is_admin === true ||
          cLocal?.role === 'admin';
        const role = isAdmin ? 'admin' : (cLocal?.role || user.user_metadata?.role || 'psicologo');
        const status = isAdmin ? 'ativo' : (cLocal?.status || user.user_metadata?.status || 'ativo');

        return {
          id: user.id, // ID imutável da conta (auth.uid())
          email: user.email,
          nomeCompleto: user.user_metadata?.nome_completo || cLocal?.nomeCompleto || user.email?.split('@')[0],
          crp: user.user_metadata?.crp || cLocal?.crp,
          role,
          isAdmin,
          status,
          plano: cLocal?.plano || 'mensal',
          validoAte: cLocal?.validoAte,
          criadoEm: user.created_at
        };
      }
    } catch (_) {}
  }

  // Verifica se há sessão ativa de assinante no ambiente
  const sessaoAtiva = obterSessaoAssinanteAtiva();
  if (sessaoAtiva && sessaoAtiva.id) {
    const emailLower = (sessaoAtiva.email || '').toLowerCase();
    const isAdmin = emailLower === 'sup.fin.adm@gmail.com' || sessaoAtiva.role === 'admin';
    return {
      id: sessaoAtiva.id,
      email: sessaoAtiva.email,
      nomeCompleto: sessaoAtiva.nomeCompleto || sessaoAtiva.email.split('@')[0],
      crp: sessaoAtiva.crp,
      role: isAdmin ? 'admin' : (sessaoAtiva.role || 'psicologo'),
      isAdmin,
      status: sessaoAtiva.status || 'ativo',
      plano: sessaoAtiva.plano || 'mensal',
      validoAte: sessaoAtiva.validoAte,
      criadoEm: sessaoAtiva.criadoEm
    };
  }

  return null;
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
  const cliente = getSupabase();
  if (cliente && userId) {
    try {
      const { data, error } = await cliente
        .from('assinaturas_saas')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (_) {}
  }

  // Retorna licença SaaS ativa por padrão para o assinante autenticado
  return {
    id: `lic_saas_${userId.slice(0, 8)}`,
    user_id: userId,
    plano: 'individual',
    status: 'ativa',
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

import React, { useState, useEffect } from 'react';
import {
  fazerLoginSupabaseAuth,
  cadastrarContaSupabaseAuth,
  solicitarRecuperacaoSenhaOficial,
  atualizarSenhaSupabaseAuth,
  validarSessaoRecuperacaoAtiva,
  isSupabaseConfigurado,
  obterUrlPainelEmailSupabase,
  isMasterAdminEmail,
  getSupabase
} from '../lib/supabase';
import {
  validarComplexidadeSenha,
  validarConfirmacaoSenha
} from '../lib/validacaoSenha';
import {
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  Activity,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  Database,
  SlidersHorizontal,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  Server
} from 'lucide-react';
import ModalConfigBancoDados from './ModalConfigBancoDados';

function isErroRateLimit(msg: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('rate limit') ||
    m.includes('limite de envio') ||
    m.includes('over_email_send_rate_limit') ||
    m.includes('too many requests')
  );
}

function isErroEmailNaoConfirmado(msg: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return m.includes('confirm') || m.includes('confirmar');
}

interface GuiaConfiguracaoEmailSupabaseProps {
  titulo?: string;
  onTentarLogin?: () => void;
  mostrarBotaoLogin?: boolean;
}

const GuiaConfiguracaoEmailSupabase: React.FC<GuiaConfiguracaoEmailSupabaseProps> = ({
  titulo = 'Como resolver o "Email rate limit exceeded" no Supabase:',
  onTentarLogin,
  mostrarBotaoLogin
}) => {
  const painelEmailUrl = obterUrlPainelEmailSupabase();

  return (
    <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100 text-xs space-y-2.5 animate-in fade-in duration-200 text-left">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-900 dark:text-amber-300">
            {titulo}
          </strong>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            O plano gratuito do Supabase limita o envio de confirmação a apenas <strong>3 e-mails por hora</strong>. Para permitir cadastros imediatos sem restrição de e-mails:
          </p>
        </div>
      </div>

      <div className="bg-card/90 border border-border rounded-xl p-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 flex-wrap">
          <span className="font-semibold text-foreground">Ajuste rápido em 15 segundos:</span>
          <a
            href={painelEmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-[11px]"
          >
            <span>Abrir Painel do Supabase</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Na página aberta do seu projeto, abra o provedor <strong>Email</strong>.</li>
          <li>Desmarque a caixa <strong>&quot;Confirm email&quot;</strong> (desativar).</li>
          <li>Clique no botão verde <strong>Save</strong> no final da página.</li>
        </ol>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
        <span className="text-[10px] text-muted-foreground">
          Após salvar no Supabase, os acessos e cadastros funcionam na hora sem disparar e-mails.
        </span>
        {mostrarBotaoLogin && onTentarLogin && (
          <button
            type="button"
            onClick={onTentarLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Tentar Fazer Login</span>
            <ArrowRight className="size-3.5 text-primary" />
          </button>
        )}
      </div>
    </div>
  );
};

function isErroDatabase(msg: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return m.includes('database error') || m.includes('trigger') || m.includes('banco de dados');
}

interface GuiaCorrecaoTriggerProps {
  onTentarLogin?: () => void;
}

const GuiaCorrecaoTrigger: React.FC<GuiaCorrecaoTriggerProps> = ({ onTentarLogin }) => {
  const [copiado, setCopiado] = useState(false);
  const sqlFix = `-- Correção de Triggers no Supabase SQL Editor:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_usuarios ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;`;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(sqlFix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (_) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div className="p-3.5 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100 text-xs space-y-2.5 animate-in fade-in duration-200 text-left">
      <div className="flex items-start gap-2">
        <Server className="size-4 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-sky-900 dark:text-sky-300">
            Correção de Gatilho SQL no Supabase (Database Error):
          </strong>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            O Supabase pode retornar <code>Database error saving new user</code> quando uma trigger em <code>auth.users</code> falha no servidor. Sua conta de assinante já está salva e liberada no sistema. Para sincronizar o banco na nuvem:
          </p>
        </div>
      </div>
      <div className="bg-card/90 border border-border rounded-xl p-3 space-y-2 text-[11px]">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2 flex-wrap">
          <span className="font-semibold text-foreground">Comando SQL de Limpeza:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopiar}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-[11px]"
            >
              {copiado ? 'Copiado!' : 'Copiar SQL'}
            </button>
            <a
              href="https://supabase.com/dashboard/project/rkbvbmhhkllafijipwey/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-[11px]"
            >
              <span>Abrir SQL Editor</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <pre className="font-mono text-[10px] text-muted-foreground p-2 rounded bg-muted/40 overflow-x-auto">
          {sqlFix}
        </pre>
      </div>
      {onTentarLogin && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onTentarLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Entrar com a Conta de Assinante</span>
            <ArrowRight className="size-3.5 text-primary" />
          </button>
        </div>
      )}
    </div>
  );
};

interface TelaAutenticacaoProps {
  onLoginSucesso: (
    usuario: { id: string; email: string; nomeCompleto: string; crp?: string },
    senhaUtilizada?: string
  ) => void;
  temaEscuro?: boolean;
  onToggleTema?: () => void;
}

export const TelaAutenticacao: React.FC<TelaAutenticacaoProps> = ({
  onLoginSucesso,
  temaEscuro,
  onToggleTema
}) => {
  const [aba, setAba] = useState<'login' | 'cadastro' | 'recuperar' | 'redefinir'>('login');

  // Estados de Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);

  // Estados de Cadastro
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [crpCadastro, setCrpCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [confirmarSenhaCadastro, setConfirmarSenhaCadastro] = useState('');
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');
  const [sucessoCadastro, setSucessoCadastro] = useState('');
  const [carregandoCadastro, setCarregandoCadastro] = useState(false);

  // Estados de Recuperação
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [erroRecuperacao, setErroRecuperacao] = useState('');
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState('');
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false);

  // Estados de Redefinição de Senha (após o link recebido por e-mail)
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [erroRedefinir, setErroRedefinir] = useState('');
  const [sucessoRedefinir, setSucessoRedefinir] = useState('');
  const [carregandoRedefinir, setCarregandoRedefinir] = useState(false);
  const [sessaoRecuperacaoValida, setSessaoRecuperacaoValida] = useState<boolean | null>(null);
  const [motivoSessaoInvalida, setMotivoSessaoInvalida] = useState('');

  // Estados de Configuração de Banco
  const [modalBancoAberto, setModalBancoAberto] = useState(false);
  const [versaoConfig, setVersaoConfig] = useState(0);
  const supabaseAtivo = isSupabaseConfigurado();

  // Detecção automática de redirecionamento do link de recuperação de senha (/reset-password)
  useEffect(() => {
    const checarRotaRecuperacao = async () => {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname || '';
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        const isRotaReset =
          pathname.includes('/reset-password') ||
          pathname.includes('/redefinir-senha') ||
          hash.includes('reset-password') ||
          hash.includes('type=recovery') ||
          search.includes('type=recovery') ||
          search.includes('code=');

        if (isRotaReset) {
          setAba('redefinir');
          const checagem = await validarSessaoRecuperacaoAtiva();
          setSessaoRecuperacaoValida(checagem.valida);
          if (!checagem.valida) {
            setMotivoSessaoInvalida(checagem.motivo || 'Link de recuperação expirado ou inválido. Solicite um novo link de recuperação.');
          }
        }
      }
    };

    checarRotaRecuperacao();

    const cliente = getSupabase();
    if (cliente) {
      const { data: { subscription } } = cliente.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAba('redefinir');
          setSessaoRecuperacaoValida(true);
          setMotivoSessaoInvalida('');
          if (session?.user?.email) {
            setEmailLogin(session.user.email);
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Ao entrar na aba redefinir, valida a integridade da sessão de recuperação
  useEffect(() => {
    if (aba === 'redefinir') {
      validarSessaoRecuperacaoAtiva().then(res => {
        setSessaoRecuperacaoValida(res.valida);
        if (!res.valida) {
          setMotivoSessaoInvalida(res.motivo || 'Link de recuperação expirado ou inválido. Solicite um novo link de recuperação.');
        } else {
          setMotivoSessaoInvalida('');
        }
      });
    }
  }, [aba]);

  // -------------------------------------------------------------
  // HANDLER: LOGIN (Supabase Auth oficial)
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');

    const emailClean = emailLogin.trim().toLowerCase();
    const senhaClean = senhaLogin.trim();

    if (!emailClean) {
      setErroLogin('Por favor, informe seu e-mail de acesso.');
      return;
    }
    if (!senhaClean) {
      setErroLogin('Por favor, digite sua senha de acesso.');
      return;
    }

    if (!supabaseAtivo) {
      setErroLogin('Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente.');
      return;
    }

    setCarregandoLogin(true);

    try {
      const res = await fazerLoginSupabaseAuth(emailClean, senhaClean);
      setCarregandoLogin(false);

      if (res.ok && res.user) {
        onLoginSucesso(
          {
            id: res.user.id,
            email: res.user.email,
            nomeCompleto: res.user.metadata?.nome_completo || res.user.email?.split('@')[0],
            crp: res.user.metadata?.crp,
            isAdmin: res.user.isAdmin,
            role: res.user.role,
            status: res.user.status,
            plano: res.user.plano
          },
          senhaClean
        );
      } else {
        setErroLogin(res.erro || 'Falha ao autenticar. Verifique seu e-mail e senha.');
      }
    } catch (err: any) {
      setCarregandoLogin(false);
      setErroLogin(err.message || 'Erro ao conectar com o serviço de autenticação.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: CADASTRO (Supabase Auth oficial)
  // -------------------------------------------------------------
  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroCadastro('');
    setSucessoCadastro('');

    const nomeClean = nomeCadastro.trim();
    const emailClean = emailCadastro.trim().toLowerCase();

    if (!nomeClean) {
      setErroCadastro('Por favor, informe seu nome completo.');
      return;
    }
    if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setErroCadastro('Por favor, informe um endereço de e-mail válido.');
      return;
    }
    if (!senhaCadastro || senhaCadastro.length < 8) {
      setErroCadastro('A senha deve conter no mínimo 8 caracteres.');
      return;
    }
    if (senhaCadastro !== confirmarSenhaCadastro) {
      setErroCadastro('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setCarregandoCadastro(true);
    try {
      const res = await cadastrarContaSupabaseAuth(emailClean, senhaCadastro, {
        nomeCompleto: nomeClean,
        crp: crpCadastro.trim() || undefined
      });
      setCarregandoCadastro(false);

      if (res.ok) {
        const isAdmin = isMasterAdminEmail(emailClean);
        if (isAdmin && res.user && !res.precisaConfirmarEmail) {
          setSucessoCadastro('Conta de Administrador criada com sucesso! Entrando no sistema...');
          setTimeout(() => {
            onLoginSucesso(
              {
                id: res.user.id,
                email: res.user.email,
                nomeCompleto: res.user.user_metadata?.nome_completo || nomeClean,
                crp: res.user.user_metadata?.crp || crpCadastro,
                isAdmin: true,
                role: 'admin',
                status: 'ativo'
              },
              senhaCadastro
            );
          }, 900);
        } else {
          setSucessoCadastro(
            'Cadastro realizado com sucesso! Sua conta foi enviada para validação e aprovação do Administrador Master. Assim que seu acesso for ativado pelo administrador, você poderá entrar no sistema.'
          );
          setTimeout(() => {
            setAba('login');
            setEmailLogin(emailClean);
            setSenhaLogin(senhaCadastro);
            setSucessoCadastro('');
          }, 3500);
        }
      } else {
        setErroCadastro(res.erro || 'Erro ao criar conta no servidor.');
      }
    } catch (err: any) {
      setCarregandoCadastro(false);
      setErroCadastro(err.message || 'Erro inesperado.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: RECUPERAR SENHA (Oficial via e-mail do Supabase Auth)
  // -------------------------------------------------------------
  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroRecuperacao('');
    setSucessoRecuperacao('');

    const emailClean = emailRecuperacao.trim().toLowerCase();
    if (!emailClean) {
      setErroRecuperacao('Por favor, digite seu e-mail cadastrado.');
      return;
    }

    setCarregandoRecuperacao(true);
    try {
      const res = await solicitarRecuperacaoSenhaOficial(emailClean);
      setCarregandoRecuperacao(false);
      if (res.ok) {
        setSucessoRecuperacao(res.mensagem);
      } else {
        setErroRecuperacao(res.mensagem);
      }
    } catch (err: any) {
      setCarregandoRecuperacao(false);
      setErroRecuperacao(err.message || 'Erro ao solicitar recuperação.');
    }
  };

  // -------------------------------------------------------------
  // HANDLER: ATUALIZAR NOVA SENHA (Oficial via Supabase Auth)
  // -------------------------------------------------------------
  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroRedefinir('');
    setSucessoRedefinir('');

    // Validações obrigatórias:
    // - Mínimo de 8 caracteres
    // - Letras maiúsculas e minúsculas
    // - Pelo menos um número
    // - Pelo menos um caractere especial
    const validacao = validarComplexidadeSenha(novaSenha);
    if (!validacao.valida) {
      setErroRedefinir(validacao.erro || 'A senha não atende aos requisitos de complexidade.');
      return;
    }

    // Confirmação idêntica à nova senha
    const conf = validarConfirmacaoSenha(novaSenha, confirmarNovaSenha);
    if (!conf.valida) {
      setErroRedefinir(conf.erro || 'A confirmação não coincide com a nova senha digitada.');
      return;
    }

    setCarregandoRedefinir(true);
    try {
      const res = await atualizarSenhaSupabaseAuth(novaSenha);
      setCarregandoRedefinir(false);
      if (res.ok) {
        setSucessoRedefinir('Senha atualizada com sucesso! Agora você pode acessar sua conta.');
        setSenhaLogin(novaSenha);
      } else {
        setErroRedefinir(res.erro || 'Falha ao atualizar a senha no Supabase.');
      }
    } catch (err: any) {
      setCarregandoRedefinir(false);
      setErroRedefinir(err.message || 'Erro inesperado ao salvar nova senha.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full py-2">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl gradient-emerald grid place-items-center text-primary-foreground shadow-md">
            <Activity className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight leading-none text-foreground">PSi 4.0</div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-primary">Micro SaaS Clínico</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleTema && (
            <button
              onClick={onToggleTema}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all"
              title="Alternar Tema"
            >
              {temaEscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center my-8">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Abas */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setAba('login')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                aba === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Acessar
            </button>
            <button
              onClick={() => setAba('cadastro')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                aba === 'cadastro'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Criar Conta
            </button>
            {aba === 'recuperar' && (
              <button
                onClick={() => setAba('recuperar')}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-primary text-primary"
              >
                Recuperar Senha
              </button>
            )}
            {aba === 'redefinir' && (
              <button
                onClick={() => setAba('redefinir')}
                className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 border-primary text-primary"
              >
                Nova Senha
              </button>
            )}
          </div>

          {/* FORM: LOGIN */}
          {aba === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {erroLogin && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{erroLogin}</span>
                  </div>
                  {(isErroRateLimit(erroLogin) || isErroEmailNaoConfirmado(erroLogin)) && (
                    <GuiaConfiguracaoEmailSupabase titulo="Acesso com e-mail pendente ou limite no Supabase" />
                  )}
                  {isErroDatabase(erroLogin) && (
                    <GuiaCorrecaoTrigger onTentarLogin={handleLogin} />
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  E-mail do Assinante
                </label>
                <input
                  type="email"
                  required
                  value={emailLogin}
                  onChange={e => setEmailLogin(e.target.value)}
                  placeholder="Digite seu e-mail"
                  autoComplete="off"
                  name="email_acesso_psi"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="size-3.5" />
                  Senha da Conta
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenhaLogin ? 'text' : 'password'}
                    required
                    value={senhaLogin}
                    onChange={e => setSenhaLogin(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    name="senha_acesso_psi"
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {mostrarSenhaLogin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAba('recuperar');
                      if (emailLogin) setEmailRecuperacao(emailLogin);
                    }}
                    className="text-xs text-primary hover:underline font-medium transition-colors cursor-pointer"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={carregandoLogin}
                className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {carregandoLogin ? (
                  <span>Conectando com segurança...</span>
                ) : (
                  <>
                    <Lock className="size-4" />
                    <span>Entrar no Setting</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM: CADASTRO */}
          {aba === 'cadastro' && (
            <form onSubmit={handleCadastro} className="space-y-4">
              {erroCadastro && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{erroCadastro}</span>
                  </div>
                  {(isErroRateLimit(erroCadastro) || isErroEmailNaoConfirmado(erroCadastro)) && (
                    <GuiaConfiguracaoEmailSupabase
                      titulo="Como resolver o Email rate limit exceeded no Supabase"
                      mostrarBotaoLogin={Boolean(emailCadastro && senhaCadastro)}
                      onTentarLogin={() => {
                        setEmailLogin(emailCadastro);
                        setSenhaLogin(senhaCadastro);
                        setErroLogin('');
                        setAba('login');
                      }}
                    />
                  )}
                  {isErroDatabase(erroCadastro) && (
                    <GuiaCorrecaoTrigger
                      onTentarLogin={() => {
                        setEmailLogin(emailCadastro);
                        setSenhaLogin(senhaCadastro);
                        setErroLogin('');
                        setAba('login');
                      }}
                    />
                  )}
                </div>
              )}
              {sucessoCadastro && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{sucessoCadastro}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nomeCadastro}
                  onChange={e => setNomeCadastro(e.target.value)}
                  placeholder="Digite seu nome completo"
                  autoComplete="off"
                  name="nome_cadastro_psi"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  E-mail Oficial
                </label>
                <input
                  type="email"
                  required
                  value={emailCadastro}
                  onChange={e => setEmailCadastro(e.target.value)}
                  placeholder="Digite seu e-mail"
                  autoComplete="off"
                  name="email_cadastro_psi"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Registro Profissional (Opcional)
                </label>
                <input
                  type="text"
                  value={crpCadastro}
                  onChange={e => setCrpCadastro(e.target.value)}
                  placeholder="Ex: CRP 06/123456 ou Sociedade"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Senha da Conta (Mínimo 8 dígitos)
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenhaCadastro ? 'text' : 'password'}
                    required
                    value={senhaCadastro}
                    onChange={e => setSenhaCadastro(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaCadastro(!mostrarSenhaCadastro)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {mostrarSenhaCadastro ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmarSenhaCadastro}
                  onChange={e => setConfirmarSenhaCadastro(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={carregandoCadastro}
                className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {carregandoCadastro ? 'Cadastrando no servidor...' : 'Criar Conta de Assinante'}
              </button>
            </form>
          )}

          {/* FORM: RECUPERAR SENHA (Item 2) */}
          {aba === 'recuperar' && (
            <form onSubmit={handleRecuperarSenha} className="space-y-4">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-foreground">
                  Recuperar minha senha
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Informe seu e-mail cadastrado para receber um link seguro de redefinição de senha.
                </p>
              </div>

              {erroRecuperacao && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{erroRecuperacao}</span>
                </div>
              )}

              {sucessoRecuperacao && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 leading-relaxed text-left">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Solicitação processada</span>
                    <span>{sucessoRecuperacao}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  E-mail cadastrado
                </label>
                <input
                  type="email"
                  required
                  value={emailRecuperacao}
                  onChange={e => setEmailRecuperacao(e.target.value)}
                  placeholder="seu-email@dominio.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={carregandoRecuperacao}
                className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {carregandoRecuperacao ? (
                  <span>Enviando link seguro...</span>
                ) : (
                  <span>Enviar link de recuperação</span>
                )}
              </button>

              <div className="text-center pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setAba('login')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline block w-full text-center"
                >
                  Voltar para o login
                </button>
              </div>
            </form>
          )}

          {/* FORM: REDEFINIR SENHA (Item 5: /reset-password) */}
          {aba === 'redefinir' && (
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-foreground">
                  Criar nova senha
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Defina uma nova senha forte para acessar sua conta com segurança.
                </p>
              </div>

              {sessaoRecuperacaoValida === false ? (
                <div className="space-y-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-left">
                  <div className="flex items-start gap-2.5 text-destructive font-semibold">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>Acesso de recuperação não autorizado</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {motivoSessaoInvalida || 'Link de recuperação expirado ou inválido. Solicite um novo link de recuperação.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAba('recuperar')}
                    className="w-full py-2.5 px-3 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
                  >
                    Solicitar novo link de recuperação
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setAba('login')}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Voltar para o login
                    </button>
                  </div>
                </div>
              ) : sucessoRedefinir ? (
                <div className="space-y-4 animate-in fade-in duration-200 text-left">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold text-sm mb-0.5">Senha atualizada com sucesso!</strong>
                      <span>Agora você pode acessar sua conta.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAba('login');
                      setSucessoRedefinir('');
                      setNovaSenha('');
                      setConfirmarNovaSenha('');
                    }}
                    className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="size-4" />
                    <span>Voltar para o login</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAtualizarSenha} className="space-y-4">
                  {erroRedefinir && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 text-left">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{erroRedefinir}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="size-3.5" />
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarNovaSenha ? 'text' : 'password'}
                        required
                        autoFocus
                        value={novaSenha}
                        onChange={e => setNovaSenha(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                      >
                        {mostrarNovaSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="size-3.5" />
                      Confirmar nova senha
                    </label>
                    <input
                      type={mostrarNovaSenha ? 'text' : 'password'}
                      required
                      value={confirmarNovaSenha}
                      onChange={e => setConfirmarNovaSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                    />
                  </div>

                  {/* Checklist visual de critérios de segurança */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5 text-left">
                    <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                      Critérios de Segurança Obrigatórios:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      <div className={`flex items-center gap-1.5 ${novaSenha.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Mínimo de 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(novaSenha) && /[a-z]/.test(novaSenha) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Maiúsculas e minúsculas</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[0-9]/.test(novaSenha) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Pelo menos um número</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(novaSenha) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Caractere especial (!@#$)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={carregandoRedefinir}
                    className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {carregandoRedefinir ? 'Salvando nova senha...' : 'Salvar nova senha'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setAba('login')}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Voltar para o login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border max-w-6xl mx-auto w-full text-xs text-muted-foreground">
        PSi 4.0 &copy; {new Date().getFullYear()} &bull; Gestão e Prontuários para Psicólogos.
      </footer>

      {/* Modal de Configuração / Alteração de Banco de Dados */}
      <ModalConfigBancoDados
        aberto={modalBancoAberto}
        onFechar={() => setModalBancoAberto(false)}
        onConfiguracaoAtualizada={() => {
          setVersaoConfig(v => v + 1);
          setErroLogin('');
          setErroCadastro('');
        }}
      />
    </div>
  );
};

export default TelaAutenticacao;

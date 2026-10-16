import React, { useState, useEffect } from 'react';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Sun,
  Moon,
  Mail,
  ShieldCheck
} from 'lucide-react';
import {
  validarSessaoRecuperacaoAtiva,
  atualizarSenhaSupabaseAuth,
  getSupabase
} from '../lib/supabase';
import {
  validarComplexidadeSenha,
  validarConfirmacaoSenha
} from '../lib/validacaoSenha';

interface TelaRedefinirSenhaProps {
  onVoltarLogin: (emailPreenchido?: string) => void;
  onSolicitarNovoLink?: () => void;
  temaEscuro?: boolean;
  onToggleTema?: () => void;
}

export default function TelaRedefinirSenha({
  onVoltarLogin,
  onSolicitarNovoLink,
  temaEscuro = true,
  onToggleTema
}: TelaRedefinirSenhaProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [checandoSessao, setChecandoSessao] = useState(true);
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);
  const [emailUsuario, setEmailUsuario] = useState<string>('');
  const [motivoInvalido, setMotivoInvalido] = useState<string>('');
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState(false);

  // Validação da Sessão de Recuperação na montagem e via evento PASSWORD_RECOVERY
  useEffect(() => {
    let cancelado = false;

    const checarSessao = async () => {
      setChecandoSessao(true);
      try {
        const resultado = await validarSessaoRecuperacaoAtiva();
        if (!cancelado) {
          setSessaoValida(resultado.valida);
          if (resultado.email) setEmailUsuario(resultado.email);
          if (!resultado.valida) {
            setMotivoInvalido(
              resultado.motivo ||
              'O link de recuperação de senha expirou ou é inválido. Por segurança, solicite um novo link.'
            );
          }
        }
      } catch (err: any) {
        if (!cancelado) {
          setSessaoValida(false);
          setMotivoInvalido(err?.message || 'Erro ao validar o link de recuperação.');
        }
      } finally {
        if (!cancelado) setChecandoSessao(false);
      }
    };

    checarSessao();

    // Escuta evento oficial PASSWORD_RECOVERY emitido pelo Supabase Auth
    const cliente = getSupabase();
    if (cliente) {
      const { data: { subscription } } = cliente.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (!cancelado) {
            setSessaoValida(true);
            setMotivoInvalido('');
            setChecandoSessao(false);
            if (session?.user?.email) {
              setEmailUsuario(session.user.email);
            }
          }
        }
      });
      return () => {
        cancelado = true;
        subscription.unsubscribe();
      };
    }

    return () => {
      cancelado = true;
    };
  }, []);

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // 1. Validação de Complexidade
    const valComplexidade = validarComplexidadeSenha(novaSenha);
    if (!valComplexidade.valida) {
      setErro(valComplexidade.erro || 'A senha não atende a todos os critérios de segurança.');
      return;
    }

    // 2. Validação de Confirmação Idêntica
    const valConf = validarConfirmacaoSenha(novaSenha, confirmarNovaSenha);
    if (!valConf.valida) {
      setErro(valConf.erro || 'A confirmação de senha não coincide com a nova senha digitada.');
      return;
    }

    setCarregando(true);

    try {
      // 3. Execução do método oficial supabase.auth.updateUser({ password: novaSenha })
      const res = await atualizarSenhaSupabaseAuth(novaSenha);
      setCarregando(false);

      if (res.ok) {
        setSucesso(true);
      } else {
        setErro(res.erro || 'Falha ao atualizar a senha no servidor.');
      }
    } catch (err: any) {
      setCarregando(false);
      setErro(err?.message || 'Erro inesperado ao salvar nova senha.');
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
              type="button"
            >
              {temaEscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center my-8 px-2">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Top Title & Route indicator */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Key className="size-4" />
              <span>Redefinição de Senha</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Criar nova senha
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Defina uma nova senha para acessar sua conta com segurança.
            </p>
          </div>

          {/* Estado 1: Checando Sessão */}
          {checandoSessao && (
            <div className="p-8 text-center space-y-3">
              <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Validando link de recuperação seguro...</p>
            </div>
          )}

          {/* Estado 2: Sessão Inválida ou Link Expirado */}
          {!checandoSessao && sessaoValida === false && (
            <div className="space-y-4 p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-left animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 text-destructive font-bold text-sm">
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <span>Link de recuperação inválido ou expirado</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {motivoInvalido ||
                  'O link recebido por e-mail expirou ou já foi utilizado. Por segurança, os links de recuperação possuem validade temporária.'}
              </p>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSolicitarNovoLink) {
                      onSolicitarNovoLink();
                    } else {
                      onVoltarLogin();
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="size-4" />
                  <span>Solicitar novo link de recuperação</span>
                </button>
                <button
                  type="button"
                  onClick={() => onVoltarLogin()}
                  className="w-full py-2 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors text-center underline block"
                >
                  Voltar para o login
                </button>
              </div>
            </div>
          )}

          {/* Estado 3: Sucesso ao Atualizar Senha */}
          {!checandoSessao && sucesso && (
            <div className="space-y-5 text-left animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3 leading-relaxed">
                <CheckCircle2 className="size-6 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-sm mb-1">
                    Senha atualizada com sucesso!
                  </strong>
                  <span>
                    Agora você pode acessar sua conta normalmente com a nova senha definida.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onVoltarLogin(emailUsuario)}
                className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Fazer Login</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {/* Estado 4: Formulário de Redefinição Ativo */}
          {!checandoSessao && sessaoValida === true && !sucesso && (
            <form onSubmit={handleSalvarSenha} className="space-y-4 text-left">
              {emailUsuario && (
                <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border flex items-center gap-2">
                  <Mail className="size-3.5 text-primary" />
                  <span>Conta: <strong className="text-foreground">{emailUsuario}</strong></span>
                </div>
              )}

              {erro && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{erro}</span>
                </div>
              )}

              {/* Campo Nova Senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    autoFocus
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Nova Senha */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={confirmarNovaSenha}
                    onChange={e => setConfirmarNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                  />
                </div>
              </div>

              {/* Checklist de Requisitos Obrigatórios de Senha */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span>Critérios de Segurança Obrigatórios:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${novaSenha.length >= 8 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>Mínimo 8 caracteres</span>
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

              {/* Botão Salvar Nova Senha */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {carregando ? (
                  <span>Salvando nova senha...</span>
                ) : (
                  <>
                    <Key className="size-4" />
                    <span>Salvar nova senha</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onVoltarLogin()}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                >
                  Voltar para o login
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border max-w-6xl mx-auto w-full text-xs text-muted-foreground">
        PSi 4.0 &copy; {new Date().getFullYear()} &bull; Gestão e Prontuários para Psicólogos.
      </footer>
    </div>
  );
}

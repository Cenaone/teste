import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Server,
  Cloud,
  HardDrive,
  ExternalLink,
  RefreshCw,
  X,
  Key,
  Globe,
  Check,
  ShieldCheck,
  Cpu,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode
} from 'lucide-react';
import {
  getSupabaseCredentials,
  salvarCredenciaisSupabase,
  testarConexaoSupabase,
  isSupabaseConfigurado,
  limparUrlSupabase,
  obterUrlPainelEmailSupabase
} from '../lib/supabase';
import { SQL_MIGRACAO_NOVO_SUPABASE } from '../lib/sqlScript';

interface ModalConfigBancoDadosProps {
  aberto: boolean;
  onFechar: () => void;
  onConfiguracaoAtualizada?: () => void;
}

export const ModalConfigBancoDados: React.FC<ModalConfigBancoDadosProps> = ({
  aberto,
  onFechar,
  onConfiguracaoAtualizada
}) => {
  const [url, setUrl] = useState('');
  const [chaveAnon, setChaveAnon] = useState('');
  const [bancoSelecionado, setBancoSelecionado] = useState<'supabase' | 'firebase' | 'cloudsql' | 'local'>('supabase');
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const [copiadoSql, setCopiadoSql] = useState(false);
  const [mostrarSqlDetalhes, setMostrarSqlDetalhes] = useState(false);

  const handleCopiarSql = async () => {
    try {
      await navigator.clipboard.writeText(SQL_MIGRACAO_NOVO_SUPABASE);
      setCopiadoSql(true);
      setTimeout(() => setCopiadoSql(false), 2500);
    } catch (_) {
      // Fallback
      setCopiadoSql(true);
      setTimeout(() => setCopiadoSql(false), 2500);
    }
  };

  useEffect(() => {
    if (aberto) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setChaveAnon(creds.anonKey);
      setResultadoTeste(null);
      setSalvoComSucesso(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const handleTestar = async () => {
    setTestando(true);
    setResultadoTeste(null);
    try {
      const res = await testarConexaoSupabase(url, chaveAnon);
      setResultadoTeste(res);
    } catch (err: any) {
      setResultadoTeste({ ok: false, mensagem: err?.message || 'Falha ao testar conexão' });
    } finally {
      setTestando(false);
    }
  };

  const handleSalvar = () => {
    salvarCredenciaisSupabase(url, chaveAnon);
    setSalvoComSucesso(true);
    if (onConfiguracaoAtualizada) {
      onConfiguracaoAtualizada();
    }
    setTimeout(() => {
      setSalvoComSucesso(false);
      onFechar();
    }, 1200);
  };

  const handleLimpar = () => {
    setUrl('');
    setChaveAnon('');
    salvarCredenciaisSupabase('', '');
    setResultadoTeste(null);
    if (onConfiguracaoAtualizada) {
      onConfiguracaoAtualizada();
    }
  };

  const statusConfigurado = isSupabaseConfigurado();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl gradient-emerald grid place-items-center text-primary-foreground shadow-sm">
              <Database className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Gerenciador de Banco de Dados</h2>
              <p className="text-xs text-muted-foreground">
                Configure ou altere o banco onde os acessos e contas de assinantes são gerenciados
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Status Atual */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className={`size-3 rounded-full ${statusConfigurado ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <div className="text-xs font-bold text-foreground">
                  Status Atual: {statusConfigurado ? 'Supabase Conectado' : 'Nenhum Banco Conectado'}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {statusConfigurado ? `URL em uso: ${url || 'Definida via ambiente/memória'}` : 'Preencha as credenciais abaixo para conectar seu banco'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Arquitetura Nuvem + Cofre Local
            </span>
          </div>

          {/* Opções de Banco */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Selecione o Provedor de Banco de Dados
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setBancoSelecionado('supabase')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  bancoSelecionado === 'supabase'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Server className="size-4 text-emerald-600" />
                  {bancoSelecionado === 'supabase' && <Check className="size-3 text-primary" />}
                </div>
                <div className="font-bold text-xs">Supabase</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">PostgreSQL + Auth</div>
              </button>

              <button
                type="button"
                onClick={() => setBancoSelecionado('firebase')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  bancoSelecionado === 'firebase'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Cloud className="size-4 text-amber-500" />
                  {bancoSelecionado === 'firebase' && <Check className="size-3 text-primary" />}
                </div>
                <div className="font-bold text-xs">Firebase</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Firestore + Auth</div>
              </button>

              <button
                type="button"
                onClick={() => setBancoSelecionado('cloudsql')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  bancoSelecionado === 'cloudsql'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Cpu className="size-4 text-blue-500" />
                  {bancoSelecionado === 'cloudsql' && <Check className="size-3 text-primary" />}
                </div>
                <div className="font-bold text-xs">Cloud SQL</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Google PostgreSQL</div>
              </button>

              <button
                type="button"
                onClick={() => setBancoSelecionado('local')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  bancoSelecionado === 'local'
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <HardDrive className="size-4 text-purple-500" />
                  {bancoSelecionado === 'local' && <Check className="size-3 text-primary" />}
                </div>
                <div className="font-bold text-xs">100% Local</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">IndexedDB + Crypto</div>
              </button>
            </div>
          </div>

          {/* Seletor 1: Configuração do Supabase */}
          {bancoSelecionado === 'supabase' && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Server className="size-4 text-emerald-600" />
                  Conectar Novo Supabase (PostgreSQL Gerenciado + Auth)
                </span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  Abrir Supabase Dashboard <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Guia Rápido de Configuração */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Passo a passo para seu novo banco Supabase:</span>
                </div>
                
                <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>
                    Acesse seu projeto no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Supabase Dashboard</a>.
                  </li>
                  <li className="space-y-1">
                    <span>No menu lateral, abra <strong>SQL Editor</strong> &gt; <strong>New query</strong>, cole o script de inicialização e clique em <strong>Run</strong>:</span>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopiarSql}
                        className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        {copiadoSql ? (
                          <>
                            <Check className="size-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Script SQL Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copiar Script SQL de Inicialização</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMostrarSqlDetalhes(!mostrarSqlDetalhes)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 underline"
                      >
                        <FileCode className="size-3" />
                        <span>{mostrarSqlDetalhes ? 'Ocultar SQL' : 'Visualizar SQL'}</span>
                        {mostrarSqlDetalhes ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </button>
                    </div>

                    {mostrarSqlDetalhes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-black/80 text-emerald-400 font-mono text-[10px] max-h-48 overflow-y-auto whitespace-pre border border-border/50">
                        {SQL_MIGRACAO_NOVO_SUPABASE}
                      </div>
                    )}
                  </li>
                  <li>
                    Em <strong>Project Settings &gt; API</strong>, copie a <strong>Project URL</strong> e a chave <strong>anon public</strong> e cole nos campos abaixo.
                  </li>
                  <li className="space-y-1 pt-1">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                      Evite o erro &quot;Email rate limit exceeded&quot;:
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      O Supabase gratuito limita o envio de confirmação a apenas 3 e-mails/hora. Em <strong>Authentication &gt; Providers &gt; Email</strong>, desmarque a opção <strong>Confirm email</strong> e clique em <strong>Save</strong> para permitir cadastros imediatos sem restrições.
                    </p>
                    <a
                      href={obterUrlPainelEmailSupabase(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                    >
                      <span>Abrir Configuração de Email do Supabase</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    Project URL (URL do Projeto Supabase)
                  </span>
                  {url && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      {limparUrlSupabase(url)}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(limparUrlSupabase(e.target.value.trim()))}
                  onBlur={e => setUrl(limparUrlSupabase(e.target.value.trim()))}
                  placeholder="https://exemplo-seu-projeto.supabase.co"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-muted/30 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Key className="size-3.5" />
                    Anon / Public API Key
                  </label>
                  {url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] && (
                    <a
                      href={`https://supabase.com/dashboard/project/${url.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1]}/settings/api`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      Copiar chave no Supabase <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  value={chaveAnon}
                  onChange={e => setChaveAnon(e.target.value.trim())}
                  placeholder="sb_publishable_... ou eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-muted/30 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-[11px] text-muted-foreground">
                  Obtenha em: <em>Project Settings &gt; API &gt; Project API Keys &gt; anon public</em>.
                </p>
              </div>

              {/* Feedback de Teste */}
              {resultadoTeste && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    resultadoTeste.ok
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}
                >
                  {resultadoTeste.ok ? (
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  )}
                  <span>{resultadoTeste.mensagem}</span>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLimpar}
                  className="px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar credenciais
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestar}
                    disabled={testando || !url || !chaveAnon}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 disabled:opacity-50 transition-all"
                  >
                    <RefreshCw className={`size-3.5 ${testando ? 'animate-spin' : ''}`} />
                    <span>{testando ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSalvar}
                    disabled={!url || !chaveAnon}
                    className="px-5 py-2 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {salvoComSucesso ? (
                      <>
                        <Check className="size-3.5" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <span>Salvar e Conectar</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seletor 2: Firebase */}
          {bancoSelecionado === 'firebase' && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Cloud className="size-4 text-amber-500" />
                Firebase (Google Cloud Firestore + Authentication)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Podemos migrar e provisionar o <strong>Firebase Firestore</strong> nativamente neste ambiente do AI Studio.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                Para ativar o Firebase no projeto, basta solicitar no chat: <em>&quot;Provisionar Firebase para esta aplicação&quot;</em> e iniciaremos o assistente oficial de autorização da nuvem.
              </div>
            </div>
          )}

          {/* Seletor 3: Cloud SQL */}
          {bancoSelecionado === 'cloudsql' && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Cpu className="size-4 text-blue-500" />
                Cloud SQL (PostgreSQL Dedicado Google Cloud)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suporta provisionamento automático com PostgreSQL Developer Edition (escala até zero e camada gratuita).
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300">
                Para migrar para Cloud SQL, você pode solicitar no chat: <em>&quot;Configurar Cloud SQL PostgreSQL&quot;</em>.
              </div>
            </div>
          )}

          {/* Seletor 4: Modo Local */}
          {bancoSelecionado === 'local' && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <HardDrive className="size-4 text-purple-500" />
                Modo 100% Local (Sem Nuvem Externa)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O PSi 4.0 já possui o cofre criptografado local (Web Crypto AES-GCM + IndexedDB) que opera 100% no seu navegador sem enviar nenhum prontuário clínico para a internet.
              </p>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-800 dark:text-purple-300">
                Se você não deseja utilizar nenhuma nuvem externa para autenticação de assinantes, os dados clínicos continuam funcionando normalmente de forma local e offline.
              </div>
            </div>
          )}

          {/* Nota de Privacidade */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/10 text-xs text-muted-foreground flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Proteção Ética e LGPD:</strong> Independente do banco de dados na nuvem escolhido, as notas clínicas e dados de pacientes são processados e armazenados no dispositivo do profissional com chaves criptográficas exclusivas, garantindo sigilo absoluto.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigBancoDados;

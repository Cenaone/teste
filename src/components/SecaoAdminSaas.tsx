import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Users,
  Search,
  RefreshCw,
  Calendar,
  Check,
  Ban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  X,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { Card } from './ui-compact';
import {
  supabase,
  getSupabase,
  getSupabaseCredentials,
  AssinaturaAdminRpc,
  isMasterAdminEmail,
  PlanoAssinante
} from '../lib/supabase';
import { consultarAdministrador, exigirSessaoAutenticada, listarContasAutenticadas } from '../lib/sessaoAutenticada';
import { createClient } from '@supabase/supabase-js';

interface SecaoAdminSaasProps {
  contaUsuario: { id: string; email: string; nomeCompleto: string; crp?: string; isAdmin?: boolean; role?: string } | null;
  licencaSaas: any | null;
  onVoltarParaConfiguracoes?: () => void;
}

export default function SecaoAdminSaas({ contaUsuario, licencaSaas, onVoltarParaConfiguracoes }: SecaoAdminSaasProps) {
  const [usuarios, setUsuarios] = useState<AssinaturaAdminRpc[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroRpc, setErroRpc] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'ativo' | 'inativo'>('todos');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [usuarioAtualizandoId, setUsuarioAtualizandoId] = useState<string | null>(null);
  const [validandoMeuAcesso, setValidandoMeuAcesso] = useState(false);

  // O banco valida o privilégio; cache, e-mail e metadados não autorizam ações.
  const [isAdminSessao, setIsAdminSessao] = useState(false);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<AssinaturaAdminRpc | null>(null);

  // Form states - Novo Usuário Manual
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('PsiSenha123!');
  const [novoCrp, setNovoCrp] = useState('');
  const [novoPlano, setNovoPlano] = useState<PlanoAssinante>('mensal');
  const [novoDias, setNovoDias] = useState(30);
  const [novoRole, setNovoRole] = useState<'admin' | 'psicologo'>('psicologo');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  // Form states - Editar Usuário
  const [editNome, setEditNome] = useState('');
  const [editCrp, setEditCrp] = useState('');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo' | 'pendente'>('ativo');
  const [editRole, setEditRole] = useState<'admin' | 'psicologo'>('psicologo');
  const [editPlano, setEditPlano] = useState<PlanoAssinante>('mensal');
  const [editDiasValidade, setEditDiasValidade] = useState(30);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // A interface reflete a decisão do banco, sem deduzir aprovação pelo e-mail ou validade.
  const verificarAcessoRealUsuario = (u: AssinaturaAdminRpc): boolean => {
    return u.acesso_valido === true;
  };

  /**
   * Busca os dados chamando: supabase.rpc('admin_listar_contas')
   */
  const carregarDados = async () => {
    setCarregando(true);
    setErroRpc(null);
    try {
      setIsAdminSessao(false);
      setUsuarios([]);
      const data = await listarContasAutenticadas(getSupabase(), contaUsuario?.id);
      setIsAdminSessao(true);
      setUsuarios(data);
    } catch (err: any) {
      setErroRpc(err?.message || 'Não foi possível consultar as contas no Supabase.');
      setUsuarios([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [contaUsuario?.id]);

  const mostrarFeedback = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Contadores calculados considerando o acesso real validado
  const contadores = useMemo(() => {
    const total = usuarios.length;
    const pendentes = usuarios.filter(
      u => !verificarAcessoRealUsuario(u) && (u.status_usuario === 'pendente' || u.status_assinatura === 'pendente')
    ).length;
    const ativos = usuarios.filter(u => verificarAcessoRealUsuario(u)).length;
    const inativos = usuarios.filter(
      u => !verificarAcessoRealUsuario(u) && u.status_usuario !== 'pendente' && u.status_assinatura !== 'pendente'
    ).length;
    return { total, pendentes, ativos, inativos };
  }, [usuarios]);

  // Lista Filtrada preservando busca e filtros existentes
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const isValido = verificarAcessoRealUsuario(u);

      // Filtro de status
      if (filtroStatus === 'pendente') {
        if (isValido || (u.status_usuario !== 'pendente' && u.status_assinatura !== 'pendente')) return false;
      } else if (filtroStatus === 'ativo') {
        if (!isValido) return false;
      } else if (filtroStatus === 'inativo') {
        if (isValido || u.status_usuario === 'pendente' || u.status_assinatura === 'pendente') return false;
      }

      // Filtro de texto conectado a todos os campos
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const nomeMatch = (u.nome || '').toLowerCase().includes(termo);
        const emailMatch = (u.email || '').toLowerCase().includes(termo);
        const crpMatch = (u.crp || '').toLowerCase().includes(termo);
        const userIdMatch = (u.user_id || '').toLowerCase().includes(termo);
        const roleMatch = (u.role || '').toLowerCase().includes(termo);
        const planoMatch = (u.plano || '').toLowerCase().includes(termo);
        const statusUsuarioMatch = (u.status_usuario || '').toLowerCase().includes(termo);
        const statusAssinaturaMatch = (u.status_assinatura || '').toLowerCase().includes(termo);
        return (
          nomeMatch ||
          emailMatch ||
          crpMatch ||
          userIdMatch ||
          roleMatch ||
          planoMatch ||
          statusUsuarioMatch ||
          statusAssinaturaMatch
        );
      }
      return true;
    });
  }, [usuarios, filtroStatus, busca]);

  // Ações de gerenciamento via RPCs oficiais
  const executarAcaoAdmin = async (funcao: string, argumentos: Record<string, unknown>) => {
    const cliente = getSupabase();
    await exigirSessaoAutenticada(cliente, contaUsuario?.id);
    if (!await consultarAdministrador(cliente)) throw new Error('Acesso restrito aos administradores.');
    return await cliente.rpc(funcao, argumentos);
  };

  const handleAprovar = async (u: AssinaturaAdminRpc, dias = 30) => {
    setUsuarioAtualizandoId(u.user_id);
    try {
      const { error } = await executarAcaoAdmin('admin_aprovar_usuario', {
        p_user_id: u.user_id,
        p_dias_validade: dias,
        p_plano: u.plano || 'mensal'
      });
      if (error) {
        mostrarFeedback(`Falha na função RPC 'admin_aprovar_usuario': ${error.message}`, 'erro');
      } else {
        mostrarFeedback(`Assinatura de ${u.nome} aprovada por ${dias} dias com sucesso!`);
        await carregarDados();
      }
    } catch (err: any) {
      mostrarFeedback(`Erro na RPC 'admin_aprovar_usuario': ${err?.message || 'Erro inesperado'}`, 'erro');
    } finally {
      setUsuarioAtualizandoId(null);
    }
  };

  const handleAlternarStatus = async (u: AssinaturaAdminRpc) => {
    if (!isAdminSessao) {
      mostrarFeedback('Apenas o Administrador possui autorização para ativar ou desativar o acesso de usuários.', 'erro');
      return;
    }
    const novoStatus = u.acesso_valido ? 'inativo' : 'ativo';
    setUsuarioAtualizandoId(u.user_id);
    try {
      const { error } = await executarAcaoAdmin('admin_alternar_status_usuario', {
        p_user_id: u.user_id,
        p_novo_status: novoStatus
      });
      if (error) {
        mostrarFeedback(`Falha na função RPC 'admin_alternar_status_usuario': ${error.message}`, 'erro');
      } else {
        mostrarFeedback(
          novoStatus === 'ativo'
            ? `Acesso de ${u.nome} ativado com sucesso pelo Administrador!`
            : `Acesso de ${u.nome} desativado com sucesso pelo Administrador.`
        );
        await carregarDados();
      }
    } catch (err: any) {
      mostrarFeedback(`Erro na RPC 'admin_alternar_status_usuario': ${err?.message || 'Erro inesperado'}`, 'erro');
    } finally {
      setUsuarioAtualizandoId(null);
    }
  };

  const handleRenovarDias = async (u: AssinaturaAdminRpc, dias = 30) => {
    setUsuarioAtualizandoId(u.user_id);
    try {
      const { error } = await executarAcaoAdmin('admin_aprovar_usuario', {
        p_user_id: u.user_id,
        p_dias_validade: dias,
        p_plano: u.plano || 'mensal'
      });
      if (error) {
        mostrarFeedback(`Falha na função RPC 'admin_aprovar_usuario': ${error.message}`, 'erro');
      } else {
        mostrarFeedback(`Assinatura de ${u.nome} renovada por mais ${dias} dias!`);
        await carregarDados();
      }
    } catch (err: any) {
      mostrarFeedback(`Erro ao renovar assinatura: ${err?.message || 'Erro inesperado'}`, 'erro');
    } finally {
      setUsuarioAtualizandoId(null);
    }
  };

  const abrirEdicao = (u: AssinaturaAdminRpc) => {
    setUsuarioEmEdicao(u);
    setEditNome(u.nome || '');
    setEditCrp(u.crp || '');
    setEditStatus((u.status_usuario as any) || 'ativo');
    setEditRole((u.role as any) || 'psicologo');
    setEditPlano((u.plano as any) || 'mensal');
    setEditDiasValidade(30);
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEmEdicao) return;
    setSalvandoEdicao(true);

    try {
      // 1. Atualiza status via RPC
      const { error: erroStatus } = await executarAcaoAdmin('admin_alternar_status_usuario', {
        p_user_id: usuarioEmEdicao.user_id,
        p_novo_status: editStatus
      });

      if (erroStatus) {
        setSalvandoEdicao(false);
        mostrarFeedback(`Falha na RPC 'admin_alternar_status_usuario': ${erroStatus.message}`, 'erro');
        return;
      }

      // 2. Se status for ativo, atualiza validade e plano via admin_aprovar_usuario
      if (editStatus === 'ativo') {
        const { error: erroAprovar } = await executarAcaoAdmin('admin_aprovar_usuario', {
          p_user_id: usuarioEmEdicao.user_id,
          p_dias_validade: Number(editDiasValidade) || 30,
          p_plano: editPlano
        });
        if (erroAprovar) {
          setSalvandoEdicao(false);
          mostrarFeedback(`Falha na RPC 'admin_aprovar_usuario': ${erroAprovar.message}`, 'erro');
          return;
        }
      }

      setSalvandoEdicao(false);
      mostrarFeedback('Assinante atualizado com sucesso no Supabase!');
      setModalEditarAberto(false);
      setUsuarioEmEdicao(null);
      await carregarDados();
    } catch (err: any) {
      setSalvandoEdicao(false);
      mostrarFeedback(err.message || 'Erro ao salvar alterações.', 'erro');
    }
  };

  const handleCriarNovoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoNovo(true);

    try {
      // signUp no cliente principal substituiria a sessão do administrador.
      await exigirSessaoAutenticada(getSupabase(), contaUsuario?.id);
      if (!await consultarAdministrador(getSupabase())) throw new Error('Acesso restrito aos administradores.');
      const { url, anonKey } = getSupabaseCredentials();
      const clienteCadastro = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { data, error } = await clienteCadastro.auth.signUp({
        email: novoEmail.trim().toLowerCase(),
        password: novaSenha.trim(),
        options: {
          data: {
            nome_completo: novoNome.trim(),
            crp: novoCrp.trim() || undefined,
            role: novoRole
          }
        }
      });

      if (error) {
        setSalvandoNovo(false);
        mostrarFeedback(`Erro ao registrar usuário: ${error.message}`, 'erro');
        return;
      }

      if (data?.user?.id) {
        // Imediatamente aprova via RPC oficial
        const { error: erroAprovar } = await executarAcaoAdmin('admin_aprovar_usuario', {
          p_user_id: data.user.id,
          p_dias_validade: Number(novoDias) || 30,
          p_plano: novoPlano
        });
        if (erroAprovar) {
          mostrarFeedback(`Usuário criado, mas RPC 'admin_aprovar_usuario' retornou: ${erroAprovar.message}`, 'erro');
        } else {
          mostrarFeedback(`Assinante ${novoNome} cadastrado e liberado com sucesso!`);
        }

        // Sincroniza também no servidor para persistência e contingência
        try {
          await fetch('/api/auth/registrar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email: novoEmail.trim().toLowerCase(),
              nomeCompleto: novoNome.trim(),
              crp: novoCrp.trim() || undefined,
              senha: novaSenha.trim()
            })
          });
          await fetch('/api/admin/aprovar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              email: novoEmail.trim().toLowerCase(),
              diasValidade: Number(novoDias) || 30,
              plano: novoPlano
            })
          });
        } catch (_) {}
      } else {
        mostrarFeedback(`Conta criada com sucesso!`);
      }

      setSalvandoNovo(false);
      setModalNovoAberto(false);
      setNovoNome('');
      setNovoEmail('');
      setNovoCrp('');
      setNovaSenha('PsiSenha123!');
      setNovoDias(30);
      await carregarDados();
    } catch (err: any) {
      setSalvandoNovo(false);
      mostrarFeedback(err.message || 'Erro inesperado.', 'erro');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-6 text-primary" />
            Gestão de Assinaturas & Validação de Acessos
          </h2>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
            <span>Painel de Controle integrado ao Supabase via RPCs oficiais.</span>
            {isAdminSessao && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                <Shield className="size-3" />
                Modo Administrador
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onVoltarParaConfiguracoes && (
            <button
              type="button"
              onClick={onVoltarParaConfiguracoes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs cursor-pointer"
              title="Voltar para as Configurações do Sistema"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar às Configurações</span>
            </button>
          )}

          {/* Botão Atualizar */}
          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Atualizar lista de assinaturas"
          >
            <RefreshCw className={`size-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold transition-all shadow-md hover:opacity-95 cursor-pointer"
          >
            <UserPlus className="size-4" />
            <span>Novo Assinante Manual</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all shadow-sm ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          {feedback.tipo === 'sucesso' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
          <span className="font-medium">{feedback.texto}</span>
        </div>
      )}

      {/* KPI Cards (Zero-pill, Typographic Hierarchy) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Cadastrado</span>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{contadores.total}</div>
          <div className="text-[11px] text-muted-foreground">Registros na base</div>
        </Card>

        <Card
          className={`p-4 space-y-1 cursor-pointer transition-all ${
            filtroStatus === 'pendente' ? 'ring-2 ring-amber-500/50 bg-amber-500/5' : ''
          }`}
          onClick={() => setFiltroStatus(filtroStatus === 'pendente' ? 'todos' : 'pendente')}
        >
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Aguardando Aprovação</span>
            <Clock className={`size-4 ${contadores.pendentes > 0 ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div className={`text-2xl font-bold ${contadores.pendentes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
            {contadores.pendentes}
          </div>
          <div className="text-[11px] text-muted-foreground">Necessitam validação</div>
        </Card>

        <Card
          className={`p-4 space-y-1 cursor-pointer transition-all ${
            filtroStatus === 'ativo' ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : ''
          }`}
          onClick={() => setFiltroStatus(filtroStatus === 'ativo' ? 'todos' : 'ativo')}
        >
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Assinaturas Ativas</span>
            <UserCheck className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {contadores.ativos}
          </div>
          <div className="text-[11px] text-muted-foreground">acesso_valido = true</div>
        </Card>

        <Card
          className={`p-4 space-y-1 cursor-pointer transition-all ${
            filtroStatus === 'inativo' ? 'ring-2 ring-destructive/50 bg-destructive/5' : ''
          }`}
          onClick={() => setFiltroStatus(filtroStatus === 'inativo' ? 'todos' : 'inativo')}
        >
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Acessos Desativados</span>
            <UserX className="size-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {contadores.inativos}
          </div>
          <div className="text-[11px] text-muted-foreground">acesso_valido = false</div>
        </Card>
      </div>

      {/* Banner se houver assinantes pendentes */}
      {contadores.pendentes > 0 && filtroStatus !== 'pendente' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-amber-500/20 grid place-items-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="size-4" />
            </div>
            <div>
              <span className="font-bold block">
                {contadores.pendentes} assinante(s) aguardando sua validação
              </span>
              <span className="text-amber-700/80 dark:text-amber-400/80 text-[11px]">
                Novos usuários registrados precisam da aprovação do administrador para ter acesso liberado.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFiltroStatus('pendente')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Ver Pendentes
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Control (Interactive Filter Buttons) */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filtroStatus === 'todos'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos ({contadores.total})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('pendente')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filtroStatus === 'pendente'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pendentes ({contadores.pendentes})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filtroStatus === 'ativo'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ativos ({contadores.ativos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('inativo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filtroStatus === 'inativo'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inativos ({contadores.inativos})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, CRP ou user_id..."
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-border bg-card text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 text-xs cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Estado de Erro da RPC */}
      {erroRpc && (
        <Card className="p-6 text-center border-destructive/40 bg-destructive/5 space-y-3">
          <div className="size-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-1 max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-destructive">
              Falha na Chamada da RPC: admin_listar_contas
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              {erroRpc}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={carregarDados}
              className="px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Tentar Novamente</span>
            </button>

          </div>
        </Card>
      )}

      {/* Lista de Assinantes */}
      <div className="space-y-3">
        {carregando ? (
          <Card className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <RefreshCw className="size-6 animate-spin mx-auto text-primary" />
            <p>Buscando dados via supabase.rpc('admin_listar_contas')...</p>
          </Card>
        ) : !erroRpc && usuariosFiltrados.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <Users className="size-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground text-sm">Nenhum assinante encontrado</p>
            <p className="max-w-sm mx-auto">
              {busca ? 'Nenhum resultado corresponde à busca digitada.' : 'Nenhuma assinatura retornada pelo banco de dados para este filtro.'}
            </p>
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="text-primary hover:underline font-semibold pt-2 cursor-pointer"
              >
                Limpar busca
              </button>
            )}
          </Card>
        ) : (
          usuariosFiltrados.map(u => {
            const isSuperAdmin = isMasterAdminEmail(u.email);

            return (
              <Card
                key={u.user_id}
                className={`p-4 sm:p-5 transition-all border ${
                  u.acesso_valido
                    ? 'border-border bg-card hover:border-primary/40'
                    : (u.status_usuario === 'pendente' || u.status_assinatura === 'pendente')
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações do Usuário conectadas aos 12 campos solicitados */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Campo: nome */}
                      <span className="font-bold text-foreground text-sm truncate">
                        {u.nome}
                      </span>

                      {/* Campo: role */}
                      {u.role === 'admin' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                          <Shield className="size-3" />
                          Administrador
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {u.role || 'Psicólogo'}
                        </span>
                      )}

                      {/* 3. Indicador de acesso usando estritamente o valor acesso_valido retornado pela RPC */}
                      <span aria-hidden="true" className="text-muted-foreground">·</span>
                      {u.acesso_valido ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Acesso Válido
                        </span>
                      ) : (
                        <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                          <span className="size-2 rounded-full bg-destructive" />
                          Acesso Inválido {u.status_usuario === 'pendente' ? '(Pendente)' : ''}
                        </span>
                      )}
                    </div>

                    {/* Metadados e Campos da RPC */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {/* Campo: email */}
                      <span className="font-mono text-foreground font-medium">{u.email}</span>

                      {/* Campo: crp */}
                      {u.crp && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>CRP: <strong className="text-foreground">{u.crp}</strong></span>
                        </>
                      )}

                      {/* Campo: status_usuario */}
                      <span aria-hidden="true">·</span>
                      <span>
                        Status Usuário: <strong className="text-foreground capitalize">{u.status_usuario}</strong>
                      </span>

                      {/* Campo: plano */}
                      <span aria-hidden="true">·</span>
                      <span>
                        Plano: <strong className="text-foreground capitalize">{u.plano}</strong>
                      </span>

                      {/* Campo: status_assinatura */}
                      <span aria-hidden="true">·</span>
                      <span>
                        Status Assinatura: <strong className="text-foreground capitalize">{u.status_assinatura}</strong>
                      </span>

                      {/* Campo: valido_ate */}
                      {u.valido_ate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Válido até:{' '}
                            <strong className={!u.acesso_valido ? 'text-destructive font-semibold' : 'text-foreground'}>
                              {new Date(u.valido_ate).toLocaleDateString('pt-BR')}
                            </strong>
                          </span>
                        </>
                      )}

                      {/* Campo: aprovado_por */}
                      {u.aprovado_por && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Aprovado por: <strong className="text-foreground">{u.aprovado_por}</strong></span>
                        </>
                      )}

                      {/* Campo: aprovado_em */}
                      {u.aprovado_em && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>
                            Aprovado em: <strong className="text-foreground">{new Date(u.aprovado_em).toLocaleDateString('pt-BR')}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Campo: user_id (identificador UUID) */}
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-muted-foreground font-mono">
                      <span>user_id: <span className="text-foreground select-all">{u.user_id}</span></span>
                    </div>
                  </div>

                  {/* Ações Administrativas conectadas às RPCs oficiais - Exclusivo para Administrador */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Opção de Ativar e Desativar Acesso - Exclusivo para Administrador */}
                    {isAdminSessao ? (
                      !isSuperAdmin ? (
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleAlternarStatus(u)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                            u.acesso_valido
                              ? 'border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 hover:border-destructive/50'
                              : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/60'
                          }`}
                          title={
                            u.acesso_valido
                              ? 'Desativar acesso deste usuário (Ação exclusiva de Administrador)'
                              : 'Ativar acesso imediato deste usuário (Ação exclusiva de Administrador)'
                          }
                        >
                          {usuarioAtualizandoId === u.user_id ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              <span>Processando...</span>
                            </>
                          ) : u.acesso_valido ? (
                            <>
                              <Ban className="size-3.5 text-destructive" />
                              <span>Desativar Acesso</span>
                            </>
                          ) : (
                            <>
                              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Ativar Acesso</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground px-2.5 py-1 bg-muted/40 rounded-lg border border-border/60">
                          Conta Master
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic px-2 py-1">
                        Acesso restrito ao Admin
                      </span>
                    )}

                    {/* Botões de aprovação com dias para contas pendentes */}
                    {isAdminSessao && (u.status_usuario === 'pendente' || u.status_assinatura === 'pendente') && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleAprovar(u, 30)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                          title="Aprovar e liberar por 30 dias via RPC admin_aprovar_usuario"
                        >
                          <UserCheck className="size-3.5" />
                          <span>Aprovar 30d</span>
                        </button>
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleAprovar(u, 60)}
                          className="px-2 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          title="Aprovar por 60 dias"
                        >
                          <span>60d</span>
                        </button>
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleAprovar(u, 90)}
                          className="px-2 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          title="Aprovar por 90 dias"
                        >
                          <span>90d</span>
                        </button>
                      </div>
                    )}

                    {/* Renovar +30 e +60 dias via RPC admin_aprovar_usuario */}
                    {isAdminSessao && (
                      <>
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleRenovarDias(u, 30)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          title="Adicionar mais 30 dias de validade"
                        >
                          <Calendar className="size-3 text-primary" />
                          <span>+30 Dias</span>
                        </button>
                        <button
                          type="button"
                          disabled={usuarioAtualizandoId === u.user_id}
                          onClick={() => handleRenovarDias(u, 60)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          title="Adicionar mais 60 dias de validade"
                        >
                          <Calendar className="size-3 text-primary" />
                          <span>+60 Dias</span>
                        </button>

                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => abrirEdicao(u)}
                          className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Editar plano e dados do assinante"
                        >
                          <Edit className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Novo Assinante Manual */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Novo Assinante Manual</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCriarNovoManual} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  placeholder="Dra. / Dr. Psicólogo"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    E-mail do Assinante
                  </label>
                  <input
                    type="email"
                    required
                    value={novoEmail}
                    onChange={e => setNovoEmail(e.target.value)}
                    placeholder="email@dominio.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Senha Provisória
                  </label>
                  <input
                    type="password"
                    required
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    CRP / Registro (Opcional)
                  </label>
                  <input
                    type="text"
                    value={novoCrp}
                    onChange={e => setNovoCrp(e.target.value)}
                    placeholder="06/123456"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Plano
                  </label>
                  <select
                    value={novoPlano}
                    onChange={e => setNovoPlano(e.target.value as PlanoAssinante)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                    <option value="saas_pro">SaaS Pro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Validade (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={novoDias}
                    onChange={e => setNovoDias(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="px-5 py-2 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {salvandoNovo ? 'Criando...' : 'Criar Assinante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário / Plano */}
      {modalEditarAberto && usuarioEmEdicao && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Edit className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Editar Assinante</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarAberto(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    CRP / Registro
                  </label>
                  <input
                    type="text"
                    value={editCrp}
                    onChange={e => setEditCrp(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status de Acesso
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pendente">Pendente</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Plano
                  </label>
                  <select
                    value={editPlano}
                    onChange={e => setEditPlano(e.target.value as PlanoAssinante)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                    <option value="saas_pro">SaaS Pro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dias de Validade
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={editDiasValidade}
                    onChange={e => setEditDiasValidade(Number(e.target.value))}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="px-5 py-2 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

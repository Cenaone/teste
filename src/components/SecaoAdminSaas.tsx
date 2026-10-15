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
  Key,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  X,
  Phone,
  Mail,
  SlidersHorizontal,
  Edit,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card } from './ui-compact';
import {
  listarUsuariosAdmin,
  aprovarUsuarioAdmin,
  alternarStatusAcessoUsuario,
  renovarAssinaturaUsuario,
  atualizarUsuarioAdmin,
  criarUsuarioManualAdmin,
  excluirUsuarioAdmin,
  ContaAssinanteArmazenada,
  StatusAssinante,
  PlanoAssinante
} from '../lib/supabase';
import { SQL_MIGRACAO_NOVO_SUPABASE } from '../lib/sqlScript';

interface SecaoAdminSaasProps {
  contaUsuario: { id: string; email: string; nomeCompleto: string; crp?: string; isAdmin?: boolean; role?: string } | null;
  licencaSaas: any | null;
  onVoltarParaConfiguracoes?: () => void;
}

export default function SecaoAdminSaas({ contaUsuario, licencaSaas }: SecaoAdminSaasProps) {
  const [usuarios, setUsuarios] = useState<ContaAssinanteArmazenada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'ativo' | 'inativo'>('todos');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalSqlAberto, setModalSqlAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<ContaAssinanteArmazenada | null>(null);

  // Form states - Novo Usuário Manual
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('PsiSenha123!');
  const [novoCrp, setNovoCrp] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoPlano, setNovoPlano] = useState<PlanoAssinante>('mensal');
  const [novoDias, setNovoDias] = useState(30);
  const [novoRole, setNovoRole] = useState<'admin' | 'psicologo'>('psicologo');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  // Form states - Editar Usuário
  const [editNome, setEditNome] = useState('');
  const [editCrp, setEditCrp] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editStatus, setEditStatus] = useState<StatusAssinante>('ativo');
  const [editRole, setEditRole] = useState<'admin' | 'psicologo'>('psicologo');
  const [editPlano, setEditPlano] = useState<PlanoAssinante>('mensal');
  const [editValidoAte, setEditValidoAte] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // SQL Copied State
  const [copiadoSql, setCopiadoSql] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const lista = await listarUsuariosAdmin();
      setUsuarios(lista);
    } catch (err: any) {
      console.warn('Erro ao carregar assinantes:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarFeedback = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Contadores
  const contadores = useMemo(() => {
    const total = usuarios.length;
    const pendentes = usuarios.filter(u => u.status === 'pendente').length;
    const ativos = usuarios.filter(u => u.status === 'ativo').length;
    const inativos = usuarios.filter(u => u.status === 'inativo').length;
    return { total, pendentes, ativos, inativos };
  }, [usuarios]);

  // Lista Filtrada
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      // Filtro de status
      if (filtroStatus !== 'todos' && u.status !== filtroStatus) return false;

      // Filtro de texto
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const nomeMatch = (u.nomeCompleto || '').toLowerCase().includes(termo);
        const emailMatch = (u.email || '').toLowerCase().includes(termo);
        const crpMatch = (u.crp || '').toLowerCase().includes(termo);
        return nomeMatch || emailMatch || crpMatch;
      }
      return true;
    });
  }, [usuarios, filtroStatus, busca]);

  // Ações de gerenciamento
  const handleAprovar = async (u: ContaAssinanteArmazenada) => {
    const res = await aprovarUsuarioAdmin(u.id, 30, 'mensal', contaUsuario?.email || 'sup.fin.adm@gmail.com');
    if (res.ok) {
      mostrarFeedback(`Assinatura de ${u.nomeCompleto} aprovada com sucesso! Acesso liberado por 30 dias.`);
      await carregarDados();
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  };

  const handleAlternarStatus = async (u: ContaAssinanteArmazenada) => {
    const novoStatus: StatusAssinante = u.status === 'ativo' ? 'inativo' : 'ativo';
    const res = await alternarStatusAcessoUsuario(u.id, novoStatus);
    if (res.ok) {
      mostrarFeedback(res.mensagem);
      await carregarDados();
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  };

  const handleRenovar30Dias = async (u: ContaAssinanteArmazenada) => {
    const res = await renovarAssinaturaUsuario(u.id, 30);
    if (res.ok) {
      mostrarFeedback(`Assinatura mensal de ${u.nomeCompleto} renovada por mais 30 dias!`);
      await carregarDados();
    } else {
      mostrarFeedback(res.mensagem, 'erro');
    }
  };

  const abrirEdicao = (u: ContaAssinanteArmazenada) => {
    setUsuarioEmEdicao(u);
    setEditNome(u.nomeCompleto);
    setEditCrp(u.crp || '');
    setEditTelefone(u.telefone || '');
    setEditStatus(u.status);
    setEditRole(u.role);
    setEditPlano(u.plano || 'mensal');
    setEditValidoAte(u.validoAte ? u.validoAte.split('T')[0] : '');
    setModalEditarAberto(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEmEdicao) return;
    setSalvandoEdicao(true);

    try {
      const dataValidade = editValidoAte ? new Date(editValidoAte).toISOString() : undefined;
      const res = await atualizarUsuarioAdmin(usuarioEmEdicao.id, {
        nome: editNome.trim(),
        crp: editCrp.trim() || undefined,
        telefone: editTelefone.trim() || undefined,
        status: editStatus,
        role: editRole,
        plano: editPlano,
        validoAte: dataValidade
      });

      setSalvandoEdicao(false);
      if (res.ok) {
        mostrarFeedback('Assinante atualizado com sucesso!');
        setModalEditarAberto(false);
        setUsuarioEmEdicao(null);
        await carregarDados();
      } else {
        mostrarFeedback(res.mensagem, 'erro');
      }
    } catch (err: any) {
      setSalvandoEdicao(false);
      mostrarFeedback(err.message || 'Erro ao salvar alterações.', 'erro');
    }
  };

  const handleCriarNovoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoNovo(true);

    try {
      const res = await criarUsuarioManualAdmin({
        nome: novoNome.trim(),
        email: novoEmail.trim().toLowerCase(),
        senha: novaSenha.trim(),
        crp: novoCrp.trim() || undefined,
        telefone: novoTelefone.trim() || undefined,
        plano: novoPlano,
        diasValidade: Number(novoDias) || 30,
        role: novoRole
      });

      setSalvandoNovo(false);
      if (res.ok) {
        mostrarFeedback(`Assinante ${novoNome} cadastrado e ativado com sucesso!`);
        setModalNovoAberto(false);
        setNovoNome('');
        setNovoEmail('');
        setNovoCrp('');
        setNovoTelefone('');
        setNovaSenha('PsiSenha123!');
        setNovoDias(30);
        await carregarDados();
      } else {
        mostrarFeedback(res.erro || 'Falha ao cadastrar usuário.', 'erro');
      }
    } catch (err: any) {
      setSalvandoNovo(false);
      mostrarFeedback(err.message || 'Erro inesperado.', 'erro');
    }
  };

  const handleExcluir = async (u: ContaAssinanteArmazenada) => {
    if (u.email.toLowerCase() === 'sup.fin.adm@gmail.com') {
      mostrarFeedback('Não é permitido excluir o Administrador Geral.', 'erro');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o usuário ${u.nomeCompleto} (${u.email})?`)) {
      const res = await excluirUsuarioAdmin(u.id);
      if (res.ok) {
        mostrarFeedback('Usuário removido.');
        await carregarDados();
      } else {
        mostrarFeedback(res.mensagem, 'erro');
      }
    }
  };

  const copiarSql = () => {
    navigator.clipboard.writeText(SQL_MIGRACAO_NOVO_SUPABASE);
    setCopiadoSql(true);
    setTimeout(() => setCopiadoSql(false), 2500);
  };

  const calcularDiasRestantes = (validoAte?: string): number => {
    if (!validoAte) return 0;
    const diff = new Date(validoAte).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
          <p className="text-sm text-muted-foreground">
            Painel do Administrador Micro SaaS. Valide pagamentos, aprove novos psicólogos e gerencie acessos mensais.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalSqlAberto(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs"
            title="Ver Script de Migração do Banco no Supabase"
          >
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Script SQL</span>
          </button>

          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs"
            title="Atualizar lista de assinantes"
          >
            <RefreshCw className={`size-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold transition-all shadow-md hover:opacity-95"
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
          <div className="text-[11px] text-muted-foreground">Psicólogos registrados</div>
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
          <div className="text-[11px] text-muted-foreground">Acesso liberado</div>
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
          <div className="text-[11px] text-muted-foreground">Acesso bloqueado</div>
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
                Novos usuários registrados precisam da aprovação do administrador para acessar o sistema.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFiltroStatus('pendente')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors shrink-0 self-start sm:self-auto"
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
              placeholder="Buscar por psicólogo, e-mail ou CRP..."
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-border bg-card text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 text-xs"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Lista de Assinantes */}
      <div className="space-y-3">
        {carregando ? (
          <Card className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <RefreshCw className="size-6 animate-spin mx-auto text-primary" />
            <p>Carregando base de assinantes e status das licenças...</p>
          </Card>
        ) : usuariosFiltrados.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-xs space-y-2">
            <Users className="size-8 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-foreground text-sm">Nenhum assinante encontrado</p>
            <p className="max-w-sm mx-auto">
              {busca ? 'Nenhum resultado corresponde à busca digitada.' : 'Nenhum usuário cadastrado neste filtro de status.'}
            </p>
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="text-primary hover:underline font-semibold pt-2"
              >
                Limpar busca
              </button>
            )}
          </Card>
        ) : (
          usuariosFiltrados.map(u => {
            const isSuperAdmin = u.email.toLowerCase() === 'sup.fin.adm@gmail.com';
            const diasRestantes = calcularDiasRestantes(u.validoAte);
            const vencido = u.validoAte && new Date(u.validoAte).getTime() < Date.now();

            return (
              <Card
                key={u.id}
                className={`p-4 sm:p-5 transition-all border ${
                  u.status === 'pendente'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : u.status === 'inativo' || vencido
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações do Usuário */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground text-sm truncate">
                        {u.nomeCompleto}
                      </span>

                      {/* Role indicator */}
                      {u.role === 'admin' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                          <Shield className="size-3" />
                          Administrador
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Psicólogo
                        </span>
                      )}

                      {/* Status indicator (No pills - clean text + dot) */}
                      <span aria-hidden="true" className="text-muted-foreground">·</span>
                      {u.status === 'ativo' && !vencido && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Ativo ({diasRestantes} dias restantes)
                        </span>
                      )}
                      {u.status === 'pendente' && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                          Aguardando Aprovação
                        </span>
                      )}
                      {(u.status === 'inativo' || (u.status === 'ativo' && vencido)) && (
                        <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                          <span className="size-2 rounded-full bg-destructive" />
                          {vencido ? 'Mensalidade Expirada' : 'Acesso Desativado'}
                        </span>
                      )}
                    </div>

                    {/* Metadata line (clean typographic separators) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono text-foreground">{u.email}</span>
                      {u.crp && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>CRP: {u.crp}</span>
                        </>
                      )}
                      {u.telefone && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Tel: {u.telefone}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>Plano: <strong className="text-foreground capitalize">{u.plano || 'Mensal'}</strong></span>
                      {u.validoAte && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Válido até: {new Date(u.validoAte).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ações Administrativas */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Botão de aprovação direta para pendentes */}
                    {u.status === 'pendente' && (
                      <button
                        type="button"
                        onClick={() => handleAprovar(u)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all"
                      >
                        <UserCheck className="size-3.5" />
                        <span>Aprovar Acesso (Mensal)</span>
                      </button>
                    )}

                    {/* Ativar / Desativar Acesso */}
                    {!isSuperAdmin && u.status !== 'pendente' && (
                      <button
                        type="button"
                        onClick={() => handleAlternarStatus(u)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          u.status === 'ativo'
                            ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                            : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                        title={u.status === 'ativo' ? 'Suspender acesso deste assinante' : 'Liberar acesso para este assinante'}
                      >
                        {u.status === 'ativo' ? (
                          <>
                            <Ban className="size-3.5" />
                            <span>Desativar Acesso</span>
                          </>
                        ) : (
                          <>
                            <Check className="size-3.5" />
                            <span>Ativar Acesso</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Renovar +30 dias */}
                    <button
                      type="button"
                      onClick={() => handleRenovar30Dias(u)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-xs"
                      title="Adicionar mais 30 dias de assinatura mensal"
                    >
                      <Calendar className="size-3.5 text-primary" />
                      <span>+30 Dias</span>
                    </button>

                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => abrirEdicao(u)}
                      className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      title="Editar plano, role e detalhes do usuário"
                    >
                      <Edit className="size-3.5" />
                    </button>

                    {/* Excluir */}
                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleExcluir(u)}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        title="Remover assinante"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
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
                className="text-muted-foreground hover:text-foreground p-1"
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
                    type="text"
                    required
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    CRP / Registro (Opcional)
                  </label>
                  <input
                    type="text"
                    value={novoCrp}
                    onChange={e => setNovoCrp(e.target.value)}
                    placeholder="Ex: 06/123456"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="text"
                    value={novoTelefone}
                    onChange={e => setNovoTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Perfil
                  </label>
                  <select
                    value={novoRole}
                    onChange={e => setNovoRole(e.target.value as 'admin' | 'psicologo')}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="psicologo">Psicólogo</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="px-5 py-2 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {salvandoNovo ? 'Salvando...' : 'Criar e Liberar Acesso'}
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
                className="text-muted-foreground hover:text-foreground p-1"
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
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editTelefone}
                    onChange={e => setEditTelefone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status de Acesso
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as StatusAssinante)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="pendente">Pendente</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Perfil
                  </label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as 'admin' | 'psicologo')}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="psicologo">Psicólogo</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Validade da Assinatura</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setEditValidoAte(d.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      +30d
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 365);
                        setEditValidoAte(d.toISOString().split('T')[0]);
                      }}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      +1 ano
                    </button>
                  </div>
                </label>
                <input
                  type="date"
                  value={editValidoAte}
                  onChange={e => setEditValidoAte(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="px-5 py-2 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Visualizador do Script SQL do Supabase */}
      {modalSqlAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Script SQL de Inicialização e Políticas RLS (Supabase)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSqlAberto(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed shrink-0">
              Execute este script no <strong>SQL Editor</strong> do seu painel Supabase para criar as funções administrativas de aprovação e as regras de segurança RLS:
            </p>

            <div className="flex-1 overflow-y-auto bg-muted/60 p-4 rounded-xl border border-border font-mono text-[11px] text-foreground space-y-1">
              <pre className="whitespace-pre-wrap">{SQL_MIGRACAO_NOVO_SUPABASE}</pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setModalSqlAberto(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={copiarSql}
                className="px-4 py-2 rounded-xl gradient-emerald text-primary-foreground font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                {copiadoSql ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span>{copiadoSql ? 'Copiado para Área de Transferência!' : 'Copiar Script SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

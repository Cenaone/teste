import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Send,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Plus,
  FileText,
  User,
  ArrowUpDown,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import {
  SessaoClinica,
  Honorario,
  Analisando,
  ModalidadeAtendimento,
  PerfilAnalista,
  ConsultorioData
} from '../types';
import { formatarMoeda, formatarData } from '../utils/helpers';
import ModalRecibo, { DadosReciboProps } from './ModalRecibo';

interface SecaoFinanceiroProps {
  sessoes: SessaoClinica[];
  honorarios: Honorario[];
  analisandos: Analisando[];
  modalidades: ModalidadeAtendimento[];
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  contaUsuario?: any;
  onAtualizarSessoes: (novas: SessaoClinica[]) => void;
  onAtualizarHonorarios: (novos: Honorario[]) => void;
  onAbrirWhatsApp: (dados: {
    analisando: Analisando;
    valor?: number;
    data?: string;
    servico?: string;
  }) => void;
  onNovoHonorarioClick?: () => void;
  onNovaSessaoClick?: () => void;
}

export default function SecaoFinanceiro({
  sessoes,
  honorarios,
  analisandos,
  modalidades,
  perfil,
  consultorio,
  contaUsuario,
  onAtualizarSessoes,
  onAtualizarHonorarios,
  onAbrirWhatsApp,
  onNovoHonorarioClick,
  onNovaSessaoClick
}: SecaoFinanceiroProps) {
  // Filtros de visualização
  const [abaVisualizacao, setAbaVisualizacao] = useState<'sessoes' | 'honorarios' | 'fechamento_mensal'>('sessoes');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'pago' | 'atrasado'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes_atual' | 'mes_anterior' | 'ultimos_3' | 'ano_atual' | 'todos'>('mes_atual');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState<string>('todos');

  // Estado para emissão de recibo
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [dadosRecibo, setDadosRecibo] = useState<DadosReciboProps | null>(null);

  // Estados para Fechamento Mensal / Recibo Agrupado
  const [fechamentoPacienteId, setFechamentoPacienteId] = useState<string>(analisandos[0]?.id || '');
  const [fechamentoMesAno, setFechamentoMesAno] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  });

  // Datas de referência para filtros de período
  const hoje = new Date();
  const mesAtualStr = hoje.toISOString().slice(0, 7); // YYYY-MM
  const mesAnteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const mesAnteriorStr = mesAnteriorDate.toISOString().slice(0, 7);
  const anoAtualStr = `${hoje.getFullYear()}`;

  // Helper de filtragem de data
  const dataPertenceAoPeriodo = (dataIso?: string): boolean => {
    if (!dataIso) return false;
    if (filtroPeriodo === 'todos') return true;
    if (filtroPeriodo === 'mes_atual') return dataIso.startsWith(mesAtualStr);
    if (filtroPeriodo === 'mes_anterior') return dataIso.startsWith(mesAnteriorStr);
    if (filtroPeriodo === 'ano_atual') return dataIso.startsWith(anoAtualStr);
    if (filtroPeriodo === 'ultimos_3') {
      const limite = new Date();
      limite.setMonth(limite.getMonth() - 3);
      return new Date(dataIso) >= limite;
    }
    return true;
  };

  // Filtragem das Sessões Clínicas
  const sessoesFiltradas = useMemo(() => {
    return sessoes.filter(s => {
      // Filtro de período
      if (!dataPertenceAoPeriodo(s.data)) return false;

      // Filtro de paciente
      if (pacienteSelecionadoId !== 'todos' && s.analisandoId !== pacienteSelecionadoId) return false;

      // Filtro de status
      const isPago = s.pagamentoStatus === 'pago';
      const isPendente = s.pagamentoStatus === 'pendente' || s.pagamentoStatus === 'parcial';
      const isAtrasado = isPendente && s.data < hoje.toISOString().slice(0, 10);

      if (filtroStatus === 'pago' && !isPago) return false;
      if (filtroStatus === 'pendente' && !isPendente) return false;
      if (filtroStatus === 'atrasado' && !isAtrasado) return false;

      // Filtro de busca de texto
      if (buscaPaciente.trim()) {
        const paciente = analisandos.find(a => a.id === s.analisandoId);
        const modalidade = modalidades.find(m => m.id === s.modalidadeId);
        const termo = buscaPaciente.toLowerCase();
        const nomeMatch = paciente?.nome.toLowerCase().includes(termo);
        const modalidadeMatch = modalidade?.nome.toLowerCase().includes(termo);
        if (!nomeMatch && !modalidadeMatch) return false;
      }

      return true;
    }).sort((a, b) => b.data.localeCompare(a.data));
  }, [sessoes, filtroPeriodo, pacienteSelecionadoId, filtroStatus, buscaPaciente, analisandos, modalidades]);

  // Filtragem dos Honorários/Mensalidades
  const honorariosFiltrados = useMemo(() => {
    return honorarios.filter(h => {
      if (!dataPertenceAoPeriodo(h.vencimento)) return false;
      if (pacienteSelecionadoId !== 'todos' && h.analisandoId !== pacienteSelecionadoId) return false;

      const isPago = h.status === 'pago';
      const isPendente = h.status === 'pendente' || h.status === 'parcial';
      const isAtrasado = h.status === 'atrasado' || (isPendente && h.vencimento < hoje.toISOString().slice(0, 10));

      if (filtroStatus === 'pago' && !isPago) return false;
      if (filtroStatus === 'pendente' && !isPendente) return false;
      if (filtroStatus === 'atrasado' && !isAtrasado) return false;

      if (buscaPaciente.trim()) {
        const paciente = analisandos.find(a => a.id === h.analisandoId);
        const termo = buscaPaciente.toLowerCase();
        if (!paciente?.nome.toLowerCase().includes(termo)) return false;
      }

      return true;
    }).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  }, [honorarios, filtroPeriodo, pacienteSelecionadoId, filtroStatus, buscaPaciente, analisandos]);

  // Cálculos de Métricas Totais (baseados nas sessões e honorários do período atual)
  const metricas = useMemo(() => {
    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;
    let totalConsultasNoPeriodo = 0;

    // Soma sessões no período
    sessoes.forEach(s => {
      if (dataPertenceAoPeriodo(s.data)) {
        totalConsultasNoPeriodo++;
        const valor = Number(s.valorCobrado) || 0;
        if (s.pagamentoStatus === 'pago') {
          totalPago += valor;
        } else {
          totalPendente += valor;
          if (s.data < hoje.toISOString().slice(0, 10)) {
            totalAtrasado += valor;
          }
        }
      }
    });

    // Soma honorários não vinculados a sessões já contadas
    honorarios.forEach(h => {
      if (!h.sessaoId && dataPertenceAoPeriodo(h.vencimento)) {
        const valor = Number(h.valor) || 0;
        if (h.status === 'pago') {
          totalPago += valor;
        } else {
          totalPendente += valor;
          if (h.vencimento < hoje.toISOString().slice(0, 10)) {
            totalAtrasado += valor;
          }
        }
      }
    });

    return {
      totalPago,
      totalPendente,
      totalAtrasado,
      totalConsultasNoPeriodo
    };
  }, [sessoes, honorarios, filtroPeriodo]);

  // Ação: Alternar Pagamento de Sessão (Pendente <-> Pago)
  const alternarPagamentoSessao = (sessao: SessaoClinica, novoStatus: 'pago' | 'pendente' | 'parcial', meio?: string) => {
    const atualizadas = sessoes.map(s => {
      if (s.id === sessao.id) {
        return {
          ...s,
          pagamentoStatus: novoStatus,
          meioPagamento: (meio || s.meioPagamento || 'pix') as any,
          valorPago: novoStatus === 'pago' ? s.valorCobrado : novoStatus === 'pendente' ? 0 : s.valorPago
        };
      }
      return s;
    });
    onAtualizarSessoes(atualizadas);

    // Se houver honorário vinculado, sincroniza automaticamente
    const honorariosAtualizados = honorarios.map(h => {
      if (h.sessaoId === sessao.id) {
        return {
          ...h,
          status: (novoStatus === 'pago' ? 'pago' : 'pendente') as any
        };
      }
      return h;
    });
    onAtualizarHonorarios(honorariosAtualizados);
  };

  // Ação: Alternar Pagamento de Honorário
  const alternarPagamentoHonorario = (honorario: Honorario, novoStatus: 'pago' | 'pendente' | 'atrasado' | 'parcial') => {
    const atualizados = honorarios.map(h => {
      if (h.id === honorario.id) {
        return {
          ...h,
          status: novoStatus
        };
      }
      return h;
    });
    onAtualizarHonorarios(atualizados);

    // Se estiver vinculado à sessão, sincroniza
    if (honorario.sessaoId) {
      const sessoesAtualizadas = sessoes.map(s => {
        if (s.id === honorario.sessaoId) {
          return {
            ...s,
            pagamentoStatus: (novoStatus === 'pago' ? 'pago' : 'pendente') as any
          };
        }
        return s;
      });
      onAtualizarSessoes(sessoesAtualizadas);
    }
  };

  // Abrir Modal de Recibo para uma Sessão
  const abrirReciboSessao = (sessao: SessaoClinica) => {
    const paciente = analisandos.find(a => a.id === sessao.analisandoId);
    if (!paciente) {
      alert('Paciente não localizado para esta sessão.');
      return;
    }
    const modalidade = modalidades.find(m => m.id === sessao.modalidadeId);
    setDadosRecibo({
      tipo: 'sessao',
      sessao,
      paciente,
      modalidade,
      valor: sessao.valorCobrado || 0,
      data: sessao.data,
      meioPagamento: sessao.meioPagamento || 'pix',
      descricao: `Atendimento de psicoterapia clínica / sessão de ${modalidade?.nome || 'psicanálise'} realizada em ${formatarData(sessao.data)}.`
    });
    setModalReciboAberto(true);
  };

  // Abrir Modal de Recibo para um Honorário
  const abrirReciboHonorario = (honorario: Honorario) => {
    const paciente = analisandos.find(a => a.id === honorario.analisandoId);
    if (!paciente) {
      alert('Paciente não localizado para este honorário.');
      return;
    }
    setDadosRecibo({
      tipo: 'honorario',
      honorario,
      paciente,
      valor: honorario.valor || 0,
      data: honorario.vencimento,
      meioPagamento: honorario.meioPagamento || 'pix',
      descricao: honorario.observacao || `Honorários clínicos de psicoterapia com vencimento em ${formatarData(honorario.vencimento)}.`
    });
    setModalReciboAberto(true);
  };

  // Sessões para o Fechamento Mensal / Recibo Consolidado
  const sessoesFechamento = useMemo(() => {
    if (!fechamentoPacienteId) return [];
    return sessoes.filter(s => {
      return s.analisandoId === fechamentoPacienteId && s.data.startsWith(fechamentoMesAno);
    }).sort((a, b) => a.data.localeCompare(b.data));
  }, [sessoes, fechamentoPacienteId, fechamentoMesAno]);

  const totalFechamento = useMemo(() => {
    return sessoesFechamento.reduce((acc, s) => acc + (Number(s.valorCobrado) || 0), 0);
  }, [sessoesFechamento]);

  const abrirReciboAgrupadoFechamento = () => {
    const paciente = analisandos.find(a => a.id === fechamentoPacienteId);
    if (!paciente) return;
    if (sessoesFechamento.length === 0) {
      alert('Nenhuma sessão encontrada para este paciente no mês selecionado.');
      return;
    }

    const [ano, mes] = fechamentoMesAno.split('-');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nomeMes = nomesMeses[parseInt(mes, 10) - 1] || mes;
    const datas = sessoesFechamento.map(s => formatarData(s.data)).join(', ');

    setDadosRecibo({
      tipo: 'multiplas',
      sessoesMultiplas: sessoesFechamento,
      paciente,
      valor: totalFechamento,
      data: `${fechamentoMesAno}-28`,
      meioPagamento: 'pix',
      descricao: `Prestação de serviços psicológicos / psicoterapia clínica referente ao mês de ${nomeMes}/${ano}, compreendendo ${sessoesFechamento.length} sessões realizadas nas datas: ${datas}.`
    });
    setModalReciboAberto(true);
  };

  const quitarTodasSessoesFechamento = () => {
    if (sessoesFechamento.length === 0) return;
    if (window.confirm(`Deseja marcar todas as ${sessoesFechamento.length} sessões do mês como PAGAS?`)) {
      const idsFechamento = new Set(sessoesFechamento.map(s => s.id));
      const atualizadas = sessoes.map(s => {
        if (idsFechamento.has(s.id)) {
          return {
            ...s,
            pagamentoStatus: 'pago' as const,
            valorPago: s.valorCobrado
          };
        }
        return s;
      });
      onAtualizarSessoes(atualizadas);
    }
  };

  return (
    <div className="space-y-6">

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold text-foreground">
              Financeiro & Recibos Clínicos
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              Gestão de Consultas & IRPF
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de consultas pagas e pendentes, conciliação de honorários e emissão de recibos profissionais.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onNovoHonorarioClick && (
            <button
              onClick={onNovoHonorarioClick}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="size-4 text-primary" />
              <span>Lançar Honorário</span>
            </button>
          )}

          {analisandos.length > 0 && (
            <button
              onClick={() => {
                const p = analisandos[0];
                setDadosRecibo({
                  tipo: 'avulso',
                  paciente: p,
                  valor: 200,
                  data: new Date().toISOString().slice(0, 10),
                  meioPagamento: 'pix',
                  descricao: 'Prestação de serviços psicológicos / sessão de psicoterapia clínica.'
                });
                setModalReciboAberto(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white gradient-emerald shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <Printer className="size-4" />
              <span>Emitir Recibo</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas Financeiras (Cards Limpos e Nítidos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Recebido (Pago) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">
              Total Recebido (Pago)
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatarMoeda(metricas.totalPago)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Consultas e honorários quitados
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="size-6" />
          </div>
        </div>

        {/* Total Pendente (A Receber) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">
              A Receber (Pendentes)
            </span>
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {formatarMoeda(metricas.totalPendente)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <Clock className="size-3 text-amber-500" />
              Aguardando pagamento
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-6" />
          </div>
        </div>

        {/* Em Atraso / Vencidos */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">
              Em Atraso / Vencidos
            </span>
            <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatarMoeda(metricas.totalAtrasado)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <AlertTriangle className="size-3 text-rose-500" />
              Pendências anteriores a hoje
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6" />
          </div>
        </div>

        {/* Consultas Realizadas no Período */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground block">
              Consultas no Período
            </span>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">
              {metricas.totalConsultasNoPeriodo}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <Calendar className="size-3 text-primary" />
              Sessões com registro clínico
            </span>
          </div>
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="size-6" />
          </div>
        </div>

      </div>

      {/* Barra de Abas do Módulo Financeiro */}
      <div className="flex border-b border-border text-sm font-medium gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setAbaVisualizacao('sessoes')}
          className={`pb-3 px-1 border-b-2 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            abaVisualizacao === 'sessoes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="size-4" />
          <span>Consultas & Sessões Clínicas ({sessoesFiltradas.length})</span>
        </button>

        <button
          onClick={() => setAbaVisualizacao('honorarios')}
          className={`pb-3 px-1 border-b-2 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            abaVisualizacao === 'honorarios'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <DollarSign className="size-4" />
          <span>Mensalidades & Honorários ({honorariosFiltrados.length})</span>
        </button>

        <button
          onClick={() => setAbaVisualizacao('fechamento_mensal')}
          className={`pb-3 px-1 border-b-2 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            abaVisualizacao === 'fechamento_mensal'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          <span>Fechamento Mensal & Recibo Agrupado</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1 & 2: Listagem com Filtros */}
      {(abaVisualizacao === 'sessoes' || abaVisualizacao === 'honorarios') && (
        <div className="space-y-4">
          
          {/* Barra de Ferramentas de Filtros */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-sm">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por paciente ou modalidade..."
                value={buscaPaciente}
                onChange={e => setBuscaPaciente(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Status */}
              <div className="flex items-center rounded-xl border border-border bg-muted/20 p-1 text-xs">
                <button
                  onClick={() => setFiltroStatus('todos')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroStatus === 'todos' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroStatus('pendente')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                    filtroStatus === 'pendente' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <Clock className="size-3" />
                  <span>Pendentes</span>
                </button>
                <button
                  onClick={() => setFiltroStatus('pago')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                    filtroStatus === 'pago' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <CheckCircle2 className="size-3" />
                  <span>Pagos</span>
                </button>
                <button
                  onClick={() => setFiltroStatus('atrasado')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                    filtroStatus === 'atrasado' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <AlertTriangle className="size-3" />
                  <span>Atrasados</span>
                </button>
              </div>

              {/* Seletor de Período */}
              <select
                value={filtroPeriodo}
                onChange={e => setFiltroPeriodo(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-semibold"
              >
                <option value="mes_atual">Mês Atual ({mesAtualStr})</option>
                <option value="mes_anterior">Mês Anterior ({mesAnteriorStr})</option>
                <option value="ultimos_3">Últimos 3 Meses</option>
                <option value="ano_atual">Ano Todo ({anoAtualStr})</option>
                <option value="todos">Todo o Histórico</option>
              </select>

              {/* Seletor de Paciente */}
              <select
                value={pacienteSelecionadoId}
                onChange={e => setPacienteSelecionadoId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-semibold max-w-[180px] truncate"
              >
                <option value="todos">Todos os Pacientes</option>
                {analisandos.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>

          </div>

          {/* TABELA DE SESSÕES CLÍNICAS */}
          {abaVisualizacao === 'sessoes' && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase text-[11px] font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Data & Hora</th>
                      <th className="px-4 py-3">Modalidade</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Pagamento</th>
                      <th className="px-4 py-3 text-right">Ações & Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sessoesFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          Nenhuma consulta clínica encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      sessoesFiltradas.map(s => {
                        const paciente = analisandos.find(a => a.id === s.analisandoId);
                        const modalidade = modalidades.find(m => m.id === s.modalidadeId);
                        const isPago = s.pagamentoStatus === 'pago';
                        const isAtrasado = !isPago && s.data < hoje.toISOString().slice(0, 10);

                        return (
                          <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                            {/* Paciente */}
                            <td className="px-4 py-3 font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {paciente?.nome ? paciente.nome.charAt(0).toUpperCase() : 'P'}
                                </div>
                                <div>
                                  <span className="block text-sm text-foreground">{paciente?.nome || 'Paciente não identificado'}</span>
                                  {paciente?.cpf && (
                                    <span className="text-[10px] text-muted-foreground font-mono">CPF: {paciente.cpf}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Data & Hora */}
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="font-semibold text-foreground block">{formatarData(s.data)}</span>
                              {s.hora && <span className="text-[11px] text-muted-foreground">{s.hora}</span>}
                            </td>

                            {/* Modalidade */}
                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                                {modalidade?.nome || 'Atendimento Clínico'}
                              </span>
                            </td>

                            {/* Valor */}
                            <td className="px-4 py-3 text-right font-mono font-bold text-sm text-foreground">
                              {formatarMoeda(s.valorCobrado || 0)}
                            </td>

                            {/* Status de Pagamento */}
                            <td className="px-4 py-3 text-center">
                              {isPago ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="size-3 text-emerald-500" />
                                  Pago
                                </span>
                              ) : isAtrasado ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                  <AlertTriangle className="size-3 text-rose-500" />
                                  Atrasado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  <Clock className="size-3 text-amber-500" />
                                  Pendente
                                </span>
                              )}
                            </td>

                            {/* Meio de Pagamento */}
                            <td className="px-4 py-3">
                              <select
                                value={s.meioPagamento || 'pix'}
                                onChange={e => {
                                  const novoMeio = e.target.value as any;
                                  const atualizadas = sessoes.map(x => x.id === s.id ? { ...x, meioPagamento: novoMeio } : x);
                                  onAtualizarSessoes(atualizadas);
                                }}
                                className="px-2 py-1 rounded-lg border border-border bg-card text-[11px] text-foreground font-semibold"
                              >
                                <option value="pix">PIX</option>
                                <option value="transferencia">Transferência</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                              </select>
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                              {/* Botão Alternar Status Rápido */}
                              <button
                                onClick={() => alternarPagamentoSessao(s, isPago ? 'pendente' : 'pago')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                                  isPago
                                    ? 'border border-border bg-muted/30 hover:bg-muted text-muted-foreground'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                                title={isPago ? 'Marcar como Pendente' : 'Confirmar Pagamento'}
                              >
                                {isPago ? 'Desmarcar' : 'Receber'}
                              </button>

                              {/* Botão Imprimir Recibo */}
                              <button
                                onClick={() => abrirReciboSessao(s)}
                                className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all inline-flex items-center gap-1"
                                title="Gerar e imprimir recibo oficial"
                              >
                                <Printer className="size-3.5" />
                                <span>Recibo</span>
                              </button>

                              {/* Cobrança WhatsApp (se pendente) */}
                              {!isPago && paciente && (
                                <button
                                  onClick={() => onAbrirWhatsApp({
                                    analisando: paciente,
                                    valor: s.valorCobrado,
                                    data: s.data,
                                    servico: modalidade?.nome || 'consulta de psicoterapia'
                                  })}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors inline-flex"
                                  title="Enviar lembrete de pagamento no WhatsApp"
                                >
                                  <Send className="size-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA DE HONORÁRIOS & MENSALIDADES */}
          {abaVisualizacao === 'honorarios' && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 uppercase text-[11px] font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Paciente</th>
                      <th className="px-4 py-3">Vencimento</th>
                      <th className="px-4 py-3">Descrição / Observação</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-center">Situação</th>
                      <th className="px-4 py-3 text-right">Ações & Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {honorariosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground">
                          Nenhum lançamento de mensalidade ou honorário encontrado.
                        </td>
                      </tr>
                    ) : (
                      honorariosFiltrados.map(h => {
                        const paciente = analisandos.find(a => a.id === h.analisandoId);
                        const isPago = h.status === 'pago';

                        return (
                          <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">
                              {paciente?.nome || '—'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-semibold">
                              {formatarData(h.vencimento)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                              {h.observacao || 'Mensalidade / Honorários Clínicos'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-sm text-foreground">
                              {formatarMoeda(h.valor)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <select
                                value={h.status}
                                onChange={e => alternarPagamentoHonorario(h, e.target.value as any)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                                  h.status === 'pago'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    : h.status === 'atrasado'
                                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                }`}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="pago">Pago</option>
                                <option value="parcial">Parcial</option>
                                <option value="atrasado">Atrasado</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => abrirReciboHonorario(h)}
                                className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all inline-flex items-center gap-1"
                              >
                                <Printer className="size-3.5" />
                                <span>Recibo</span>
                              </button>

                              {paciente && (
                                <button
                                  onClick={() => onAbrirWhatsApp({
                                    analisando: paciente,
                                    valor: h.valor,
                                    data: h.vencimento,
                                    servico: h.observacao || 'mensalidade de psicoterapia'
                                  })}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors inline-flex"
                                  title="Enviar cobrança via WhatsApp"
                                >
                                  <Send className="size-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Conteúdo da Aba 3: Fechamento Mensal & Recibo Consolidado por Paciente */}
      {abaVisualizacao === 'fechamento_mensal' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                <span>Fechamento Mensal & Recibo Único de IRPF</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione um paciente e o mês de referência para consolidar todas as sessões realizadas em um único recibo oficial para dedução no Imposto de Renda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Selecione o Paciente
                </label>
                <select
                  value={fechamentoPacienteId}
                  onChange={e => setFechamentoPacienteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-semibold"
                >
                  {analisandos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.cpf ? `(CPF: ${a.cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Mês / Ano de Competência
                </label>
                <input
                  type="month"
                  value={fechamentoMesAno}
                  onChange={e => setFechamentoMesAno(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Resumo do Fechamento do Paciente */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className="text-xs text-muted-foreground">Sessões localizadas no mês:</span>
                <p className="text-xl font-bold text-foreground">
                  {sessoesFechamento.length} sessões • Total: <span className="font-mono text-primary">{formatarMoeda(totalFechamento)}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={quitarTodasSessoesFechamento}
                  disabled={sessoesFechamento.length === 0}
                  className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-xs transition-all disabled:opacity-50"
                >
                  Marcar Todas como Pagas
                </button>

                <button
                  onClick={abrirReciboAgrupadoFechamento}
                  disabled={sessoesFechamento.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white gradient-emerald shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Printer className="size-4" />
                  <span>Imprimir Recibo Consolidado</span>
                </button>
              </div>
            </div>

            {/* Lista detalhada das sessões do fechamento */}
            {sessoesFechamento.length === 0 ? (
              <p className="text-center py-8 text-xs text-muted-foreground">
                Nenhuma sessão registrada para este paciente no mês de {fechamentoMesAno}.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {sessoesFechamento.map((s, idx) => {
                  const modalidade = modalidades.find(m => m.id === s.modalidadeId);
                  const isPago = s.pagamentoStatus === 'pago';

                  return (
                    <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="size-6 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatarData(s.data)} {s.hora ? `às ${s.hora}` : ''}
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {modalidade?.nome || 'Sessão Psicoterapêutica'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-foreground">
                          {formatarMoeda(s.valorCobrado || 0)}
                        </span>
                        {isPago ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> Pago
                          </span>
                        ) : (
                          <button
                            onClick={() => alternarPagamentoSessao(s, 'pago')}
                            className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-500/20"
                          >
                            Pendente (Receber)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Impressão de Recibo */}
      <ModalRecibo
        aberto={modalReciboAberto}
        onFechar={() => setModalReciboAberto(false)}
        dados={dadosRecibo}
        perfil={perfil}
        consultorio={consultorio}
        contaUsuario={contaUsuario}
      />

    </div>
  );
}

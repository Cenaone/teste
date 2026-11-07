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
import ModalRelatorioFinanceiro from './ModalRelatorioFinanceiro';

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
  const [abaVisualizacao, setAbaVisualizacao] = useState<'todos' | 'sessoes' | 'honorarios' | 'fechamento_mensal'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'pago' | 'atrasado'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes_atual' | 'mes_anterior' | 'ultimos_3' | 'ano_atual' | 'todos'>('mes_atual');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState<string>('todos');

  // Estado para emissão de recibo e relatório financeiro
  const [modalReciboAberto, setModalReciboAberto] = useState(false);
  const [dadosRecibo, setDadosRecibo] = useState<DadosReciboProps | null>(null);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);

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
    if (filtroPeriodo === 'todos') return true;
    if (!dataIso) return false;

    const str = String(dataIso).trim();
    let dataFormatada = str;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
      const [dia, mes, ano] = str.split('/');
      dataFormatada = `${ano}-${mes}-${dia}`;
    }

    if (filtroPeriodo === 'mes_atual') return dataFormatada.startsWith(mesAtualStr);
    if (filtroPeriodo === 'mes_anterior') return dataFormatada.startsWith(mesAnteriorStr);
    if (filtroPeriodo === 'ano_atual') return dataFormatada.startsWith(anoAtualStr);
    if (filtroPeriodo === 'ultimos_3') {
      const limite = new Date();
      limite.setMonth(limite.getMonth() - 3);
      const dataObj = new Date(dataFormatada.slice(0, 10));
      return !isNaN(dataObj.getTime()) && dataObj >= limite;
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
    const hojeStr = hoje.toISOString().slice(0, 10);
    return honorarios.filter(h => {
      if (!dataPertenceAoPeriodo(h.vencimento)) return false;
      if (pacienteSelecionadoId !== 'todos' && h.analisandoId !== pacienteSelecionadoId) return false;

      const isPago = h.status === 'pago';
      const isAtrasado = h.status === 'atrasado' || ((h.status === 'pendente' || h.status === 'parcial') && h.vencimento < hojeStr);
      // Qualquer honorário em aberto (não pago) é pendente de liquidação
      const isPendente = !isPago;

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

  // Cálculos de Métricas Globais (reconciliação rigorosa sem sobreposição)
  const metricas = useMemo(() => {
    let totalPago = 0;
    let totalNoPrazo = 0;
    let totalAtrasado = 0;
    let totalConsultasNoPeriodo = 0;

    // Mapeia IDs de sessões vinculadas em honorários para evitar qualquer dupla contagem
    const sessoesVinculadas = new Set<string>();
    sessoes.forEach(s => sessoesVinculadas.add(s.id));
    const hojeStr = hoje.toISOString().slice(0, 10);

    // Soma sessões no período
    sessoes.forEach(s => {
      if (dataPertenceAoPeriodo(s.data)) {
        totalConsultasNoPeriodo++;
        const valor = Number(s.valorCobrado) || 0;
        if (s.pagamentoStatus === 'pago') {
          totalPago += valor;
        } else if (s.pagamentoStatus === 'parcial') {
          const pago = Number(s.valorPago) || 0;
          const pendente = Math.max(0, valor - pago);
          totalPago += pago;
          if (s.data < hojeStr && pendente > 0) {
            totalAtrasado += pendente;
          } else {
            totalNoPrazo += pendente;
          }
        } else {
          // Pendente integral
          if (s.data < hojeStr && valor > 0) {
            totalAtrasado += valor;
          } else {
            totalNoPrazo += valor;
          }
        }
      }
    });

    // Soma honorários não vinculados a sessões já contadas
    honorarios.forEach(h => {
      if ((!h.sessaoId || !sessoesVinculadas.has(h.sessaoId)) && dataPertenceAoPeriodo(h.vencimento)) {
        const valor = Number(h.valor) || 0;
        if (h.status === 'pago') {
          totalPago += valor;
        } else if (h.status === 'parcial') {
          const pago = Number(h.valorPago) || 0;
          const pendente = Math.max(0, valor - pago);
          totalPago += pago;
          if (h.vencimento < hojeStr && pendente > 0) {
            totalAtrasado += pendente;
          } else {
            totalNoPrazo += pendente;
          }
        } else {
          // Pendente ou atrasado
          if (h.status === 'atrasado' || (h.vencimento < hojeStr && valor > 0)) {
            totalAtrasado += valor;
          } else {
            totalNoPrazo += valor;
          }
        }
      }
    });

    const totalPendente = totalNoPrazo + totalAtrasado;
    const totalFaturamento = totalPago + totalPendente;
    const ticketMedio = totalConsultasNoPeriodo > 0 ? totalFaturamento / totalConsultasNoPeriodo : 0;

    return {
      totalFaturamento,
      totalPago,
      totalNoPrazo,
      totalAtrasado,
      totalPendente,
      totalConsultasNoPeriodo,
      ticketMedio
    };
  }, [sessoes, honorarios, filtroPeriodo]);

  // Resumos específicos por aba para transparência contextual total
  const resumoSessoesTab = useMemo(() => {
    let pagas = 0;
    let noPrazo = 0;
    let atrasadas = 0;
    const hojeStr = hoje.toISOString().slice(0, 10);
    sessoesFiltradas.forEach(s => {
      const v = Number(s.valorCobrado) || 0;
      if (s.pagamentoStatus === 'pago') pagas += v;
      else if (s.pagamentoStatus === 'parcial') {
        const p = Number(s.valorPago) || 0;
        const saldo = Math.max(0, v - p);
        pagas += p;
        if (s.data < hojeStr) atrasadas += saldo;
        else noPrazo += saldo;
      } else {
        if (s.data < hojeStr) atrasadas += v;
        else noPrazo += v;
      }
    });
    const pendentes = noPrazo + atrasadas;
    return { total: pagas + pendentes, pagas, noPrazo, atrasadas, pendentes, qtd: sessoesFiltradas.length };
  }, [sessoesFiltradas]);

  const resumoHonorariosTab = useMemo(() => {
    let pagos = 0;
    let noPrazo = 0;
    let atrasados = 0;
    const hojeStr = hoje.toISOString().slice(0, 10);
    honorariosFiltrados.forEach(h => {
      const v = Number(h.valor) || 0;
      if (h.status === 'pago') pagos += v;
      else if (h.status === 'parcial') {
        const p = Number(h.valorPago) || 0;
        const saldo = Math.max(0, v - p);
        pagos += p;
        if (h.vencimento < hojeStr) atrasados += saldo;
        else noPrazo += saldo;
      } else {
        if (h.status === 'atrasado' || h.vencimento < hojeStr) atrasados += v;
        else noPrazo += v;
      }
    });
    const pendentes = noPrazo + atrasados;
    return { total: pagos + pendentes, pagos, noPrazo, atrasados, pendentes, qtd: honorariosFiltrados.length };
  }, [honorariosFiltrados]);

  // Interface para os itens unificados da grade financeira
  interface ItemGradeFinanceiro {
    id: string;
    tipo: 'sessao' | 'honorario';
    data: string;
    hora?: string;
    pacienteNome: string;
    pacienteCpf?: string;
    paciente?: Analisando;
    modalidadeNome: string;
    descricao: string;
    valor: number;
    valorPago: number;
    saldoDevedor: number;
    isPago: boolean;
    isAtrasado: boolean;
    status: 'pago' | 'pendente' | 'atrasado' | 'parcial';
    meioPagamento: 'pix' | 'transferencia' | 'dinheiro' | 'cartao';
    sessaoOriginal?: SessaoClinica;
    honorarioOriginal?: Honorario;
  }

  // Lista unificada para a Grade Financeira & Emissão de Recibos
  const itensGrade = useMemo<ItemGradeFinanceiro[]>(() => {
    const lista: ItemGradeFinanceiro[] = [];
    const hojeStr = hoje.toISOString().slice(0, 10);

    // 1. Sessões clínicas
    if (abaVisualizacao === 'todos' || abaVisualizacao === 'sessoes') {
      for (const s of sessoesFiltradas) {
        const paciente = analisandos.find(a => a.id === s.analisandoId);
        const modalidade = modalidades.find(m => m.id === s.modalidadeId);
        const isPago = s.pagamentoStatus === 'pago';
        const isParcial = s.pagamentoStatus === 'parcial';
        const isAtrasado = !isPago && s.data < hojeStr;
        const status: 'pago' | 'pendente' | 'atrasado' | 'parcial' = isPago
          ? 'pago'
          : isParcial
          ? 'parcial'
          : isAtrasado
          ? 'atrasado'
          : 'pendente';
        const valor = Number(s.valorCobrado) || 0;
        const valorPago = isPago ? valor : Number(s.valorPago) || 0;

        lista.push({
          id: `sessao-${s.id}`,
          tipo: 'sessao',
          data: s.data,
          hora: s.hora,
          pacienteNome: paciente?.nome || 'Paciente não identificado',
          pacienteCpf: paciente?.cpf,
          paciente,
          modalidadeNome: modalidade?.nome || 'Atendimento Clínico',
          descricao: `Sessão de ${modalidade?.nome || 'Psicoterapia'}`,
          valor,
          valorPago,
          saldoDevedor: Math.max(0, valor - valorPago),
          isPago,
          isAtrasado,
          status,
          meioPagamento: (s.meioPagamento || 'pix') as any,
          sessaoOriginal: s
        });
      }
    }

    // 2. Honorários & Mensalidades
    if (abaVisualizacao === 'todos' || abaVisualizacao === 'honorarios') {
      for (const h of honorariosFiltrados) {
        const paciente = analisandos.find(a => a.id === h.analisandoId);
        const isPago = h.status === 'pago';
        const isParcial = h.status === 'parcial';
        const isAtrasado = h.status === 'atrasado' || (!isPago && h.vencimento < hojeStr);
        const status: 'pago' | 'pendente' | 'atrasado' | 'parcial' = isPago
          ? 'pago'
          : isParcial
          ? 'parcial'
          : isAtrasado
          ? 'atrasado'
          : 'pendente';
        const valor = Number(h.valor) || 0;
        const valorPago = isPago ? valor : Number(h.valorPago) || 0;

        lista.push({
          id: `honorario-${h.id}`,
          tipo: 'honorario',
          data: h.vencimento,
          pacienteNome: paciente?.nome || 'Paciente não identificado',
          pacienteCpf: paciente?.cpf,
          paciente,
          modalidadeNome: h.observacao || 'Honorários Clínicos / Mensalidade',
          descricao: h.observacao || 'Honorários Clínicos / Mensalidade Acordada',
          valor,
          valorPago,
          saldoDevedor: Math.max(0, valor - valorPago),
          isPago,
          isAtrasado,
          status,
          meioPagamento: (h.meioPagamento || 'pix') as any,
          honorarioOriginal: h
        });
      }
    }

    return lista.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
  }, [abaVisualizacao, sessoesFiltradas, honorariosFiltrados, analisandos, modalidades, hoje]);

  // Resumo contextual para a grade ativa
  const resumoGradeTab = useMemo(() => {
    let pagos = 0;
    let pendentes = 0;
    let atrasados = 0;
    let qtdSessoes = 0;
    let qtdHonorarios = 0;

    itensGrade.forEach(item => {
      if (item.tipo === 'sessao') qtdSessoes++;
      else qtdHonorarios++;

      if (item.isPago) {
        pagos += item.valor;
      } else if (item.status === 'parcial') {
        pagos += item.valorPago;
        if (item.isAtrasado) atrasados += item.saldoDevedor;
        else pendentes += item.saldoDevedor;
      } else if (item.isAtrasado) {
        atrasados += item.valor;
      } else {
        pendentes += item.valor;
      }
    });

    const total = pagos + pendentes + atrasados;
    return {
      total,
      pagos,
      pendentes,
      atrasados,
      qtd: itensGrade.length,
      qtdSessoes,
      qtdHonorarios
    };
  }, [itensGrade]);

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
          <button
            onClick={() => setModalRelatorioAberto(true)}
            className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Abrir relatório financeiro completo para conferência, impressão e envio via WhatsApp"
          >
            <FileText className="size-4" />
            <span>Relatório Completo & WhatsApp</span>
          </button>

          {onNovoHonorarioClick && (
            <button
              onClick={onNovoHonorarioClick}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
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
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white gradient-emerald shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Emitir Recibo</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas Financeiras Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Faturamento Total */}
        <div className="p-5 rounded-2xl bg-card border-2 border-primary/30 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl -mr-4 -mt-4 pointer-events-none" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Faturamento Total
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary">
                {filtroPeriodo === 'todos' ? 'Geral' : 'Período'}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary mt-1">
              {formatarMoeda(metricas.totalFaturamento)}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatarMoeda(metricas.totalPago)}</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{formatarMoeda(metricas.totalPendente)}</span>
            </div>
          </div>
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DollarSign className="size-5" />
          </div>
        </div>

        {/* Total Recebido (Pago) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Total Recebido (Pago)
            </span>
            <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatarMoeda(metricas.totalPago)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              Quitados no período
            </span>
          </div>
          <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        {/* A Vencer (No Prazo) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              A Vencer (No Prazo)
            </span>
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {formatarMoeda(metricas.totalNoPrazo)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <Clock className="size-3 text-amber-500" />
              Vencimentos futuros
            </span>
          </div>
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
        </div>

        {/* Em Atraso / Vencidos */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Em Atraso (Vencidos)
            </span>
            <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatarMoeda(metricas.totalAtrasado)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <AlertTriangle className="size-3 text-rose-500" />
              Anteriores a hoje
            </span>
          </div>
          <div className="size-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>
        </div>

        {/* Total a Receber em Aberto */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Total a Receber (Em Aberto)
            </span>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">
              {formatarMoeda(metricas.totalPendente)}
            </p>
            <span className="text-[11px] text-muted-foreground mt-0.5 block flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              {metricas.totalConsultasNoPeriodo} atendimentos no período
            </span>
          </div>
          <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="size-5" />
          </div>
        </div>
      </div>

      {/* Barra de Abas do Módulo Financeiro */}
      <div className="flex border-b border-border text-sm font-medium gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setAbaVisualizacao('todos')}
          className={`pb-3 px-1 border-b-2 font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
            abaVisualizacao === 'todos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="size-4" />
          <span>Todos os Lançamentos ({sessoesFiltradas.length + honorariosFiltrados.length})</span>
        </button>

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
          <Sparkles className="size-4" />
          <span>Fechamento Mensal & Recibo Agrupado</span>
        </button>
      </div>

      {/* Conteúdo das Abas: Listagem com Filtros */}
      {(abaVisualizacao === 'todos' || abaVisualizacao === 'sessoes' || abaVisualizacao === 'honorarios') && (
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

          {/* GRADE FINANCEIRA UNIFICADA (CONSULTAS & HONORÁRIOS) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between text-xs px-4 py-2.5 rounded-xl bg-muted/30 border border-border text-muted-foreground gap-2">
              <span className="font-semibold text-foreground">
                {abaVisualizacao === 'todos' && (
                  <>
                    Lançamentos no Filtro: <strong className="text-primary font-mono">{resumoGradeTab.qtd}</strong>
                    <span className="text-muted-foreground font-normal ml-1">
                      ({resumoGradeTab.qtdSessoes} consultas • {resumoGradeTab.qtdHonorarios} honorários)
                    </span>
                  </>
                )}
                {abaVisualizacao === 'sessoes' && (
                  <>
                    Consultas no Filtro: <strong className="text-primary font-mono">{resumoGradeTab.qtd}</strong>
                  </>
                )}
                {abaVisualizacao === 'honorarios' && (
                  <>
                    Mensalidades no Filtro: <strong className="text-primary font-mono">{resumoGradeTab.qtd}</strong>
                  </>
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-mono text-xs">
                <span>Subtotal: <strong className="text-foreground font-semibold">{formatarMoeda(resumoGradeTab.total)}</strong></span>
                <span>•</span>
                <span>Quitadas: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatarMoeda(resumoGradeTab.pagos)}</strong></span>
                <span>•</span>
                <span>Pendentes: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{formatarMoeda(resumoGradeTab.pendentes)}</strong></span>
                {resumoGradeTab.atrasados > 0 && (
                  <>
                    <span>•</span>
                    <span>Vencidas: <strong className="text-rose-600 dark:text-rose-400 font-semibold">{formatarMoeda(resumoGradeTab.atrasados)}</strong></span>
                  </>
                )}
              </div>
            </div>

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
                    {itensGrade.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                          Nenhum lançamento financeiro encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      itensGrade.map(item => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          {/* Paciente */}
                          <td className="px-4 py-3 font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <div className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                item.tipo === 'honorario'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                  : 'bg-primary/15 text-primary'
                              }`}>
                                {item.pacienteNome ? item.pacienteNome.charAt(0).toUpperCase() : 'P'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="block text-sm text-foreground">{item.pacienteNome}</span>
                                  {item.tipo === 'honorario' ? (
                                    <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
                                      Honorário
                                    </span>
                                  ) : (
                                    <span className="text-[9px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                                      Consulta
                                    </span>
                                  )}
                                </div>
                                {item.pacienteCpf && (
                                  <span className="text-[10px] text-muted-foreground font-mono">CPF: {item.pacienteCpf}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Data & Hora */}
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="font-semibold text-foreground block">{formatarData(item.data)}</span>
                            {item.hora ? (
                              <span className="text-[11px] text-muted-foreground">{item.hora}</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Vencimento</span>
                            )}
                          </td>

                          {/* Modalidade */}
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium max-w-[200px] truncate block ${
                              item.tipo === 'honorario'
                                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 font-semibold'
                                : 'bg-muted text-foreground'
                            }`} title={item.modalidadeNome}>
                              {item.modalidadeNome}
                            </span>
                          </td>

                          {/* Valor */}
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm text-foreground whitespace-nowrap">
                            {formatarMoeda(item.valor)}
                            {item.status === 'parcial' && (
                              <span className="block text-[10px] font-normal text-emerald-600">
                                Pago: {formatarMoeda(item.valorPago)}
                              </span>
                            )}
                          </td>

                          {/* Status de Pagamento */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.status === 'pago' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="size-3 text-emerald-500" />
                                Pago
                              </span>
                            ) : item.status === 'parcial' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                Parcial
                              </span>
                            ) : item.isAtrasado ? (
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
                              value={item.meioPagamento || 'pix'}
                              onChange={e => {
                                const novoMeio = e.target.value as any;
                                if (item.tipo === 'sessao' && item.sessaoOriginal) {
                                  const atualizadas = sessoes.map(x => x.id === item.sessaoOriginal!.id ? { ...x, meioPagamento: novoMeio } : x);
                                  onAtualizarSessoes(atualizadas);
                                } else if (item.tipo === 'honorario' && item.honorarioOriginal) {
                                  const atualizados = honorarios.map(x => x.id === item.honorarioOriginal!.id ? { ...x, meioPagamento: novoMeio } : x);
                                  onAtualizarHonorarios(atualizados);
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-border bg-card text-[11px] text-foreground font-semibold"
                            >
                              <option value="pix">PIX</option>
                              <option value="transferencia">Transferência</option>
                              <option value="dinheiro">Dinheiro</option>
                              <option value="cartao">Cartão</option>
                            </select>
                          </td>

                          {/* Ações & Recibo */}
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            {/* Botão Alternar Pagamento Rápido */}
                            <button
                              onClick={() => {
                                if (item.tipo === 'sessao' && item.sessaoOriginal) {
                                  alternarPagamentoSessao(item.sessaoOriginal, item.isPago ? 'pendente' : 'pago');
                                } else if (item.tipo === 'honorario' && item.honorarioOriginal) {
                                  alternarPagamentoHonorario(item.honorarioOriginal, item.isPago ? 'pendente' : 'pago');
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                                item.isPago
                                  ? 'border border-border bg-muted/30 hover:bg-muted text-muted-foreground'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                              title={item.isPago ? 'Marcar como Pendente' : 'Confirmar Pagamento'}
                            >
                              {item.isPago ? 'Desmarcar' : 'Receber'}
                            </button>

                            {/* Botão Imprimir Recibo Oficial */}
                            <button
                              onClick={() => {
                                if (item.tipo === 'sessao' && item.sessaoOriginal) {
                                  abrirReciboSessao(item.sessaoOriginal);
                                } else if (item.tipo === 'honorario' && item.honorarioOriginal) {
                                  abrirReciboHonorario(item.honorarioOriginal);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all inline-flex items-center gap-1"
                              title="Gerar e imprimir recibo oficial"
                            >
                              <Printer className="size-3.5" />
                              <span>Recibo</span>
                            </button>

                            {/* Cobrança WhatsApp (se pendente) */}
                            {!item.isPago && item.paciente && (
                              <button
                                onClick={() => {
                                  onAbrirWhatsApp({
                                    analisando: item.paciente!,
                                    valor: item.valor,
                                    data: item.data,
                                    servico: item.modalidadeNome
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors inline-flex"
                                title="Enviar lembrete de pagamento no WhatsApp"
                              >
                                <Send className="size-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

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

      {/* Modal de Relatório Financeiro Completo (Impressão & WhatsApp) */}
      <ModalRelatorioFinanceiro
        aberto={modalRelatorioAberto}
        onFechar={() => setModalRelatorioAberto(false)}
        sessoes={sessoes}
        honorarios={honorarios}
        analisandos={analisandos}
        modalidades={modalidades}
        perfil={perfil}
        consultorio={consultorio}
        contaUsuario={contaUsuario}
      />

    </div>
  );
}

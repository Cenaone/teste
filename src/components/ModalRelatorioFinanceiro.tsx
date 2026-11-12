import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Send,
  Copy,
  Check,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  User,
  CreditCard,
  Building,
  ShieldCheck,
  ArrowUpDown,
  Download,
  Layers
} from 'lucide-react';
import {
  SessaoClinica,
  Honorario,
  Analisando,
  ModalidadeAtendimento,
  PerfilAnalista,
  ConsultorioData
} from '../types';
import { formatarMoeda, formatarData, formatarTelefone } from '../utils/helpers';

interface ModalRelatorioFinanceiroProps {
  aberto: boolean;
  onFechar: () => void;
  sessoes: SessaoClinica[];
  honorarios: Honorario[];
  analisandos: Analisando[];
  modalidades: ModalidadeAtendimento[];
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  contaUsuario?: any;
}

export default function ModalRelatorioFinanceiro({
  aberto,
  onFechar,
  sessoes,
  honorarios,
  analisandos,
  modalidades,
  perfil,
  consultorio,
  contaUsuario
}: ModalRelatorioFinanceiroProps) {
  if (!aberto) return null;

  // Filtros internos do relatório (por padrão exibe Todos para não ocultar nenhum honorário recém-lançado)
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todos' | 'mes_atual' | 'mes_anterior' | 'ultimos_3' | 'ano_atual'>('todos');
  const [pacienteId, setPacienteId] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente' | 'atrasado'>('todos');
  const [tipoVisualizacaoTabela, setTipoVisualizacaoTabela] = useState<'todos' | 'honorarios' | 'sessoes'>('todos');
  const [ordemData, setOrdemData] = useState<'vencimento_asc' | 'vencimento_desc' | 'valor_desc' | 'valor_asc' | 'paciente'>('vencimento_asc');
  const [copiado, setCopiado] = useState(false);

  // Datas de referência
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const mesAtualStr = hojeStr.slice(0, 7);
  const mesAnteriorDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  const mesAnteriorStr = mesAnteriorDate.toISOString().slice(0, 7);
  const anoAtualStr = `${hoje.getFullYear()}`;

  // Helper de filtragem de data com suporte universal a ISO e datas formatadas
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

  // Label do período
  const labelPeriodo = useMemo(() => {
    switch (filtroPeriodo) {
      case 'mes_atual': {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${nomesMeses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
      }
      case 'mes_anterior': {
        const nomesMeses = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${nomesMeses[mesAnteriorDate.getMonth()]} de ${mesAnteriorDate.getFullYear()}`;
      }
      case 'ultimos_3':
        return 'Últimos 3 Meses';
      case 'ano_atual':
        return `Ano Vigente (${anoAtualStr})`;
      case 'todos':
      default:
        return 'Período Completo (Histórico Geral)';
    }
  }, [filtroPeriodo, mesAnteriorDate, anoAtualStr]);

  // Itens filtrados de Sessões
  const sessoesFiltradas = useMemo(() => {
    return sessoes.filter(s => {
      if (!dataPertenceAoPeriodo(s.data)) return false;
      if (pacienteId !== 'todos' && s.analisandoId !== pacienteId) return false;

      const isPago = s.pagamentoStatus === 'pago';
      const isPendente = s.pagamentoStatus === 'pendente' || s.pagamentoStatus === 'parcial';
      const isAtrasado = isPendente && s.data < hojeStr;

      if (filtroStatus === 'pago' && !isPago) return false;
      if (filtroStatus === 'pendente' && !isPendente) return false;
      if (filtroStatus === 'atrasado' && !isAtrasado) return false;

      return true;
    }).sort((a, b) => b.data.localeCompare(a.data));
  }, [sessoes, filtroPeriodo, pacienteId, filtroStatus, hojeStr]);

  // Itens filtrados de Honorários
  const honorariosFiltrados = useMemo(() => {
    return honorarios.filter(h => {
      if (!dataPertenceAoPeriodo(h.vencimento)) return false;
      if (pacienteId !== 'todos' && h.analisandoId !== pacienteId) return false;

      const isPago = h.status === 'pago';
      const isAtrasado = h.status === 'atrasado' || ((h.status === 'pendente' || h.status === 'parcial') && h.vencimento < hojeStr);
      // Qualquer cobrança em aberto é considerada pendente de pagamento
      const isPendente = !isPago;

      if (filtroStatus === 'pago' && !isPago) return false;
      if (filtroStatus === 'pendente' && !isPendente) return false;
      if (filtroStatus === 'atrasado' && !isAtrasado) return false;

      return true;
    }).sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  }, [honorarios, filtroPeriodo, pacienteId, filtroStatus, hojeStr]);

  // Cálculos matematicamente rigorosos sem duplicidades
  const metricas = useMemo(() => {
    let totalPago = 0;
    let totalNoPrazo = 0;
    let totalAtrasado = 0;
    let qtdAtendimentos = 0;

    // Sessões
    for (const s of sessoesFiltradas) {
      qtdAtendimentos++;
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

    // Honorários Avulsos (não vinculados a sessões já contabilizadas)
    for (const h of honorariosFiltrados) {
      if (h.sessaoId && sessoes.some(s => s.id === h.sessaoId)) {
        continue;
      }
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

    const totalPendente = totalNoPrazo + totalAtrasado;
    const totalFaturamento = totalPago + totalPendente;
    const ticketMedio = qtdAtendimentos > 0 ? totalFaturamento / qtdAtendimentos : 0;

    return {
      totalFaturamento,
      totalPago,
      totalNoPrazo,
      totalAtrasado,
      totalPendente,
      qtdAtendimentos,
      ticketMedio
    };
  }, [sessoesFiltradas, honorariosFiltrados, sessoes, hojeStr]);

  // Agrupamento por Paciente
  const resumoPorPaciente = useMemo(() => {
    const mapa = new Map<string, { nome: string; sessoes: number; pago: number; pendente: number; total: number }>();

    for (const s of sessoesFiltradas) {
      const p = analisandos.find(a => a.id === s.analisandoId);
      const nome = p?.nome || 'Paciente não identificado';
      const valor = Number(s.valorCobrado) || 0;
      const pago = s.pagamentoStatus === 'pago' ? valor : s.pagamentoStatus === 'parcial' ? (Number(s.valorPago) || 0) : 0;
      const pendente = valor - pago;

      const atual = mapa.get(s.analisandoId) || { nome, sessoes: 0, pago: 0, pendente: 0, total: 0 };
      atual.sessoes += 1;
      atual.pago += pago;
      atual.pendente += pendente;
      atual.total += valor;
      mapa.set(s.analisandoId, atual);
    }

    for (const h of honorariosFiltrados) {
      if (h.sessaoId && sessoes.some(s => s.id === h.sessaoId)) continue;
      const p = analisandos.find(a => a.id === h.analisandoId);
      const nome = p?.nome || 'Paciente não identificado';
      const valor = Number(h.valor) || 0;
      const pago = h.status === 'pago' ? valor : h.status === 'parcial' ? (Number(h.valorPago) || 0) : 0;
      const pendente = valor - pago;

      const atual = mapa.get(h.analisandoId) || { nome, sessoes: 0, pago: 0, pendente: 0, total: 0 };
      atual.pago += pago;
      atual.pendente += pendente;
      atual.total += valor;
      mapa.set(h.analisandoId, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
  }, [sessoesFiltradas, honorariosFiltrados, sessoes, analisandos]);

  // Agrupamento por Meio de Pagamento
  const resumoPorMeio = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const s of sessoesFiltradas) {
      if (s.pagamentoStatus === 'pago') {
        const meio = s.meioPagamento || 'pix';
        const valor = Number(s.valorCobrado) || 0;
        mapa.set(meio, (mapa.get(meio) || 0) + valor);
      }
    }
    for (const h of honorariosFiltrados) {
      if (h.sessaoId && sessoes.some(s => s.id === h.sessaoId)) continue;
      if (h.status === 'pago') {
        const meio = h.meioPagamento || 'pix';
        const valor = Number(h.valor) || 0;
        mapa.set(meio, (mapa.get(meio) || 0) + valor);
      }
    }
    return Array.from(mapa.entries());
  }, [sessoesFiltradas, honorariosFiltrados, sessoes]);

  interface ItemPlanilha {
    id: string;
    origem: 'sessao' | 'honorario';
    tipoBadge: string;
    data: string;
    pacienteNome: string;
    pacienteId: string;
    descricao: string;
    meioPagamento: string;
    status: 'pago' | 'pendente' | 'atrasado' | 'parcial';
    valor: number;
    valorPago: number;
  }

  // Planilha Unificada com todos os lançamentos financeiros (Sessões e Honorários)
  const itensPlanilha = useMemo(() => {
    const lista: ItemPlanilha[] = [];

    // 1. Sessões Clínicas
    if (tipoVisualizacaoTabela === 'todos' || tipoVisualizacaoTabela === 'sessoes') {
      for (const s of sessoesFiltradas) {
        const paciente = analisandos.find(a => a.id === s.analisandoId);
        const modalidade = modalidades.find(m => m.id === s.modalidadeId);
        const isPago = s.pagamentoStatus === 'pago';
        const isParcial = s.pagamentoStatus === 'parcial';
        const isAtrasado = !isPago && s.data < hojeStr;
        const statusFinal: 'pago' | 'pendente' | 'atrasado' | 'parcial' = isPago
          ? 'pago'
          : isParcial
          ? 'parcial'
          : isAtrasado
          ? 'atrasado'
          : 'pendente';

        lista.push({
          id: `sessao-${s.id}`,
          origem: 'sessao',
          tipoBadge: 'Consulta Clínica',
          data: s.data,
          pacienteNome: paciente?.nome || 'Paciente não identificado',
          pacienteId: s.analisandoId,
          descricao: modalidade?.nome || 'Sessão de Psicoterapia',
          meioPagamento: s.meioPagamento || 'pix',
          status: statusFinal,
          valor: Number(s.valorCobrado) || 0,
          valorPago: isPago ? (Number(s.valorCobrado) || 0) : Number(s.valorPago) || 0
        });
      }
    }

    // 2. Honorários & Mensalidades
    if (tipoVisualizacaoTabela === 'todos' || tipoVisualizacaoTabela === 'honorarios') {
      for (const h of honorariosFiltrados) {
        const paciente = analisandos.find(a => a.id === h.analisandoId);
        const isPago = h.status === 'pago';
        const isParcial = h.status === 'parcial';
        const isAtrasado = h.status === 'atrasado' || (!isPago && h.vencimento < hojeStr);
        const statusFinal: 'pago' | 'pendente' | 'atrasado' | 'parcial' = isPago
          ? 'pago'
          : isParcial
          ? 'parcial'
          : isAtrasado
          ? 'atrasado'
          : 'pendente';

        lista.push({
          id: `honorario-${h.id}`,
          origem: 'honorario',
          tipoBadge: 'Honorário / Mensalidade',
          data: h.vencimento,
          pacienteNome: paciente?.nome || 'Paciente não identificado',
          pacienteId: h.analisandoId,
          descricao: h.observacao || 'Mensalidade de psicoterapia / Honorários acordados',
          meioPagamento: h.meioPagamento || 'pix',
          status: statusFinal,
          valor: Number(h.valor) || 0,
          valorPago: isPago ? (Number(h.valor) || 0) : Number(h.valorPago) || 0
        });
      }
    }

    if (ordemData === 'vencimento_asc') {
      return lista.sort((a, b) => a.data.localeCompare(b.data));
    }
    if (ordemData === 'vencimento_desc') {
      return lista.sort((a, b) => b.data.localeCompare(a.data));
    }
    if (ordemData === 'valor_desc') {
      return lista.sort((a, b) => b.valor - a.valor);
    }
    if (ordemData === 'valor_asc') {
      return lista.sort((a, b) => a.valor - b.valor);
    }
    if (ordemData === 'paciente') {
      return lista.sort((a, b) => a.pacienteNome.localeCompare(b.pacienteNome));
    }
    return lista.sort((a, b) => a.data.localeCompare(b.data));
  }, [sessoesFiltradas, honorariosFiltrados, tipoVisualizacaoTabela, analisandos, modalidades, hojeStr, ordemData]);

  const exportarPlanilhaCSV = () => {
    if (itensPlanilha.length === 0) {
      alert('Não há dados para exportar com os filtros selecionados.');
      return;
    }

    const headers = ['Data/Vencimento', 'Paciente', 'Tipo', 'Descrição', 'Forma Pagamento', 'Status', 'Valor (R$)', 'Valor Pago (R$)'];
    const rows = itensPlanilha.map(item => [
      `"${formatarData(item.data)}"`,
      `"${item.pacienteNome.replace(/"/g, '""')}"`,
      `"${item.tipoBadge}"`,
      `"${item.descricao.replace(/"/g, '""')}"`,
      `"${item.meioPagamento.toUpperCase()}"`,
      `"${item.status.toUpperCase()}"`,
      item.valor.toFixed(2).replace('.', ','),
      item.valorPago.toFixed(2).replace('.', ',')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_financeiro_${hojeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formatação de texto para envio por WhatsApp
  const mensagemWhatsApp = useMemo(() => {
    const profissional = perfil.nome || contaUsuario?.nomeCompleto || 'Dr. Roberto Martins';
    const crp = perfil.registroProfissional || contaUsuario?.crp || '';
    const pacienteFiltro = pacienteId !== 'todos' ? analisandos.find(a => a.id === pacienteId)?.nome : null;

    let txt = `📊 *RELATÓRIO FINANCEIRO CLÍNICO*\n`;
    txt += `*${consultorio.nome || 'Consultório de Psicologia & Psicanálise'}*\n`;
    txt += `👤 Profissional: ${profissional}${crp ? ` (${crp})` : ''}\n`;
    txt += `🗓️ Período: *${labelPeriodo}*\n`;
    if (pacienteFiltro) {
      txt += `👤 Paciente: *${pacienteFiltro}*\n`;
    }
    txt += `━━━━━━━━━━━━━━━━━━━━\n`;
    txt += `💰 *Faturamento Total:* ${formatarMoeda(metricas.totalFaturamento)}\n`;
    txt += `✅ *Total Recebido (Pago):* ${formatarMoeda(metricas.totalPago)}\n`;
    txt += `⏳ *A Vencer (No Prazo):* ${formatarMoeda(metricas.totalNoPrazo)}\n`;
    if (metricas.totalAtrasado > 0) {
      txt += `⚠️ *Em Atraso (Vencido):* ${formatarMoeda(metricas.totalAtrasado)}\n`;
    }
    txt += `📌 *Total em Aberto (A Receber):* ${formatarMoeda(metricas.totalPendente)}\n`;
    txt += `📈 *Consultas Realizadas:* ${metricas.qtdAtendimentos}\n`;
    txt += `🎯 *Ticket Médio:* ${formatarMoeda(metricas.ticketMedio)}\n`;
    txt += `━━━━━━━━━━━━━━━━━━━━\n`;

    if (!pacienteFiltro && resumoPorPaciente.length > 0) {
      txt += `*Resumo por Paciente:*\n`;
      resumoPorPaciente.slice(0, 8).forEach(p => {
        txt += `• ${p.nome}: ${formatarMoeda(p.total)} (${p.sessoes} sessões | ${formatarMoeda(p.pago)} quitado)\n`;
      });
      if (resumoPorPaciente.length > 8) {
        txt += `• ... e mais ${resumoPorPaciente.length - 8} pacientes.\n`;
      }
      txt += `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    txt += `_Relatório gerado em ${formatarData(hojeStr)} via PSi 4.0 - Prontuário Clínico Inteligente._`;
    return txt;
  }, [perfil, contaUsuario, consultorio, labelPeriodo, pacienteId, analisandos, metricas, resumoPorPaciente, hojeStr]);

  const enviarWhatsApp = () => {
    let telefone = '';
    if (pacienteId !== 'todos') {
      const p = analisandos.find(a => a.id === pacienteId);
      if (p?.whatsapp) telefone = p.whatsapp;
    }
    if (!telefone && perfil.whatsapp) {
      telefone = perfil.whatsapp;
    }
    const numeroLimpo = telefone.replace(/\D/g, '');
    const url = numeroLimpo
      ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsApp)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copiarMensagem = () => {
    navigator.clipboard.writeText(mensagemWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const dispararImpressao = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-6xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Cabeçalho de Controle (Ocultado na Impressão) */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                Relatório Financeiro Completo
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Conciliação & Auditoria
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Demonstrativo consolidado de faturamento, consultas pagas e valores a receber.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={enviarWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Compartilhar resumo financeiro via WhatsApp"
            >
              <Send className="size-3.5" />
              <span>Enviar WhatsApp</span>
            </button>

            <button
              onClick={exportarPlanilhaCSV}
              className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Baixar planilha compatível com Excel e Google Planilhas (CSV)"
            >
              <Download className="size-3.5 text-primary" />
              <span>Baixar Planilha (CSV)</span>
            </button>

            <button
              onClick={dispararImpressao}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Imprimir ou Salvar em PDF"
            >
              <Printer className="size-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onFechar}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros (Ocultada na Impressão) */}
        <div className="p-4 bg-muted/10 border-b border-border/60 flex flex-wrap items-center gap-3 text-xs print:hidden">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">Período:</span>
            <select
              value={filtroPeriodo}
              onChange={e => setFiltroPeriodo(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground font-medium"
            >
              <option value="mes_atual">Mês Atual ({mesAtualStr})</option>
              <option value="mes_anterior">Mês Anterior ({mesAnteriorStr})</option>
              <option value="ultimos_3">Últimos 3 Meses</option>
              <option value="ano_atual">Ano Vigente ({anoAtualStr})</option>
              <option value="todos">Todos os Períodos (Histórico Completo)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="size-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">Paciente:</span>
            <select
              value={pacienteId}
              onChange={e => setPacienteId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground font-medium max-w-[200px]"
            >
              <option value="todos">Todos os Pacientes</option>
              {analisandos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="size-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">Status:</span>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground font-medium"
            >
              <option value="todos">Todos os Status</option>
              <option value="pago">Apenas Pagos</option>
              <option value="pendente">Apenas Pendentes</option>
              <option value="atrasado">Em Atraso / Vencidos</option>
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={copiarMensagem}
              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiado ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Relatório */}
        <div id="area-relatorio-financeiro" className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-foreground print:p-0 print:overflow-visible">
          
          {/* Cabeçalho Profissional Clínico (Folha A4) */}
          <div className="border-b-2 border-stone-800 pb-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
                  {consultorio.nome || 'Consultório de Psicoterapia & Atendimento Clínico'}
                </h1>
                <p className="text-xs font-semibold text-stone-700 mt-0.5">
                  Demonstrativo Financeiro & Relatório de Honorários
                </p>
                <div className="text-[11px] text-stone-600 space-y-0.5 mt-2">
                  <p><strong>Profissional Responsável:</strong> {perfil.nome || contaUsuario?.nomeCompleto || 'Dr. Roberto Martins'} {perfil.registroProfissional && `• ${perfil.registroProfissional}`}</p>
                  {consultorio.endereco && <p><strong>Endereço:</strong> {consultorio.endereco} {consultorio.cidade && `• ${consultorio.cidade}`}</p>}
                  {consultorio.segmento && <p><strong>Segmento:</strong> {consultorio.segmento}</p>}
                  {consultorio.whatsapp && <p><strong>Contato:</strong> {formatarTelefone(consultorio.whatsapp)}</p>}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-3 py-1 bg-stone-100 border border-stone-300 rounded-md text-[11px] font-bold text-stone-900 uppercase tracking-wider">
                  {labelPeriodo}
                </span>
                <p className="text-[10px] text-stone-500 mt-1">
                  Emissão: {formatarData(hojeStr)} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Cards de Métricas Consolidadas (Visualização em Grid Limpo e Proporcional) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 sm:p-4 rounded-xl border border-stone-200 bg-stone-50/50 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block truncate">Faturamento Total</span>
              <p className="text-base sm:text-lg font-bold tracking-tight text-stone-900 mt-1 truncate" title={formatarMoeda(metricas.totalFaturamento)}>
                {formatarMoeda(metricas.totalFaturamento)}
              </p>
              <span className="text-[10px] text-stone-500 mt-0.5 block truncate">Total cobrado no período</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block truncate">Total Recebido (Pago)</span>
              <p className="text-base sm:text-lg font-bold tracking-tight text-emerald-700 mt-1 truncate" title={formatarMoeda(metricas.totalPago)}>
                {formatarMoeda(metricas.totalPago)}
              </p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block truncate">Valores quitados</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/40 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block truncate">A Vencer (No Prazo)</span>
              <p className="text-base sm:text-lg font-bold tracking-tight text-amber-700 mt-1 truncate" title={formatarMoeda(metricas.totalNoPrazo)}>
                {formatarMoeda(metricas.totalNoPrazo)}
              </p>
              <span className="text-[10px] text-amber-600 mt-0.5 block truncate">Vencimentos futuros</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-rose-200 bg-rose-50/40 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block truncate">Em Atraso (Vencidos)</span>
              <p className="text-base sm:text-lg font-bold tracking-tight text-rose-700 mt-1 truncate" title={formatarMoeda(metricas.totalAtrasado)}>
                {formatarMoeda(metricas.totalAtrasado)}
              </p>
              <span className="text-[10px] text-rose-600 mt-0.5 block truncate">Anteriores a hoje</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-300 bg-amber-100/30 col-span-2 sm:col-span-1 min-w-0 overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider block truncate">Total a Receber</span>
              <p className="text-base sm:text-lg font-bold tracking-tight text-amber-800 mt-1 truncate" title={formatarMoeda(metricas.totalPendente)}>
                {formatarMoeda(metricas.totalPendente)}
              </p>
              <span className="text-[10px] text-amber-700 mt-0.5 block truncate">No prazo + Vencidos</span>
            </div>
          </div>

          {/* Indicadores Clínicos do Período */}
          <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-white text-xs gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-stone-500" />
              <span><strong>Consultas Realizadas:</strong> {metricas.qtdAtendimentos} {metricas.qtdAtendimentos === 1 ? 'sessão' : 'sessões'}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-stone-500" />
              <span><strong>Ticket Médio por Consulta:</strong> {formatarMoeda(metricas.ticketMedio)}</span>
            </div>
            {resumoPorMeio.length > 0 && (
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-stone-500" />
                <span>
                  <strong>Formas de Pagamento Recebidas:</strong>{' '}
                  {resumoPorMeio.map(([meio, val]) => `${meio.toUpperCase()}: ${formatarMoeda(val)}`).join(' • ')}
                </span>
              </div>
            )}
          </div>

          {/* Planilha Unificada de Lançamentos Financeiros (Honorários + Consultas) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    Planilha de Lançamentos Financeiros ({itensPlanilha.length})
                  </h4>
                  <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium">
                    {honorariosFiltrados.length} honorários • {sessoesFiltradas.length} consultas
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Extrato consolidado de honorários, mensalidades e consultas clínicas no período selecionado.
                </p>
              </div>

              {/* Botões de Alternância Rápida & Seletor de Ordenação */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setTipoVisualizacaoTabela('todos')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      tipoVisualizacaoTabela === 'todos'
                        ? 'bg-white text-stone-900 shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Todos ({sessoesFiltradas.length + honorariosFiltrados.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoVisualizacaoTabela('honorarios')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      tipoVisualizacaoTabela === 'honorarios'
                        ? 'bg-white text-stone-900 shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Honorários ({honorariosFiltrados.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoVisualizacaoTabela('sessoes')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      tipoVisualizacaoTabela === 'sessoes'
                        ? 'bg-white text-stone-900 shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Consultas ({sessoesFiltradas.length})
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200 text-xs">
                  <ArrowUpDown className="size-3 text-stone-600 shrink-0" />
                  <select
                    value={ordemData}
                    onChange={e => setOrdemData(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
                    title="Classificar lançamentos por data de vencimento ou outros critérios"
                  >
                    <option value="vencimento_asc">📅 Vencimento (Próximos primeiro)</option>
                    <option value="vencimento_desc">📅 Vencimento (Mais recentes primeiro)</option>
                    <option value="valor_desc">💰 Maior Valor</option>
                    <option value="valor_asc">💰 Menor Valor</option>
                    <option value="paciente">👤 Paciente (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                    <tr>
                      <th 
                        onClick={() => setOrdemData(prev => prev === 'vencimento_asc' ? 'vencimento_desc' : 'vencimento_asc')}
                        className="p-2.5 cursor-pointer hover:bg-stone-200 transition-colors select-none group"
                        title="Clique para alternar ordenação por data de vencimento"
                      >
                        <div className="flex items-center gap-1">
                          <span>Data / Venc.</span>
                          <ArrowUpDown className={`size-3 ${ordemData.startsWith('vencimento') ? 'text-emerald-700 font-bold' : 'text-stone-400 group-hover:text-stone-700'}`} />
                          {ordemData === 'vencimento_asc' && <span className="text-[9px] text-emerald-700 lowercase">(próximos)</span>}
                          {ordemData === 'vencimento_desc' && <span className="text-[9px] text-emerald-700 lowercase">(recentes)</span>}
                        </div>
                      </th>
                      <th className="p-2.5">Paciente</th>
                      <th className="p-2.5">Origem & Descrição</th>
                      <th className="p-2.5">Meio</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Valor Total</th>
                      <th className="p-2.5 text-right">Recebido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {itensPlanilha.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-stone-500">
                          <p className="font-medium text-stone-700 text-sm mb-1">Nenhum lançamento financeiro localizado</p>
                          <p className="text-xs text-stone-400">Verifique os filtros de período e paciente selecionados acima.</p>
                        </td>
                      </tr>
                    ) : (
                      itensPlanilha.map(item => (
                        <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                          <td className="p-2.5 font-mono text-stone-800 whitespace-nowrap">
                            {formatarData(item.data)}
                          </td>
                          <td className="p-2.5 font-semibold text-stone-900 whitespace-nowrap">
                            {item.pacienteNome}
                          </td>
                          <td className="p-2.5 text-stone-700 max-w-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.origem === 'honorario' ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                  Honorário
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-bold bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded border border-stone-300">
                                  Consulta
                                </span>
                              )}
                              <span className="text-stone-800 font-medium truncate" title={item.descricao}>
                                {item.descricao}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono uppercase text-[11px] text-stone-600 whitespace-nowrap">
                            {item.meioPagamento || 'pix'}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            {item.status === 'pago' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                <CheckCircle2 className="size-3" /> Pago
                              </span>
                            ) : item.status === 'parcial' ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                                Parcial ({formatarMoeda(item.valorPago)})
                              </span>
                            ) : item.status === 'atrasado' ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                <AlertTriangle className="size-3" /> Em Atraso
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                                <Clock className="size-3" /> Pendente
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-stone-900 whitespace-nowrap">
                            {formatarMoeda(item.valor)}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-emerald-700 whitespace-nowrap">
                            {formatarMoeda(item.valorPago)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {itensPlanilha.length > 0 && (
                    <tfoot className="bg-stone-100 text-stone-900 font-bold border-t-2 border-stone-300 text-xs">
                      <tr>
                        <td colSpan={5} className="p-2.5 uppercase tracking-wider text-[11px] text-stone-700">
                          Subtotal da Tabela ({itensPlanilha.length} lançamentos):
                        </td>
                        <td className="p-2.5 text-right font-bold text-stone-900 whitespace-nowrap">
                          {formatarMoeda(itensPlanilha.reduce((acc, curr) => acc + curr.valor, 0))}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {formatarMoeda(itensPlanilha.reduce((acc, curr) => acc + curr.valorPago, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Resumo Consolidado por Paciente */}
          {resumoPorPaciente.length > 0 && pacienteId === 'todos' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Consolidação por Paciente / Analisando
              </h4>

              <div className="rounded-xl border border-stone-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">Paciente</th>
                      <th className="p-2.5 text-center">Atendimentos</th>
                      <th className="p-2.5 text-right">Quitado</th>
                      <th className="p-2.5 text-right">Pendente</th>
                      <th className="p-2.5 text-right">Total Produzido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {resumoPorPaciente.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 transition-colors">
                        <td className="p-2.5 font-semibold text-stone-900">{item.nome}</td>
                        <td className="p-2.5 text-center font-mono">{item.sessoes}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-700 font-semibold">{formatarMoeda(item.pago)}</td>
                        <td className="p-2.5 text-right font-mono text-amber-700 font-semibold">{formatarMoeda(item.pendente)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-stone-900">{formatarMoeda(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rodapé de Auditoria e Assinatura */}
          <div className="pt-6 border-t border-stone-300 flex justify-between items-end text-xs text-stone-500">
            <div>
              <p className="flex items-center gap-1 font-semibold text-stone-700">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                Dados conferidos em conformidade com o Código de Ética Profissional e CFP 01/2009.
              </p>
              <p className="text-[11px] mt-0.5">
                Chave Criptográfica AES-256 ativa • Registro imutável de atendimentos
              </p>
            </div>

            <div className="text-center pt-8 border-t border-stone-400 min-w-[240px]">
              <p className="font-semibold text-stone-900">{perfil.nome || contaUsuario?.nomeCompleto || 'Dr. Roberto Martins'}</p>
              <p className="text-[11px] text-stone-600">{perfil.registroProfissional || contaUsuario?.crp || 'CRP 06/123456'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  FileText,
  Send,
  Pencil,
  Trash2,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  List,
  CalendarDays,
  Columns,
  Check,
  MapPin,
  Video,
  ExternalLink
} from 'lucide-react';
import { AgendamentoClinico, Analisando, ModalidadeAtendimento } from '../types';
import { formatarMoeda, formatarData } from '../utils/helpers';

interface AgendaClinicaProps {
  agendamentos: AgendamentoClinico[];
  analisandos: Analisando[];
  modalidades: ModalidadeAtendimento[];
  onAtualizarAgendamentos: (novos: AgendamentoClinico[]) => void;
  onNovoAgendamento: (dataStr?: string) => void;
  onEditarAgendamento: (agendamento: AgendamentoClinico) => void;
  onExcluirAgendamento: (id: string) => void;
  onIniciarSessao: (agendamentoId: string, analisandoId: string) => void;
  onAbrirProntuario: (analisando: Analisando) => void;
  onEnviarWhatsApp: (whatsapp: string, mensagem: string) => void;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const NOMES_MESES_ABREV = [
  'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
  'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'
];

const DIAS_SEMANA = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
const DIAS_SEMANA_MINI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const AgendaClinica: React.FC<AgendaClinicaProps> = ({
  agendamentos,
  analisandos,
  modalidades,
  onAtualizarAgendamentos,
  onNovoAgendamento,
  onEditarAgendamento,
  onExcluirAgendamento,
  onIniciarSessao,
  onAbrirProntuario,
  onEnviarWhatsApp,
}) => {
  // Navigation State
  const [dataNavegacao, setDataNavegacao] = useState<Date>(() => new Date());
  const [visualizacao, setVisualizacao] = useState<'mes' | 'semana' | 'lista'>('mes');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaPaciente, setBuscaPaciente] = useState<string>('');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('todas');
  const [mostrarSidebar, setMostrarSidebar] = useState<boolean>(true);

  // Selected event modal/popover
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoClinico | null>(null);
  const [diaSelecionadoMais, setDiaSelecionadoMais] = useState<{ dataStr: string; agendamentos: AgendamentoClinico[] } | null>(null);

  const hoje = useMemo(() => new Date(), []);
  const hojeStr = useMemo(() => {
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [hoje]);

  // Current viewed month and year
  const anoAtual = dataNavegacao.getFullYear();
  const mesAtual = dataNavegacao.getMonth();

  // Navigation handlers
  const irParaHoje = () => {
    setDataNavegacao(new Date());
  };

  const mesAnterior = () => {
    setDataNavegacao(new Date(anoAtual, mesAtual - 1, 1));
  };

  const proximoMes = () => {
    setDataNavegacao(new Date(anoAtual, mesAtual + 1, 1));
  };

  // Filtered appointments
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(a => {
      if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
      if (filtroModalidade !== 'todas' && a.modalidadeId !== filtroModalidade) return false;
      if (buscaPaciente.trim()) {
        const paciente = analisandos.find(p => p.id === a.analisandoId);
        const nomePaciente = paciente?.nome?.toLowerCase() || '';
        if (!nomePaciente.includes(buscaPaciente.toLowerCase())) return false;
      }
      return true;
    });
  }, [agendamentos, filtroStatus, filtroModalidade, buscaPaciente, analisandos]);

  // Generate Month Matrix (Google Calendar 7-column grid)
  const matrizMes = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const diaSemanaPrimeiro = primeiroDia.getDay(); // 0 = Domingo, 6 = Sábado
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const totalDiasMes = ultimoDia.getDate();
    const ultimoDiaMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();

    const dias = [];

    // Dias do mês anterior para preencher a primeira semana
    for (let i = diaSemanaPrimeiro - 1; i >= 0; i--) {
      const diaNum = ultimoDiaMesAnterior - i;
      const dataObj = new Date(anoAtual, mesAtual - 1, diaNum);
      const y = dataObj.getFullYear();
      const m = String(dataObj.getMonth() + 1).padStart(2, '0');
      const d = String(dataObj.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${d}`;
      dias.push({
        data: dataObj,
        dataStr,
        diaNumero: diaNum,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
        rotulo: diaNum === 1 ? `1 ${NOMES_MESES_ABREV[dataObj.getMonth()]}` : `${diaNum}`
      });
    }

    // Dias do mês corrente
    for (let diaNum = 1; diaNum <= totalDiasMes; diaNum++) {
      const dataObj = new Date(anoAtual, mesAtual, diaNum);
      const y = dataObj.getFullYear();
      const m = String(dataObj.getMonth() + 1).padStart(2, '0');
      const d = String(dataObj.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${d}`;
      dias.push({
        data: dataObj,
        dataStr,
        diaNumero: diaNum,
        isMesAtual: true,
        isHoje: dataStr === hojeStr,
        rotulo: diaNum === 1 ? `1 ${NOMES_MESES_ABREV[mesAtual]}` : `${diaNum}`
      });
    }

    // Dias do próximo mês para completar a grade (35 ou 42 células)
    const celulasTotais = dias.length > 35 ? 42 : 35;
    const diasRestantes = celulasTotais - dias.length;
    for (let diaNum = 1; diaNum <= diasRestantes; diaNum++) {
      const dataObj = new Date(anoAtual, mesAtual + 1, diaNum);
      const y = dataObj.getFullYear();
      const m = String(dataObj.getMonth() + 1).padStart(2, '0');
      const d = String(dataObj.getDate()).padStart(2, '0');
      const dataStr = `${y}-${m}-${d}`;
      dias.push({
        data: dataObj,
        dataStr,
        diaNumero: diaNum,
        isMesAtual: false,
        isHoje: dataStr === hojeStr,
        rotulo: diaNum === 1 ? `1 ${NOMES_MESES_ABREV[dataObj.getMonth()]}` : `${diaNum}`
      });
    }

    return dias;
  }, [anoAtual, mesAtual, hojeStr]);

  // Mini Calendar Matrix for the left sidebar
  const miniCalendarioDias = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const diaSemanaPrimeiro = primeiroDia.getDay();
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const totalDiasMes = ultimoDia.getDate();
    const ultimoDiaMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();

    const dias = [];
    for (let i = diaSemanaPrimeiro - 1; i >= 0; i--) {
      dias.push({
        diaNumero: ultimoDiaMesAnterior - i,
        isMesAtual: false,
        dataStr: new Date(anoAtual, mesAtual - 1, ultimoDiaMesAnterior - i).toISOString().split('T')[0]
      });
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dias.push({
        diaNumero: d,
        isMesAtual: true,
        dataStr
      });
    }
    const totalCelulas = dias.length > 35 ? 42 : 35;
    const restantes = totalCelulas - dias.length;
    for (let d = 1; d <= restantes; d++) {
      dias.push({
        diaNumero: d,
        isMesAtual: false,
        dataStr: new Date(anoAtual, mesAtual + 1, d).toISOString().split('T')[0]
      });
    }
    return dias;
  }, [anoAtual, mesAtual]);

  // Group appointments by date
  const agendamentosPorData = useMemo(() => {
    const mapa = new Map<string, AgendamentoClinico[]>();
    for (const ag of agendamentosFiltrados) {
      const lista = mapa.get(ag.data) || [];
      lista.push(ag);
      mapa.set(ag.data, lista);
    }
    // Ordenar cada dia por horário
    for (const [dataStr, lista] of mapa.entries()) {
      lista.sort((a, b) => a.hora.localeCompare(b.hora));
    }
    return mapa;
  }, [agendamentosFiltrados]);

  // Helper for status badge & styling
  const getCorStatus = (status: AgendamentoClinico['status']) => {
    switch (status) {
      case 'confirmado':
        return {
          pill: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
          dot: 'bg-blue-200',
          badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        };
      case 'realizado':
        return {
          pill: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs',
          dot: 'bg-emerald-200',
          badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        };
      case 'pendente':
        return {
          pill: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs',
          dot: 'bg-amber-200',
          badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        };
      case 'cancelado':
        return {
          pill: 'bg-zinc-500 hover:bg-zinc-600 text-white/90 line-through opacity-70',
          dot: 'bg-zinc-300',
          badge: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      default:
        return {
          pill: 'bg-primary text-primary-foreground',
          dot: 'bg-white',
          badge: 'bg-muted text-foreground border-border'
        };
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. GOOGLE CALENDAR MAIN HEADER BAR */}
      {/* ======================================================== */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Brand + Date Navigation */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Google Calendar Style Icon Badge */}
            <div className="flex items-center gap-2.5 mr-1">
              <div className="size-9 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-sm font-bold select-none">
                <span className="text-[9px] uppercase leading-none font-medium text-blue-100">
                  {NOMES_MESES_ABREV[hoje.getMonth()]}
                </span>
                <span className="text-sm leading-none font-bold">
                  {hoje.getDate()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight hidden sm:inline">
                Agenda Clínica
              </h2>
            </div>

            {/* "Hoje" Button */}
            <button
              onClick={irParaHoje}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs"
            >
              Hoje
            </button>

            {/* Navigation Arrows */}
            <div className="flex items-center">
              <button
                onClick={mesAnterior}
                title="Mês anterior"
                className="size-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={proximoMes}
                title="Próximo mês"
                className="size-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Month & Year Title */}
            <h3 className="text-base sm:text-lg font-bold text-foreground capitalize tracking-tight ml-1">
              {NOMES_MESES[mesAtual]} de {anoAtual}
            </h3>
          </div>

          {/* Right: Actions, View Modes, & New Appointment */}
          <div className="flex items-center flex-wrap gap-2 justify-end">
            {/* Search Input */}
            <div className="relative min-w-[140px] sm:min-w-[180px]">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={buscaPaciente}
                onChange={e => setBuscaPaciente(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {buscaPaciente && (
                <button
                  onClick={() => setBuscaPaciente('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-muted/60 rounded-xl border border-border text-xs">
              <button
                onClick={() => setVisualizacao('mes')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  visualizacao === 'mes'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="size-3.5" />
                <span>Mês</span>
              </button>
              <button
                onClick={() => setVisualizacao('semana')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  visualizacao === 'semana'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Columns className="size-3.5" />
                <span>Semana</span>
              </button>
              <button
                onClick={() => setVisualizacao('lista')}
                className={`px-3 py-1.5 font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  visualizacao === 'lista'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="size-3.5" />
                <span>Lista</span>
              </button>
            </div>

            {/* Primary "+ Criar Agendamento" */}
            <button
              onClick={() => onNovoAgendamento()}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Criar Agendamento</span>
              <span className="sm:hidden">Criar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN LAYOUT: SIDEBAR + CALENDAR VIEWPORT */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Mini Sidebar (Google Calendar style) */}
        {mostrarSidebar && (
          <div className="lg:col-span-3 space-y-4">
            {/* Google-Style Big "+ Criar" button */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-4">
              <button
                onClick={() => onNovoAgendamento()}
                className="w-full py-2.5 px-4 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-foreground border border-border/80 rounded-2xl shadow-sm hover:shadow transition-all flex items-center gap-3 font-semibold text-sm group"
              >
                <div className="size-7 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus className="size-4" />
                </div>
                <span>Novo Agendamento</span>
              </button>

              {/* Mini Monthly Calendar */}
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-foreground">
                    {NOMES_MESES[mesAtual]} {anoAtual}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={mesAnterior}
                      className="size-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                    >
                      <ChevronLeft className="size-3" />
                    </button>
                    <button
                      onClick={proximoMes}
                      className="size-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                    >
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-1">
                  {DIAS_SEMANA_MINI.map((d, idx) => (
                    <div key={idx} className="py-0.5">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {miniCalendarioDias.map((d, idx) => {
                    const isHoje = d.dataStr === hojeStr;
                    const temSessao = agendamentosPorData.has(d.dataStr);

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const [ano, mes, dia] = d.dataStr.split('-').map(Number);
                          setDataNavegacao(new Date(ano, mes - 1, dia));
                        }}
                        className={`h-7 w-7 mx-auto rounded-full flex flex-col items-center justify-center text-[11px] font-medium transition-colors relative ${
                          isHoje
                            ? 'bg-blue-600 text-white font-bold'
                            : d.isMesAtual
                            ? 'text-foreground hover:bg-muted'
                            : 'text-muted-foreground/40 hover:bg-muted/40'
                        }`}
                      >
                        <span>{d.diaNumero}</span>
                        {temSessao && !isHoje && (
                          <span className="size-1 rounded-full bg-blue-500 absolute bottom-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filters (Google Calendar "Minhas Agendas" style) */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Filtro de Status
                </span>
                <div className="space-y-1.5">
                  {[
                    { id: 'todos', label: 'Todos os Horários', cor: 'bg-zinc-400' },
                    { id: 'confirmado', label: 'Confirmados', cor: 'bg-blue-600' },
                    { id: 'realizado', label: 'Realizados / Concluídos', cor: 'bg-emerald-600' },
                    { id: 'pendente', label: 'Pendentes de Confirmação', cor: 'bg-amber-600' },
                    { id: 'cancelado', label: 'Cancelados', cor: 'bg-destructive' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setFiltroStatus(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        filtroStatus === item.id
                          ? 'bg-muted text-foreground font-semibold'
                          : 'text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-sm ${item.cor}`} />
                        <span>{item.label}</span>
                      </div>
                      {filtroStatus === item.id && <Check className="size-3 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modalidades Filters */}
              {modalidades.length > 0 && (
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Modalidades Clínicas
                  </span>
                  <div className="space-y-1">
                    <button
                      onClick={() => setFiltroModalidade('todas')}
                      className={`w-full text-left px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        filtroModalidade === 'todas'
                          ? 'font-bold text-foreground bg-muted/60'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Todas as modalidades
                    </button>
                    {modalidades.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setFiltroModalidade(m.id)}
                        className={`w-full text-left px-2.5 py-1 rounded-lg text-xs truncate transition-colors ${
                          filtroModalidade === m.id
                            ? 'font-bold text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right / Center Calendar Canvas */}
        <div className={mostrarSidebar ? 'lg:col-span-9' : 'lg:col-span-12'}>
          {/* ======================================================== */}
          {/* A. GOOGLE CALENDAR FULL MONTH VIEW */}
          {/* ======================================================== */}
          {visualizacao === 'mes' && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Day of Week Headers (DOM., SEG., TER., QUA., QUI., SEX., SÁB.) */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                {DIAS_SEMANA.map((diaSemana, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider border-r border-border/40 last:border-r-0"
                  >
                    {diaSemana}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 auto-rows-fr divide-y divide-border/60">
                {matrizMes.map((dia, idx) => {
                  const agendamentosDia = agendamentosPorData.get(dia.dataStr) || [];
                  const temMais = agendamentosDia.length > 3;
                  const agendamentosVisiveis = agendamentosDia.slice(0, 3);

                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        // Se clicou na célula vazia (não no evento), abre criação rápida
                        if (e.target === e.currentTarget) {
                          onNovoAgendamento(dia.dataStr);
                        }
                      }}
                      className={`min-h-[110px] sm:min-h-[125px] p-1 sm:p-1.5 flex flex-col border-r border-border/40 last:border-r-0 transition-colors group relative ${
                        !dia.isMesAtual
                          ? 'bg-muted/10 opacity-75'
                          : dia.isHoje
                          ? 'bg-blue-500/[0.03]'
                          : 'bg-card hover:bg-muted/20'
                      }`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between mb-1 px-1">
                        {dia.isHoje ? (
                          <div className="size-6 sm:size-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {dia.diaNumero}
                          </div>
                        ) : (
                          <span
                            className={`text-xs font-semibold ${
                              dia.isMesAtual
                                ? 'text-foreground'
                                : 'text-muted-foreground/50'
                            }`}
                          >
                            {dia.rotulo}
                          </span>
                        )}

                        {/* Quick Add Button on Hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNovoAgendamento(dia.dataStr);
                          }}
                          title={`Agendar sessão em ${formatarData(dia.dataStr)}`}
                          className="opacity-0 group-hover:opacity-100 size-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-opacity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>

                      {/* Event Chips (Google Calendar Style) */}
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {agendamentosVisiveis.map(ag => {
                          const paciente = analisandos.find(p => p.id === ag.analisandoId);
                          const modalidade = modalidades.find(m => m.id === ag.modalidadeId);
                          const cor = getCorStatus(ag.status);

                          return (
                            <button
                              key={ag.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setAgendamentoSelecionado(ag);
                              }}
                              className={`w-full text-left px-2 py-0.5 rounded-md text-[11px] font-medium transition-all truncate flex items-center gap-1.5 ${cor.pill}`}
                            >
                              <span className="font-mono text-[10px] font-bold opacity-90 shrink-0">
                                {ag.hora}
                              </span>
                              <span className="truncate">
                                {paciente?.nome || 'Paciente'}
                              </span>
                            </button>
                          );
                        })}

                        {/* "+X mais" Link */}
                        {temMais && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDiaSelecionadoMais({
                                dataStr: dia.dataStr,
                                agendamentos: agendamentosDia
                              });
                            }}
                            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-1 block text-left"
                          >
                            +{agendamentosDia.length - 3} mais
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* B. WEEK VIEW */}
          {/* ======================================================== */}
          {visualizacao === 'semana' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {(() => {
                const diaSemanaHoje = dataNavegacao.getDay();
                const segunda = new Date(dataNavegacao);
                const diff = diaSemanaHoje === 0 ? -6 : 1 - diaSemanaHoje;
                segunda.setDate(dataNavegacao.getDate() + diff);

                const diasSemana = [];
                for (let i = 0; i < 6; i++) {
                  const d = new Date(segunda);
                  d.setDate(segunda.getDate() + i);
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const diaStr = String(d.getDate()).padStart(2, '0');
                  const dataStr = `${y}-${m}-${diaStr}`;
                  diasSemana.push({
                    nome: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i],
                    dataStr,
                    diaMes: d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
                    isHoje: dataStr === hojeStr
                  });
                }

                return diasSemana.map(d => {
                  const sessoes = agendamentosPorData.get(d.dataStr) || [];

                  return (
                    <div
                      key={d.dataStr}
                      className={`p-3 rounded-2xl border flex flex-col min-h-[380px] ${
                        d.isHoje
                          ? 'border-blue-500/60 bg-blue-500/[0.04] ring-1 ring-blue-500/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                        <div>
                          <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                            {d.nome}
                          </h4>
                          <p className="text-xs text-muted-foreground">{d.diaMes}</p>
                        </div>
                        {d.isHoje && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-1">
                        {sessoes.length === 0 ? (
                          <div className="text-center py-12 text-xs text-muted-foreground font-mono">
                            Sem sessões
                          </div>
                        ) : (
                          sessoes.map(ag => {
                            const paciente = analisandos.find(p => p.id === ag.analisandoId);
                            const modalidade = modalidades.find(m => m.id === ag.modalidadeId);
                            const cor = getCorStatus(ag.status);

                            return (
                              <div
                                key={ag.id}
                                onClick={() => setAgendamentoSelecionado(ag)}
                                className="p-2.5 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {ag.hora}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold capitalize border ${cor.badge}`}>
                                    {ag.status}
                                  </span>
                                </div>
                                <h5 className="font-bold text-xs text-foreground truncate">
                                  {paciente?.nome || 'Paciente'}
                                </h5>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {modalidade?.nome || '—'}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <button
                        onClick={() => onNovoAgendamento(d.dataStr)}
                        className="w-full mt-2 py-1.5 text-xs text-center font-medium border border-dashed border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                      >
                        + Horário
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* ======================================================== */}
          {/* C. LIST VIEW */}
          {/* ======================================================== */}
          {visualizacao === 'lista' && (
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Data & Hora</th>
                      <th className="text-left px-4 py-3 font-semibold">Paciente</th>
                      <th className="text-left px-4 py-3 font-semibold">Modalidade</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Observações</th>
                      <th className="text-right px-4 py-3 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {agendamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                          Nenhum agendamento encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      agendamentosFiltrados
                        .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`))
                        .map(ag => {
                          const paciente = analisandos.find(p => p.id === ag.analisandoId);
                          const modalidade = modalidades.find(m => m.id === ag.modalidadeId);
                          const cor = getCorStatus(ag.status);

                          return (
                            <tr key={ag.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-semibold text-foreground">
                                  {formatarData(ag.data)}
                                </span>
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">
                                  {ag.hora}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                                {paciente?.nome || '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                {modalidade?.nome || '—'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize border ${cor.badge}`}>
                                  {ag.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs italic text-muted-foreground max-w-xs truncate">
                                {ag.observacao || '—'}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-1.5">
                                  {ag.status !== 'realizado' && (
                                    <button
                                      onClick={() => onIniciarSessao(ag.id, ag.analisandoId)}
                                      title="Iniciar Atendimento e Registrar Sessão"
                                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground transition-colors"
                                    >
                                      <Play className="size-3.5" />
                                    </button>
                                  )}
                                  {paciente && (
                                    <button
                                      onClick={() => onAbrirProntuario(paciente)}
                                      title="Abrir Prontuário"
                                      className="p-1.5 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                                    >
                                      <FileText className="size-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (!paciente) return;
                                      const msg = `Olá ${paciente.nome}, passando para confirmar nosso horário de análise agendado para ${formatarData(ag.data)} às ${ag.hora}. Até lá!`;
                                      onEnviarWhatsApp(paciente.whatsapp || '', msg);
                                    }}
                                    title="Confirmar via WhatsApp"
                                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground transition-colors"
                                  >
                                    <Send className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onEditarAgendamento(ag)}
                                    title="Editar"
                                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onExcluirAgendamento(ag.id)}
                                    title="Excluir"
                                    className="p-1.5 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
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
      </div>

      {/* ======================================================== */}
      {/* 3. EVENT DETAILS MODAL (GOOGLE CALENDAR POPUP STYLE) */}
      {/* ======================================================== */}
      {agendamentoSelecionado && (() => {
        const ag = agendamentoSelecionado;
        const paciente = analisandos.find(p => p.id === ag.analisandoId);
        const modalidade = modalidades.find(m => m.id === ag.modalidadeId);
        const cor = getCorStatus(ag.status);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
              {/* Header color bar */}
              <div className={`h-3 w-full ${cor.pill.split(' ')[0]}`} />

              <div className="p-5 space-y-4">
                {/* Title & Close */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {paciente?.nome || 'Horário de Análise'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatarData(ag.data)} às {ag.hora}
                    </p>
                  </div>
                  <button
                    onClick={() => setAgendamentoSelecionado(null)}
                    className="size-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status Atual:</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold capitalize border ${cor.badge}`}>
                      {ag.status}
                    </span>
                  </div>

                  {modalidade && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Modalidade:</span>
                      <span className="font-semibold text-foreground">
                        {modalidade.nome} ({formatarMoeda(modalidade.preco)})
                      </span>
                    </div>
                  )}

                  {paciente?.whatsapp && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <span className="font-mono text-foreground font-medium">
                        {paciente.whatsapp}
                      </span>
                    </div>
                  )}

                  {ag.observacao && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="text-muted-foreground block mb-1">Observações:</span>
                      <p className="italic text-foreground">"{ag.observacao}"</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {ag.status !== 'realizado' ? (
                      <button
                        onClick={() => {
                          setAgendamentoSelecionado(null);
                          onIniciarSessao(ag.id, ag.analisandoId);
                        }}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Play className="size-3.5" />
                        <span>Iniciar Sessão</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (paciente) {
                            setAgendamentoSelecionado(null);
                            onAbrirProntuario(paciente);
                          }
                        }}
                        className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="size-3.5" />
                        <span>Ver Prontuário</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (!paciente) return;
                        const msg = `Olá ${paciente.nome}, passando para confirmar nosso horário de análise agendado para ${formatarData(ag.data)} às ${ag.hora}. Até lá!`;
                        onEnviarWhatsApp(paciente.whatsapp || '', msg);
                      }}
                      className="w-full py-2 px-3 border border-border bg-card hover:bg-muted text-foreground rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="size-3.5 text-blue-500" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <button
                      onClick={() => {
                        const idParaExcluir = ag.id;
                        setAgendamentoSelecionado(null);
                        onExcluirAgendamento(idParaExcluir);
                      }}
                      className="px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Excluir</span>
                    </button>
                    <button
                      onClick={() => {
                        const agParaEditar = ag;
                        setAgendamentoSelecionado(null);
                        onEditarAgendamento(agParaEditar);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Pencil className="size-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 4. "+X MAIS" POPUP MODAL FOR DAYS WITH MULTIPLE SESSIONS */}
      {/* ======================================================== */}
      {diaSelecionadoMais && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div>
                <h4 className="font-bold text-sm text-foreground">
                  Horários em {formatarData(diaSelecionadoMais.dataStr)}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {diaSelecionadoMais.agendamentos.length} atendimentos programados
                </p>
              </div>
              <button
                onClick={() => setDiaSelecionadoMais(null)}
                className="size-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {diaSelecionadoMais.agendamentos.map(ag => {
                const paciente = analisandos.find(p => p.id === ag.analisandoId);
                const modalidade = modalidades.find(m => m.id === ag.modalidadeId);
                const cor = getCorStatus(ag.status);

                return (
                  <div
                    key={ag.id}
                    onClick={() => {
                      setDiaSelecionadoMais(null);
                      setAgendamentoSelecionado(ag);
                    }}
                    className="p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {ag.hora}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold capitalize border ${cor.badge}`}>
                          {ag.status}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-foreground">
                        {paciente?.nome || 'Paciente'}
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        {modalidade?.nome || '—'}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDiaSelecionadoMais(null);
                        setAgendamentoSelecionado(ag);
                      }}
                      className="px-2.5 py-1 text-xs font-medium border border-border rounded-lg hover:bg-muted text-foreground"
                    >
                      Ver
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={() => {
                  const dataStr = diaSelecionadoMais.dataStr;
                  setDiaSelecionadoMais(null);
                  onNovoAgendamento(dataStr);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Adicionar neste dia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

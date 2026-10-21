import React, { useState, useMemo } from 'react';
import { 
  Analisando, 
  SessaoClinica, 
  ModalidadeAtendimento, 
  Honorario, 
  ComplementoSessao,
  UsuarioConta 
} from '../types';
import { 
  formatarMoeda, 
  formatarData, 
  formatarDataHora, 
  diferencaDias, 
  formatarTelefone, 
  formatarCPF 
} from '../utils/helpers';
import { Card } from './ui-compact';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  X, 
  History, 
  Send, 
  Plus, 
  Pencil, 
  Search, 
  Filter, 
  Check, 
  Volume2, 
  Copy, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  FileEdit,
  User,
  MapPin,
  Phone,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProntuarioModalProps {
  analisando: Analisando;
  sessoes: SessaoClinica[];
  modalidades: ModalidadeAtendimento[];
  honorarios?: Honorario[];
  contaUsuario?: UsuarioConta | null;
  onFechar: () => void;
  onAtualizarObservacoes: (novasObs: string) => void;
  onAtualizarSessoes: (novasSessoes: SessaoClinica[]) => void;
  onAbrirMensagem: (analisando: Analisando) => void;
  onNovaSessaoRapida?: (analisandoId: string) => void;
  onEditarPaciente?: (analisando: Analisando) => void;
}

export default function ProntuarioModal({
  analisando,
  sessoes,
  modalidades,
  honorarios = [],
  contaUsuario,
  onFechar,
  onAtualizarObservacoes,
  onAtualizarSessoes,
  onAbrirMensagem,
  onNovaSessaoRapida,
  onEditarPaciente
}: ProntuarioModalProps) {
  // Aba padrão: 'historico' (área principal requerida pelo usuário)
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'resumo' | 'cadastro' | 'financeiro' | 'comunicacao'>('historico');

  // Observações gerais da demanda
  const [observacoes, setObservacoes] = useState(analisando.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [sucessoSalvarObs, setSucessoSalvarObs] = useState(false);

  // Filtros de busca no Histórico de Sessões
  const [termoBuscaSessao, setTermoBuscaSessao] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Sessão expandida para visualização de conteúdo completo e complementos
  const [sessaoExpandidaId, setSessaoExpandidaId] = useState<string | null>(null);

  // Estado para inserção de novo complemento / adendo clínico
  const [sessaoIdAdicionandoComplemento, setSessaoIdAdicionandoComplemento] = useState<string | null>(null);
  const [textoComplemento, setTextoComplemento] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estatísticas do paciente
  const sessoesPaciente = useMemo(() => {
    return sessoes
      .filter(s => s.analisandoId === analisando.id)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [analisando.id, sessoes]);

  const stats = useMemo(() => {
    const totalPago = sessoesPaciente
      .filter(s => s.pagamentoStatus === 'pago')
      .reduce((sum, s) => sum + s.valorCobrado, 0) +
      sessoesPaciente
        .filter(s => s.pagamentoStatus === 'parcial')
        .reduce((sum, s) => sum + (s.valorPago || 0), 0);

    const mediaValor = sessoesPaciente.length
      ? sessoesPaciente.reduce((sum, s) => sum + s.valorCobrado, 0) / sessoesPaciente.length
      : 0;

    const ultimaSessao = sessoesPaciente[0];
    const diasSemSessao = ultimaSessao ? diferencaDias(ultimaSessao.data) : null;

    const proximaSessao = sessoesPaciente
      .map(s => s.proximaSessaoData)
      .filter(Boolean)
      .sort()[0];

    const totalCobrado = sessoesPaciente.reduce((sum, s) => sum + s.valorCobrado, 0);
    const saldoAberto = Math.max(0, totalCobrado - totalPago);

    return {
      totalSessoes: sessoesPaciente.length,
      totalPago,
      totalCobrado,
      saldoAberto,
      mediaValor,
      ultimaSessao,
      diasSemSessao,
      proximaSessao
    };
  }, [sessoesPaciente]);

  // Filtro inteligente do histórico de sessões
  const sessoesFiltradas = useMemo(() => {
    return sessoesPaciente.filter(s => {
      // 1. Filtro por período
      if (filtroDataInicio && s.data < filtroDataInicio) return false;
      if (filtroDataFim && s.data > filtroDataFim) return false;

      // 2. Busca por palavra-chave no registro clínico, transcrição ou complementos
      if (termoBuscaSessao.trim()) {
        const busca = termoBuscaSessao.toLowerCase();
        const textoNotas = (s.notasSessao || '').toLowerCase();
        const textoTranscricao = (s.transcricao || '').toLowerCase();
        const textoComplementos = (s.complementos || []).map(c => c.texto).join(' ').toLowerCase();
        return textoNotas.includes(busca) || textoTranscricao.includes(busca) || textoComplementos.includes(busca);
      }

      return true;
    });
  }, [sessoesPaciente, termoBuscaSessao, filtroDataInicio, filtroDataFim]);

  const handleSalvarObservacoes = () => {
    setSalvandoObs(true);
    setSucessoSalvarObs(false);
    setTimeout(() => {
      onAtualizarObservacoes(observacoes);
      setSalvandoObs(false);
      setSucessoSalvarObs(true);
      setTimeout(() => setSucessoSalvarObs(false), 3000);
    }, 300);
  };

  // Adiciona um complemento sem sobrescrever o conteúdo original da sessão
  const handleAdicionarComplemento = (sessaoId: string) => {
    if (!textoComplemento.trim()) return;

    const autor = contaUsuario?.nomeCompleto || 'Profissional Responsável';
    const autorId = contaUsuario?.id;

    const novoComplemento: ComplementoSessao = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessaoId,
      autorNome: autor,
      autorId,
      criadoEm: new Date().toISOString(),
      texto: textoComplemento.trim()
    };

    const sessoesAtualizadas = sessoes.map(s => {
      if (s.id === sessaoId) {
        return {
          ...s,
          complementos: [...(s.complementos || []), novoComplemento]
        };
      }
      return s;
    });

    onAtualizarSessoes(sessoesAtualizadas);
    setTextoComplemento('');
    setSessaoIdAdicionandoComplemento(null);
  };

  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Cabeçalho do Prontuário */}
        <div className="gradient-emerald text-primary-foreground px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold truncate">{analisando.nome}</h2>
              {analisando.nomeSocial && (
                <span className="text-xs opacity-90 italic">({analisando.nomeSocial})</span>
              )}
              {analisando.vip && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full shadow-sm shrink-0">
                  Caso Prioritário
                </span>
              )}
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
                Status: {analisando.status}
              </span>
            </div>

            <p className="text-xs opacity-90 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span>{analisando.whatsapp ? formatarTelefone(analisando.whatsapp) : 'Sem WhatsApp'}</span>
              <span>·</span>
              <span>{analisando.email || 'Sem e-mail'}</span>
              <span>·</span>
              <span>Início do acompanhamento: {formatarData(analisando.criadoEm)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNovaSessaoRapida && (
              <button
                type="button"
                onClick={() => onNovaSessaoRapida(analisando.id)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white text-emerald-900 hover:bg-white/90 shadow-sm transition-all cursor-pointer"
                title="Iniciar e registrar nova sessão"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Nova Sessão</span>
              </button>
            )}

            {onEditarPaciente && (
              <button
                type="button"
                onClick={() => onEditarPaciente(analisando)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-primary-foreground transition-colors shadow-sm cursor-pointer"
                title="Editar dados cadastrais completos"
              >
                <Pencil className="size-3.5" />
                <span className="hidden sm:inline">Editar Cadastro</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFechar}
              className="rounded-full p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar prontuário"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Abas do Prontuário Clínico */}
        <div className="flex border-b border-border bg-muted/40 px-3 sm:px-6 overflow-x-auto shrink-0 scrollbar-none gap-1 py-1.5">
          <button
            type="button"
            onClick={() => setAbaAtiva('historico')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              abaAtiva === 'historico'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <History className="size-4" />
            <span>Histórico de Sessões ({sessoesPaciente.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('resumo')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              abaAtiva === 'resumo'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <FileText className="size-4" />
            <span>Resumo Clínico</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('cadastro')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              abaAtiva === 'cadastro'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <User className="size-4" />
            <span>Ficha Cadastral</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('financeiro')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              abaAtiva === 'financeiro'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <DollarSign className="size-4" />
            <span>Financeiro</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('comunicacao')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
              abaAtiva === 'comunicacao'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <MessageSquare className="size-4" />
            <span>Comunicação & Mensagens</span>
          </button>
        </div>

        {/* Área Principal de Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ======================================================== */}
          {/* ABA 1: HISTÓRICO DE SESSÕES (ÁREA PRINCIPAL DE LEITURA) */}
          {/* ======================================================== */}
          {abaAtiva === 'historico' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Barra de Filtros e Busca */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={termoBuscaSessao}
                    onChange={e => setTermoBuscaSessao(e.target.value)}
                    placeholder="Buscar por termo clínico, escuta ou evolução..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-card text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">De:</span>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={e => setFiltroDataInicio(e.target.value)}
                      className="h-9 px-2 rounded-xl border border-border bg-card text-xs text-foreground"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-medium">Até:</span>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={e => setFiltroDataFim(e.target.value)}
                      className="h-9 px-2 rounded-xl border border-border bg-card text-xs text-foreground"
                    />
                  </div>

                  {(termoBuscaSessao || filtroDataInicio || filtroDataFim) && (
                    <button
                      type="button"
                      onClick={() => {
                        setTermoBuscaSessao('');
                        setFiltroDataInicio('');
                        setFiltroDataFim('');
                      }}
                      className="text-xs text-primary hover:underline px-2 py-1 font-semibold"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Lista Ordenada da Mais Recente para a Mais Antiga */}
              {sessoesFiltradas.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card space-y-3">
                  <FileText className="size-10 text-muted-foreground mx-auto opacity-50" />
                  <h4 className="text-sm font-bold text-foreground">Nenhuma sessão encontrada</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {sessoesPaciente.length === 0
                      ? 'Nenhum atendimento clínico foi registrado ainda para este paciente.'
                      : 'Nenhuma sessão corresponde aos filtros e termos de busca aplicados.'}
                  </p>
                  {onNovaSessaoRapida && (
                    <button
                      type="button"
                      onClick={() => onNovaSessaoRapida(analisando.id)}
                      className="mt-2 px-4 py-2 text-xs font-bold text-primary-foreground gradient-emerald rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      Registrar Nova Sessão
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {sessoesFiltradas.map((sessao, index) => {
                    const modalidade = modalidades.find(m => m.id === sessao.modalidadeId);
                    const estaExpandida = sessaoExpandidaId === sessao.id || index === 0; // Primeira sessão sempre aberta para leitura
                    const temAudio = Boolean(sessao.audioUrl);
                    const temTranscricao = Boolean(sessao.transcricao);
                    const complementos = sessao.complementos || [];

                    return (
                      <Card
                        key={sessao.id}
                        className="p-4 sm:p-5 border-border/80 bg-card hover:border-primary/40 transition-all space-y-4"
                      >
                        {/* Linha Superior: Data, Modalidade, Status Financeiro e Ações */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                              {formatarData(sessao.data)} {sessao.hora ? `às ${sessao.hora}` : ''}
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {modalidade?.nome || 'Atendimento Clínico'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatarMoeda(sessao.valorCobrado)})
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                sessao.pagamentoStatus === 'pago'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : sessao.pagamentoStatus === 'parcial'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {sessao.pagamentoStatus} ({sessao.meioPagamento})
                            </span>
                            {temTranscricao && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                <Sparkles className="size-2.5" />
                                Transcrição Salva
                              </span>
                            )}
                            {temAudio && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                <Volume2 className="size-2.5" />
                                Áudio
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setSessaoExpandidaId(estaExpandida ? null : sessao.id)}
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <span>{estaExpandida ? 'Recolher' : 'Ler Completo'}</span>
                              {estaExpandida ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Conteúdo Clínico Original (Imutável e Distinto) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <FileText className="size-3.5 text-primary" />
                              Registro Clínico Original (Confidencial)
                            </span>
                            {(sessao.notasSessao || sessao.transcricao) && (
                              <button
                                type="button"
                                onClick={() => copiarTexto(sessao.notasSessao || sessao.transcricao || '', sessao.id)}
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium cursor-pointer"
                                title="Copiar notas do atendimento"
                              >
                                {copiadoId === sessao.id ? (
                                  <>
                                    <Check className="size-3 text-emerald-600" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                            {sessao.notasSessao ? (
                              sessao.notasSessao
                            ) : sessao.transcricao ? (
                              <div className="space-y-1.5">
                                <span className="text-[11px] font-bold uppercase text-primary flex items-center gap-1">
                                  <Sparkles className="size-3" />
                                  Transcrição Salva da Sessão:
                                </span>
                                <div>{sessao.transcricao}</div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Nenhum texto clínico registrado nesta sessão.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bloco de Áudio e Transcrição Salva no Prontuário */}
                        {(temAudio || temTranscricao) && estaExpandida && (
                          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                <Volume2 className="size-3.5" />
                                Transcrição & Áudio Salvos no Prontuário
                              </span>
                            </div>

                            {/* Player de Áudio Nativo */}
                            {temAudio && (
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                  Gravação de Voz da Sessão:
                                </span>
                                <audio
                                  controls
                                  src={sessao.audioUrl}
                                  className="w-full h-9 rounded-lg"
                                />
                              </div>
                            )}

                            {/* Transcrição de Fala */}
                            {temTranscricao && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-primary uppercase font-bold flex items-center gap-1">
                                    <Sparkles className="size-3" />
                                    Transcrição Completa da Fala:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copiarTexto(sessao.transcricao || '', `transc_${sessao.id}`)}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                                  >
                                    <Copy className="size-3" />
                                    <span>Copiar Transcrição</span>
                                  </button>
                                </div>
                                <div className="p-3 rounded-lg bg-card border border-border text-xs text-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                                  {sessao.transcricao}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Seção de Complementos / Adendos Clínicos */}
                        {estaExpandida && (
                          <div className="space-y-3 pt-2 border-t border-border/60">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <FileEdit className="size-3.5 text-primary" />
                                Complementos e Adendos da Sessão ({complementos.length})
                              </span>

                              {sessaoIdAdicionandoComplemento !== sessao.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSessaoIdAdicionandoComplemento(sessao.id);
                                    setTextoComplemento('');
                                  }}
                                  className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="size-3" />
                                  <span>Adicionar Complemento</span>
                                </button>
                              )}
                            </div>

                            {/* Lista de Complementos Existentes */}
                            {complementos.length > 0 && (
                              <div className="space-y-2">
                                {complementos.map(comp => (
                                  <div
                                    key={comp.id}
                                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300 font-semibold">
                                      <span className="flex items-center gap-1">
                                        <UserCheck className="size-3" />
                                        Autor: {comp.autorNome}
                                      </span>
                                      <span>{formatarDataHora(comp.criadoEm)}</span>
                                    </div>
                                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                                      {comp.texto}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Formulário para Inserir Novo Complemento */}
                            {sessaoIdAdicionandoComplemento === sessao.id && (
                              <div className="p-3.5 rounded-xl border border-primary/30 bg-card space-y-2.5 animate-in fade-in">
                                <label className="text-xs font-bold text-foreground block">
                                  Novo Adendo / Complemento Clínico (Não sobrescreve o registro original)
                                </label>
                                <textarea
                                  rows={3}
                                  value={textoComplemento}
                                  onChange={e => setTextoComplemento(e.target.value)}
                                  placeholder="Digite observações complementares, insights pós-sessão ou relatórios adicionais..."
                                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSessaoIdAdicionandoComplemento(null)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-muted-foreground"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdicionarComplemento(sessao.id)}
                                    disabled={!textoComplemento.trim()}
                                    className="px-3 py-1.5 text-xs font-bold text-primary-foreground gradient-emerald rounded-lg shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
                                  >
                                    Salvar Adendo com Minha Autoria
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: RESUMO CLÍNICO */}
          {/* ======================================================== */}
          {abaAtiva === 'resumo' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-muted/40 border-border/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-semibold uppercase">
                    <Clock className="size-3.5 text-primary" />
                    Sessões Realizadas
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stats.totalSessoes}</div>
                </Card>

                <Card className="p-4 bg-muted/40 border-border/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-semibold uppercase">
                    <DollarSign className="size-3.5 text-primary" />
                    Total Investido
                  </div>
                  <div className="text-2xl font-bold text-foreground">{formatarMoeda(stats.totalPago)}</div>
                </Card>

                <Card className="p-4 bg-muted/40 border-border/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-semibold uppercase">
                    <FileText className="size-3.5 text-primary" />
                    Média por Sessão
                  </div>
                  <div className="text-2xl font-bold text-foreground">{formatarMoeda(stats.mediaValor)}</div>
                </Card>

                <Card className="p-4 bg-muted/40 border-border/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1 font-semibold uppercase">
                    <Calendar className="size-3.5 text-primary" />
                    Ausência
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stats.diasSemSessao !== null ? `${stats.diasSemSessao} dias` : '—'}
                  </div>
                </Card>
              </div>

              {/* Demanda Analítica & Observações Gerais */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    Demanda Analítica, Hipóteses & Queixa Inicial (Confidencial)
                  </label>
                  <button
                    type="button"
                    onClick={handleSalvarObservacoes}
                    disabled={salvandoObs}
                    className="text-xs px-3.5 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {salvandoObs ? 'Salvando...' : 'Salvar Nota Geral'}
                  </button>
                </div>

                {sucessoSalvarObs && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>Notas gerais do paciente salvas com segurança no prontuário!</span>
                  </div>
                )}

                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={8}
                  placeholder="Descreva a queixa que motivou o paciente, história pregressa relevante, estrutura clínica, sintomas e considerações gerais..."
                  className="w-full rounded-2xl border border-border bg-card p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                />
              </div>

              {/* Tags Clínicas */}
              {analisando.tags && analisando.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Tags do Setting:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analisando.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-medium border border-border/60"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: FICHA CADASTRAL COMPLETA */}
          {/* ======================================================== */}
          {abaAtiva === 'cadastro' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  Dados Cadastrais do Paciente
                </h3>
                {onEditarPaciente && (
                  <button
                    type="button"
                    onClick={() => onEditarPaciente(analisando)}
                    className="px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Pencil className="size-3.5" />
                    Editar Estes Dados
                  </button>
                )}
              </div>

              {/* Seção 1: Identificação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Nome Completo:</span>
                  <p className="text-sm font-bold text-foreground">{analisando.nome}</p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Nome Social:</span>
                  <p className="text-sm font-bold text-foreground">{analisando.nomeSocial || '—'}</p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Nascimento:</span>
                  <p className="text-sm font-bold text-foreground">{formatarData(analisando.nascimento)}</p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">CPF do Paciente:</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {analisando.cpf ? formatarCPF(analisando.cpf) : 'Não informado'}
                  </p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Situação Setting:</span>
                  <p className="text-sm font-bold text-foreground capitalize">{analisando.status}</p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Caso Prioritário:</span>
                  <p className="text-sm font-bold text-foreground">{analisando.vip ? 'Sim (VIP)' : 'Não'}</p>
                </div>
              </div>

              {/* Seção 2: Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">WhatsApp / Celular:</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {analisando.whatsapp ? formatarTelefone(analisando.whatsapp) : 'Não informado'}
                  </p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Telefone Fixo / Recado:</span>
                  <p className="text-sm font-bold text-foreground font-mono">
                    {analisando.telefone ? formatarTelefone(analisando.telefone) : '—'}
                  </p>
                </div>

                <div className="space-y-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">E-mail:</span>
                  <p className="text-sm font-bold text-foreground">{analisando.email || '—'}</p>
                </div>
              </div>

              {/* Seção 3: Endereço */}
              <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border/60">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Endereço Residencial:</span>
                <p className="text-sm text-foreground">
                  {analisando.logradouro
                    ? `${analisando.logradouro}${analisando.numero ? `, ${analisando.numero}` : ''}${analisando.complemento ? ` (${analisando.complemento})` : ''} - ${analisando.bairro || ''}, ${analisando.cidade} - ${analisando.uf || ''} (CEP: ${analisando.cep || '—'})`
                    : (analisando.endereco || `${analisando.cidade || 'Não informada'}`)
                  }
                </p>
              </div>

              {/* Seção 4: Responsável Legal */}
              {analisando.temResponsavel && (
                <div className="space-y-2 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase block">
                    Responsável Legal (Menor / Tutela)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <strong className="block text-muted-foreground">Nome:</strong>
                      <span>{analisando.responsavelNome || '—'}</span>
                    </div>
                    <div>
                      <strong className="block text-muted-foreground">Parentesco:</strong>
                      <span>{analisando.responsavelParentesco || '—'}</span>
                    </div>
                    <div>
                      <strong className="block text-muted-foreground">Contato:</strong>
                      <span>{analisando.responsavelContato ? formatarTelefone(analisando.responsavelContato) : '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 4: FINANCEIRO DO PACIENTE */}
          {/* ======================================================== */}
          {abaAtiva === 'financeiro' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Balanço Rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-muted/40 border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                    Total Faturado em Sessões
                  </span>
                  <div className="text-xl font-bold text-foreground">{formatarMoeda(stats.totalCobrado)}</div>
                </Card>

                <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase block mb-1">
                    Total Efetivamente Pago
                  </span>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatarMoeda(stats.totalPago)}</div>
                </Card>

                <Card className="p-4 bg-rose-500/10 border-rose-500/30">
                  <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold uppercase block mb-1">
                    Saldo em Aberto / Pendente
                  </span>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-300">{formatarMoeda(stats.saldoAberto)}</div>
                </Card>
              </div>

              {/* Tabela de Lançamentos das Sessões */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Histórico de Cobranças dos Atendimentos
                </h4>

                <Card className="overflow-hidden border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 uppercase text-muted-foreground border-b border-border font-semibold">
                        <tr>
                          <th className="text-left p-3">Data</th>
                          <th className="text-left p-3">Modalidade</th>
                          <th className="text-right p-3">Valor Cobrado</th>
                          <th className="text-right p-3">Valor Pago</th>
                          <th className="text-center p-3">Meio</th>
                          <th className="text-center p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {sessoesPaciente.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                              Nenhuma cobrança registrada para este paciente.
                            </td>
                          </tr>
                        ) : (
                          sessoesPaciente.map(s => {
                            const mod = modalidades.find(m => m.id === sessaoIdAdicionandoComplemento);
                            return (
                              <tr key={s.id} className="hover:bg-muted/20">
                                <td className="p-3 font-mono">{formatarData(s.data)}</td>
                                <td className="p-3">{mod?.nome || 'Sessão'}</td>
                                <td className="p-3 text-right font-bold text-foreground">{formatarMoeda(s.valorCobrado)}</td>
                                <td className="p-3 text-right font-bold text-emerald-600">
                                  {formatarMoeda(s.pagamentoStatus === 'pago' ? s.valorCobrado : (s.valorPago || 0))}
                                </td>
                                <td className="p-3 text-center uppercase font-mono">{s.meioPagamento}</td>
                                <td className="p-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      s.pagamentoStatus === 'pago'
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : s.pagamentoStatus === 'parcial'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                    }`}
                                  >
                                    {s.pagamentoStatus}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: COMUNICAÇÃO & MENSAGENS */}
          {/* ======================================================== */}
          {abaAtiva === 'comunicacao' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="size-4 text-primary" />
                    Histórico de Notificações & WhatsApp
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registros de mensagens preparadas e transmitidas via WhatsApp
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAbrirMensagem(analisando)}
                  className="px-4 py-2 text-xs font-bold text-primary-foreground gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="size-3.5" />
                  <span>Enviar Mensagem WhatsApp</span>
                </button>
              </div>

              <div className="space-y-3">
                {analisando.mensagensEnviadas && analisando.mensagensEnviadas.length > 0 ? (
                  analisando.mensagensEnviadas.map(m => (
                    <Card key={m.id} className="p-3.5 border-border/70 space-y-2">
                      <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                        <span className="capitalize font-bold text-primary">{m.tipo}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{formatarDataHora(m.data)}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground border border-border/60">
                            {m.status === 'aberta_whatsapp'
                              ? 'Aberta no WhatsApp'
                              : m.status === 'preparada'
                              ? 'Preparada'
                              : m.status || 'Registrada'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                        {m.texto}
                      </p>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card">
                    <MessageSquare className="size-8 text-muted-foreground mx-auto opacity-50 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Nenhuma notificação por WhatsApp enviada pelo sistema até o momento.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="border-t border-border px-5 sm:px-6 py-3.5 flex justify-between items-center bg-muted/30 shrink-0">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Prontuário sob sigilo ético (Resoluções CFP e Código de Ética Profissional)</span>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
          >
            Fechar Prontuário
          </button>
        </div>

      </div>
    </div>
  );
}

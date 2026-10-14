import React, { useState, useMemo } from 'react';
import { Analisando, SessaoClinica, ModalidadeAtendimento } from '../types';
import { formatarMoeda, formatarData, diferencaDias } from '../utils/helpers';
import { Card } from './ui-compact';
import GravadorSessao from './GravadorSessao';
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
  Pencil
} from 'lucide-react';

interface ProntuarioModalProps {
  analisando: Analisando;
  sessoes: SessaoClinica[];
  modalidades: ModalidadeAtendimento[];
  onFechar: () => void;
  onAtualizarObservacoes: (novasObs: string) => void;
  onAbrirMensagem: (analisando: Analisando) => void;
  onNovaSessaoRapida?: (analisandoId: string) => void;
  onEditarPaciente?: (analisando: Analisando) => void;
}

export default function ProntuarioModal({
  analisando,
  sessoes,
  modalidades,
  onFechar,
  onAtualizarObservacoes,
  onAbrirMensagem,
  onNovaSessaoRapida,
  onEditarPaciente
}: ProntuarioModalProps) {
  const [observacoes, setObservacoes] = useState(analisando.observacoes || '');
  const [salvandoObs, setSalvandoObs] = useState(false);

  const stats = useMemo(() => {
    const sessoesPaciente = sessoes.filter(s => s.analisandoId === analisando.id);
    const totalPago = sessoesPaciente
      .filter(s => s.pagamentoStatus === 'pago')
      .reduce((sum, s) => sum + s.valorCobrado, 0);
    const mediaValor = sessoesPaciente.length
      ? sessoesPaciente.reduce((sum, s) => sum + s.valorCobrado, 0) / sessoesPaciente.length
      : 0;
    
    const sessoesOrdenadas = [...sessoesPaciente].sort((a, b) => b.data.localeCompare(a.data));
    const ultimaSessao = sessoesOrdenadas[0];
    const diasSemSessao = ultimaSessao ? diferencaDias(ultimaSessao.data) : null;

    const proximaSessao = sessoesPaciente
      .map(s => s.proximaSessaoData)
      .filter(Boolean)
      .sort()[0];

    return {
      totalSessoes: sessoesPaciente.length,
      totalPago,
      mediaValor,
      ultimaSessao,
      diasSemSessao,
      proximaSessao
    };
  }, [analisando.id, sessoes]);

  const handleSalvarObservacoes = () => {
    setSalvandoObs(true);
    setTimeout(() => {
      onAtualizarObservacoes(observacoes);
      setSalvandoObs(false);
    }, 400);
  };

  const sessoesFiltradas = useMemo(() => {
    return sessoes
      .filter(s => s.analisandoId === analisando.id)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [analisando.id, sessoes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[94vh] sm:h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="gradient-emerald text-primary-foreground px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold truncate">{analisando.nome}</h2>
              {analisando.vip && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-full shadow-sm shrink-0">
                  Caso Prioritário
                </span>
              )}
            </div>
            <p className="text-xs opacity-90 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>{analisando.whatsapp ? `WhatsApp: ${analisando.whatsapp}` : 'Sem telefone'}</span>
              <span className="hidden sm:inline">·</span>
              <span>Desde: {formatarData(analisando.criadoEm)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {onEditarPaciente && (
              <button
                onClick={() => onEditarPaciente(analisando)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-primary-foreground transition-colors shadow-sm"
                title="Editar dados cadastrais do paciente"
              >
                <Pencil className="size-3.5" />
                <span className="hidden sm:inline">Editar Cadastro</span>
              </button>
            )}
            <button
              onClick={onFechar}
              className="rounded-full p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
              aria-label="Fechar prontuário"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-muted/40 border-border/60">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Clock className="size-3.5 text-primary" />
                Sessões Realizadas
              </div>
              <div className="text-xl font-bold text-foreground">{stats.totalSessoes}</div>
            </Card>

            <Card className="p-4 bg-muted/40 border-border/60">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <DollarSign className="size-3.5 text-primary" />
                Total Investido
              </div>
              <div className="text-xl font-bold text-foreground">{formatarMoeda(stats.totalPago)}</div>
            </Card>

            <Card className="p-4 bg-muted/40 border-border/60">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <FileText className="size-3.5 text-primary" />
                Média por Sessão
              </div>
              <div className="text-xl font-bold text-foreground">{formatarMoeda(stats.mediaValor)}</div>
            </Card>

            <Card className="p-4 bg-muted/40 border-border/60">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="size-3.5 text-primary" />
                Tempo de Ausência
              </div>
              <div className="text-xl font-bold text-foreground">
                {stats.diasSemSessao !== null 
                  ? `${stats.diasSemSessao} ${stats.diasSemSessao === 1 ? 'dia' : 'dias'}`
                  : '—'
                }
              </div>
            </Card>
          </div>

          {/* Clinical setting detail */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left side: observations & confidential note */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-3">
                {/* Gravador & Transcritor de Sessão em Áudio */}
                <GravadorSessao
                  nomePaciente={analisando.nome}
                  textoAtual={observacoes}
                  onInserirTexto={(novoTexto) => {
                    setObservacoes(novoTexto);
                    onAtualizarObservacoes(novoTexto);
                  }}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      Demanda Analítica & Observações Clínicas (Confidencial)
                    </label>
                    <button
                      onClick={handleSalvarObservacoes}
                      disabled={salvandoObs}
                      className="text-xs px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md font-medium transition-colors"
                    >
                      {salvandoObs ? 'Salvando...' : 'Salvar Nota'}
                    </button>
                  </div>
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    rows={8}
                    placeholder="Descreva a queixa principal, hipóteses diagnósticas (estrutura clínica, sintomas, fantasias recorrentes) e notas confidenciais de evolução terapêutica..."
                    className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Message log history */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  Registro de Comunicação & Alertas
                </h3>
                <Card className="p-4 max-h-48 overflow-y-auto space-y-3 bg-muted/20 border-border/60">
                  {analisando.mensagensEnviadas && analisando.mensagensEnviadas.length > 0 ? (
                    analisando.mensagensEnviadas.map(m => (
                      <div key={m.id} className="text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                          <span className="capitalize font-semibold text-primary">{m.tipo}</span>
                          <span>{formatarData(m.data)}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Nenhuma notificação por WhatsApp enviada pelo sistema.
                    </p>
                  )}
                </Card>
              </div>
            </div>

            {/* Right side: Session history & Next appointment */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <History className="size-4 text-primary" />
                    Histórico de Sessões
                  </h3>
                  {onNovaSessaoRapida && (
                    <button
                      onClick={() => onNovaSessaoRapida(analisando.id)}
                      className="text-xs flex items-center gap-1 text-primary hover:underline font-medium"
                    >
                      <Plus className="size-3" /> Registrar sessão
                    </button>
                  )}
                </div>
                
                <Card className="p-4 max-h-[360px] overflow-y-auto space-y-3 bg-muted/20 border-border/60">
                  {sessoesFiltradas.length > 0 ? (
                    sessoesFiltradas.map(s => {
                      const mod = modalidades.find(m => m.id === s.modalidadeId);
                      return (
                        <div key={s.id} className="text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between font-semibold mb-1">
                            <span className="truncate max-w-[120px]" title={mod?.nome}>
                              {mod?.nome || 'Sessão'}
                            </span>
                            <span>{formatarMoeda(s.valorCobrado)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-[10px]">
                            <span>{formatarData(s.data)}</span>
                            <span className="capitalize">{s.pagamentoStatus} · {s.meioPagamento}</span>
                          </div>
                          {s.notasSessao && (
                            <p className="mt-1 text-[11px] text-muted-foreground italic line-clamp-2" title={s.notasSessao}>
                              &ldquo;{s.notasSessao}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-12">
                      Nenhum atendimento clínico registrado ainda.
                    </p>
                  )}
                </Card>
              </div>

              {/* Actions Card */}
              <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Ações de Setting</h4>
                {stats.proximaSessao && (
                  <p className="text-xs text-muted-foreground">
                    Próxima sessão prevista para:{' '}
                    <span className="font-semibold text-foreground">{formatarData(stats.proximaSessao)}</span>
                  </p>
                )}
                <button
                  onClick={() => onAbrirMensagem(analisando)}
                  className="w-full btn-emerald flex items-center justify-center gap-2"
                >
                  <Send className="size-4" />
                  Enviar Mensagem WhatsApp
                </button>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 sm:px-6 py-3.5 sm:py-4 flex justify-end bg-muted/30 shrink-0">
          <button
            onClick={onFechar}
            className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all"
          >
            Fechar Prontuário
          </button>
        </div>
      </div>
    </div>
  );
}

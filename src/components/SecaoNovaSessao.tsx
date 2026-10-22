import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  AlertCircle,
  HelpCircle,
  Layers,
  Volume2
} from 'lucide-react';
import { Card } from './ui-compact';
import GravadorSessao from './GravadorSessao';
import { 
  Analisando, 
  ModalidadeAtendimento, 
  SessaoClinica, 
  AgendamentoClinico, 
  UsuarioConta 
} from '../types';
import { 
  formatarData, 
  formatarMoeda, 
  arredondarMoeda, 
  verificarConflitoHorario 
} from '../utils/helpers';

interface SecaoNovaSessaoProps {
  analisandos: Analisando[];
  modalidades: ModalidadeAtendimento[];
  sessoes: SessaoClinica[];
  agendamentos?: AgendamentoClinico[];
  agendamentoInicialId?: string | null;
  pacienteInicialId?: string | null;
  contaUsuario?: UsuarioConta | null;
  onSalvarSessao: (novaSessao: SessaoClinica, agendamentoRetorno?: AgendamentoClinico) => void;
  onNavegarSessoes: () => void;
  onCadastrarPaciente?: () => void;
}

const RASCUNHO_STORAGE_KEY = 'psi40_rascunho_nova_sessao';

export default function SecaoNovaSessao({
  analisandos,
  modalidades,
  sessoes,
  agendamentos = [],
  agendamentoInicialId,
  pacienteInicialId,
  contaUsuario,
  onSalvarSessao,
  onNavegarSessoes,
  onCadastrarPaciente
}: SecaoNovaSessaoProps) {
  // Identifica agendamento vinculado se houver
  const agendamentoOrigem = agendamentos.find(a => a.id === agendamentoInicialId);

  // 1. Paciente, Data, Horário e Modalidade
  const [analisandoId, setAnalisandoId] = useState<string>(() => {
    if (agendamentoOrigem) return agendamentoOrigem.analisandoId;
    if (pacienteInicialId) return pacienteInicialId;
    return ''; // Exige seleção explícita quando iniciado de forma geral
  });

  const [modalidadeId, setModalidadeId] = useState<string>(() => {
    if (agendamentoOrigem) return agendamentoOrigem.modalidadeId;
    return modalidades[0]?.id || '';
  });

  const [dataSessao, setDataSessao] = useState(() => {
    if (agendamentoOrigem) return agendamentoOrigem.data;
    return new Date().toISOString().slice(0, 10);
  });

  const [horaSessao, setHoraSessao] = useState(() => {
    if (agendamentoOrigem) return agendamentoOrigem.hora;
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // 2. Gravação e Transcrição
  const [transcricaoSessao, setTranscricaoSessao] = useState('');
  const [audioBlobSessao, setAudioBlobSessao] = useState<Blob | null>(null);
  const [audioUrlSessao, setAudioUrlSessao] = useState<string | null>(null);

  // 3. Revisão e Evolução Clínica
  const [notasSessao, setNotasSessao] = useState('');

  // 4. Próximo Atendimento e Retorno
  const [proximaSessaoData, setProximaSessaoData] = useState('');
  const [reservarNaAgenda, setReservarNaAgenda] = useState(false);
  const [horaRetornoAgenda, setHoraRetornoAgenda] = useState(() => {
    return agendamentoOrigem?.hora || '09:00';
  });
  const [avisoConflitoRetorno, setAvisoConflitoRetorno] = useState<string | null>(null);

  // 5. Dados Financeiros e Conclusão
  // REGRA ESTREITA: Não assumir pagamento como 'pago' sem confirmação explícita
  const [valorCobrado, setValorCobrado] = useState<number>(0);
  const [pagamentoStatus, setPagamentoStatus] = useState<'pendente' | 'pago' | 'parcial'>('pendente');
  const [valorPago, setValorPago] = useState<number>(0);
  const [meioPagamento, setMeioPagamento] = useState<'pix' | 'dinheiro' | 'transferencia' | 'cartao'>('pix');

  // Estados de controle e feedback
  const [sucessoSalvo, setSucessoSalvo] = useState(false);
  const [detalhesSucesso, setDetalhesSucesso] = useState<{
    pacienteNome: string;
    data: string;
    hora: string;
    proximaData?: string;
    temTranscricao: boolean;
  } | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Analisando e Modalidade Selecionados
  const analisandoSelecionado = analisandos.find(a => a.id === analisandoId);
  const modalidadeSelecionada = modalidades.find(m => m.id === modalidadeId);

  // Sincroniza horário padrão de retorno com o horário da sessão
  useEffect(() => {
    if (horaSessao && (!horaRetornoAgenda || horaRetornoAgenda === '00:00')) {
      setHoraRetornoAgenda(horaSessao);
    }
  }, [horaSessao]);

  // Inicializa preço e próxima data quando modalidade mudar
  useEffect(() => {
    if (modalidadeSelecionada) {
      if (valorCobrado === 0) {
        setValorCobrado(modalidadeSelecionada.preco || 0);
      }
      const dias = modalidadeSelecionada.intervaloDias || 7;
      const base = new Date(dataSessao + 'T12:00:00');
      base.setDate(base.getDate() + dias);
      setProximaSessaoData(base.toISOString().slice(0, 10));
    }
  }, [modalidadeId, dataSessao]);

  // Checagem de conflitos para reserva de retorno na agenda
  useEffect(() => {
    if (reservarNaAgenda && proximaSessaoData && horaRetornoAgenda && horaRetornoAgenda !== '00:00') {
      const conflito = verificarConflitoHorario(
        proximaSessaoData,
        horaRetornoAgenda,
        modalidadeSelecionada?.duracao || 50,
        agendamentos
      );
      if (conflito.conflito) {
        setAvisoConflitoRetorno(conflito.mensagem || 'Horário de retorno conflita com outro agendamento.');
      } else {
        setAvisoConflitoRetorno(null);
      }
    } else {
      setAvisoConflitoRetorno(null);
    }
  }, [reservarNaAgenda, proximaSessaoData, horaRetornoAgenda, modalidadeSelecionada, agendamentos]);

  // Recupera rascunho salvo do localStorage se existir
  useEffect(() => {
    if (!agendamentoInicialId && !pacienteInicialId) {
      try {
        const rascunho = localStorage.getItem(RASCUNHO_STORAGE_KEY);
        if (rascunho) {
          const dados = JSON.parse(rascunho);
          if (dados.notasSessao && !notasSessao) {
            setNotasSessao(dados.notasSessao);
          }
          if (dados.analisandoId && !analisandoId) {
            setAnalisandoId(dados.analisandoId);
          }
        }
      } catch (_) {}
    }
  }, []);

  // Salva rascunho automaticamente para proteção contra falhas e perdas
  useEffect(() => {
    if (notasSessao.trim() || analisandoId) {
      try {
        localStorage.setItem(RASCUNHO_STORAGE_KEY, JSON.stringify({
          analisandoId,
          modalidadeId,
          dataSessao,
          notasSessao
        }));
      } catch (_) {}
    }
  }, [notasSessao, analisandoId, modalidadeId, dataSessao]);

  // Aviso antes de sair com conteúdo não salvo (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (notasSessao.trim().length > 10 && !sucessoSalvo) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notasSessao, sucessoSalvo]);

  // Salvar Sessão
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    // Passo 1: Validação explícita de paciente
    if (!analisandoId) {
      setErroValidacao('Selecione explicitamente o paciente para registrar este atendimento clínico.');
      return;
    }

    if (!modalidadeId) {
      setErroValidacao('Selecione a modalidade do atendimento.');
      return;
    }

    // Passo 5: Validação Financeira
    const cobrado = arredondarMoeda(valorCobrado);
    let pago = 0;
    let saldo = cobrado;

    if (pagamentoStatus === 'pago') {
      pago = cobrado;
      saldo = 0;
    } else if (pagamentoStatus === 'parcial') {
      pago = arredondarMoeda(valorPago);
      if (pago <= 0 || pago >= cobrado) {
        setErroValidacao('No pagamento parcial, informe um valor pago maior que zero e menor que o valor total.');
        return;
      }
      saldo = arredondarMoeda(Math.max(0, cobrado - pago));
    } else {
      // Pendente
      pago = 0;
      saldo = cobrado;
    }

    setSalvando(true);

    try {
      const sessaoId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const textoFinalNotas = notasSessao.trim() || transcricaoSessao.trim() || undefined;
      const textoFinalTranscricao = transcricaoSessao.trim() || undefined;

      const novaSessao: SessaoClinica = {
        id: sessaoId,
        analisandoId,
        modalidadeId,
        agendamentoOrigemId: agendamentoInicialId || undefined,
        data: dataSessao,
        hora: horaSessao,
        valorCobrado: cobrado,
        valorPago: pago,
        saldoDevedor: saldo,
        pagamentoStatus,
        meioPagamento,
        proximaSessaoData: proximaSessaoData || undefined,
        proximaSessaoAgendada: reservarNaAgenda,
        notasSessao: textoFinalNotas,
        transcricao: textoFinalTranscricao,
        audioUrl: audioUrlSessao || undefined,
        criadoEm: new Date().toISOString()
      };

      // Se o profissional marcou para reservar na agenda, cria o agendamento de retorno
      let agendamentoRetorno: AgendamentoClinico | undefined;
      if (reservarNaAgenda && proximaSessaoData) {
        agendamentoRetorno = {
          id: `ag_ret_${Date.now()}`,
          analisandoId,
          modalidadeId,
          data: proximaSessaoData,
          hora: (horaRetornoAgenda && horaRetornoAgenda !== '00:00') ? horaRetornoAgenda : (horaSessao || '09:00'),
          duracaoMinutos: modalidadeSelecionada?.duracao || 50,
          status: 'confirmado',
          observacao: `Retorno programado na conclusão da sessão de ${formatarData(dataSessao)}.`
        };
      }

      onSalvarSessao(novaSessao, agendamentoRetorno);

      // Limpa rascunho persistido com segurança
      try {
        localStorage.removeItem(RASCUNHO_STORAGE_KEY);
      } catch (_) {}

      setDetalhesSucesso({
        pacienteNome: analisandoSelecionado?.nome || 'Paciente',
        data: dataSessao,
        hora: horaSessao,
        proximaData: (reservarNaAgenda && proximaSessaoData) ? proximaSessaoData : undefined,
        temTranscricao: Boolean(textoFinalTranscricao)
      });
      setSucessoSalvo(true);
      setSalvando(false);

      // Limpa notas
      setNotasSessao('');
      setTranscricaoSessao('');

    } catch (err: any) {
      console.error('[Salvar Sessão]:', err);
      setSalvando(false);
      setErroValidacao('Ocorreu uma falha ao persistir a sessão. Seus dados foram preservados no formulário para você tentar novamente.');
    }
  };

  const handleLimpar = () => {
    if (notasSessao.trim() && !window.confirm('Deseja descartar as anotações desta sessão?')) {
      return;
    }
    setNotasSessao('');
    setTranscricaoSessao('');
    setAudioUrlSessao(null);
    setAudioBlobSessao(null);
    setSucessoSalvo(false);
    setErroValidacao(null);
    try {
      localStorage.removeItem(RASCUNHO_STORAGE_KEY);
    } catch (_) {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-6 text-primary" />
            <span>Fluxo de Registro de Atendimento Clínico</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={onNavegarSessoes}
          className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Ver Sessões Realizadas</span>
          <ArrowRight className="size-3.5 text-primary" />
        </button>
      </div>

      {/* Alerta de Vínculo com Agendamento da Agenda */}
      {agendamentoOrigem && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-xs text-primary flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            <span>
              Sessão vinculada ao agendamento de <strong>{analisandoSelecionado?.nome}</strong> em {formatarData(agendamentoOrigem.data)} às {agendamentoOrigem.hora}. Ao salvar, o agendamento será concluído automaticamente.
            </span>
          </div>
        </div>
      )}

      {/* Alerta de Erro de Validação */}
      {erroValidacao && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{erroValidacao}</span>
        </div>
      )}

      {/* Formulário Principal Estruturado nos 5 Passos Requeridos */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ======================================================== */}
        {/* PASSO 1: PACIENTE, DATA, HORÁRIO E MODALIDADE */}
        {/* ======================================================== */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Paciente, Data, Horário e Modalidade
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seleção Explícita de Paciente */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                <span>Paciente / Analisando *</span>
                {onCadastrarPaciente && (
                  <button
                    type="button"
                    onClick={onCadastrarPaciente}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    + Novo Paciente
                  </button>
                )}
              </label>
              {analisandos.length === 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span>Nenhum paciente cadastrado ainda. Cadastre um paciente para vincular o prontuário.</span>
                  {onCadastrarPaciente && (
                    <button
                      type="button"
                      onClick={onCadastrarPaciente}
                      className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold text-[11px] shrink-0 hover:opacity-90"
                    >
                      + Cadastrar Paciente
                    </button>
                  )}
                </div>
              )}
              <select
                required
                value={analisandoId}
                onChange={e => setAnalisandoId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              >
                <option value="">-- Selecione obrigatoriamente o paciente --</option>
                {analisandos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} {a.whatsapp ? `(${a.whatsapp})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Modalidade de Atendimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Modalidade de Atendimento *
              </label>
              <select
                required
                value={modalidadeId}
                onChange={e => setModalidadeId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              >
                <option value="">Selecione a modalidade...</option>
                {modalidades.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome} — R$ {m.preco} ({m.duracao} min)
                  </option>
                ))}
              </select>
            </div>

            {/* Data da Sessão */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Data do Atendimento *
              </label>
              <input
                type="date"
                required
                value={dataSessao}
                onChange={e => setDataSessao(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Horário da Sessão */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Horário da Sessão
              </label>
              <input
                type="time"
                value={horaSessao}
                onChange={e => setHoraSessao(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* PASSO 2: GRAVAÇÃO E TRANSCRIÇÃO REAIS */}
        {/* ======================================================== */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Gravação de Áudio & Transcrição da Sessão
            </h3>
          </div>

          <GravadorSessao
            nomePaciente={analisandoSelecionado?.nome || 'Paciente'}
            textoAtual={notasSessao}
            onInserirTexto={(novoTexto) => {
              setTranscricaoSessao(novoTexto);
              if (!notasSessao.trim()) {
                setNotasSessao(novoTexto);
              }
            }}
            onAudioGravado={(blob, url, transcricao) => {
              setAudioBlobSessao(blob);
              setAudioUrlSessao(url);
              setTranscricaoSessao(transcricao);
              if (!notasSessao.trim() && transcricao.trim()) {
                setNotasSessao(transcricao.trim());
              }
            }}
          />
        </div>

        {/* ======================================================== */}
        {/* PASSO 3: REVISÃO E EVOLUÇÃO CLÍNICA */}
        {/* ======================================================== */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Revisão & Evolução Clínica (Prontuário Confidencial)
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Armazenamento Seguro do Consultório</span>
            </div>
          </div>

          {transcricaoSessao.trim() && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary shrink-0" />
                Transcrição gravada ativa ({transcricaoSessao.length} caracteres) &mdash; será salva no prontuário deste paciente.
              </span>
              {!notasSessao.trim() && (
                <button
                  type="button"
                  onClick={() => setNotasSessao(transcricaoSessao)}
                  className="underline font-bold text-primary hover:opacity-80 shrink-0 cursor-pointer ml-2"
                >
                  Usar na evolução
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Notas de Setting, Hipóteses & Significantes *</span>
              <span className="text-[11px] text-muted-foreground lowercase">rascunho preservado automaticamente</span>
            </label>
            <textarea
              required={!transcricaoSessao.trim()}
              rows={6}
              value={notasSessao}
              onChange={e => setNotasSessao(e.target.value)}
              placeholder="Descreva as manifestações do paciente no setting, intervenções realizadas, associações e encaminhamentos..."
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y font-sans"
            />
          </div>
        </Card>

        {/* ======================================================== */}
        {/* PASSO 4: PRÓXIMO ATENDIMENTO E RESERVA DE RETORNO */}
        {/* ======================================================== */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Programação do Próximo Atendimento / Retorno
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                <span>Data do Próximo Atendimento</span>
              </label>
              <input
                type="date"
                value={proximaSessaoData}
                onChange={e => setProximaSessaoData(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-[11px] text-muted-foreground block">
                Sugerido com base no intervalo de {modalidadeSelecionada?.intervaloDias || 7} dias da modalidade.
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-reservar-agenda"
                  checked={reservarNaAgenda}
                  onChange={e => setReservarNaAgenda(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-ring size-4 mt-0.5"
                />
                <label htmlFor="chk-reservar-agenda" className="text-xs cursor-pointer select-none space-y-0.5">
                  <span className="font-bold text-foreground block">
                    Reservar horário efetivamente na Agenda Clínica
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    Diferencia previsão clínica de compromisso reservado na grade semanal.
                  </span>
                </label>
              </div>

              {reservarNaAgenda && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Horário Reservado na Agenda
                  </label>
                  <input
                    type="time"
                    value={horaRetornoAgenda || horaSessao || '09:00'}
                    onChange={e => {
                      const val = e.target.value;
                      setHoraRetornoAgenda(val && val !== '00:00' ? val : (horaSessao || '09:00'));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {avisoConflitoRetorno && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="size-3.5" />
                      {avisoConflitoRetorno}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* ======================================================== */}
        {/* PASSO 5: DADOS FINANCEIROS E CONCLUSÃO */}
        {/* ======================================================== */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              5
            </span>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Dados Financeiros & Confirmação de Cobrança
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Valor Cobrado */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Valor Cobrado (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={valorCobrado}
                onChange={e => setValorCobrado(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
              />
            </div>

            {/* Meio de Pagamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Meio de Pagamento
              </label>
              <select
                value={meioPagamento}
                onChange={e => setMeioPagamento(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência Bancária</option>
                <option value="cartao">Cartão de Débito/Crédito</option>
              </select>
            </div>

            {/* Status do Pagamento: NÃO assumir 'pago' sem confirmação */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Situação do Pagamento *
              </label>
              <select
                value={pagamentoStatus}
                onChange={e => {
                  const novo = e.target.value as any;
                  setPagamentoStatus(novo);
                  if (novo === 'pago') setValorPago(valorCobrado);
                  if (novo === 'pendente') setValorPago(0);
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
              >
                <option value="pendente">Pendente (Aguardando Pagamento)</option>
                <option value="parcial">Parcial (Entrada / Pagamento em Aberto)</option>
                <option value="pago">Pago (Confirmado Efetivamente)</option>
              </select>
            </div>
          </div>

          {/* Em caso de pagamento parcial: campos de valor pago e saldo */}
          {pagamentoStatus === 'parcial' && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
                  Valor Efetivamente Recebido (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  max={valorCobrado}
                  step="0.01"
                  value={valorPago}
                  onChange={e => setValorPago(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-amber-500/40 bg-background text-sm text-foreground font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase block">
                  Saldo Devedor em Aberto:
                </span>
                <div className="h-10 px-3 rounded-xl bg-background border border-amber-500/40 flex items-center font-bold text-rose-600 text-sm">
                  {formatarMoeda(Math.max(0, valorCobrado - valorPago))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Barra de Ações Finais */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleLimpar}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Limpar Rascunho
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavegarSessoes}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-sm font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              <span>{salvando ? 'Salvando...' : 'Concluir e Persistir Sessão'}</span>
            </button>
          </div>
        </div>

      </form>

      {/* ======================================================== */}
      {/* CAIXA DE SUCESSO NO MEIO DA TELA (MODAL CENTRAL) */}
      {/* ======================================================== */}
      {sucessoSalvo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-card border border-border/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-500/10">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Atendimento registrado com sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                A sessão clínica, transcrição e dados financeiros foram salvos com segurança no prontuário do paciente.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paciente:</span>
                <span className="font-bold text-foreground truncate max-w-[200px]">
                  {detalhesSucesso?.pacienteNome || analisandoSelecionado?.nome || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data do Atendimento:</span>
                <span className="font-semibold text-foreground">
                  {formatarData(detalhesSucesso?.data || dataSessao)} às {detalhesSucesso?.hora || horaSessao}
                </span>
              </div>
              {detalhesSucesso?.temTranscricao && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3.5" />
                    Transcrição de Áudio:
                  </span>
                  <span>Salva no Prontuário</span>
                </div>
              )}
              {detalhesSucesso?.proximaData && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Próximo Retorno:</span>
                  <span className="font-semibold text-primary">
                    {formatarData(detalhesSucesso.proximaData)} (Reservado na Agenda)
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSucessoSalvo(false);
                  onNavegarSessoes();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Ver no Histórico</span>
                <ArrowRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSucessoSalvo(false);
                }}
                className="py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
              >
                Novo Atendimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

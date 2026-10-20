import React, { useState, useEffect } from 'react';
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
  Shield,
  Sparkles,
  CalendarDays,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Card } from './ui-compact';
import GravadorSessao from './GravadorSessao';
import { Analisando, ModalidadeAtendimento, SessaoClinica } from '../types';

interface SecaoNovaSessaoProps {
  analisandos: Analisando[];
  modalidades: ModalidadeAtendimento[];
  sessoes: SessaoClinica[];
  onSalvarSessao: (novaSessao: SessaoClinica) => void;
  onNavegarSessoes: () => void;
  onCadastrarPaciente?: () => void;
}

export default function SecaoNovaSessao({
  analisandos,
  modalidades,
  sessoes,
  onSalvarSessao,
  onNavegarSessoes,
  onCadastrarPaciente
}: SecaoNovaSessaoProps) {
  const [analisandoId, setAnalisandoId] = useState('');
  const [modalidadeId, setModalidadeId] = useState('');
  const [dataSessao, setDataSessao] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaSessao, setHoraSessao] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [valorCobrado, setValorCobrado] = useState<number>(0);
  const [pagamentoStatus, setPagamentoStatus] = useState<'pago' | 'pendente' | 'parcial'>('pago');
  const [meioPagamento, setMeioPagamento] = useState<'pix' | 'dinheiro' | 'transferencia' | 'cartao'>('pix');
  const [proximaSessaoData, setProximaSessaoData] = useState('');
  const [notasSessao, setNotasSessao] = useState('');
  const [sucessoSalvo, setSucessoSalvo] = useState(false);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Analisando selecionado
  const analisandoSelecionado = analisandos.find(a => a.id === analisandoId);
  const modalidadeSelecionada = modalidades.find(m => m.id === modalidadeId);

  // Atualiza valor padrão e próxima sessão ao alterar modalidade ou paciente
  useEffect(() => {
    if (modalidadeSelecionada) {
      if (valorCobrado === 0) {
        setValorCobrado(modalidadeSelecionada.preco || 0);
      }
      // Calcula próxima sessão
      const dias = modalidadeSelecionada.intervaloDias || 7;
      const base = new Date(dataSessao + 'T12:00:00');
      base.setDate(base.getDate() + dias);
      setProximaSessaoData(base.toISOString().slice(0, 10));
    }
  }, [modalidadeId, dataSessao]);

  // Sugere modalidade da última sessão do paciente se houver
  useEffect(() => {
    if (analisandoId) {
      const ultimaSessao = sessoes.find(s => s.analisandoId === analisandoId);
      if (ultimaSessao && ultimaSessao.modalidadeId) {
        setModalidadeId(ultimaSessao.modalidadeId);
        if (ultimaSessao.valorCobrado) {
          setValorCobrado(ultimaSessao.valorCobrado);
        }
      }
    }
  }, [analisandoId, sessoes]);

  // Pré-seleciona primeiro paciente e modalidade se disponível
  useEffect(() => {
    if (analisandos.length > 0 && !analisandoId) {
      setAnalisandoId(analisandos[0].id);
    }
    if (modalidades.length > 0 && !modalidadeId) {
      setModalidadeId(modalidades[0].id);
      setValorCobrado(modalidades[0].preco || 0);
      const dias = modalidades[0].intervaloDias || 7;
      const base = new Date();
      base.setDate(base.getDate() + dias);
      setProximaSessaoData(base.toISOString().slice(0, 10));
    }
  }, [analisandos, modalidades]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao(null);

    if (!analisandoId) {
      setErroValidacao('Selecione o paciente para registrar a sessão.');
      return;
    }

    if (!modalidadeId) {
      setErroValidacao('Selecione a modalidade de atendimento da sessão.');
      return;
    }

    const novaSessao: SessaoClinica = {
      id: `${Date.now()}`,
      analisandoId,
      modalidadeId,
      data: dataSessao,
      valorCobrado: Number(valorCobrado) || 0,
      pagamentoStatus,
      meioPagamento,
      proximaSessaoData: proximaSessaoData || undefined,
      notasSessao: notasSessao.trim() || undefined
    };

    onSalvarSessao(novaSessao);
    setSucessoSalvo(true);

    // Limpa notas da sessão mantendo paciente e modalidade para próxima
    setTimeout(() => {
      setNotasSessao('');
      setSucessoSalvo(false);
    }, 4000);
  };

  const handleLimparFormulario = () => {
    setNotasSessao('');
    setDataSessao(new Date().toISOString().slice(0, 10));
    setSucessoSalvo(false);
    setErroValidacao(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-6 text-primary" />
            <span>Nova Sessão Clínica</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Registro de atendimento com gravação de áudio, transcrição automática em tempo real e prontuário clínico.
          </p>
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

      {/* Alerta de Sucesso ao Salvar */}
      {sucessoSalvo && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in zoom-in-95">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block text-sm font-bold">Sessão registrada com sucesso no prontuário!</strong>
              <span className="text-xs">
                Os dados clínicos foram armazenados no seu cofre local com sigilo criptografado.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavegarSessoes}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 cursor-pointer"
          >
            Ver no Histórico
          </button>
        </div>
      )}

      {/* Alerta de Erro de Validação */}
      {erroValidacao && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{erroValidacao}</span>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Identificação do Paciente, Data e Modalidade */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <User className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Dados do Setting & Paciente
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paciente */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Paciente / Analisando *</span>
                {analisandos.length === 0 && onCadastrarPaciente && (
                  <button
                    type="button"
                    onClick={onCadastrarPaciente}
                    className="text-[11px] text-primary hover:underline font-bold"
                  >
                    + Cadastrar Paciente
                  </button>
                )}
              </label>
              <select
                required
                value={analisandoId}
                onChange={e => setAnalisandoId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
              >
                <option value="">Selecione o paciente...</option>
                {analisandos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} {a.whatsapp ? `(${a.whatsapp})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Modalidade */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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

            {/* Data e Horário da Sessão */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Data da Sessão *
                </label>
                <input
                  type="date"
                  required
                  value={dataSessao}
                  onChange={e => setDataSessao(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Horário
                </label>
                <input
                  type="time"
                  value={horaSessao}
                  onChange={e => setHoraSessao(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Honorário & Status Financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorCobrado}
                  onChange={e => setValorCobrado(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Meio de Pagto
                </label>
                <select
                  value={meioPagamento}
                  onChange={e => setMeioPagamento(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status Pagamento
                </label>
                <select
                  value={pagamentoStatus}
                  onChange={e => setPagamentoStatus(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-semibold"
                >
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Gravação da Sessão & Transcrição Automática */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Gravação de Áudio & Transcrição Automática da Sessão
              </h3>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/60">
              Microfone do Dispositivo
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Inicie a gravação no botão abaixo para capturar o áudio da sessão com total privacidade. A transcrição do diálogo é realizada automaticamente conforme a fala é capturada, e você pode inserir o texto diretamente no prontuário.
          </p>

          {/* Componente Gravador com Transcrição e Botão Salvar .MP3 */}
          <GravadorSessao
            nomePaciente={analisandoSelecionado?.nome || 'Paciente'}
            textoAtual={notasSessao}
            onInserirTexto={(novoTexto) => {
              setNotasSessao(novoTexto);
            }}
          />
        </Card>

        {/* Card 3: Prontuário Clínico & Evolução Terapêutica */}
        <Card className="p-4 sm:p-6 border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Prontuário & Notas Confidenciais da Sessão
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <Shield className="size-3 text-emerald-600" />
              <span>Criptografia Ponta-a-Ponta</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Evolução Terapêutica, Chaves de Escuta & Significantes
            </label>
            <textarea
              value={notasSessao}
              onChange={e => setNotasSessao(e.target.value)}
              rows={6}
              placeholder="Digite aqui as anotações do setting analítico, insights transferenciais, atos falhos, associações livres e considerações de evolução..."
              className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y font-sans"
            />
          </div>

          {/* Próximo Retorno / Sessão Futura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                <span>Próximo Retorno / Sessão Prevista</span>
              </label>
              <input
                type="date"
                value={proximaSessaoData}
                onChange={e => setProximaSessaoData(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-[11px] text-muted-foreground block">
                Calculado automaticamente a partir da frequência da modalidade ({modalidadeSelecionada?.intervaloDias || 7} dias).
              </span>
            </div>
          </div>
        </Card>

        {/* Barra de Ações Finais */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleLimparFormulario}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Limpar Formulário
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
              className="px-6 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-sm font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              <span>Registrar e Salvar Sessão no Prontuário</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

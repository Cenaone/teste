import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Send,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Edit3,
  Calendar,
  CreditCard,
  User,
  Sparkles
} from 'lucide-react';
import { Analisando, SessaoClinica, Honorario, PerfilAnalista, ConsultorioData } from '../types';
import { formatarMoeda, formatarData } from '../utils/helpers';
import { numeroPorExtenso } from '../utils/numeroPorExtenso';

export interface DadosReciboProps {
  tipo: 'sessao' | 'honorario' | 'multiplas' | 'avulso';
  sessao?: SessaoClinica;
  honorario?: Honorario;
  sessoesMultiplas?: SessaoClinica[];
  paciente: Analisando;
  valor: number;
  data: string;
  meioPagamento?: string;
  descricao?: string;
}

interface ModalReciboProps {
  aberto: boolean;
  onFechar: () => void;
  dados: DadosReciboProps | null;
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  contaUsuario?: any;
}

export default function ModalRecibo({
  aberto,
  onFechar,
  dados,
  perfil,
  consultorio,
  contaUsuario
}: ModalReciboProps) {
  if (!aberto || !dados) return null;

  // Estado editável dos campos do recibo
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [nomePaciente, setNomePaciente] = useState(dados.paciente?.nome || '');
  const [cpfPaciente, setCpfPaciente] = useState(dados.paciente?.cpf || '');
  const [nomeProfissional, setNomeProfissional] = useState(
    perfil.nome || contaUsuario?.nomeCompleto || 'Dr. Roberto Martins'
  );
  const [registroProfissional, setRegistroProfissional] = useState(
    perfil.registroProfissional || contaUsuario?.crp || 'CRP 06/123456'
  );
  const [cpfProfissional, setCpfProfissional] = useState('');
  const [valor, setValor] = useState<number>(dados.valor || 0);
  const [dataEmissao, setDataEmissao] = useState(
    dados.data ? dados.data.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [cidadeEmissao, setCidadeEmissao] = useState(
    consultorio.cidade || dados.paciente?.cidade || 'São Paulo - SP'
  );
  const [meioPagamento, setMeioPagamento] = useState(
    dados.meioPagamento || 'pix'
  );
  const [descricaoServico, setDescricaoServico] = useState('');
  const [mostrarOpcoesEdicao, setMostrarOpcoesEdicao] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Inicializa descrição detalhada
  useEffect(() => {
    const dataFormatada = formatarData(dados.data);
    let desc = '';

    if (dados.tipo === 'multiplas' && dados.sessoesMultiplas && dados.sessoesMultiplas.length > 0) {
      const datas = dados.sessoesMultiplas.map(s => formatarData(s.data)).join(', ');
      desc = `Prestação de serviços psicológicos / psicoterapia clínica referente ao pacote de ${dados.sessoesMultiplas.length} sessões realizadas nas seguintes datas: ${datas}.`;
    } else if (dados.tipo === 'honorario') {
      desc = `Prestação de serviços psicológicos / psicanálise clínica referente a honorários com vencimento em ${dataFormatada}.`;
    } else {
      desc = `Prestação de serviços psicológicos / sessão de psicoterapia clínica presencial/online realizada no dia ${dataFormatada}.`;
    }

    setDescricaoServico(dados.descricao || desc);
    setNomePaciente(dados.paciente?.nome || '');
    setCpfPaciente(dados.paciente?.cpf || '');
    setValor(dados.valor || 0);

    // Gera número sequencial amigável baseado no timestamp
    const anoMes = (dados.data || new Date().toISOString()).slice(0, 7).replace('-', '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNumeroRecibo(`REC-${anoMes}-${rand}`);
  }, [dados]);

  const valorExtenso = numeroPorExtenso(valor);

  const imprimir = () => {
    window.print();
  };

  const copiarTextoRecibo = () => {
    const texto = `
=========================================
RECIBO DE PRESTAÇÃO DE SERVIÇOS CLÍNICOS
Nº ${numeroRecibo}
=========================================

Recebi de: ${nomePaciente}
CPF: ${cpfPaciente || 'Não informado'}
Valor: ${formatarMoeda(valor)} (${valorExtenso})
Forma de Pagamento: ${meioPagamento.toUpperCase()}

Referente a:
${descricaoServico}

Data de Emissão: ${cidadeEmissao}, ${formatarData(dataEmissao)}

Emitente:
${nomeProfissional}
${registroProfissional ? `Registro: ${registroProfissional}` : ''}
${cpfProfissional ? `CPF do Profissional: ${cpfProfissional}` : ''}
Consultório: ${consultorio.nome || 'Consultório Clínico'}
${consultorio.endereco ? `Endereço: ${consultorio.endereco}` : ''}
    `.trim();

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const enviarWhatsApp = () => {
    if (!dados.paciente?.whatsapp) {
      alert('O paciente não possui número de WhatsApp cadastrado.');
      return;
    }
    const numeroLimpo = dados.paciente.whatsapp.replace(/\D/g, '');
    const mensagem = encodeURIComponent(
      `Olá, ${nomePaciente.split(' ')[0]}! Tudo bem?\n\n` +
      `Segue a confirmação do seu *Recibo de Atendimento Clínico* (${numeroRecibo}):\n\n` +
      `📄 *Valor:* ${formatarMoeda(valor)} (${valorExtenso})\n` +
      `🗓️ *Data:* ${formatarData(dataEmissao)}\n` +
      `💳 *Pagamento:* ${meioPagamento.toUpperCase()}\n\n` +
      `*Descrição:* ${descricaoServico}\n\n` +
      `Emitido por *${nomeProfissional}* (${registroProfissional || ''}).\n` +
      `Este recibo serve para sua comprovação contábil e dedução no IRPF.`
    );
    window.open(`https://wa.me/55${numeroLimpo}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-card w-full max-w-3xl rounded-3xl border border-border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho do Modal (Oculto na impressão) */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-3 bg-muted/40 no-print">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Recibo de Atendimento Clínico
              </h2>
              <p className="text-xs text-muted-foreground">
                Conforme com regulamentação do CFP e IRPF para dedução médica/psicológica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarOpcoesEdicao(!mostrarOpcoesEdicao)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Ajustar dados do recibo"
            >
              <Edit3 className="size-4" />
              <span className="hidden sm:inline">Ajustar Dados</span>
            </button>
            <button
              onClick={onFechar}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Painel de Ajuste Rápido (Expansível / no-print) */}
        {mostrarOpcoesEdicao && (
          <div className="p-4 sm:p-5 bg-muted/30 border-b border-border space-y-4 no-print text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Personalizar Campos do Recibo
              </span>
              <button
                onClick={() => setMostrarOpcoesEdicao(false)}
                className="text-primary hover:underline font-semibold"
              >
                Concluir edição
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Nome do Paciente</label>
                <input
                  type="text"
                  value={nomePaciente}
                  onChange={e => setNomePaciente(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">CPF do Paciente</label>
                <input
                  type="text"
                  value={cpfPaciente}
                  placeholder="000.000.000-00"
                  onChange={e => setCpfPaciente(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Valor do Recibo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={e => setValor(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Forma de Pagamento</label>
                <select
                  value={meioPagamento}
                  onChange={e => setMeioPagamento(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                >
                  <option value="pix">PIX</option>
                  <option value="transferencia">Transferência Bancária</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="cartao">Cartão de Crédito/Débito</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Data de Emissão</label>
                <input
                  type="date"
                  value={dataEmissao}
                  onChange={e => setDataEmissao(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Cidade / UF de Emissão</label>
                <input
                  type="text"
                  value={cidadeEmissao}
                  onChange={e => setCidadeEmissao(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Nome do Profissional</label>
                <input
                  type="text"
                  value={nomeProfissional}
                  onChange={e => setNomeProfissional(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Registro / CRP</label>
                <input
                  type="text"
                  value={registroProfissional}
                  onChange={e => setRegistroProfissional(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-muted-foreground mb-1">Descrição do Serviço Prestado</label>
              <textarea
                rows={2}
                value={descricaoServico}
                onChange={e => setDescricaoServico(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground"
              />
            </div>
          </div>
        )}

        {/* Corpo Visual do Recibo (Área Imprimível A4 Oficial) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-muted/10">
          <div
            id="recibo-imprimir"
            className="bg-white text-stone-900 border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-lg mx-auto max-w-2xl font-serif relative"
          >
            {/* Faixa Superior com Logotipo e Dados do Consultório */}
            <div className="border-b-2 border-stone-800 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-serif">
                  {consultorio.nome || 'Consultório de Psicologia & Psicanálise'}
                </h1>
                <p className="text-xs text-stone-600 font-sans mt-0.5">
                  {nomeProfissional} • {registroProfissional}
                </p>
                {consultorio.endereco && (
                  <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                    {consultorio.endereco} • {cidadeEmissao}
                  </p>
                )}
              </div>

              <div className="text-right sm:text-right shrink-0">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-sans font-bold bg-stone-100 border border-stone-300 text-stone-800">
                  {numeroRecibo}
                </span>
                <p className="text-2xl font-bold font-mono text-stone-900 mt-1 font-sans">
                  {formatarMoeda(valor)}
                </p>
              </div>
            </div>

            {/* Título Central */}
            <div className="text-center my-6">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-stone-900 underline decoration-gold-500 underline-offset-8">
                Recibo de Pagamento
              </h2>
              <p className="text-xs font-sans text-stone-500 mt-1 uppercase tracking-widest">
                Prestação de Serviços Psicológicos / Clínicos
              </p>
            </div>

            {/* Texto Declaratório Principal do Recibo */}
            <div className="my-8 text-sm sm:text-base leading-relaxed text-stone-800 text-justify space-y-4">
              <p>
                Recebi de <strong className="text-stone-900 font-semibold">{nomePaciente}</strong>
                {cpfPaciente ? (
                  <span>, portador(a) do CPF nº <strong className="text-stone-900 font-mono">{cpfPaciente}</strong></span>
                ) : (
                  <span> (CPF não informado)</span>
                )}
                , a importância líquida de <strong className="text-stone-900 font-mono font-bold">{formatarMoeda(valor)}</strong> (<em>{valorExtenso}</em>), referente a:
              </p>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm italic font-sans text-stone-700">
                "{descricaoServico}"
              </div>

              <p className="text-xs sm:text-sm font-sans text-stone-600">
                <strong>Forma de liquidação:</strong> {meioPagamento.toUpperCase()} • Quitação irrevogável para os devidos fins legais e comprovação para IRPF.
              </p>
            </div>

            {/* Local, Data e Assinatura */}
            <div className="mt-12 pt-6 border-t border-stone-200">
              <div className="text-right text-xs sm:text-sm text-stone-600 font-sans mb-10">
                {cidadeEmissao}, {formatarData(dataEmissao)}.
              </div>

              <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-64 border-b border-stone-900 mb-2"></div>
                <p className="font-bold text-sm text-stone-900 font-sans">{nomeProfissional}</p>
                <p className="text-xs text-stone-600 font-sans">{registroProfissional}</p>
                {cpfProfissional && (
                  <p className="text-[11px] text-stone-500 font-sans font-mono">CPF: {cpfProfissional}</p>
                )}
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-sans mt-2">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  Emitido via Prontuário PSi 4.0 Pro
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé de Ações (Oculto na Impressão) */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={copiarTextoRecibo}
              className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground transition-all flex items-center gap-1.5"
            >
              {copiado ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              <span>{copiado ? 'Recibo Copiado!' : 'Copiar Texto'}</span>
            </button>

            {dados.paciente?.whatsapp && (
              <button
                onClick={enviarWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="size-4" />
                <span>Enviar no WhatsApp</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onFechar}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Fechar
            </button>
            <button
              onClick={imprimir}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white gradient-emerald shadow-lg hover:opacity-95 transition-all flex items-center gap-2"
            >
              <Printer className="size-4" />
              <span>Imprimir Recibo (A4 / PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

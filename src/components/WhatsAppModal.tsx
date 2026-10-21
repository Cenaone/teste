import React, { useState, useEffect } from 'react';
import { Analisando, ModeloMensagem, PerfilAnalista, ConsultorioData } from '../types';
import { 
  abrirWhatsApp, 
  substituirVariaveis, 
  formatarMoeda, 
  formatarData, 
  formatarTelefone, 
  formatarDataHora 
} from '../utils/helpers';
import { 
  Send, 
  X, 
  ShieldAlert,
  ChevronDown,
  Clock,
  User,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface WhatsAppModalProps {
  analisando: Analisando;
  modelos: ModeloMensagem[];
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  onFechar: () => void;
  onMensagemEnviada: (analisandoId: string, textoMensagem: string, tipoCategoria: string, statusEnvio: 'aberta_whatsapp' | 'preparada') => void;
  valorReferencia?: number;
  dataReferencia?: string;
  horaReferencia?: string;
  servicoReferencia?: string;
}

export default function WhatsAppModal({
  analisando,
  modelos,
  perfil,
  consultorio,
  onFechar,
  onMensagemEnviada,
  valorReferencia,
  dataReferencia,
  horaReferencia,
  servicoReferencia
}: WhatsAppModalProps) {
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState('');
  const [textoMensagem, setTextoMensagem] = useState('');
  const [consentimentoExterno, setConsentimentoExterno] = useState(false);

  // Data e hora do atendimento no fuso da clínica
  const dataHoraClinica = dataReferencia 
    ? `${formatarData(dataReferencia)}${horaReferencia ? ` às ${horaReferencia}` : ''}`
    : formatarDataHora(new Date().toISOString());

  // Gera variáveis para substituição fidedigna
  const variables = {
    nome: analisando.nomeSocial || (analisando.nome ? analisando.nome.split(' ')[0] : 'Paciente'),
    nomeCompleto: analisando.nome,
    analista: perfil.nome,
    empresa: consultorio.nome,
    servico: servicoReferencia || 'nossa sessão de análise',
    valor: valorReferencia ? formatarMoeda(valorReferencia) : '—',
    data: dataHoraClinica,
    horario: horaReferencia || 'conforme combinado',
    pix: perfil.whatsapp || consultorio.whatsapp || 'chave Pix cadastrada no consultório'
  };

  useEffect(() => {
    if (modeloSelecionadoId) {
      const modelo = modelos.find(m => m.id === modeloSelecionadoId);
      if (modelo) {
        setTextoMensagem(substituirVariaveis(modelo.conteudo, variables));
      }
    } else {
      setTextoMensagem('');
    }
  }, [modeloSelecionadoId, modelos]);

  const handleAbrirWhatsApp = () => {
    if (!analisando.whatsapp.trim()) {
      alert('Este paciente não possui número de WhatsApp cadastrado na ficha.');
      return;
    }
    if (!textoMensagem.trim()) {
      alert('Escreva ou selecione uma mensagem antes de prosseguir.');
      return;
    }
    if (!consentimentoExterno) {
      alert('Por favor, confirme que está ciente de que o link redirecionará para os servidores externos do WhatsApp.');
      return;
    }

    const modelo = modelos.find(m => m.id === modeloSelecionadoId);
    const categoria = modelo ? modelo.categoria : 'manual';

    // Ação explícita do profissional
    abrirWhatsApp(analisando.whatsapp, textoMensagem);

    // Registra como "aberta_whatsapp" distinguindo de entrega confirmada
    onMensagemEnviada(analisando.id, textoMensagem, categoria, 'aberta_whatsapp');
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-xl max-h-[94vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Cabeçalho */}
        <div className="gradient-emerald text-primary-foreground px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold">Comunicação Clínica via WhatsApp</h3>
            <p className="text-xs opacity-90 mt-0.5">
              Preparação de notificação com revisão ética prévia
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Informações Prévias de Origem (Destinatário e Horário no Fuso da Clínica) */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                Destinatário:
              </span>
              <strong className="text-foreground">
                {analisando.nome} {analisando.whatsapp ? `(${formatarTelefone(analisando.whatsapp)})` : '(Sem telefone)'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                Data / Horário de Referência:
              </span>
              <span className="font-mono text-foreground font-semibold">
                {dataHoraClinica}
              </span>
            </div>
          </div>

          {/* Seleção do Modelo de Mensagem */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase block">
              Modelo Pré-configurado de Mensagem
            </label>
            <div className="relative">
              <select
                value={modeloSelecionadoId}
                onChange={e => setModeloSelecionadoId(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-10"
              >
                <option value="">— Escrever mensagem personalizada —</option>
                {modelos.map(m => (
                  <option key={m.id} value={m.id}>
                    [{m.categoria.toUpperCase()}] {m.nome}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Texto Completo Revisável Antes do Envio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">
                Texto Completo da Mensagem para Envio
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">
                Revise antes de autorizar a abertura
              </span>
            </div>
            <textarea
              value={textoMensagem}
              onChange={e => setTextoMensagem(e.target.value)}
              rows={6}
              placeholder="Digite o texto da mensagem ou selecione um modelo acima..."
              className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
            />
          </div>

          {/* Distinção de Status & Alerta de Transmissão */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Distinção Importante:</strong> O clique no botão abaixo abrirá o link oficial do WhatsApp Web ou App. Abrir o link <u>não comprova envio ou entrega</u> até que a mensagem seja efetivamente disparada dentro do WhatsApp.
                </p>
                <p className="text-[11px] opacity-90">
                  O registro no prontuário será gravado com o status <code>Aberta no WhatsApp (confirmação externa pendente)</code>.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground pt-1 border-t border-amber-500/20">
              <input
                type="checkbox"
                checked={consentimentoExterno}
                onChange={e => setConsentimentoExterno(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary size-4"
              />
              <span>Autorizo a abertura externa no WhatsApp para este paciente</span>
            </label>
          </div>

        </div>

        {/* Rodapé com Ações */}
        <div className="border-t border-border px-5 py-3.5 flex justify-end gap-2 bg-muted/30 shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleAbrirWhatsApp}
            disabled={!consentimentoExterno || !textoMensagem.trim() || !analisando.whatsapp.trim()}
            className="px-5 py-2 text-xs font-bold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ExternalLink className="size-3.5" />
            <span>Abrir no WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}

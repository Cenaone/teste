import React, { useState, useEffect } from 'react';
import { Analisando, ModeloMensagem, PerfilAnalista, ConsultorioData } from '../types';
import { abrirWhatsApp, substituirVariaveis, formatarMoeda, formatarData } from '../utils/helpers';
import { 
  Send, 
  X, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';

interface WhatsAppModalProps {
  analisando: Analisando;
  modelos: ModeloMensagem[];
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  onFechar: () => void;
  onMensagemEnviada: (analisandoId: string, textoMensagem: string, tipoCategoria: string) => void;
  valorReferencia?: number;
  dataReferencia?: string;
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
  servicoReferencia
}: WhatsAppModalProps) {
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState('');
  const [textoMensagem, setTextoMensagem] = useState('');
  const [consentimentoExterno, setConsentimentoExterno] = useState(false);

  // Generate variables to substitute
  const variables = {
    nome: analisando.nome.split(' ')[0] || analisando.nome,
    analista: perfil.nome,
    empresa: consultorio.nome,
    servico: servicoReferencia || 'nossa sessão de análise',
    valor: valorReferencia ? formatarMoeda(valorReferencia) : '—',
    data: dataReferencia ? formatarData(dataReferencia) : formatarData(new Date().toISOString()),
    pix: perfil.whatsapp || consultorio.whatsapp || 'chave Pix cadastrada'
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

  const handleEnviar = () => {
    if (!analisando.whatsapp.trim()) {
      alert('Este paciente não possui número de WhatsApp cadastrado.');
      return;
    }
    if (!textoMensagem.trim()) {
      alert('Escreva ou selecione uma mensagem antes de prosseguir.');
      return;
    }
    if (!consentimentoExterno) {
      alert('Por favor, confirme que está ciente de que o envio compartilha este contato e texto com os servidores externos do WhatsApp.');
      return;
    }

    const modelo = modelos.find(m => m.id === modeloSelecionadoId);
    const categoria = modelo ? modelo.categoria : 'manual';

    // Ação explícita do profissional
    abrirWhatsApp(analisando.whatsapp, textoMensagem);

    // Registra envio localmente sem dados sensíveis
    onMensagemEnviada(analisando.id, textoMensagem, categoria);
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="gradient-emerald text-primary-foreground px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Contato Clínico via WhatsApp</h3>
            <p className="text-xs opacity-90 mt-0.5">Destinatário: {analisando.nome} ({analisando.whatsapp || 'Sem número'})</p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-2 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Template select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Selecione um Modelo de Mensagem
            </label>
            <div className="relative">
              <select
                value={modeloSelecionadoId}
                onChange={e => setModeloSelecionadoId(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none pr-10"
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

          {/* Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Conteúdo da Mensagem para Envio
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">
                Revise antes de autorizar o envio
              </span>
            </div>
            <textarea
              value={textoMensagem}
              onChange={e => setTextoMensagem(e.target.value)}
              rows={6}
              placeholder="Selecione um modelo acima ou digite sua mensagem personalizada aqui..."
              className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Aviso Explícito de Compartilhamento Externo */}
          <div className="flex gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                <strong>Aviso de Privacidade:</strong> O envio desta mensagem abrirá o aplicativo/web do WhatsApp e transmitirá o número de telefone <code>{analisando.whatsapp || 'não cadastrado'}</code> e o texto acima para os servidores externos da Meta/WhatsApp. Notas de prontuário sigilosas nunca são incluídas automaticamente.
              </p>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground pt-1">
                <input
                  type="checkbox"
                  checked={consentimentoExterno}
                  onChange={e => setConsentimentoExterno(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                <span>Estou ciente e autorizo a transmissão externa ao WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4 flex justify-end gap-2 bg-muted/30">
          <button
            onClick={onFechar}
            className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={!consentimentoExterno || !textoMensagem.trim() || !analisando.whatsapp.trim()}
            className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="size-4" />
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

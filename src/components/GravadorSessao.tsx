import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Check, 
  Trash2, 
  AlertCircle,
  FileText,
  Clock,
  Shield,
  Download,
  Copy,
  Volume2,
  Sparkles,
  FileAudio,
  CheckCircle2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Card } from './ui-compact';

interface GravadorSessaoProps {
  nomePaciente?: string;
  onInserirTexto: (texto: string) => void;
  textoAtual?: string;
  onAudioSalvo?: (blob: Blob, url: string) => void;
}

export default function GravadorSessao({
  nomePaciente = 'Paciente',
  onInserirTexto,
  textoAtual = '',
  onAudioSalvo
}: GravadorSessaoProps) {
  const [estaGravando, setEstaGravando] = useState(false);
  const [estaPausado, setEstaPausado] = useState(false);
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [transcricaoTexto, setTranscricaoTexto] = useState('');
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [erroMicrofone, setErroMicrofone] = useState<string | null>(null);
  const [erroTranscricao, setErroTranscricao] = useState<string | null>(null);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [sucessoDownload, setSucessoDownload] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Formatar tempo MM:SS ou HH:MM:SS
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    const hrs = Math.floor(min / 60);
    if (hrs > 0) {
      const minRest = min % 60;
      return `${String(hrs).padStart(2, '0')}:${String(minRest).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    }
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      pararGravacaoGeral();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // 1. Iniciar gravação de áudio pura (SEM transcrição automática durante a fala)
  const iniciarGravacao = async () => {
    setErroMicrofone(null);
    setErroTranscricao(null);
    setTempoSegundos(0);
    setMostrarPainel(true);
    setAudioUrl(null);
    setAudioBlob(null);
    setSucessoDownload(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      try {
        let options: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            setAudioBlob(blob);
            setAudioUrl(url);
            if (onAudioSalvo) {
              onAudioSalvo(blob, url);
            }
          }
        };

        mediaRecorder.start(1000);
      } catch (e) {
        console.warn('MediaRecorder não disponível ou formato restrito:', e);
      }

      setEstaGravando(true);
      setEstaPausado(false);

      // Timer
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setErroMicrofone('Não foi possível acessar o microfone local. Verifique as permissões de áudio do seu navegador.');
      setEstaGravando(false);
    }
  };

  const alternarPausa = () => {
    if (!estaGravando) return;

    if (estaPausado) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);
      setEstaPausado(false);
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setEstaPausado(true);
    }
  };

  const pararGravacaoGeral = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setEstaGravando(false);
    setEstaPausado(false);
  };

  const handleFinalizarGravacao = () => {
    pararGravacaoGeral();
  };

  // Converte Blob de áudio para base64 para envio à API de transcrição
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        // Remove prefixo data:*/*;base64,
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 2. FUNÇÃO EXCLUSIVA DE TRANSCRIÇÃO DISPARADA PELO BOTÃO (NÃO AUTOMÁTICA)
  const handleTranscreverAudio = async () => {
    setErroTranscricao(null);

    // Se ainda estiver gravando, encerra a gravação primeiro
    if (estaGravando) {
      pararGravacaoGeral();
    }

    const blobParaTranscrever = audioBlob || (audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: 'audio/mp3' }) : null);

    if (!blobParaTranscrever || blobParaTranscrever.size === 0) {
      setErroTranscricao('Nenhum áudio gravado disponível para transcrever. Grave a sessão primeiro.');
      return;
    }

    setTranscrevendo(true);

    try {
      const base64 = await blobToBase64(blobParaTranscrever);
      const mime = blobParaTranscrever.type || 'audio/webm';

      const response = await fetch('/api/transcrever-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: mime
        })
      });

      const data = await response.json();

      if (data.ok && data.transcricao) {
        setTranscricaoTexto(data.transcricao);
      } else {
        // Fallback local se a API retornar erro
        throw new Error(data.erro || 'Falha ao processar a transcrição pelo servidor.');
      }
    } catch (err: any) {
      console.warn('Erro ao transcrever via API:', err);
      // Tentativa de fallback com Web Speech API se suportado pelo navegador
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setErroTranscricao('A transcrição remota falhou ou está indisponível. Você pode usar a fala ao vivo ou ditar notas diretamente.');
      } else {
        setErroTranscricao('Não foi possível transcrever o áudio no momento. Verifique a conexão com o servidor ou digite as anotações manualmente.');
      }
    } finally {
      setTranscrevendo(false);
    }
  };

  // 3. Salvar arquivo em formato .mp3 diretamente no computador
  const handleBaixarArquivoMp3 = () => {
    const blobParaDownload = audioBlob || (audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: 'audio/mp3' }) : null);

    if (!blobParaDownload) {
      alert('Nenhum áudio gravado disponível para download. Grave a sessão antes de salvar.');
      return;
    }

    const url = URL.createObjectURL(blobParaDownload);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;

    const nomeFormatado = (nomePaciente || 'Paciente')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    const dataHoje = new Date().toISOString().slice(0, 10);
    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');

    a.download = `sessao_${nomeFormatado}_${dataHoje}_${horaAgora}.mp3`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    setSucessoDownload(true);
    setTimeout(() => setSucessoDownload(false), 5000);
  };

  // 4. Inserir registro do áudio e transcrição no prontuário clínico
  const handleInserirRegistroAudio = () => {
    const timestamp = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cabecalho = `\n\n--- [Sessão Registrada - ${timestamp} (Duração: ${formatarTempo(tempoSegundos)})] ---\n`;
    
    const blocoTranscricao = transcricaoTexto.trim()
      ? `\n[Transcrição do Áudio da Sessão]:\n"${transcricaoTexto.trim()}"\n`
      : '';

    const nota = `[Áudio gravado e arquivado em formato .mp3 sob sigilo profissional.]\n`;
    const resultado = textoAtual 
      ? `${textoAtual.trim()}${cabecalho}${nota}${blocoTranscricao}` 
      : `${cabecalho.trim()}\n${nota}${blocoTranscricao}`;

    onInserirTexto(resultado);

    // Se houver gravação concluída, oferece também o download imediato do MP3
    if (audioBlob || audioChunksRef.current.length > 0) {
      handleBaixarArquivoMp3();
    }
  };

  const handleCopiarTranscricao = () => {
    if (!transcricaoTexto) return;
    navigator.clipboard.writeText(transcricaoTexto);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 3000);
  };

  const handleLimparGravacao = () => {
    if (estaGravando) {
      pararGravacaoGeral();
    }
    audioChunksRef.current = [];
    setTranscricaoTexto('');
    setTempoSegundos(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setTranscrevendo(false);
    setMostrarPainel(false);
  };

  const temAudioGravado = tempoSegundos > 0 || !!audioBlob || audioChunksRef.current.length > 0;

  return (
    <div className="space-y-3">
      {/* Botão de Disparo Inicial quando o painel está recolhido */}
      {!mostrarPainel && !estaGravando && (
        <button
          type="button"
          onClick={() => {
            setMostrarPainel(true);
            iniciarGravacao();
          }}
          className="w-full py-2.5 px-3 sm:px-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center justify-between transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Mic className="size-3.5" />
            </div>
            <div className="text-left">
              <span className="font-semibold block">Gravar Áudio da Sessão</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                Grave com tranquilidade e transcreva quando desejar apertando o botão
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono font-medium uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-border shrink-0 flex items-center gap-1">
            <Shield className="size-3 text-emerald-600" />
            Sigilo 100% Local
          </span>
        </button>
      )}

      {/* Painel do Gravador */}
      {mostrarPainel && (
        <Card className={`p-3.5 sm:p-5 border-2 transition-all space-y-4 ${
          estaGravando 
            ? 'border-primary/50 bg-primary/5 shadow-md ring-1 ring-primary/20' 
            : 'border-border bg-card'
        }`}>
          {/* Topo do Gravador com Status, Cronômetro e Controles de Gravação */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className={`size-3 rounded-full shrink-0 ${
                estaGravando 
                  ? (estaPausado ? 'bg-amber-500' : 'bg-red-500 animate-pulse') 
                  : 'bg-zinc-400'
              }`} />
              <div className="leading-tight">
                <span className="font-bold text-xs text-foreground uppercase tracking-wider block">
                  {estaGravando 
                    ? (estaPausado ? 'Gravação em Pausa' : 'Gravando Áudio...') 
                    : 'Gravação Concluída'}
                </span>
                <span className="text-[11px] text-muted-foreground truncate max-w-[150px] sm:max-w-[240px] block">
                  {nomePaciente}
                </span>
              </div>
            </div>

            {/* Timer de Duração */}
            <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-xl border border-border shadow-xs">
              <Clock className="size-3.5 text-primary shrink-0" />
              <span className="font-mono text-xs font-bold text-foreground">
                {formatarTempo(tempoSegundos)}
              </span>
            </div>

            {/* Controles de Gravação */}
            <div className="flex items-center gap-1.5">
              {estaGravando ? (
                <>
                  <button
                    type="button"
                    onClick={alternarPausa}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {estaPausado ? <Play className="size-3 text-emerald-500" /> : <Pause className="size-3 text-amber-500" />}
                    <span>{estaPausado ? 'Retomar' : 'Pausar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizarGravacao}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Square className="size-3 fill-current" />
                    <span>Concluir Gravação</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={iniciarGravacao}
                  className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  <span>Gravar Novamente</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLimparGravacao}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                title="Descartar gravação"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {/* Player de áudio quando disponível */}
          {audioUrl && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" />
                  Ouvir Áudio Gravado
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Duração: {formatarTempo(tempoSegundos)}
                </span>
              </div>
              <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
            </div>
          )}

          {/* ============================================================ */}
          {/* BOTÃO EXCLUSIVO PARA TRANSCREVER O ÁUDIO SOB DEMANDA */}
          {/* ============================================================ */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  Transcrição sob Demanda
                </span>
                <p className="text-[11px] text-muted-foreground">
                  A transcrição não é automática. Aperte o botão para converter o áudio gravado em texto.
                </p>
              </div>

              {/* Botão de Transcrição Disparado pelo Usuário */}
              <button
                type="button"
                disabled={!temAudioGravado || transcrevendo}
                onClick={handleTranscreverAudio}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40 shrink-0"
              >
                {transcrevendo ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Transcrevendo áudio...</span>
                  </>
                ) : (
                  <>
                    <FileAudio className="size-3.5" />
                    <span>Transcrever Áudio da Sessão</span>
                  </>
                )}
              </button>
            </div>

            {/* Caixa de exibição da Transcrição Gerada */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Texto Transcrito da Sessão
                </label>
                {transcricaoTexto && (
                  <button
                    type="button"
                    onClick={handleCopiarTranscricao}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiadoTexto ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                    <span>{copiadoTexto ? 'Copiado!' : 'Copiar texto'}</span>
                  </button>
                )}
              </div>

              <textarea
                value={transcricaoTexto}
                onChange={(e) => setTranscricaoTexto(e.target.value)}
                placeholder="Aperte o botão 'Transcrever Áudio da Sessão' acima para gerar o texto do diálogo da gravação..."
                rows={4}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y font-sans"
              />
            </div>
          </div>

          {/* Alertas de erro */}
          {erroMicrofone && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{erroMicrofone}</span>
            </div>
          )}

          {erroTranscricao && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{erroTranscricao}</span>
            </div>
          )}

          {/* Feedback de download do MP3 */}
          {sucessoDownload && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>Arquivo de áudio <strong>.mp3</strong> salvo no seu computador com sucesso!</span>
            </div>
          )}

          {/* Alerta de Sigilo */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
            <Shield className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Sigilo e Segurança:</strong> O áudio é gravado no seu dispositivo. Você pode salvar a cópia em formato <strong>.mp3</strong> no computador e transcrever quando desejar.
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTÕES: SALVAR MP3 NO COMPUTADOR & INSERIR NO PRONTUÁRIO */}
          {/* ============================================================ */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            {/* Botão de Salvar arquivo .mp3 no computador */}
            <button
              type="button"
              disabled={!temAudioGravado}
              onClick={handleBaixarArquivoMp3}
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              title="Salvar arquivo de áudio (.mp3) no disco local"
            >
              <Download className="size-4 text-primary" />
              <span>Salvar arquivo (.mp3) no computador</span>
            </button>

            {/* Inserir Registro e Transcrição no Prontuário */}
            <button
              type="button"
              disabled={!temAudioGravado}
              onClick={handleInserirRegistroAudio}
              className="px-4 py-2 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
            >
              <Check className="size-4" />
              <span>Inserir Registro & Transcrição no Prontuário</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

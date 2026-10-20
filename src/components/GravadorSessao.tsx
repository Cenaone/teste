import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Pause, 
  Play, 
  Check, 
  Trash2, 
  AlertCircle,
  Clock,
  Shield,
  Copy,
  Volume2,
  Sparkles,
  FileAudio,
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const estaGravandoRef = useRef(false);
  const estaPausadoRef = useRef(false);

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

  // Inicializa o reconhecimento de fala contínuo e automático
  const iniciarReconhecimentoAoVivo = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('SpeechRecognition não é suportado nativamente neste navegador.');
        return;
      }

      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      let textoBase = transcricaoTexto ? transcricaoTexto.trim() + ' ' : '';

      recognition.onresult = (event: any) => {
        let textoFinal = '';
        let textoIntermediario = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            textoFinal += item[0].transcript + ' ';
          } else {
            textoIntermediario += item[0].transcript;
          }
        }

        if (textoFinal) {
          textoBase += textoFinal;
          setTranscricaoTexto((textoBase + textoIntermediario).trim());
        } else if (textoIntermediario) {
          setTranscricaoTexto((textoBase + textoIntermediario).trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[SpeechRecognition erro]:', event.error);
        }
      };

      recognition.onend = () => {
        // Reinicia automaticamente se ainda estiver no estado gravando e não pausado
        if (estaGravandoRef.current && !estaPausadoRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Erro ao disparar SpeechRecognition:', e);
    }
  };

  const pararReconhecimentoAoVivo = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
  };

  // 1. Iniciar gravação de áudio E transcrição automática imediata
  const iniciarGravacao = async () => {
    setErroMicrofone(null);
    setErroTranscricao(null);
    setTempoSegundos(0);
    setMostrarPainel(true);
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    estaGravandoRef.current = true;
    estaPausadoRef.current = false;

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
            const mime = audioChunksRef.current[0]?.type || 'audio/webm';
            const blob = new Blob(audioChunksRef.current, { type: mime });
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

      // Inicia imediatamente a transcrição ao vivo por voz
      iniciarReconhecimentoAoVivo();

      // Timer
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setErroMicrofone('Não foi possível acessar o microfone. Verifique as permissões de áudio do seu navegador.');
      setEstaGravando(false);
      estaGravandoRef.current = false;
    }
  };

  const alternarPausa = () => {
    if (!estaGravando) return;

    if (estaPausado) {
      // Retomar
      estaPausadoRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      iniciarReconhecimentoAoVivo();
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);
      setEstaPausado(false);
    } else {
      // Pausar
      estaPausadoRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      pararReconhecimentoAoVivo();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setEstaPausado(true);
    }
  };

  const pararGravacaoGeral = () => {
    estaGravandoRef.current = false;
    estaPausadoRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    pararReconhecimentoAoVivo();

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

  const handleFinalizarGravacao = async () => {
    pararGravacaoGeral();
    // Se a transcrição ao vivo não captou ou para melhorar pontuação via IA:
    setTimeout(() => {
      verificarOuRefinarTranscricaoServidor();
    }, 600);
  };

  // Converte Blob de áudio para base64 para envio à API de transcrição
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Refina ou gera a transcrição pelo modelo do servidor (Gemini 2.5 Flash)
  const verificarOuRefinarTranscricaoServidor = async () => {
    const blobParaTranscrever = audioBlob || (audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: 'audio/webm' }) : null);

    if (!blobParaTranscrever || blobParaTranscrever.size === 0) {
      return;
    }

    // Se já temos transcrição ao vivo extensa, só tenta se solicitado ou se estiver vazio
    setTranscrevendo(true);
    setErroTranscricao(null);

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

      if (data.ok && data.transcricao && data.transcricao.trim()) {
        setTranscricaoTexto(data.transcricao.trim());
      }
    } catch (err: any) {
      console.warn('Transcrição remota não disponível, preservando transcrição em tempo real:', err);
    } finally {
      setTranscrevendo(false);
    }
  };

  const handleTranscreverManualmente = async () => {
    if (estaGravando) {
      pararGravacaoGeral();
    }
    await verificarOuRefinarTranscricaoServidor();
  };

  // Inserir registro e transcrição clínica no prontuário sem opção de baixar áudio
  const handleInserirRegistroAudio = () => {
    const timestamp = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cabecalho = `\n\n--- [Sessão Registrada - ${timestamp} (Duração: ${formatarTempo(tempoSegundos)})] ---\n`;
    
    const blocoTranscricao = transcricaoTexto.trim()
      ? `\n[Transcrição Automática da Sessão]:\n"${transcricaoTexto.trim()}"\n`
      : '\n[Áudio registrado na sessão clínica.]\n';

    const nota = `[Registro clínico gravado e protegido sob sigilo profissional.]\n`;
    const resultado = textoAtual 
      ? `${textoAtual.trim()}${cabecalho}${nota}${blocoTranscricao}` 
      : `${cabecalho.trim()}\n${nota}${blocoTranscricao}`;

    onInserirTexto(resultado);
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
                A transcrição automática é realizada em tempo real enquanto você grava
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono font-medium uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-border shrink-0 flex items-center gap-1">
            <Shield className="size-3 text-emerald-600" />
            Transcrição Automática
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
                    ? (estaPausado ? 'Gravação em Pausa' : 'Gravando e Transcrevendo...') 
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

          {/* Player de áudio interno da sessão quando disponível */}
          {audioUrl && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="size-3.5 text-primary" />
                  Reproduzir Áudio da Sessão
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Duração: {formatarTempo(tempoSegundos)}
                </span>
              </div>
              <audio src={audioUrl} controls className="w-full h-9 rounded-lg" />
            </div>
          )}

          {/* Bloco de Transcrição Automática */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" />
                  Transcrição Automática da Sessão
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {estaGravando 
                    ? 'Capturando e transcrevendo a fala em tempo real...' 
                    : 'Texto transcrito pronto para conferência e inserção no prontuário.'}
                </p>
              </div>

              {/* Botão de Refinar Transcrição com IA */}
              <button
                type="button"
                disabled={!temAudioGravado || transcrevendo}
                onClick={handleTranscreverManualmente}
                className="px-3.5 py-1.5 rounded-xl border border-primary/30 bg-background hover:bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
                title="Refinar pontuação e formatação com Inteligência Artificial"
              >
                {transcrevendo ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Ajustando texto...</span>
                  </>
                ) : (
                  <>
                    <FileAudio className="size-3.5" />
                    <span>Refinar Transcrição</span>
                  </>
                )}
              </button>
            </div>

            {/* Caixa de exibição da Transcrição Gerada */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Texto Transcrito
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
                placeholder="A transcrição do áudio aparecerá aqui automaticamente durante a gravação..."
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

          {/* Alerta de Sigilo Profissional */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
            <Shield className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Sigilo e Privacidade:</strong> O diálogo da sessão é transcrito para fins de evolução clínica e incorporado ao prontuário sob sigilo profissional.
            </div>
          </div>

          {/* Botão de Inserção Direta no Prontuário */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              disabled={!temAudioGravado && !transcricaoTexto.trim()}
              onClick={handleInserirRegistroAudio}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-40"
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

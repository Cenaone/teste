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
  ShieldCheck,
  Copy,
  Volume2,
  Sparkles,
  RefreshCw,
  Loader2,
  Download,
  Info,
  Plus
} from 'lucide-react';
import { Card } from './ui-compact';

interface GravadorSessaoProps {
  nomePaciente?: string;
  onInserirTexto: (texto: string) => void;
  textoAtual?: string;
  onAudioGravado?: (blob: Blob, url: string, transcricao: string) => void;
}

type EstadoGravador = 'ocioso' | 'gravando' | 'pausado' | 'processando' | 'concluido' | 'falha';

export default function GravadorSessao({
  nomePaciente = 'Paciente',
  onInserirTexto,
  textoAtual = '',
  onAudioGravado
}: GravadorSessaoProps) {
  const [estado, setEstado] = useState<EstadoGravador>('ocioso');
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [transcricaoTexto, setTranscricaoTexto] = useState('');
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [suportaFalaAoVivo, setSuportaFalaAoVivo] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const estadoRef = useRef<EstadoGravador>('ocioso');
  const transcricaoTextoRef = useRef('');

  // Sincroniza ref com estado
  useEffect(() => {
    transcricaoTextoRef.current = transcricaoTexto;
  }, [transcricaoTexto]);

  // Verifica suporte da API de Fala contínua do navegador na montagem
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSuportaFalaAoVivo(Boolean(SpeechRecognition));

    return () => {
      pararHardware();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

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

  const pararHardware = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Inicia reconhecimento de fala ao vivo via Web Speech API nativa se suportada
  const iniciarFalaAoVivo = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      let baseTexto = transcricaoTextoRef.current ? transcricaoTextoRef.current.trim() + ' ' : '';

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
          baseTexto += textoFinal;
          const completo = (baseTexto + textoIntermediario).trim();
          transcricaoTextoRef.current = completo;
          setTranscricaoTexto(completo);
          onInserirTexto(completo);
        } else if (textoIntermediario) {
          const completo = (baseTexto + textoIntermediario).trim();
          transcricaoTextoRef.current = completo;
          setTranscricaoTexto(completo);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[WebSpeech erro]:', event.error);
        }
      };

      recognition.onend = () => {
        // Reinicia se o gravador ainda estiver no estado gravando e não pausado
        if (estadoRef.current === 'gravando') {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('[SpeechRecognition falha]:', err);
    }
  };

  // Converte Blob para base64 para envio à API do servidor quando necessário
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

  // Processa áudio após o término no servidor (Gemini 2.5 Flash) se necessário
  const processarTranscricaoServidor = async (blob: Blob) => {
    // Se a transcrição ao vivo já capturou o texto do paciente, mantém com sucesso imediato
    if (transcricaoTextoRef.current.trim()) {
      setEstado('concluido');
      estadoRef.current = 'concluido';
      setErroMensagem(null);
      if (onAudioGravado && audioUrl) {
        onAudioGravado(blob, audioUrl, transcricaoTextoRef.current.trim());
      }
      return;
    }

    setEstado('processando');
    estadoRef.current = 'processando';
    setErroMensagem(null);

    try {
      const base64 = await blobToBase64(blob);
      const mime = blob.type || 'audio/webm';

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
        transcricaoTextoRef.current = data.transcricao;
        setEstado('concluido');
        estadoRef.current = 'concluido';
        if (onAudioGravado && audioUrl) {
          onAudioGravado(blob, audioUrl, data.transcricao);
        }
        onInserirTexto(data.transcricao);
      } else {
        // Se a transcrição ao vivo já havia captado algo, mantém
        if (transcricaoTextoRef.current.trim()) {
          setEstado('concluido');
          estadoRef.current = 'concluido';
          setErroMensagem(null);
        } else {
          setEstado('falha');
          estadoRef.current = 'falha';
          setErroMensagem(data.erro || 'Não foi possível transcrever o áudio automaticamente.');
        }
      }
    } catch (err: any) {
      console.warn('[Erro transcrição servidor]:', err);
      if (transcricaoTextoRef.current.trim()) {
        setEstado('concluido');
        estadoRef.current = 'concluido';
        setErroMensagem(null);
      } else {
        setEstado('falha');
        estadoRef.current = 'falha';
        setErroMensagem('Falha na conexão com o serviço de transcrição. O áudio foi preservado e você pode digitar as notas.');
      }
    }
  };

  // 1. Iniciar Gravação
  const iniciarGravacao = async () => {
    setErroMensagem(null);
    setTempoSegundos(0);
    audioChunksRef.current = [];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

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

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const mime = audioChunksRef.current[0]?.type || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioUrl(url);

          const textoCapturado = transcricaoTextoRef.current.trim();

          // Se a fala ao vivo já reconheceu o texto, conclui com êxito e preserva o áudio e texto
          if (textoCapturado) {
            setEstado('concluido');
            estadoRef.current = 'concluido';
            setErroMensagem(null);
            if (onAudioGravado) {
              onAudioGravado(blob, url, textoCapturado);
            }
            onInserirTexto(textoCapturado);
          } else {
            await processarTranscricaoServidor(blob);
          }
        }
      };

      mediaRecorder.start(1000);

      setEstado('gravando');
      estadoRef.current = 'gravando';

      // Dispara transcrição de fala contínua imediatamente
      iniciarFalaAoVivo();

      // Timer
      timerRef.current = setInterval(() => {
        setTempoSegundos(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('[Microfone]:', err);
      setEstado('falha');
      estadoRef.current = 'falha';
      setErroMensagem('Permissão de microfone negada ou dispositivo indisponível. Verifique as configurações de áudio do seu navegador.');
    }
  };

  // 2. Pausar / Retomar
  const alternarPausa = () => {
    if (estado === 'gravando') {
      // Pausa
      setEstado('pausado');
      estadoRef.current = 'pausado';

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (estado === 'pausado') {
      // Retoma
      setEstado('gravando');
      estadoRef.current = 'gravando';

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      iniciarFalaAoVivo();
      timerRef.current = setInterval(() => {
        setTempoSegundos(prev => prev + 1);
      }, 1000);
    }
  };

  // 3. Concluir / Parar Gravação
  const finalizarGravacao = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (transcricaoTextoRef.current.trim()) {
      setEstado('concluido');
      estadoRef.current = 'concluido';
      setErroMensagem(null);
    } else {
      setEstado('processando');
      estadoRef.current = 'processando';
    }
  };

  // 4. Descartar gravação atual para recomeçar
  const descartarGravacao = () => {
    pararHardware();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    audioChunksRef.current = [];
    setTranscricaoTexto('');
    transcricaoTextoRef.current = '';
    setTempoSegundos(0);
    setErroMensagem(null);
    setEstado('ocioso');
    estadoRef.current = 'ocioso';
  };

  // Inserir a transcrição obtida nas notas da sessão
  const handleInserirNasNotas = () => {
    if (!transcricaoTexto.trim()) return;

    let novoConteudo = textoAtual ? `${textoAtual}\n\n` : '';
    novoConteudo += `--- Transcrição do Diálogo da Sessão (${nomePaciente}) ---\n${transcricaoTexto.trim()}`;

    onInserirTexto(novoConteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Card className="p-4 sm:p-5 border-border bg-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${
            estado === 'gravando'
              ? 'bg-rose-500/20 text-rose-500 animate-pulse'
              : estado === 'pausado'
              ? 'bg-amber-500/20 text-amber-500'
              : estado === 'processando'
              ? 'bg-primary/20 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Mic className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">
              Gravação de Áudio & Transcrição da Sessão
            </h4>
            <p className="text-xs text-muted-foreground">
              Atendimento com: <strong className="text-foreground">{nomePaciente}</strong>
            </p>
          </div>
        </div>

        {/* Badge de Estado Atual */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            estado === 'gravando'
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse'
              : estado === 'pausado'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              : estado === 'processando'
              ? 'bg-primary/15 text-primary'
              : estado === 'concluido'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : estado === 'falha'
              ? 'bg-destructive/15 text-destructive'
              : 'bg-muted text-muted-foreground'
          }`}>
            {estado === 'ocioso' && 'Pronto para Gravar'}
            {estado === 'gravando' && `Gravando (${formatarTempo(tempoSegundos)})`}
            {estado === 'pausado' && `Pausado (${formatarTempo(tempoSegundos)})`}
            {estado === 'processando' && 'Processando Transcrição...'}
            {estado === 'concluido' && 'Gravação & Transcrição Concluídas'}
            {estado === 'falha' && 'Falha no Processamento'}
          </span>
        </div>
      </div>

      {/* Informativo de Tecnologia e Privacidade Ética */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p>
            {suportaFalaAoVivo
              ? 'Seu navegador suporta reconhecimento de fala contínuo em tempo real. O diálogo é transcrito conforme você fala.'
              : 'Seu navegador processará a transcrição completa do diálogo automaticamente no término da gravação através do processamento seguro do servidor.'
            }
          </p>
          <span className="text-[11px] text-muted-foreground block">
            Armazenamento seguro e confidencial do consultório sob guarda do profissional responsável.
          </span>
        </div>
      </div>

      {/* Alerta de Erro */}
      {erroMensagem && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{erroMensagem}</span>
          </div>
          {audioBlob && (
            <button
              type="button"
              onClick={() => processarTranscricaoServidor(audioBlob)}
              className="text-xs underline font-bold shrink-0 cursor-pointer"
            >
              Tentar Novamente
            </button>
          )}
        </div>
      )}

      {/* Barra de Controles de Gravação */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {estado === 'ocioso' && (
          <button
            type="button"
            onClick={iniciarGravacao}
            className="px-5 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Mic className="size-4" />
            <span>Iniciar Gravação e Transcrição</span>
          </button>
        )}

        {(estado === 'gravando' || estado === 'pausado') && (
          <>
            <button
              type="button"
              onClick={alternarPausa}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
                estado === 'pausado'
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {estado === 'pausado' ? <Play className="size-4" /> : <Pause className="size-4" />}
              <span>{estado === 'pausado' ? 'Retomar Gravação' : 'Pausar Gravação'}</span>
            </button>

            <button
              type="button"
              onClick={finalizarGravacao}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Square className="size-4" />
              <span>Concluir Gravação</span>
            </button>
          </>
        )}

        {estado === 'processando' && (
          <div className="flex items-center gap-2 text-xs font-bold text-primary py-2 px-3">
            <Loader2 className="size-4 animate-spin" />
            <span>Processando áudio e gerando transcrição fiel...</span>
          </div>
        )}

        {(estado === 'concluido' || estado === 'falha') && (
          <button
            type="button"
            onClick={descartarGravacao}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Gravar Nova Sessão</span>
          </button>
        )}
      </div>

      {/* Player de Áudio Gravado */}
      {audioUrl && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-primary" />
              Áudio Gravado da Sessão ({formatarTempo(tempoSegundos)})
            </span>
            <a
              href={audioUrl}
              download={`sessao_${nomePaciente.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.webm`}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
            >
              <Download className="size-3.5" />
              <span>Baixar Áudio (.webm)</span>
            </a>
          </div>
          <audio controls src={audioUrl} className="w-full h-9 rounded-lg" />
        </div>
      )}

      {/* Caixa de Exibição da Transcrição Real */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Transcrição Textual da Sessão
          </label>

          {transcricaoTexto.trim() && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInserirNasNotas}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiado ? <Check className="size-3.5 text-emerald-600" /> : <Plus className="size-3.5" />}
                <span>{copiado ? 'Inserido no Prontuário!' : 'Inserir nas Anotações da Sessão'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <textarea
            rows={5}
            readOnly={estado === 'gravando'}
            value={transcricaoTexto}
            onChange={e => {
              const val = e.target.value;
              setTranscricaoTexto(val);
              transcricaoTextoRef.current = val;
              onInserirTexto(val);
            }}
            placeholder={
              estado === 'gravando'
                ? 'Gravando... As falas da sessão estão sendo captadas e transcritas...'
                : 'A transcrição automática da gravação de áudio aparecerá aqui. Você poderá editar o texto livremente antes de inseri-lo no prontuário.'
            }
            className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y font-mono"
          />
        </div>
      </div>
    </Card>
  );
}

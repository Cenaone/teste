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
  Copy, 
  Volume2, 
  Sparkles, 
  Loader2, 
  Download, 
  Info, 
  Plus,
  Upload,
  Radio,
  FileAudio
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
  const [estaOuvindoFala, setEstaOuvindoFala] = useState(false);
  const [statusPermissaoMic, setStatusPermissaoMic] = useState<'concedida' | 'solicitando' | 'negada' | 'desconhecido'>('desconhecido');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const estadoRef = useRef<EstadoGravador>('ocioso');
  const transcricaoTextoRef = useRef('');
  const textoFinalAcumuladoRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sincroniza ref com estado
  useEffect(() => {
    transcricaoTextoRef.current = transcricaoTexto;
  }, [transcricaoTexto]);

  // Sincroniza estadoRef
  useEffect(() => {
    estadoRef.current = estado;
  }, [estado]);

  // Verifica suporte da API de Fala contínua e status de permissão de microfone
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSuportaFalaAoVivo(Boolean(SpeechRecognition));

    if (navigator?.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' as any })
        .then(res => {
          if (res.state === 'granted') setStatusPermissaoMic('concedida');
          else if (res.state === 'denied') setStatusPermissaoMic('negada');
          else setStatusPermissaoMic('solicitando');

          res.onchange = () => {
            if (res.state === 'granted') setStatusPermissaoMic('concedida');
            else if (res.state === 'denied') setStatusPermissaoMic('negada');
            else setStatusPermissaoMic('solicitando');
          };
        })
        .catch(() => {
          setStatusPermissaoMic('desconhecido');
        });
    }

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
        speechRecognitionRef.current.abort();
      } catch (_) {}
      speechRecognitionRef.current = null;
      setEstaOuvindoFala(false);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      streamRef.current = null;
    }
  };

  // Inicia reconhecimento de fala ao vivo via Web Speech API nativa se suportada
  const iniciarFalaAoVivo = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (_) {}
        speechRecognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setEstaOuvindoFala(true);
      };

      recognition.onresult = (event: any) => {
        let textoFinalDestaSessao = '';
        let textoIntermediario = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            textoFinalDestaSessao += item[0].transcript + ' ';
          } else {
            textoIntermediario += item[0].transcript;
          }
        }

        if (textoFinalDestaSessao) {
          const anterior = textoFinalAcumuladoRef.current ? textoFinalAcumuladoRef.current.trim() + ' ' : '';
          textoFinalAcumuladoRef.current = (anterior + textoFinalDestaSessao).trim();
        }

        const completo = (
          (textoFinalAcumuladoRef.current ? textoFinalAcumuladoRef.current.trim() + ' ' : '') + 
          textoIntermediario
        ).trim();

        if (completo) {
          transcricaoTextoRef.current = completo;
          setTranscricaoTexto(completo);
          onInserirTexto(completo);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('[WebSpeech reconhecimento aviso]:', event.error);
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setEstaOuvindoFala(false);
        }
      };

      recognition.onend = () => {
        setEstaOuvindoFala(false);
        // Reinicia de forma resiliente caso o usuário ainda esteja com a sessão gravando
        if (estadoRef.current === 'gravando') {
          try {
            recognition.start();
            setEstaOuvindoFala(true);
          } catch (_) {}
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('[SpeechRecognition falha de inicialização]:', err);
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

  // Processa áudio no servidor (Gemini 3.5 Transcribe / 3.8 Flash)
  const processarTranscricaoServidor = async (blob: Blob, urlFornecida?: string) => {
    const finalUrl = urlFornecida || audioUrl || URL.createObjectURL(blob);
    if (!audioUrl && finalUrl) {
      setAudioUrl(finalUrl);
    }

    // Se já capturamos o diálogo completo via fala contínua, consolida diretamente
    if (transcricaoTextoRef.current.trim()) {
      const textoFinal = transcricaoTextoRef.current.trim();
      setEstado('concluido');
      estadoRef.current = 'concluido';
      setErroMensagem(null);
      if (onAudioGravado) {
        onAudioGravado(blob, finalUrl, textoFinal);
      }
      onInserirTexto(textoFinal);
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
        setErroMensagem(null);
        if (onAudioGravado) {
          onAudioGravado(blob, finalUrl, data.transcricao);
        }
        onInserirTexto(data.transcricao);
      } else {
        // Se a fala local já tiver algum texto, preserva
        if (transcricaoTextoRef.current.trim()) {
          const texto = transcricaoTextoRef.current.trim();
          setEstado('concluido');
          estadoRef.current = 'concluido';
          setErroMensagem(null);
          if (onAudioGravado) {
            onAudioGravado(blob, finalUrl, texto);
          }
          onInserirTexto(texto);
        } else {
          setEstado('falha');
          estadoRef.current = 'falha';
          setErroMensagem(data.erro || 'Não foi possível transcrever automaticamente. Você pode digitar as anotações livremente.');
        }
      }
    } catch (err: any) {
      console.warn('[Erro transcrição servidor]:', err);
      if (transcricaoTextoRef.current.trim()) {
        const texto = transcricaoTextoRef.current.trim();
        setEstado('concluido');
        estadoRef.current = 'concluido';
        setErroMensagem(null);
        if (onAudioGravado) {
          onAudioGravado(blob, finalUrl, texto);
        }
        onInserirTexto(texto);
      } else {
        setEstado('falha');
        estadoRef.current = 'falha';
        setErroMensagem('Falha na comunicação com o serviço de transcrição. O áudio foi mantido intacto no prontuário.');
      }
    }
  };

  // Obter stream de microfone com tolerância máxima a dispositivos e navegadores
  const obterMediaStream = async (): Promise<MediaStream> => {
    const nav = navigator as any;

    if (nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function') {
      try {
        // Tenta com parâmetros ideais para voz clínica
        return await nav.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (errRestricao) {
        console.warn('[Microfone ideal falhou, tentando fallback simples]:', errRestricao);
        // Fallback para áudio sem restrições
        return await nav.mediaDevices.getUserMedia({ audio: true });
      }
    }

    // Suporte a navegadores mais antigos ou webviews
    const legacyGUM = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;
    if (legacyGUM) {
      return new Promise<MediaStream>((resolve, reject) => {
        legacyGUM.call(nav, { audio: true }, resolve, reject);
      });
    }

    throw new Error('Dispositivo de microfone não suportado pelo navegador atual.');
  };

  // 1. Iniciar Gravação
  const iniciarGravacao = async () => {
    setErroMensagem(null);
    setTempoSegundos(0);
    audioChunksRef.current = [];
    textoFinalAcumuladoRef.current = '';

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    try {
      const stream = await obterMediaStream();
      streamRef.current = stream;

      // Seleção de melhor formato compatível para MediaRecorder
      let options: MediaRecorderOptions | undefined = undefined;
      const tiposPossiveis = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/aac'
      ];

      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const t of tiposPossiveis) {
          try {
            if (MediaRecorder.isTypeSupported(t)) {
              options = { mimeType: t };
              break;
            }
          } catch (_) {}
        }
      }

      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      } catch (eOpt) {
        console.warn('[MediaRecorder com opções falhou, usando padrão do navegador]:', eOpt);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const mime = audioChunksRef.current[0]?.type || options?.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioUrl(url);

          const textoCapturado = transcricaoTextoRef.current.trim();

          if (textoCapturado) {
            setEstado('concluido');
            estadoRef.current = 'concluido';
            setErroMensagem(null);
            if (onAudioGravado) {
              onAudioGravado(blob, url, textoCapturado);
            }
            onInserirTexto(textoCapturado);
          } else {
            await processarTranscricaoServidor(blob, url);
          }
        } else {
          // Se não gerou chunks de áudio, mas temos transcrição de fala contínua
          if (transcricaoTextoRef.current.trim()) {
            setEstado('concluido');
            estadoRef.current = 'concluido';
          }
        }
      };

      // Inicia captura a cada 1 segundo
      mediaRecorder.start(1000);

      setEstado('gravando');
      estadoRef.current = 'gravando';

      // Dispara transcrição de fala contínua em tempo real
      iniciarFalaAoVivo();

      // Inicia cronômetro
      timerRef.current = setInterval(() => {
        setTempoSegundos(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('[Microfone Erro]:', err);
      
      let msg = 'Não foi possível acessar o microfone.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setStatusPermissaoMic('negada');
        msg = 'Permissão de microfone bloqueada pelo navegador. Para habilitar: clique no ícone de cadeado/permissões ao lado do endereço do site (URL), selecione "Permitir Microfone" e recarregue. Você também pode importar arquivos de áudio (.mp3, .m4a, .wav) pelo botão abaixo.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg = 'Nenhum microfone foi detectado neste dispositivo. Conecte um fone de ouvido com microfone ou use o botão "Importar Áudio Externo".';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg = 'O microfone está ocupado por outro aplicativo. Feche outras abas ou programas que utilizam áudio e tente novamente.';
      } else {
        msg = `Acesso ao microfone indisponível (${err?.message || 'Permissão restrita'}). Use a opção "Importar Áudio Externo" para transcrever qualquer gravação de sessão.`;
      }

      // Mesmo se o MediaRecorder falhar, tenta iniciar SpeechRecognition se disponível
      if (suportaFalaAoVivo && err?.name !== 'NotAllowedError') {
        try {
          iniciarFalaAoVivo();
          setEstado('gravando');
          estadoRef.current = 'gravando';
          timerRef.current = setInterval(() => {
            setTempoSegundos(prev => prev + 1);
          }, 1000);
          setErroMensagem('Acesso direto ao arquivo de áudio restrito no dispositivo, mas o reconhecimento de voz contínuo está ativo e transcrevendo em tempo real.');
          return;
        } catch (_) {}
      }

      setEstado('falha');
      estadoRef.current = 'falha';
      setErroMensagem(msg);
    }
  };

  // 2. Pausar / Retomar
  const alternarPausa = () => {
    if (estado === 'gravando') {
      setEstado('pausado');
      estadoRef.current = 'pausado';

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.pause(); } catch (_) {}
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
        setEstaOuvindoFala(false);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (estado === 'pausado') {
      setEstado('gravando');
      estadoRef.current = 'gravando';

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        try { mediaRecorderRef.current.resume(); } catch (_) {}
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
      setEstaOuvindoFala(false);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
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
    textoFinalAcumuladoRef.current = '';
    setTempoSegundos(0);
    setErroMensagem(null);
    setEstado('ocioso');
    estadoRef.current = 'ocioso';
  };

  // 5. Upload manual de arquivo de áudio gravado em outro dispositivo (celular/whatsapp)
  const handleUploadAudioArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    descartarGravacao();

    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioUrl(url);

    // Dispara transcrição automática via Gemini no servidor
    await processarTranscricaoServidor(file, url);

    // Reseta o input para permitir selecionar o mesmo arquivo novamente se desejar
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      {/* Input oculto para importação de áudio gravado externamente */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm,.aac"
        onChange={handleUploadAudioArquivo}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-xl transition-all ${
            estado === 'gravando'
              ? 'bg-rose-500/20 text-rose-500 animate-pulse ring-2 ring-rose-500/30'
              : estado === 'pausado'
              ? 'bg-amber-500/20 text-amber-500'
              : estado === 'processando'
              ? 'bg-primary/20 text-primary'
              : estado === 'concluido'
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Mic className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                Gravação de Áudio & Transcrição da Sessão
              </h4>
              {estaOuvindoFala && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse">
                  <Radio className="size-3" />
                  Voz Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Atendimento com: <strong className="text-foreground">{nomePaciente}</strong>
            </p>
          </div>
        </div>

        {/* Badge de Estado Atual */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
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
            {estado === 'gravando' && <Clock className="size-3.5 animate-spin" />}
            {estado === 'processando' && <Loader2 className="size-3.5 animate-spin" />}
            {estado === 'concluido' && <Check className="size-3.5" />}
            
            {estado === 'ocioso' && 'Pronto para Gravar'}
            {estado === 'gravando' && `Gravando (${formatarTempo(tempoSegundos)})`}
            {estado === 'pausado' && `Pausado (${formatarTempo(tempoSegundos)})`}
            {estado === 'processando' && 'Processando Transcrição...'}
            {estado === 'concluido' && 'Gravação & Transcrição Concluídas'}
            {estado === 'falha' && 'Ajuste Necessário'}
          </span>
        </div>
      </div>

      {/* Informativo de Tecnologia e Privacidade */}
      <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed">
        <Info className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p>
            {suportaFalaAoVivo
              ? 'Transcrição contínua em tempo real ativada: conforme você e o paciente falam, o diálogo é transcrito e salvo no prontuário.'
              : 'Gravação estéreo com inteligência artificial para transcrição clínica automática ao concluir a sessão.'
            }
          </p>
          <span className="text-[11px] text-muted-foreground block">
            Armazenamento seguro, isolado e confidencial sob tutela do psicólogo/psicanalista responsável.
          </span>
        </div>
      </div>

      {/* Alerta Preventivo de Permissão de Microfone Negada */}
      {statusPermissaoMic === 'negada' && !erroMensagem && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              O microfone está bloqueado pelo navegador. Para habilitar: clique no ícone de cadeado/permissões ao lado da URL do navegador, selecione &quot;Permitir Microfone&quot; e recarregue.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold underline cursor-pointer hover:opacity-80"
          >
            Importar Arquivo de Áudio (.mp3, .m4a, .wav)
          </button>
        </div>
      )}

      {/* Alerta de Erro ou Notificação */}
      {erroMensagem && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-600" />
            <span>{erroMensagem}</span>
          </div>
          {audioBlob && (
            <button
              type="button"
              onClick={() => processarTranscricaoServidor(audioBlob)}
              className="text-xs underline font-bold shrink-0 cursor-pointer text-primary hover:opacity-80"
            >
              Tentar Transcrever Novamente
            </button>
          )}
        </div>
      )}

      {/* Barra de Controles de Gravação */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {estado === 'ocioso' && (
          <>
            <button
              type="button"
              onClick={iniciarGravacao}
              className="px-5 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mic className="size-4" />
              <span>Gravar Sessão & Transcrever</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-2 cursor-pointer"
              title="Transcrever áudio de arquivo (.mp3, .m4a, .wav, .webm)"
            >
              <Upload className="size-3.5 text-primary" />
              <span>Importar Áudio Externo</span>
            </button>
          </>
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
          <div className="flex items-center gap-2.5 text-xs font-bold text-primary py-2 px-3 rounded-xl bg-primary/10 border border-primary/20">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Processando áudio e gerando transcrição fiel com IA...</span>
          </div>
        )}

        {(estado === 'concluido' || estado === 'falha') && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={descartarGravacao}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span>Gravar Nova Sessão</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="size-3.5 text-primary" />
              <span>Importar Outro Áudio</span>
            </button>

            {audioBlob && (
              <button
                type="button"
                onClick={() => processarTranscricaoServidor(audioBlob)}
                className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Refinar com IA Gemini</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Player de Áudio Gravado */}
      {audioUrl && (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <Volume2 className="size-3.5 text-primary" />
              <span>Áudio Gravado da Sessão</span>
              {tempoSegundos > 0 && <span className="text-muted-foreground">({formatarTempo(tempoSegundos)})</span>}
            </span>
            <a
              href={audioUrl}
              download={`sessao_${nomePaciente.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.webm`}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
            >
              <Download className="size-3.5" />
              <span>Baixar Áudio</span>
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
            {transcricaoTexto.trim() && (
              <span className="text-[11px] font-normal text-muted-foreground lowercase">
                ({transcricaoTexto.length} caracteres)
              </span>
            )}
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
              textoFinalAcumuladoRef.current = val;
              onInserirTexto(val);
            }}
            placeholder={
              estado === 'gravando'
                ? 'Gravando... As falas da sessão estão sendo captadas e transcritas automaticamente em tempo real...'
                : 'A transcrição automática da gravação de áudio aparecerá aqui. Você poderá editar o texto livremente antes de salvá-lo no prontuário do paciente.'
            }
            className={`w-full rounded-xl border border-border p-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring leading-relaxed resize-y font-mono transition-colors ${
              estado === 'gravando' ? 'bg-primary/5 border-primary/30' : 'bg-background'
            }`}
          />
        </div>
      </div>
    </Card>
  );
}

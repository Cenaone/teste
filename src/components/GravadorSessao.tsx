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
  FileAudio,
  Video,
  HelpCircle,
  Headphones
} from 'lucide-react';
import { Card } from './ui-compact';
import { getSupabase } from '../lib/supabase';

interface GravadorSessaoProps {
  nomePaciente?: string;
  onInserirTexto: (texto: string) => void;
  textoAtual?: string;
  onAudioGravado?: (blob: Blob, url: string, transcricao: string) => void;
}

type EstadoGravador = 'ocioso' | 'solicitando' | 'gravando' | 'pausado' | 'processando' | 'concluido' | 'falha';
export type ModoCapturaAudio = 'presencial' | 'google_meet';

export default function GravadorSessao({
  nomePaciente = 'Paciente',
  onInserirTexto,
  textoAtual = '',
  onAudioGravado
}: GravadorSessaoProps) {
  const [estado, setEstado] = useState<EstadoGravador>('ocioso');
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [transcricaoTexto, setTranscricaoTexto] = useState('');
  const [rascunhoVozNavegador, setRascunhoVozNavegador] = useState('');
  const [origemTranscricao, setOrigemTranscricao] = useState<'ia_gemini' | 'rascunho_navegador' | null>(null);
  const [progressoTrechos, setProgressoTrechos] = useState<{ atual: number; total: number } | null>(null);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [suportaFalaAoVivo, setSuportaFalaAoVivo] = useState(false);
  const [estaOuvindoFala, setEstaOuvindoFala] = useState(false);
  const [statusPermissaoMic, setStatusPermissaoMic] = useState<'concedida' | 'solicitando' | 'negada' | 'desconhecido'>('desconhecido');
  const [modoCaptura, setModoCaptura] = useState<ModoCapturaAudio>('google_meet');
  const [modalAjudaMeet, setModalAjudaMeet] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const estadoRef = useRef<EstadoGravador>('ocioso');
  const transcricaoTextoRef = useRef('');
  const rascunhoVozNavegadorRef = useRef('');
  const textoFinalAcumuladoRef = useRef('');
  const trechosArmazenadosRef = useRef<Blob[]>([]);
  const trechosResultadosRef = useRef<Record<number, string>>({});
  const tentativaMicRef = useRef(0);
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
      tentativaMicRef.current += 1;
      estadoRef.current = 'ocioso';
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

    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      micStreamRef.current = null;
    }

    if (displayStreamRef.current) {
      try {
        displayStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      displayStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (_) {}
      audioContextRef.current = null;
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
          rascunhoVozNavegadorRef.current = completo;
          setRascunhoVozNavegador(completo);
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

  /**
   * Extrai um segmento do AudioBuffer e serializa em um Blob de formato WAV padrão 16-bit PCM mono (16kHz).
   * Garante que cada trecho seja um arquivo de áudio autônomo, válido e decodificável pelo Gemini e reprodutores.
   */
  const extrairTrechoWav = (audioBuffer: AudioBuffer, startSec: number, endSec: number): Blob => {
    const targetSampleRate = 16000; // Taxa de amostragem padrão para IA e fala clínica
    const startSample = Math.floor(startSec * audioBuffer.sampleRate);
    const endSample = Math.min(Math.floor(endSec * audioBuffer.sampleRate), audioBuffer.length);
    const lengthInOriginal = Math.max(0, endSample - startSample);

    // Mixagem para Mono para economia de banda sem perda de fidelidade vocal
    const numChannels = audioBuffer.numberOfChannels;
    const originalMono = new Float32Array(lengthInOriginal);
    for (let c = 0; c < numChannels; c++) {
      const channelData = audioBuffer.getChannelData(c).subarray(startSample, endSample);
      for (let i = 0; i < lengthInOriginal; i++) {
        originalMono[i] += channelData[i] / numChannels;
      }
    }

    // Reamostragem para 16kHz via interpolação linear
    let finalSamples: Float32Array;
    if (audioBuffer.sampleRate === targetSampleRate) {
      finalSamples = originalMono;
    } else {
      const ratio = targetSampleRate / audioBuffer.sampleRate;
      const newLength = Math.max(1, Math.round(lengthInOriginal * ratio));
      finalSamples = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const origIndex = i / ratio;
        const indexFloor = Math.floor(origIndex);
        const indexCeil = Math.min(indexFloor + 1, lengthInOriginal - 1);
        const frac = origIndex - indexFloor;
        finalSamples[i] = originalMono[indexFloor] * (1 - frac) + originalMono[indexCeil] * frac;
      }
    }

    const numSamples = finalSamples.length;
    const dataByteLength = numSamples * 2; // 16-bit PCM = 2 bytes por amostra
    const buffer = new ArrayBuffer(44 + dataByteLength);
    const view = new DataView(buffer);

    // Cabeçalho RIFF canônico (44 bytes)
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataByteLength, true); // chunkSize
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // Subchunk fmt
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // subchunk1Size (16 para PCM)
    view.setUint16(20, 1, true); // áudio format PCM = 1
    view.setUint16(22, 1, true); // mono = 1
    view.setUint32(24, targetSampleRate, true); // sampleRate (16000)
    view.setUint32(28, targetSampleRate * 2, true); // byteRate (16000 * 1 * 2)
    view.setUint16(32, 2, true); // blockAlign (1 * 2)
    view.setUint16(34, 16, true); // bitsPerSample = 16
    // Subchunk data
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataByteLength, true); // data size

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, finalSamples[i]));
      const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  /**
   * Segmenta áudios longos (de até 45 minutos) em trechos válidos de 90 segundos (~2.75 MB por trecho).
   * Não corta bytes brutos de WebM/MP4: decodifica e sintetiza arquivos WAV decodificáveis individualmente.
   */
  const segmentarAudioEmTrechos = async (blob: Blob, segundosPorTrecho: number = 90): Promise<Blob[]> => {
    // Se o áudio é pequeno (<= 2.5 MB), envia diretamente como trecho único
    if (blob.size <= 2.5 * 1024 * 1024) {
      return [blob];
    }

    const AudioCtxClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    if (!AudioCtxClass) {
      return [blob];
    }

    const audioCtx = new AudioCtxClass();
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const totalSegundos = audioBuffer.duration;

      if (totalSegundos <= segundosPorTrecho && blob.size <= 3 * 1024 * 1024) {
        return [blob];
      }

      const trechos: Blob[] = [];
      let inicioSec = 0;
      while (inicioSec < totalSegundos) {
        const fimSec = Math.min(inicioSec + segundosPorTrecho, totalSegundos);
        const trechoWav = extrairTrechoWav(audioBuffer, inicioSec, fimSec);
        trechos.push(trechoWav);
        inicioSec = fimSec;
      }

      return trechos.length > 0 ? trechos : [blob];
    } catch (err) {
      console.warn('[Segmentação Web Audio falhou, fallback para blob original]:', err);
      return [blob];
    } finally {
      audioCtx.close().catch(() => {});
    }
  };

  // Processa áudio no servidor em trechos sequenciais com recuperação incremental
  const processarTranscricaoServidor = async (blob: Blob, urlFornecida?: string, retomar: boolean = false) => {
    const finalUrl = urlFornecida || audioUrl || URL.createObjectURL(blob);
    if (!audioUrl && finalUrl) {
      setAudioUrl(finalUrl);
    }
    setAudioBlob(blob);

    setEstado('processando');
    estadoRef.current = 'processando';
    setErroMensagem(null);

    try {
      // 1. Obtém sessão Supabase válida
      const supabase = getSupabase();
      const { data: sessao, error: erroSessao } = await supabase.auth.getSession();
      if (erroSessao || !sessao.session?.access_token) {
        throw new Error('Sessão expirada ou não autenticada. Entre novamente para transcrever o áudio.');
      }
      const token = sessao.session.access_token;

      // 2. Prepara os trechos caso não esteja retomando
      if (!retomar || trechosArmazenadosRef.current.length === 0) {
        setProgressoTrechos({ atual: 1, total: 1 });
        const trechos = await segmentarAudioEmTrechos(blob, 90);
        trechosArmazenadosRef.current = trechos;
        trechosResultadosRef.current = {};
      }

      const trechos = trechosArmazenadosRef.current;
      const totalTrechos = trechos.length;

      // 3. Processa cada trecho sequencialmente
      for (let i = 0; i < totalTrechos; i++) {
        // Pula trechos já transcritos anteriormente com sucesso
        if (trechosResultadosRef.current[i]) continue;

        setProgressoTrechos({ atual: i + 1, total: totalTrechos });

        const trechoAtual = trechos[i];
        if (trechoAtual.size > 3 * 1024 * 1024) {
          throw new Error(`O trecho ${i + 1} de ${totalTrechos} excede o limite de 3 MB permitido.`);
        }

        const base64 = await blobToBase64(trechoAtual);
        const mime = trechoAtual.type || 'audio/wav';

        const response = await fetch('/api/transcrever-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: mime
          })
        });

        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error(
            response.status === 413
              ? `O trecho ${i + 1} excede o limite de upload do servidor.`
              : `A rota de transcrição retornou erro HTTP ${response.status}. Verifique a conexão ou tente novamente.`
          );
        }

        const data = await response.json();
        if (!response.ok || !data.ok) {
          const motivo = data?.erro || `Erro HTTP ${response.status}`;
          throw new Error(`Falha no trecho ${i + 1} de ${totalTrechos}: ${motivo}`);
        }

        const textoTrecho = (data.transcricao || '').trim();
        trechosResultadosRef.current[i] = textoTrecho;
      }

      // 4. Consolida todos os trechos em ordem cronológica estrita
      const textoConsolidado = trechos
        .map((_, idx) => trechosResultadosRef.current[idx] || '')
        .filter(Boolean)
        .join('\n\n')
        .trim();

      if (!textoConsolidado) {
        throw new Error('Não foi obtida transcrição com falas compreensíveis.');
      }

      setTranscricaoTexto(textoConsolidado);
      transcricaoTextoRef.current = textoConsolidado;
      textoFinalAcumuladoRef.current = textoConsolidado;
      setOrigemTranscricao('ia_gemini');
      setProgressoTrechos(null);
      setEstado('concluido');
      estadoRef.current = 'concluido';
      setErroMensagem(null);

      if (onAudioGravado) {
        onAudioGravado(blob, finalUrl, textoConsolidado);
      }
      onInserirTexto(textoConsolidado);

    } catch (err: any) {
      console.warn('[Erro transcrição servidor]:', err);
      setEstado('falha');
      estadoRef.current = 'falha';
      setProgressoTrechos(null);
      setErroMensagem(
        err?.message || 'Falha na comunicação com o serviço de transcrição. O áudio completo permanece disponível para download e nova tentativa.'
      );
    }
  };

  // Permite adotar o rascunho de voz local do navegador caso o usuário prefira
  const handleUsarRascunhoNavegador = () => {
    if (!rascunhoVozNavegador.trim()) return;
    const rascunho = rascunhoVozNavegador.trim();
    setTranscricaoTexto(rascunho);
    transcricaoTextoRef.current = rascunho;
    textoFinalAcumuladoRef.current = rascunho;
    setOrigemTranscricao('rascunho_navegador');
    setEstado('concluido');
    estadoRef.current = 'concluido';
    setErroMensagem(null);
    if (audioBlob && audioUrl && onAudioGravado) {
      onAudioGravado(audioBlob, audioUrl, rascunho);
    }
    onInserirTexto(rascunho);
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
      } catch (errRestricao: any) {
        if (['NotAllowedError', 'PermissionDeniedError', 'NotFoundError', 'NotReadableError'].includes(errRestricao?.name)) throw errRestricao;
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
    if (['solicitando', 'gravando', 'pausado', 'processando'].includes(estadoRef.current)) return;
    const tentativa = ++tentativaMicRef.current;
    estadoRef.current = 'solicitando';
    setEstado('solicitando');
    setErroMensagem(null);
    setTranscricaoTexto('');
    transcricaoTextoRef.current = '';
    setTempoSegundos(0);
    audioChunksRef.current = [];
    textoFinalAcumuladoRef.current = '';

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

    let limitePermissao: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.isSecureContext) throw new Error('Abra o sistema pelo endereço HTTPS para usar o microfone.');
      if (typeof MediaRecorder === 'undefined') throw new Error('Este navegador não suporta gravação de áudio. Abra o sistema em um navegador atualizado.');
      const pedido = obterMediaStream().then(stream => {
        if (tentativa !== tentativaMicRef.current) {
          stream.getTracks().forEach(track => track.stop());
          throw new Error('Solicitação de microfone encerrada. Clique para tentar novamente.');
        }
        return stream;
      });
      const micStream = await Promise.race([
        pedido,
        new Promise<MediaStream>((_, reject) => {
          limitePermissao = setTimeout(() => {
            if (tentativa === tentativaMicRef.current) tentativaMicRef.current += 1;
            reject(new Error('A autorização do microfone não foi concluída. Confira o pedido de permissão no navegador e tente novamente.'));
          }, 30000);
        })
      ]);
      clearTimeout(limitePermissao);
      micStreamRef.current = micStream;
      setStatusPermissaoMic('concedida');

      let stream: MediaStream = micStream;

      // Se o modo selecionado for Google Meet / Teleconsulta, captura a guia do navegador com áudio da chamada
      if (modoCaptura === 'google_meet') {
        const nav = navigator as any;
        if (!nav.mediaDevices || typeof nav.mediaDevices.getDisplayMedia !== 'function') {
          throw new Error('A captura de áudio da chamada online requer um computador com Google Chrome, Microsoft Edge, Brave ou Firefox.');
        }

        let displayStream: MediaStream;
        try {
          displayStream = await nav.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            }
          });
        } catch (errDisplay: any) {
          micStream.getTracks().forEach(t => t.stop());
          if (errDisplay?.name === 'NotAllowedError' || errDisplay?.name === 'AbortError') {
            throw new Error('Seleção da guia do Google Meet cancelada. Para gravar a chamada, clique em Gravar com Google Meet, selecione a guia do Meet e marque a caixa "Compartilhar áudio da guia".');
          }
          throw new Error(`Falha ao selecionar a chamada do Google Meet: ${errDisplay?.message || 'Permissão negada'}`);
        }

        const meetAudioTracks = displayStream.getAudioTracks();
        if (meetAudioTracks.length === 0) {
          displayStream.getTracks().forEach(t => t.stop());
          micStream.getTracks().forEach(t => t.stop());
          throw new Error('A guia foi selecionada, mas a caixa "Compartilhar áudio da guia" NÃO foi marcada no diálogo do navegador. Clique em Gravar novamente, escolha a guia do Google Meet e marque a caixinha de áudio.');
        }

        displayStreamRef.current = displayStream;

        // Mixa Microfone (Terapeuta) + Guia do Google Meet (Paciente) via Web Audio API
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          audioContextRef.current = audioCtx;
          const destination = audioCtx.createMediaStreamDestination();

          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(destination);

          const meetSource = audioCtx.createMediaStreamSource(displayStream);
          meetSource.connect(destination);

          stream = destination.stream;
        } else {
          stream = new MediaStream([
            ...micStream.getAudioTracks(),
            ...meetAudioTracks
          ]);
        }
      }

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

          // Dispara a transcrição clínica oficial por IA do arquivo gravado
          await processarTranscricaoServidor(blob, url, false);
        } else {
          setEstado('falha');
          estadoRef.current = 'falha';
          setErroMensagem('Nenhum dado de áudio foi capturado pelo gravador.');
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

      estadoRef.current = 'falha';
      pararHardware();

      setEstado('falha');
      estadoRef.current = 'falha';
      setErroMensagem(msg);
    } finally {
      clearTimeout(limitePermissao);
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

    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      micStreamRef.current = null;
    }

    if (displayStreamRef.current) {
      try {
        displayStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (_) {}
      displayStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch (_) {}
      audioContextRef.current = null;
    }

    setEstado('processando');
    estadoRef.current = 'processando';
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
    trechosArmazenadosRef.current = [];
    trechosResultadosRef.current = {};
    setTranscricaoTexto('');
    transcricaoTextoRef.current = '';
    setRascunhoVozNavegador('');
    rascunhoVozNavegadorRef.current = '';
    textoFinalAcumuladoRef.current = '';
    setTempoSegundos(0);
    setErroMensagem(null);
    setProgressoTrechos(null);
    setOrigemTranscricao(null);
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
              {estado === 'gravando' && modoCaptura === 'google_meet' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <Video className="size-3" />
                  Google Meet Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Atendimento com: <strong className="text-foreground">{nomePaciente}</strong>
              {modoCaptura === 'google_meet' ? ' • Modo Teleconsulta (Google Meet + Microfone)' : ' • Modo Presencial (Microfone)'}
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
            {estado === 'solicitando' && 'Aguardando microfone...'}
            {estado === 'gravando' && `Gravando (${formatarTempo(tempoSegundos)})`}
            {estado === 'pausado' && `Pausado (${formatarTempo(tempoSegundos)})`}
            {estado === 'processando' && (progressoTrechos && progressoTrechos.total > 1 ? `Transcrevendo (${progressoTrechos.atual}/${progressoTrechos.total})` : 'Transcrevendo com IA...')}
            {estado === 'concluido' && (origemTranscricao === 'ia_gemini' ? 'Transcrição IA Concluída' : origemTranscricao === 'rascunho_navegador' ? 'Rascunho Local' : 'Gravação & Transcrição Concluídas')}
            {estado === 'falha' && 'Transcrição Pendente'}
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

      {/* Rascunho de voz ao vivo do navegador durante a gravação */}
      {estado === 'gravando' && rascunhoVozNavegador.trim() && (
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span>Rascunho de voz em tempo real (Navegador)</span>
            <span className="text-[10px] lowercase text-muted-foreground/80 font-normal">
              (ao finalizar, a IA Gemini processará a transcrição clínica oficial do áudio)
            </span>
          </div>
          <p className="text-xs text-foreground/90 font-mono italic line-clamp-3 bg-background/60 p-2 rounded-lg border border-border/40">
            {rascunhoVozNavegador}
          </p>
        </div>
      )}

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

      {/* Alerta de Erro ou Notificação com Recuperação Segura */}
      {erroMensagem && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">{erroMensagem}</span>
              <p className="text-[11px] text-muted-foreground">
                O áudio gravado está 100% preservado no player abaixo e pode ser reproduzido ou baixado a qualquer momento.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
            {audioBlob && trechosArmazenadosRef.current.length > 1 && Object.keys(trechosResultadosRef.current).length > 0 && Object.keys(trechosResultadosRef.current).length < trechosArmazenadosRef.current.length && (
              <button
                type="button"
                onClick={() => processarTranscricaoServidor(audioBlob, undefined, true)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Continuar do Trecho {Object.keys(trechosResultadosRef.current).length + 1} de {trechosArmazenadosRef.current.length}</span>
              </button>
            )}

            {audioBlob && (
              <button
                type="button"
                onClick={() => processarTranscricaoServidor(audioBlob, undefined, false)}
                className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Tentar Transcrever Novamente</span>
              </button>
            )}

            {rascunhoVozNavegador.trim() && (
              <button
                type="button"
                onClick={handleUsarRascunhoNavegador}
                className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer"
                title="Aplica o texto captado localmente pelo navegador como transcrição provisória"
              >
                <Radio className="size-3.5 text-amber-600" />
                <span>Usar Rascunho de Voz do Navegador (Local)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seletor de Modo de Atendimento: Presencial vs Google Meet / Teleconsulta */}
      {estado === 'ocioso' && (
        <div className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Volume2 className="size-3.5 text-primary" />
              Modo de Atendimento & Captação de Áudio
            </span>
            <button
              type="button"
              onClick={() => setModalAjudaMeet(prev => !prev)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <HelpCircle className="size-3" />
              {modalAjudaMeet ? 'Ocultar instruções' : 'Como captar do Google Meet?'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Opção Teleconsulta / Google Meet */}
            <button
              type="button"
              onClick={() => setModoCaptura('google_meet')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                modoCaptura === 'google_meet'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border/60 hover:bg-muted/40'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                modoCaptura === 'google_meet' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Video className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Google Meet / Teleconsulta</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary/20 text-primary">
                    Misto
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Mixa a sua voz (microfone) <strong>e também o áudio do paciente no Google Meet</strong>, funcionando perfeitamente com fones!
                </p>
              </div>
            </button>

            {/* Opção Presencial */}
            <button
              type="button"
              onClick={() => setModoCaptura('presencial')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                modoCaptura === 'presencial'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border/60 hover:bg-muted/40'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                modoCaptura === 'presencial' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Mic className="size-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Presencial no Consultório</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Grava apenas pelo microfone local. Indicado quando terapeuta e paciente estão presencialmente na mesma sala.
                </p>
              </div>
            </button>
          </div>

          {/* Dica rápida quando modo Google Meet está ativo */}
          {modoCaptura === 'google_meet' && (
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-950 dark:text-sky-200 text-xs flex items-start gap-2 leading-relaxed">
              <Info className="size-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-[11px] space-y-0.5">
                <span className="font-semibold block">Como autorizar a captação do Meet:</span>
                <p>
                  Ao clicar em <strong>&quot;Gravar com Google Meet&quot;</strong>, o navegador abrirá uma janela. Escolha a guia do <strong>Google Meet</strong> e certifique-se de manter marcada a opção <strong>&quot;Compartilhar áudio da guia&quot;</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Guia detalhado passo a passo */}
          {modalAjudaMeet && (
            <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Headphones className="size-3.5 text-primary" />
                Passo a passo: gravação de sessões do Google Meet no PSi 4.0
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
                <li>Deixe a chamada do Google Meet já aberta em outra aba do navegador (Chrome, Edge, Brave ou Firefox).</li>
                <li>Aqui no PSi 4.0, mantenha selecionado <strong>&quot;Google Meet / Teleconsulta&quot;</strong> e clique em <strong>&quot;Gravar com Google Meet&quot;</strong>.</li>
                <li>Se for a primeira vez, autorize o microfone quando o navegador solicitar.</li>
                <li>Em seguida, o navegador exibirá a janela <em>&quot;Escolha o que compartilhar&quot;</em>.</li>
                <li>Clique na aba <strong>&quot;Guia do Chrome&quot;</strong> (ou Guia do Navegador) e clique na reunião do <strong>Google Meet</strong>.</li>
                <li><strong className="text-foreground">Importante:</strong> no canto inferior da janela, deixe marcada a opção <strong>&quot;Compartilhar áudio da guia&quot;</strong>.</li>
                <li>O PSi 4.0 fará a mixagem simultânea da sua voz e da voz do paciente em alta fidelidade digital para a IA Gemini transcrever todo o diálogo.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Barra de Controles de Gravação */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {estado === 'solicitando' && (
          <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-primary font-medium">
            <Loader2 className="size-4 animate-spin" />
            {modoCaptura === 'google_meet'
              ? 'Aguardando autorização do microfone e seleção da guia do Google Meet com áudio...'
              : 'Aguardando acesso ao microfone. Se o navegador solicitar, clique em Permitir.'}
          </div>
        )}
        {estado === 'ocioso' && (
          <>
            <button
              type="button"
              onClick={iniciarGravacao}
              className="px-5 py-2.5 rounded-xl gradient-emerald text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {modoCaptura === 'google_meet' ? (
                <>
                  <Video className="size-4" />
                  <span>Gravar com Google Meet & Transcrever</span>
                </>
              ) : (
                <>
                  <Mic className="size-4" />
                  <span>Gravar Sessão & Transcrever</span>
                </>
              )}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-primary py-2.5 px-3.5 rounded-xl bg-primary/10 border border-primary/20 w-full">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <span>
                {progressoTrechos && progressoTrechos.total > 1
                  ? `Transcrevendo trecho ${progressoTrechos.atual} de ${progressoTrechos.total} com IA Gemini...`
                  : 'Processando áudio e gerando transcrição fiel com IA...'}
              </span>
            </div>
            {progressoTrechos && progressoTrechos.total > 1 && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted-foreground font-normal">
                  {Math.round(((progressoTrechos.atual - 1) / progressoTrechos.total) * 100)}% concluído
                </span>
                <div className="w-24 h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round(((progressoTrechos.atual - 1) / progressoTrechos.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
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
                onClick={() => processarTranscricaoServidor(audioBlob, undefined, false)}
                className="px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>{origemTranscricao === 'ia_gemini' ? 'Retranscrever com IA Gemini' : 'Refinar com IA Gemini'}</span>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              Transcrição Textual da Sessão
              {transcricaoTexto.trim() && (
                <span className="text-[11px] font-normal text-muted-foreground lowercase">
                  ({transcricaoTexto.length} caracteres)
                </span>
              )}
            </label>
            {origemTranscricao === 'ia_gemini' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-3" /> Transcrição Clínica por IA (Gemini)
              </span>
            )}
            {origemTranscricao === 'rascunho_navegador' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                <Radio className="size-3" /> Rascunho Local do Navegador
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {origemTranscricao === 'rascunho_navegador' && audioBlob && estado !== 'processando' && (
              <button
                type="button"
                onClick={() => processarTranscricaoServidor(audioBlob, undefined, false)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Processar com IA Gemini</span>
              </button>
            )}
            {transcricaoTexto.trim() && (
              <button
                type="button"
                onClick={handleInserirNasNotas}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiado ? <Check className="size-3.5 text-emerald-600" /> : <Plus className="size-3.5" />}
                <span>{copiado ? 'Inserido no Prontuário!' : 'Inserir nas Anotações da Sessão'}</span>
              </button>
            )}
          </div>
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
                ? 'Gravando... As falas da sessão estão sendo captadas e o áudio preservado com máxima fidelidade...'
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

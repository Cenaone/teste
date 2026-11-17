import { Model, type KaldiRecognizer } from 'vosk-browser';

export const VOSK_MODEL_PATH = '/models/vosk-model-small-pt-0.3.tar.gz';

let modeloVoskPromise: Promise<Model> | null = null;
let modeloVoskInstancia: Model | null = null;

/**
 * Carrega e mantém em cache (memória + IndexedDB interno do vosk-browser)
 * o modelo offline de reconhecimento de fala em português (pt-BR).
 */
export function obterModeloVoskLocal(
  onStatus?: (status: string) => void
): Promise<Model> {
  if (modeloVoskInstancia && modeloVoskInstancia.ready) {
    return Promise.resolve(modeloVoskInstancia);
  }
  if (modeloVoskPromise) {
    return modeloVoskPromise;
  }

  const modelUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${VOSK_MODEL_PATH}`
      : VOSK_MODEL_PATH;

  onStatus?.('Carregando motor de transcrição offline em português...');

  modeloVoskPromise = new Promise<Model>((resolve, reject) => {
    let finalizado = false;
    const model = new Model(modelUrl, -1);

    const timeout = setTimeout(() => {
      if (!finalizado) {
        finalizado = true;
        modeloVoskPromise = null;
        try { model.terminate(); } catch (_) {}
        reject(new Error('Tempo limite excedido ao carregar o modelo de transcrição local.'));
      }
    }, 120000);

    model.on('load', (msg) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      if (msg.event === 'load' && msg.result) {
        modeloVoskInstancia = model;
        onStatus?.('Motor de transcrição local pronto.');
        resolve(model);
      } else {
        modeloVoskPromise = null;
        reject(new Error('Não foi possível inicializar o motor de transcrição local.'));
      }
    });

    model.on('error', (msg) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      modeloVoskPromise = null;
      const detalhe = msg.event === 'error' ? msg.error : 'Erro desconhecido';
      reject(new Error(`Falha ao carregar motor local: ${detalhe}`));
    });
  });

  return modeloVoskPromise;
}

export function modeloVoskEstaCarregado(): boolean {
  return Boolean(modeloVoskInstancia?.ready);
}

export interface SessaoAoVivoVosk {
  enviarPcm: (samples: Float32Array, sampleRate: number) => void;
  finalizar: () => Promise<string>;
  descartar: () => void;
}

/**
 * Cria um reconhecedor Kaldi em Web Worker ligado ao AudioContext em tempo real.
 * Aceita áudio mixado (Microfone + Guia da Chamada Online) sem enviar dados à nuvem.
 */
export async function criarReconhecedorAoVivoVosk(
  sampleRate: number,
  callbacks: {
    onResultadoFinal: (frase: string, textoAcumulado: string) => void;
    onParcial?: (parcial: string, textoVisualCompleto: string) => void;
    onErro?: (erro: string) => void;
    onStatus?: (status: string) => void;
  }
): Promise<SessaoAoVivoVosk> {
  const model = await obterModeloVoskLocal(callbacks.onStatus);
  const recognizer: KaldiRecognizer = new model.KaldiRecognizer(sampleRate);

  const frasesConfirmadas: string[] = [];
  let ultimoParcial = '';
  let encerrado = false;
  let resolverFinal: ((texto: string) => void) | null = null;

  const obterAcumulado = () => frasesConfirmadas.join(' ').trim();

  recognizer.on('result', (msg) => {
    if (msg.event !== 'result') return;
    const texto = (msg.result?.text || '').trim();
    if (texto) {
      frasesConfirmadas.push(texto);
      ultimoParcial = '';
      callbacks.onResultadoFinal(texto, obterAcumulado());
    }
    if (resolverFinal) {
      const resolve = resolverFinal;
      resolverFinal = null;
      resolve(obterAcumulado());
    }
  });

  recognizer.on('partialresult', (msg) => {
    if (msg.event !== 'partialresult') return;
    const parcial = (msg.result?.partial || '').trim();
    if (parcial !== ultimoParcial) {
      ultimoParcial = parcial;
      const acumulado = obterAcumulado();
      const visual = [acumulado, parcial].filter(Boolean).join(' ').trim();
      callbacks.onParcial?.(parcial, visual);
    }
  });

  recognizer.on('error', (msg) => {
    if (msg.event === 'error') {
      callbacks.onErro?.(msg.error || 'Erro no motor de reconhecimento local.');
    }
  });

  return {
    enviarPcm(samples: Float32Array, sr: number) {
      if (encerrado) return;
      try {
        recognizer.acceptWaveformFloat(new Float32Array(samples), sr);
      } catch (_) {}
    },
    async finalizar(): Promise<string> {
      if (encerrado) return obterAcumulado();
      encerrado = true;

      const textoAposFlush = await new Promise<string>((resolve) => {
        const timer = setTimeout(() => {
          resolverFinal = null;
          const acumulado = obterAcumulado();
          const finalComParcial = [acumulado, ultimoParcial].filter(Boolean).join(' ').trim();
          resolve(finalComParcial);
        }, 650);

        resolverFinal = (texto) => {
          clearTimeout(timer);
          resolve(texto);
        };

        try {
          recognizer.retrieveFinalResult();
        } catch (_) {
          clearTimeout(timer);
          resolverFinal = null;
          resolve([obterAcumulado(), ultimoParcial].filter(Boolean).join(' ').trim());
        }
      });

      try {
        recognizer.remove();
      } catch (_) {}
      return textoAposFlush;
    },
    descartar() {
      encerrado = true;
      resolverFinal = null;
      try {
        recognizer.remove();
      } catch (_) {}
    }
  };
}

/**
 * Transcreve um arquivo ou gravação completa localmente no navegador usando Vosk WASM.
 * Útil para áudios importados (.mp3, .m4a, .wav, .webm) ou retranscrição offline.
 */
export async function transcreverAudioArquivoLocalVosk(
  blob: Blob,
  opcoes?: {
    onStatus?: (status: string) => void;
    onProgresso?: (atual: number, total: number) => void;
    onTextoParcial?: (textoVisual: string) => void;
  }
): Promise<string> {
  const model = await obterModeloVoskLocal(opcoes?.onStatus);

  const AudioCtxClass =
    typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      : null;

  if (!AudioCtxClass) {
    throw new Error('Este navegador não suporta Web Audio API para decodificar áudio.');
  }

  opcoes?.onStatus?.('Decodificando áudio para processamento local...');
  const audioCtx = new AudioCtxClass();
  let audioBuffer: AudioBuffer;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    audioCtx.close().catch(() => {});
  }

  const numChannels = audioBuffer.numberOfChannels;
  const totalSamples = audioBuffer.length;
  const monoSamples = new Float32Array(totalSamples);
  for (let c = 0; c < numChannels; c++) {
    const ch = audioBuffer.getChannelData(c);
    for (let i = 0; i < totalSamples; i++) {
      monoSamples[i] += ch[i] / numChannels;
    }
  }

  const sampleRate = audioBuffer.sampleRate;
  const recognizer: KaldiRecognizer = new model.KaldiRecognizer(sampleRate);
  const frasesConfirmadas: string[] = [];
  let ultimoParcial = '';
  let resolverFinal: ((texto: string) => void) | null = null;

  const obterAcumulado = () => frasesConfirmadas.join(' ').trim();

  recognizer.on('result', (msg) => {
    if (msg.event !== 'result') return;
    const texto = (msg.result?.text || '').trim();
    if (texto) {
      frasesConfirmadas.push(texto);
      ultimoParcial = '';
      opcoes?.onTextoParcial?.(obterAcumulado());
    }
    if (resolverFinal) {
      const resolve = resolverFinal;
      resolverFinal = null;
      resolve(obterAcumulado());
    }
  });

  recognizer.on('partialresult', (msg) => {
    if (msg.event !== 'partialresult') return;
    const parcial = (msg.result?.partial || '').trim();
    if (parcial !== ultimoParcial) {
      ultimoParcial = parcial;
      const visual = [obterAcumulado(), parcial].filter(Boolean).join(' ').trim();
      opcoes?.onTextoParcial?.(visual);
    }
  });

  // Envia blocos de ~0.5 segundo para manter a interface responsiva e atualizar progresso
  const chunkSize = Math.max(4096, Math.floor(sampleRate * 0.5));
  const totalBlocos = Math.max(1, Math.ceil(totalSamples / chunkSize));

  try {
    for (let blocoIdx = 0; blocoIdx < totalBlocos; blocoIdx++) {
      const inicio = blocoIdx * chunkSize;
      const fim = Math.min(inicio + chunkSize, totalSamples);
      const fatia = monoSamples.slice(inicio, fim);
      recognizer.acceptWaveformFloat(fatia, sampleRate);

      opcoes?.onProgresso?.(blocoIdx + 1, totalBlocos);

      // Libera brevemente a thread principal a cada 2 blocos para manter UI fluida
      if (blocoIdx % 2 === 1) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    const textoFinal = await new Promise<string>((resolve) => {
      const timer = setTimeout(() => {
        resolverFinal = null;
        resolve([obterAcumulado(), ultimoParcial].filter(Boolean).join(' ').trim());
      }, 900);

      resolverFinal = (texto) => {
        clearTimeout(timer);
        resolve(texto);
      };

      recognizer.retrieveFinalResult();
    });

    return textoFinal.trim();
  } finally {
    try {
      recognizer.remove();
    } catch (_) {}
  }
}

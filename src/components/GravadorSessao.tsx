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
  Shield
} from 'lucide-react';
import { Card } from './ui-compact';

interface GravadorSessaoProps {
  nomePaciente?: string;
  onInserirTexto: (texto: string) => void;
  textoAtual?: string;
}

export default function GravadorSessao({
  nomePaciente = 'Paciente',
  onInserirTexto,
  textoAtual = ''
}: GravadorSessaoProps) {
  const [estaGravando, setEstaGravando] = useState(false);
  const [estaPausado, setEstaPausado] = useState(false);
  const [tempoSegundos, setTempoSegundos] = useState(0);
  const [transcricaoAoVivo, setTranscricaoAoVivo] = useState('');
  const [transcricaoFinal, setTranscricaoFinal] = useState('');
  const [erroMicrofone, setErroMicrofone] = useState<string | null>(null);
  const [mostrarPainel, setMostrarPainel] = useState(false);

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
    };
  }, []);

  const iniciarGravacao = async () => {
    setErroMicrofone(null);
    setTranscricaoAoVivo('');
    setTranscricaoFinal('');
    setTempoSegundos(0);
    setMostrarPainel(true);
    audioChunksRef.current = [];

    try {
      // Obter stream de microfone do dispositivo
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(1000);
      } catch (e) {
        console.warn('MediaRecorder não disponível ou áudio puro não suportado.');
      }

      setEstaGravando(true);
      setEstaPausado(false);

      // Timer
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setErroMicrofone('Não foi possível acessar o microfone local. Por favor, verifique as permissões de áudio do seu navegador.');
      setEstaGravando(false);
    }
  };

  const alternarPausa = () => {
    if (!estaGravando) return;

    if (estaPausado) {
      // Retomar
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      timerRef.current = setInterval(() => {
        setTempoSegundos((prev) => prev + 1);
      }, 1000);
      setEstaPausado(false);
    } else {
      // Pausar
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      clearInterval(timerRef.current);
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

  const handleInserirRegistroAudio = () => {
    const timestamp = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cabecalho = `\n\n--- [Sessão Presencial Registrada Localmente - ${timestamp} (Duração: ${formatarTempo(tempoSegundos)})] ---\n`;
    const nota = `[Áudio retido no dispositivo local do profissional sob sigilo profissional.]\n`;
    const resultado = textoAtual ? `${textoAtual.trim()}${cabecalho}${nota}` : `${cabecalho.trim()}\n${nota}`;

    onInserirTexto(resultado);
    alert('Registro da sessão inserido no prontuário local com sucesso!');
  };

  const handleLimparGravacao = () => {
    if (estaGravando) {
      pararGravacaoGeral();
    }
    audioChunksRef.current = [];
    setTranscricaoAoVivo('');
    setTranscricaoFinal('');
    setTempoSegundos(0);
    setMostrarPainel(false);
  };

  return (
    <div className="space-y-3">
      {/* Botão de Trigger quando o painel está fechado */}
      {!mostrarPainel && !estaGravando && (
        <button
          type="button"
          onClick={() => {
            setMostrarPainel(true);
            iniciarGravacao();
          }}
          className="w-full py-2.5 px-3 sm:px-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Mic className="size-3.5" />
            </div>
            <span className="text-left font-semibold">Gravar Sessão no Dispositivo</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono font-medium uppercase tracking-wider bg-background px-2 py-0.5 rounded border border-border shrink-0 flex items-center gap-1">
            <Shield className="size-3 text-emerald-600" />
            100% Local
          </span>
        </button>
      )}

      {/* Painel do Gravador */}
      {mostrarPainel && (
        <Card className={`p-3 sm:p-4 border-2 transition-all space-y-3 ${estaGravando ? 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-border bg-card'}`}>
          {/* Topo do Gravador com Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`size-2.5 rounded-full shrink-0 ${estaGravando ? (estaPausado ? 'bg-amber-500' : 'bg-red-500 animate-pulse') : 'bg-zinc-400'}`} />
              <div className="leading-tight">
                <span className="font-bold text-[11px] sm:text-xs text-foreground uppercase tracking-wider block">
                  {estaGravando ? (estaPausado ? 'Em Pausa' : 'Gravando Localmente...') : 'Finalizado'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-[200px] block">
                  {nomePaciente}
                </span>
              </div>
            </div>

            {/* Timer de Duração */}
            <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-lg border border-border shadow-xs">
              <Clock className="size-3 text-primary shrink-0" />
              <span className="font-mono text-xs font-bold text-foreground">
                {formatarTempo(tempoSegundos)}
              </span>
            </div>

            {/* Controles de Gravação */}
            <div className="flex items-center gap-1">
              {estaGravando ? (
                <>
                  <button
                    type="button"
                    onClick={alternarPausa}
                    className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-semibold text-foreground flex items-center gap-1 transition-colors"
                  >
                    {estaPausado ? <Play className="size-3 text-emerald-500" /> : <Pause className="size-3 text-amber-500" />}
                    <span>{estaPausado ? 'Retomar' : 'Pausar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalizarGravacao}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Square className="size-3 fill-current" />
                    <span>Concluir</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={iniciarGravacao}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Mic className="size-3" />
                  <span>Gravar</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLimparGravacao}
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Fechar e descartar"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Alerta de sigilo e privacidade */}
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
            <Shield className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground">Proteção de Sigilo Psicanalítico:</strong> O áudio é gravado exclusivamente na memória do dispositivo local. Transcrição remota por navegadores e envio para nuvem desabilitados para preservar a confidencialidade do setting analítico.
            </div>
          </div>

          {/* Alerta de erro de microfone */}
          {erroMicrofone && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{erroMicrofone}</span>
            </div>
          )}

          {/* Ações após gravar / durante gravação */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={tempoSegundos === 0}
              onClick={handleInserirRegistroAudio}
              className="px-3.5 py-1.5 rounded-lg gradient-emerald text-primary-foreground text-[11px] font-bold flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-all disabled:opacity-40"
            >
              <Check className="size-3" />
              <span>Inserir Registro no Prontuário</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

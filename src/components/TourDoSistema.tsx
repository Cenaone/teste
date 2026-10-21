import React, { useEffect, useState, useRef } from 'react';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  BarChart,
  PlusCircle,
  Users,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  Activity,
  Heart,
  Gift,
  DollarSign,
  RotateCcw,
  Bot,
  MessageSquare,
  Database,
  FileText,
  Settings,
  Shield,
  Lightbulb,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Move,
  ArrowUpRight
} from 'lucide-react';

export interface TourStep {
  id: string;
  sectionId?: string;
  title: string;
  category: 'Geral' | 'Clínica' | 'Setting' | 'Comunicação' | 'Configurações';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  details: string[];
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'bem_vindo',
    title: 'Boas-vindas ao PSi4.0',
    category: 'Geral',
    icon: Compass,
    description: 'Conheça o sistema de gestão clínica desenvolvido para psicólogos e psicanalistas.',
    details: [
      'Segurança total com Cofre Criptográfico local (AES-GCM 256 bits).',
      'Gravação de escuta analítica com transcrição automática por IA.',
      'Setting terapêutico, agenda, prontuários sigilosos e honorários em um só lugar.'
    ],
    tip: 'Você pode arrastar este card ou alterar sua posição para não atrapalhar sua visualização da tela.'
  },
  {
    id: 'dashboard',
    sectionId: 'dashboard',
    title: 'Painel Geral (Dashboard)',
    category: 'Clínica',
    icon: BarChart,
    description: 'Visão panorâmica em tempo real de toda a sua rotina clínica e saúde do consultório.',
    details: [
      'Indicadores rápidos de casos ativos, sessões agendadas para o dia e faturamento do mês.',
      'Avisos de pacientes com retorno pendente ou sessões a confirmar.',
      'Acesso direto aos atalhos de nova sessão e novos cadastros.'
    ],
    tip: 'Observe a tela de fundo: ela exibe seus cards de métricas e indicadores em tempo real.'
  },
  {
    id: 'nova_sessao',
    sectionId: 'nova_sessao',
    title: 'Nova Sessão & Transcrição Automática',
    category: 'Clínica',
    icon: PlusCircle,
    description: 'Registre o atendimento com apoio do Gravador Clínico e transcrição de fala contínua.',
    details: [
      'Grave a escuta da sessão pelo microfone com 1 clique.',
      'Transcrição contínua em Português gerada automaticamente em tempo real.',
      'Campos dedicados para hipóteses diagnósticas, associações livres e temas da sessão.',
      'Salva com criptografia militar diretamente no seu cofre local.'
    ],
    tip: 'Ao salvar a sessão, você pode agendar imediatamente o próximo retorno do paciente.'
  },
  {
    id: 'analisandos',
    sectionId: 'analisandos',
    title: 'Meus Pacientes (Prontuários)',
    category: 'Clínica',
    icon: Users,
    description: 'Gestão completa dos analisandos, fichas de identificação e prontuários sigilosos.',
    details: [
      'Histórico clínico, anamnese, dados de contato e responsáveis de emergência.',
      'Tags de acompanhamento clínico e sinalizadores de casos prioritários.',
      'Prontuário Eletrônico protegido por cofre com evolução temporal das sessões.',
      'Botão de contato rápido via WhatsApp oficial integrado.'
    ],
    tip: 'Use a barra de busca no topo da tela de fundo para localizar pacientes por nome, CPF ou telefone.'
  },
  {
    id: 'agenda',
    sectionId: 'agenda',
    title: 'Agenda Clínica Integrada',
    category: 'Clínica',
    icon: Calendar,
    description: 'Controle de horários com visualização semanal ou em lista para evitar conflitos.',
    details: [
      'Exibição em grade semanal ou lista cronológica de atendimentos.',
      'Detecção inteligente de conflitos de horário para impedir agendamentos sobrepostos.',
      'Confirmação de sessão com 1 clique e lembretes por WhatsApp.',
      'Conversão direta de agendamento em "Nova Sessão" com pré-carregamento dos dados.'
    ],
    tip: 'Alterne entre visualização "Semana" e "Lista" conforme seu fluxo de trabalho.'
  },
  {
    id: 'sessoes',
    sectionId: 'sessoes',
    title: 'Sessões Realizadas',
    category: 'Clínica',
    icon: Clock,
    description: 'Acervo temporal de todas as escutas, evoluções terapêuticas e transcrições salvas.',
    details: [
      'Busca e filtragem por paciente, intervalo de datas ou modalidade.',
      'Acesso seguro às anotações da escuta, impressões e termos clínicos.',
      'Reprodução dos áudios gravados e consulta da transcrição integral.'
    ],
    tip: 'Consulte as anotações da sessão anterior antes de iniciar o atendimento do paciente.'
  },
  {
    id: 'modalidades',
    sectionId: 'modalidades',
    title: 'Modalidades de Sessão',
    category: 'Clínica',
    icon: Briefcase,
    description: 'Defina os tipos de atendimento oferecidos, durações e tabelas de valores.',
    details: [
      'Configure sessões individuais, casal, supervisão ou atendimentos sociais.',
      'Defina tempo padrão (ex: 50 minutos) e valor base de referência.',
      'Padroniza o agendamento de horários e o cálculo financeiro.'
    ]
  },
  {
    id: 'relatorios',
    sectionId: 'relatorios',
    title: 'Relatórios & Métricas',
    category: 'Clínica',
    icon: TrendingUp,
    description: 'Análise estatística da prática clínica, faturamento e retenção de pacientes.',
    details: [
      'Gráficos de faturamento mensal acumulado e ticket médio por sessão.',
      'Taxa de comparecimento, faltas justificadas e cancelamentos.',
      'Exportação para demonstrativos contábeis e declaração anual.'
    ]
  },
  {
    id: 'previstos',
    sectionId: 'previstos',
    title: 'Retornos Previstos',
    category: 'Setting',
    icon: Activity,
    description: 'Monitore a regularidade do Setting terapêutico e garanta continuidade da análise.',
    details: [
      'Relação de pacientes com datas de retorno calculadas pelo intervalo de atendimento.',
      'Alertas visuais de retornos vencidos ou pacientes sem data marcada.',
      'Ação imediata com envio de mensagem de retorno pelo WhatsApp.'
    ]
  },
  {
    id: 'acompanhamento',
    sectionId: 'acompanhamento',
    title: 'Acompanhamento Crítico',
    category: 'Setting',
    icon: Heart,
    description: 'Acolhimento prioritário para casos que exigem vigilância intensificada ou apoio emergencial.',
    details: [
      'Marcação de pacientes em crise, luto recente ou vulnerabilidade.',
      'Contatos de emergência e familiares sempre acessíveis com 1 clique.',
      'Quadro de anotações prioritárias em destaque na tela de fundo.'
    ]
  },
  {
    id: 'aniversariantes',
    sectionId: 'aniversariantes',
    title: 'Aniversariantes do Mês',
    category: 'Setting',
    icon: Gift,
    description: 'Fortaleça o vínculo terapêutico lembrando das datas comemorativas dos analisandos.',
    details: [
      'Lista ordenada dos aniversariantes do mês corrente.',
      'Mensagem afetuosa e ética pré-formatada para envio no WhatsApp.',
      'Controle para evitar duplicidade de mensagens.'
    ]
  },
  {
    id: 'honorarios',
    sectionId: 'honorarios',
    title: 'Gestão de Honorários & Recibos',
    category: 'Setting',
    icon: DollarSign,
    description: 'Controle rigoroso dos valores a receber, pagamentos efetuados e emissão de recibos.',
    details: [
      'Visualização de honorários pendentes, pagos e em aberto por paciente.',
      'Geração de recibos profissionais com seus dados de CRP e consultório.',
      'Lembretes sutis de pagamento enviados ao WhatsApp com chave PIX.'
    ]
  },
  {
    id: 'reativacao',
    sectionId: 'reativacao',
    title: 'Reativação de Pausas',
    category: 'Setting',
    icon: RotateCcw,
    description: 'Resgate ético e cuidadoso de pacientes que pausaram o tratamento há mais de 30 dias.',
    details: [
      'Identificação automática de analisandos sem sessão recente.',
      'Modelos de contato empático para verificar se o paciente deseja retomar.',
      'Atualização de status para Alta Clínica ou Desistência.'
    ]
  },
  {
    id: 'bia',
    sectionId: 'bia',
    title: 'Assistente Bia (Inteligência Clínica)',
    category: 'Comunicação',
    icon: Bot,
    description: 'Sua parceira inteligente para reflexões teóricas, auxílio de escrita e apoio analítico.',
    details: [
      'Apoio na formulação de hipóteses teóricas e resumos para supervisão.',
      'Cruzamento de conceitos psicanalíticos e sugestões bibliográficas.',
      'Processamento anônimo e sigiloso, sem identificação de dados de pacientes.'
    ]
  },
  {
    id: 'transmissoes',
    sectionId: 'transmissoes',
    title: 'Transmissões & Grupos',
    category: 'Comunicação',
    icon: Compass,
    description: 'Comunicação coletiva para avisos de férias, recessos ou comunicados gerais.',
    details: [
      'Listas de transmissão organizadas por categorias de atendimento.',
      'Disparo individualizado via WhatsApp sem criar grupos constrangedores.',
      'Histórico e confirmação de mensagens enviadas.'
    ]
  },
  {
    id: 'modelos',
    sectionId: 'modelos',
    title: 'Modelos de Mensagem',
    category: 'Comunicação',
    icon: MessageSquare,
    description: 'Templates padronizados com variáveis dinâmicas para agilizar seu dia a dia.',
    details: [
      'Modelos prontos para Confirmação de Sessão, Cobrança, Aniversário e Retorno.',
      'Substituição automática de {nome}, {data}, {horario} e {valor}.',
      'Personalização livre de textos e mensagens.'
    ]
  },
  {
    id: 'backup',
    sectionId: 'backup',
    title: 'Backup & Cofre Local Criptografado',
    category: 'Configurações',
    icon: Database,
    description: 'Segurança absoluta: seus dados clínicos permanecem sob seu controle exclusivo.',
    details: [
      'Criptografia AES-GCM 256 bits com chave derivada exclusivamente da sua senha.',
      'Nenhum prontuário é armazenado em texto puro na nuvem.',
      'Download de backup criptografado (.json) para salvar no seu computador.',
      'Restauração transacional a qualquer momento para migrar entre dispositivos.'
    ]
  },
  {
    id: 'analista',
    sectionId: 'analista',
    title: 'Meu Perfil & Consultório',
    category: 'Configurações',
    icon: FileText,
    description: 'Configure seus dados profissionais, registros do conselho (CRP/CRM) e consultório.',
    details: [
      'Informações automáticas nos recibos e documentos emitidos.',
      'Endereço do consultório, chave PIX e telefone profissional.',
      'Preferências visuais de cores e temas.'
    ]
  }
];

type DockPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface TourDoSistemaProps {
  aberto: boolean;
  onFechar: () => void;
  onNavegarSecao: (secaoId: string) => void;
  onAbrirManual: () => void;
}

export default function TourDoSistema({
  aberto,
  onFechar,
  onNavegarSecao,
  onAbrirManual
}: TourDoSistemaProps) {
  const [passoAtual, setPassoAtual] = useState(0);
  const [minimizado, setMinimizado] = useState(false);
  const [dock, setDock] = useState<DockPreset>('bottom-right');

  // Dragging state
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFechar();
      } else if (e.key === 'ArrowRight') {
        proximoPasso();
      } else if (e.key === 'ArrowLeft') {
        passoAnterior();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, passoAtual]);

  // Navigate to matching section as user progresses
  useEffect(() => {
    if (aberto && TOUR_STEPS[passoAtual]?.sectionId) {
      onNavegarSecao(TOUR_STEPS[passoAtual].sectionId!);
    }
  }, [passoAtual, aberto]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    isDraggingRef.current = true;
    const rect = cardRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.initialY + deltaY));
      setCustomPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch drag for mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    const rect = cardRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: rect.left,
      initialY: rect.top
    };

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current || moveEvent.touches.length === 0) return;
      const t = moveEvent.touches[0];
      const deltaX = t.clientX - dragStartRef.current.startX;
      const deltaY = t.clientY - dragStartRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 320, dragStartRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragStartRef.current.initialY + deltaY));
      setCustomPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  if (!aberto) return null;

  const step = TOUR_STEPS[passoAtual];
  const StepIcon = step.icon;
  const totalPassos = TOUR_STEPS.length;
  const percentual = Math.round(((passoAtual + 1) / totalPassos) * 100);

  const proximoPasso = () => {
    if (passoAtual < totalPassos - 1) {
      setPassoAtual(prev => prev + 1);
    } else {
      concluirTour();
    }
  };

  const passoAnterior = () => {
    if (passoAtual > 0) {
      setPassoAtual(prev => prev - 1);
    }
  };

  const concluirTour = () => {
    try {
      localStorage.setItem('psi40_tour_concluido', 'true');
    } catch {
      // ignore
    }
    onFechar();
  };

  // Preset dock positions
  const getDockClasses = () => {
    if (customPosition) return '';
    switch (dock) {
      case 'bottom-right':
        return 'right-4 sm:right-6 bottom-4 sm:bottom-6';
      case 'bottom-left':
        return 'left-4 sm:left-6 bottom-4 sm:bottom-6';
      case 'top-right':
        return 'right-4 sm:right-6 top-16 sm:top-20';
      case 'top-left':
        return 'left-4 sm:left-6 top-16 sm:top-20';
      default:
        return 'right-4 sm:right-6 bottom-4 sm:bottom-6';
    }
  };

  const alternarProximaPosicao = () => {
    setCustomPosition(null);
    if (dock === 'bottom-right') setDock('bottom-left');
    else if (dock === 'bottom-left') setDock('top-left');
    else if (dock === 'top-left') setDock('top-right');
    else setDock('bottom-right');
  };

  return (
    // CONTAINER COMPLETELY NON-BLOCKING: NO DARK BACKDROP, ZERO BLUR!
    // The background remains 100% visible and interactive.
    <div
      role="region"
      aria-label="Tour Guiado do Sistema"
      className="fixed inset-0 z-50 pointer-events-none"
    >
      {/* FLOATING ACTION PILL (WHEN MINIMIZED) */}
      {minimizado ? (
        <div
          ref={cardRef}
          style={customPosition ? { left: `${customPosition.x}px`, top: `${customPosition.y}px`, position: 'fixed' } : undefined}
          className={`pointer-events-auto fixed ${getDockClasses()} z-50 bg-card/95 backdrop-blur-md border-2 border-primary/40 rounded-2xl shadow-2xl p-2.5 flex items-center gap-2.5 animate-in zoom-in-95`}
        >
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
            title="Arraste para mover"
          >
            <GripHorizontal className="size-4" />
          </div>

          <div className="flex items-center gap-2 pr-1">
            <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Compass className="size-4" />
            </div>
            <div className="text-xs leading-tight">
              <div className="font-bold text-foreground truncate max-w-[150px]">
                {step.title}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Passo {passoAtual + 1} de {totalPassos}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              type="button"
              onClick={passoAnterior}
              disabled={passoAtual === 0}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
              title="Passo Anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={proximoPasso}
              className="p-1 rounded-lg hover:bg-muted text-primary hover:text-primary/80 cursor-pointer"
              title="Próximo Passo"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setMinimizado(false)}
              className="p-1 rounded-lg hover:bg-muted text-foreground cursor-pointer"
              title="Expandir Card Completo"
            >
              <Maximize2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={concluirTour}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Fechar Tour"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* EXPANDED FLOATING CARD (REPOSITIONABLE & DRAGGABLE) */
        <div
          ref={cardRef}
          style={customPosition ? { left: `${customPosition.x}px`, top: `${customPosition.y}px`, position: 'fixed' } : undefined}
          className={`pointer-events-auto fixed ${getDockClasses()} z-50 w-[94vw] sm:w-[440px] max-w-lg bg-card/98 border border-primary/30 rounded-2xl shadow-2xl flex flex-col max-h-[82vh] overflow-hidden animate-in zoom-in-95 transition-shadow duration-150 ring-1 ring-black/5`}
        >
          {/* DRAGGABLE HEADER HANDLE */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none hover:bg-muted/60 transition-colors"
            title="Clique e arraste para posicionar o card em qualquer lugar da tela"
          >
            <div className="flex items-center gap-2 min-w-0">
              <GripHorizontal className="size-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Tour Guiado
                </span>
                <span>·</span>
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {passoAtual + 1}/{totalPassos}
                </span>
                <span>·</span>
                <span className="text-[10px] truncate">{step.category}</span>
              </div>
            </div>

            {/* CARD CONTROLS: POSITION SWITCHER, MINIMIZE, CLOSE */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Quick Position Switcher */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  alternarProximaPosicao();
                }}
                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title={`Mover para outro canto (Atual: ${dock})`}
                aria-label="Mudar posição do card"
              >
                <Move className="size-3.5 text-primary" />
              </button>

              {/* Minimize to float pill */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setMinimizado(true);
                }}
                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Minimizar card para ver a tela inteira"
                aria-label="Minimizar tour"
              >
                <Minimize2 className="size-3.5" />
              </button>

              {/* Close tour */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  concluirTour();
                }}
                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar Tour"
                aria-label="Fechar tour"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full bg-muted/60 h-1 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${percentual}%` }}
            />
          </div>

          {/* CARD CONTENT */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 max-h-[55vh]">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <StepIcon className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Highlights List */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Recursos deste menu
              </div>
              <ul className="space-y-1.5">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-snug">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Practical Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="font-semibold text-amber-950 dark:text-amber-100">Dica: </strong>
                  {step.tip}
                </div>
              </div>
            )}
          </div>

          {/* CARD FOOTER */}
          <div className="p-3 sm:px-4 py-3 border-t border-border bg-card/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onAbrirManual}
                className="text-[11px] px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-medium cursor-pointer"
                title="Abrir Manual Oficial em PDF"
              >
                <FileText className="size-3 text-primary" />
                <span className="hidden sm:inline">Manual PDF</span>
              </button>

              <button
                type="button"
                onClick={concluirTour}
                className="text-[11px] px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Pular
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {passoAtual > 0 && (
                <button
                  type="button"
                  onClick={passoAnterior}
                  className="text-xs px-2.5 py-1.5 border border-border hover:bg-muted text-foreground rounded-xl transition-all flex items-center gap-1 font-medium cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Anterior</span>
                </button>
              )}

              <button
                type="button"
                onClick={proximoPasso}
                className="text-xs px-3.5 py-1.5 gradient-emerald text-primary-foreground font-semibold rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{passoAtual === totalPassos - 1 ? 'Concluir' : 'Próximo'}</span>
                {passoAtual === totalPassos - 1 ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

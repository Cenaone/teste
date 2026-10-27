import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  ShieldCheck,
  Lightbulb,
  GripHorizontal,
  Minimize2,
  Maximize2,
  Move,
  ArrowUpRight,
  Sparkles,
  ClipboardList,
  Video,
  Layers,
  Filter
} from 'lucide-react';

/**
 * VERSÃO ATUAL DO TOUR E REGISTRO DE IMPLEMENTOS
 * IMPORTANTE: Toda vez que um novo recurso ou implemento for criado no PSi4.0:
 * 1. Adicione ou atualize o passo correspondente em ALL_TOUR_STEPS com isNew: true e novoBadge: 'Novo Implemento'
 * 2. Incremente CURRENT_TOUR_VERSION (ex: '2026.10-v4.1.0' -> '2026.10-v4.2.0')
 * Isso garante que todos os usuários recebam automaticamente o aviso e o tour atualizado!
 */
export const CURRENT_TOUR_VERSION = '2026.10-v4.2.0';

export function checarNovosImplementosTour(): boolean {
  try {
    const versaoSalva = localStorage.getItem('psi40_tour_version');
    return versaoSalva !== CURRENT_TOUR_VERSION;
  } catch {
    return false;
  }
}

export function marcarTourConcluidoVersaoAtual(): void {
  try {
    localStorage.setItem('psi40_tour_version', CURRENT_TOUR_VERSION);
    localStorage.setItem('psi40_tour_concluido', 'true');
  } catch {
    // ignorar falha no localStorage
  }
}

export interface TourStep {
  id: string;
  sectionId?: string;
  title: string;
  category: 'Geral' | 'Clínica' | 'Setting' | 'Comunicação' | 'Configurações';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  details: string[];
  tip?: string;
  isNew?: boolean;
  novoBadge?: string;
  requerAdmin?: boolean;
}

const ALL_TOUR_STEPS: TourStep[] = [
  {
    id: 'bem_vindo',
    title: 'Boas-vindas ao PSi4.0',
    category: 'Geral',
    icon: Compass,
    description: 'Conheça o sistema de gestão clínica e setting analítico desenvolvido para psicólogos e psicanalistas.',
    details: [
      'Segurança total com Cofre Criptográfico local (AES-GCM 256 bits).',
      'Gravação de escuta com transcrição automática por IA para atendimentos presenciais e teleconsultas.',
      '18 Modelos & Instrumentos clínicos oficiais, agenda inteligente e controle de honorários.',
      'Sempre atualizado com novas implementações contínuas para sua prática clínica.'
    ],
    tip: 'Você pode alternar entre "Todos os Passos" e "✨ Apenas Novos Implementos" nos botões acima para ver o que há de novo!'
  },
  {
    id: 'dashboard',
    sectionId: 'dashboard',
    title: 'Painel Geral (Dashboard Clínico)',
    category: 'Clínica',
    icon: BarChart,
    isNew: true,
    novoBadge: 'Métricas em Tempo Real',
    description: 'Visão panorâmica em tempo real de toda a sua rotina clínica, pacientes ativos e saúde do consultório.',
    details: [
      'Indicadores rápidos de casos ativos, sessões agendadas para o dia e faturamento do mês.',
      'Gráfico de evolução financeira e sessões mês a mês com faturamento total atualizado em tempo real.',
      'Avisos de pacientes com retorno pendente ou sessões a confirmar.',
      'Atalhos velozes para iniciar Nova Sessão, emitir recibo ou cadastrar novo analisando.'
    ],
    tip: 'Observe a tela de fundo: o gráfico reflete automaticamente as sessões clínicas realizadas e honorários pagos.'
  },
  {
    id: 'nova_sessao',
    sectionId: 'nova_sessao',
    title: 'Nova Sessão & Gravador Dual Teleconsulta',
    category: 'Clínica',
    icon: PlusCircle,
    isNew: true,
    novoBadge: 'Dual-Áudio Google Meet / Zoom',
    description: 'Registre o atendimento com apoio do Gravador Clínico capaz de captar simultaneamente microfone e chamadas online!',
    details: [
      '✨ Modo Teleconsulta Online: mixa o seu microfone E o áudio do paciente vindo do Google Meet, Zoom, WhatsApp Web ou Teams, funcionando perfeitamente com fones de ouvido!',
      'Modo Presencial para gravação de escuta direta pelo microfone do consultório.',
      'Transcrição contínua em Português gerada automaticamente em tempo real.',
      'Campos dedicados para hipóteses diagnósticas, associações livres e temas da sessão.',
      'Salva com criptografia militar AES-GCM diretamente no seu cofre local.'
    ],
    tip: 'Ao realizar teleconsultas no Google Meet, ative o modo Teleconsulta no gravador e selecione a aba da reunião para captar o diálogo de ambos.'
  },
  {
    id: 'modelos_clinicos',
    sectionId: 'modelos_clinicos',
    title: 'Modelos & Instrumentos Clínicos',
    category: 'Clínica',
    icon: ClipboardList,
    isNew: true,
    novoBadge: '18 Modelos & Escalas Oficiais',
    description: 'Biblioteca completa de formulários, anamneses, inventários diagnósticos e documentos oficiais para atendimento.',
    details: [
      '✨ Anamneses Clínicas: PBE (Prática Baseada em Evidências), TCC, Breve, Detalhada, Rotina e Modelo Breno Altieres.',
      '✨ Escalas & Inventários: Inventário de Depressão de Beck (BDI), Inventário de Ansiedade (BAI), Questionário de Saúde Geral (QSG-12), Autoestima de Rosenberg e Registro Diário de Humor.',
      '✨ Saúde Mental no Trabalho NR-1: Formulário de Triagem Inicial de Colaboradores e Formulário Gerencial por Área para conformidade legal.',
      '✨ Documentos Oficiais: Atestado Psicológico, Declaração, Contrato de Prestação de Serviços, Termo de Consentimento, Encaminhamento Psiquiátrico e Notas SOAP.',
      'Preenchimento dinâmico vinculado ao prontuário, com cálculo automático de scores e exportação imediata em PDF profissional.'
    ],
    tip: 'Acesse esta seção para preencher escalas com pacientes ou emitir laudos e atestados pré-formatados com seus dados de CRP.'
  },
  {
    id: 'analisandos',
    sectionId: 'analisandos',
    title: 'Meus Pacientes (Prontuários Sigilosos)',
    category: 'Clínica',
    icon: Users,
    description: 'Gestão completa dos analisandos, fichas de identificação e prontuários protegidos por criptografia militar.',
    details: [
      'Visualização organizada por status de atendimento (Ativo, Em Pausa, Alta Terapêutica).',
      'Prontuário com linha do tempo de evolução, sessões gravadas, documentos emitidos e notas SOAP.',
      'Ficha cadastral com contatos de emergência e anotações prioritárias.',
      'Atalho rápido para contato direto pelo WhatsApp oficial com 1 clique.'
    ],
    tip: 'Clique sobre qualquer paciente para abrir seu prontuário clínico individual.'
  },
  {
    id: 'agenda',
    sectionId: 'agenda',
    title: 'Agenda Clínica & Google Meet',
    category: 'Clínica',
    icon: Calendar,
    isNew: true,
    novoBadge: 'Vídeo Chamadas Google Meet',
    description: 'Controle inteligente de horários com geração automática de reuniões de vídeo e avisos no WhatsApp.',
    details: [
      '✨ Botão de criação instantânea de videochamada Google Meet vinculada ao agendamento.',
      'Exibição em grade semanal ou lista cronológica de atendimentos.',
      'Detecção inteligente de conflitos para impedir marcações sobrepostas de horários.',
      'Confirmação com 1 clique por WhatsApp e conversão direta para "Nova Sessão".'
    ],
    tip: 'Ao agendar uma sessão remota, o link do Google Meet pode ser enviado automaticamente na mensagem de confirmação.'
  },
  {
    id: 'sessoes',
    sectionId: 'sessoes',
    title: 'Sessões Realizadas & Acervo',
    category: 'Clínica',
    icon: Clock,
    description: 'Acervo temporal de todas as escutas, evoluções terapêuticas, áudios e transcrições salvas.',
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
    title: 'Relatórios, Métricas & Faturamento',
    category: 'Clínica',
    icon: TrendingUp,
    isNew: true,
    novoBadge: 'Mês a Mês Atualizado',
    description: 'Análise estatística da prática clínica, retenção de pacientes e conciliação de faturamento mensal.',
    details: [
      '✨ Gráficos mensais de faturamento acumulado atualizados em tempo real com as sessões registradas.',
      'Taxa de comparecimento, faltas justificadas e cancelamentos.',
      'Ticket médio por sessão e projeção de receita do consultório.',
      'Exportação para demonstrativos contábeis e declaração anual (Carnê-Leão).'
    ],
    tip: 'Todos os valores de faturamento refletem com precisão o status de quitação das sessões no cofre.'
  },
  {
    id: 'previstos',
    sectionId: 'previstos',
    title: 'Retornos Previstos (Setting)',
    category: 'Setting',
    icon: Activity,
    description: 'Monitore a regularidade do Setting terapêutico e garanta a continuidade da análise.',
    details: [
      'Relação de pacientes com datas de retorno calculadas pelo intervalo de atendimento.',
      'Alertas visuais de retornos vencidos ou pacientes sem data marcada.',
      'Ação imediata com envio de mensagem de retorno pelo WhatsApp.'
    ]
  },
  {
    id: 'acompanhamento',
    sectionId: 'acompanhamento',
    title: 'Acompanhamento Crítico & Emergências',
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
    id: 'financeiro',
    sectionId: 'financeiro',
    title: 'Financeiro, Consultas Pendentes/Pagas & Recibos',
    category: 'Clínica',
    icon: DollarSign,
    isNew: true,
    novoBadge: 'Novo Módulo Financeiro & Recibos',
    description: 'Acesso unificado a todas as consultas clínicas com status de pagamento, controle de honorários e emissão/impressão de recibos para IRPF.',
    details: [
      'Visão instantânea de consultas Pagas, Pendentes de Pagamento e em Atraso com filtros por paciente e período.',
      'Emissão e impressão profissional de recibos de atendimento para declaração de IRPF com dados de CRP/CPF do terapeuta e paciente.',
      'Geração de Recibo Consolidado / Fechamento Mensal somando todas as sessões do paciente no mês.',
      'Valor por extenso automático em reais, alternância de status em 1 toque e disparo de recibo e cobrança pelo WhatsApp.'
    ],
    tip: 'Clique em "Recibo" em qualquer consulta para visualizar o documento oficial timbrado, pronto para impressão em folha A4 ou envio direto no WhatsApp do paciente.'
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
    title: 'Modelos de Mensagem WhatsApp',
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
    id: 'analista',
    sectionId: 'analista',
    title: 'Meu Perfil & Registro Profissional',
    category: 'Configurações',
    icon: FileText,
    description: 'Configure seus dados profissionais, registros do conselho (CRP/CRM) e consultório.',
    details: [
      'Informações automáticas nos recibos e documentos emitidos.',
      'Nome completo, número de registro profissional e mini-bio.',
      'Chave PIX padrão para pagamentos e preferências visuais de cores.'
    ]
  },
  {
    id: 'consultorio',
    sectionId: 'consultorio',
    title: 'Dados do Consultório & Cabeçalho',
    category: 'Configurações',
    icon: Settings,
    isNew: true,
    novoBadge: 'Novo Implemento',
    description: 'Configure a identidade do seu espaço físico ou clínica virtual nos documentos oficiais.',
    details: [
      '✨ Endereço completo do consultório, telefone e logomarca.',
      'Padronização automática no cabeçalho dos 18 Modelos Clínicos, Atestados e Recibos.',
      'Garante apresentação profissional e conformidade nas emissões.'
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
    id: 'admin_users',
    sectionId: 'admin_users',
    title: 'Validação de Acessos & Assinaturas SaaS',
    category: 'Configurações',
    icon: ShieldCheck,
    isNew: true,
    novoBadge: 'Painel Administrativo',
    requerAdmin: true,
    description: 'Painel de governança para gerenciamento de planos, assinaturas e status de usuários.',
    details: [
      '✨ Visualização de todos os assinantes, planos contratados e vigência de assinaturas.',
      'Liberação manual de acessos e sincronização com banco Supabase.',
      'Diagnóstico de permissões RPC e segurança de administradores da plataforma.'
    ],
    tip: 'Este passo é exibido apenas para contas com perfil de Administrador.'
  }
];

type DockPreset = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface TourDoSistemaProps {
  aberto: boolean;
  onFechar: () => void;
  onNavegarSecao: (secaoId: string) => void;
  onAbrirManual: () => void;
  podeGerenciarAcessos?: boolean;
  passoInicialId?: string;
  iniciarApenasNovos?: boolean;
}

export default function TourDoSistema({
  aberto,
  onFechar,
  onNavegarSecao,
  onAbrirManual,
  podeGerenciarAcessos = false,
  passoInicialId,
  iniciarApenasNovos = false
}: TourDoSistemaProps) {
  // Filtro de passos: 'todos' ou 'novos'
  const [filtroModo, setFiltroModo] = useState<'todos' | 'novos'>(iniciarApenasNovos ? 'novos' : 'todos');
  const [passoIndex, setPassoIndex] = useState(0);
  const [minimizado, setMinimizado] = useState(false);
  const [dock, setDock] = useState<DockPreset>('bottom-right');
  const [menuPassosAberto, setMenuPassosAberto] = useState(false);

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

  // Filtra passos disponíveis respeitando perfil admin e filtro de novidades
  const passosDisponiveis = useMemo(() => {
    let lista = ALL_TOUR_STEPS.filter(step => {
      if (step.requerAdmin && !podeGerenciarAcessos) return false;
      return true;
    });

    if (filtroModo === 'novos') {
      const novos = lista.filter(s => s.isNew);
      return novos.length > 0 ? novos : lista;
    }

    return lista;
  }, [podeGerenciarAcessos, filtroModo]);

  const totalPassos = passosDisponiveis.length;
  const totalNovosImplementos = useMemo(() => {
    return ALL_TOUR_STEPS.filter(s => s.isNew && (!s.requerAdmin || podeGerenciarAcessos)).length;
  }, [podeGerenciarAcessos]);

  // Se passoInicialId for fornecido, posicione nele
  useEffect(() => {
    if (aberto && passoInicialId) {
      const idx = passosDisponiveis.findIndex(s => s.id === passoInicialId || s.sectionId === passoInicialId);
      if (idx !== -1) {
        setPassoIndex(idx);
      }
    }
  }, [aberto, passoInicialId, passosDisponiveis]);

  // Garante índice válido caso mude o filtro
  useEffect(() => {
    if (passoIndex >= totalPassos) {
      setPassoIndex(0);
    }
  }, [totalPassos, passoIndex]);

  // Teclado
  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        concluirTour();
      } else if (e.key === 'ArrowRight') {
        proximoPasso();
      } else if (e.key === 'ArrowLeft') {
        passoAnterior();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, passoIndex, totalPassos]);

  // Navegar na aplicação ao avançar o passo
  useEffect(() => {
    if (aberto && passosDisponiveis[passoIndex]?.sectionId) {
      onNavegarSecao(passosDisponiveis[passoIndex].sectionId!);
    }
  }, [passoIndex, aberto, passosDisponiveis]);

  // Handle Dragging Mouse
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

  const step = passosDisponiveis[passoIndex] || passosDisponiveis[0];
  const StepIcon = step.icon;
  const percentual = Math.round(((passoIndex + 1) / totalPassos) * 100);

  const proximoPasso = () => {
    if (passoIndex < totalPassos - 1) {
      setPassoIndex(prev => prev + 1);
    } else {
      concluirTour();
    }
  };

  const passoAnterior = () => {
    if (passoIndex > 0) {
      setPassoIndex(prev => prev - 1);
    }
  };

  const concluirTour = () => {
    marcarTourConcluidoVersaoAtual();
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
    // CONTAINER COMPLETELY NON-BLOCKING: NO DARK BACKDROP, ZERO BLUR
    // A tela de fundo permanece 100% visível e interativa
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
              <StepIcon className="size-4" />
            </div>
            <div className="text-xs leading-tight">
              <div className="font-bold text-foreground truncate max-w-[150px] flex items-center gap-1">
                <span>{step.title}</span>
                {step.isNew && <Sparkles className="size-3 text-amber-500 shrink-0" />}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Passo {passoIndex + 1} de {totalPassos} {filtroModo === 'novos' && '(Novidades)'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              type="button"
              onClick={passoAnterior}
              disabled={passoIndex === 0}
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
          className={`pointer-events-auto fixed ${getDockClasses()} z-50 w-[95vw] sm:w-[460px] max-w-lg bg-card/98 border border-primary/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 transition-shadow duration-150 ring-1 ring-black/5`}
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
                  Tour do Sistema
                </span>
                <span>·</span>
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {passoIndex + 1}/{totalPassos}
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

          {/* FILTER MODES & QUICK STEP PICKER */}
          <div className="px-4 py-2 bg-background/50 border-b border-border/70 flex items-center justify-between gap-2 text-xs">
            {/* Toggle: Todos vs Apenas Novos Implementos */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setFiltroModo('todos');
                  setPassoIndex(0);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  filtroModo === 'todos'
                    ? 'bg-card text-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({ALL_TOUR_STEPS.filter(s => !s.requerAdmin || podeGerenciarAcessos).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroModo('novos');
                  setPassoIndex(0);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  filtroModo === 'novos'
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold border border-amber-500/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Ver somente os passos com implementações recentes"
              >
                <Sparkles className="size-3 text-amber-500 shrink-0" />
                <span>Novos ({totalNovosImplementos})</span>
              </button>
            </div>

            {/* Quick step menu dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuPassosAberto(prev => !prev)}
                className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                title="Pular direto para outro menu"
              >
                <Layers className="size-3 text-primary" />
                <span className="hidden sm:inline">Pular para...</span>
              </button>

              {menuPassosAberto && (
                <div className="absolute right-0 top-8 z-50 w-64 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border mb-1">
                    Passos do Tour
                  </div>
                  {passosDisponiveis.map((p, idx) => {
                    const PIcon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPassoIndex(idx);
                          setMenuPassosAberto(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          idx === passoIndex
                            ? 'bg-primary text-primary-foreground font-semibold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <PIcon className="size-3.5 shrink-0" />
                          <span className="truncate">{p.title}</span>
                        </div>
                        {p.isNew && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shrink-0">
                            Novo
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  {step.isNew && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center gap-1 shadow-2xs">
                      <Sparkles className="size-3 text-amber-500" />
                      <span>{step.novoBadge || 'Novo Implemento'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Highlights List */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Destaques & Recursos</span>
                {step.sectionId && (
                  <button
                    type="button"
                    onClick={() => onNavegarSecao(step.sectionId!)}
                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
                  >
                    <span>Abrir seção na tela</span>
                    <ArrowUpRight className="size-3" />
                  </button>
                )}
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
              {passoIndex > 0 && (
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
                <span>{passoIndex === totalPassos - 1 ? 'Concluir Tour' : 'Próximo'}</span>
                {passoIndex === totalPassos - 1 ? (
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

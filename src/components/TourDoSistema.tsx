import React, { useEffect, useState } from 'react';
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
  Sparkles,
  ArrowRight
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
    description: 'Conheça o sistema de gestão clínica desenvolvido especialmente para psicólogos e psicanalistas.',
    details: [
      'Segurança de ponta a ponta com Cofre Criptográfico local (AES-GCM 256 bits).',
      'Gravação de escuta analítica com transcrição automática por inteligência artificial.',
      'Organização do Setting terapêutico, agenda, prontuários sigilosos e honorários em um só lugar.'
    ],
    tip: 'Você pode reabrir este tour a qualquer momento clicando em "Tour Guiado" no topo da tela.'
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
      'Avisos de pacientes que precisam de confirmação ou que estão sem retorno previsto.',
      'Acesso direto aos atalhos de nova sessão e novos cadastros.'
    ],
    tip: 'Verifique o Dashboard ao iniciar o dia para planejar sua jornada de atendimentos.'
  },
  {
    id: 'nova_sessao',
    sectionId: 'nova_sessao',
    title: 'Nova Sessão & Transcrição Automática',
    category: 'Clínica',
    icon: PlusCircle,
    description: 'Registre o atendimento com apoio do Gravador Clínico e transcrição de fala em tempo real.',
    details: [
      'Grave a escuta da sessão pelo microfone com um clique.',
      'Transcrição contínua em Português gerada automaticamente enquanto a conversa acontece.',
      'Campos dedicados para impressões diagnósticas, associações livres e temas da sessão.',
      'Salva instantaneamente com criptografia militar no seu cofre local.'
    ],
    tip: 'Ao salvar a sessão, o sistema já agenda opcionalmente o próximo retorno do paciente.'
  },
  {
    id: 'analisandos',
    sectionId: 'analisandos',
    title: 'Meus Pacientes (Prontuários)',
    category: 'Clínica',
    icon: Users,
    description: 'Gestão completa dos analisandos, fichas de identificação e prontuários sigilosos.',
    details: [
      'Histórico clínico, anamnese, dados de contato e responsáveis.',
      'Tags de acompanhamento clínico e sinalizadores de casos prioritários.',
      'Acesso ao Prontuário Eletrônico protegido por cofre com evolução temporal das sessões.',
      'Botão de contato rápido via WhatsApp oficial.'
    ],
    tip: 'Use o campo de busca no topo para localizar pacientes rapidamente por nome, telefone ou CPF.'
  },
  {
    id: 'agenda',
    sectionId: 'agenda',
    title: 'Agenda Clínica Integrada',
    category: 'Clínica',
    icon: Calendar,
    description: 'Controle de horários com visualização semanal ou em lista para evitar conflitos de sessão.',
    details: [
      'Exibição visual da semana inteira ou lista ordenada de atendimentos.',
      'Detecção inteligente de conflitos de horário para impedir agendamentos sobrepostos.',
      'Confirmação de sessão com 1 clique e envio automático de lembrete pelo WhatsApp.',
      'Conversão direta de agendamento em "Nova Sessão" com pré-carregamento dos dados.'
    ],
    tip: 'Alterne entre visualização "Semana" e "Lista" de acordo com sua preferência de rotina.'
  },
  {
    id: 'sessoes',
    sectionId: 'sessoes',
    title: 'Sessões Realizadas',
    category: 'Clínica',
    icon: Clock,
    description: 'Acervo temporal de todas as escutas, evoluções terapêuticas e transcrições salvas.',
    details: [
      'Busca e filtragem por paciente, intervalo de datas ou tipo de atendimento.',
      'Visualização das notas de sessão, impressões psicanalíticas e termos clínicos.',
      'Acesso seguro às gravações de áudio e transcrições completas da fala.',
      'Exportação segura de relatórios para supervisão ou evolução clínica.'
    ],
    tip: 'Revise as anotações da sessão anterior antes de iniciar o próximo atendimento com o paciente.'
  },
  {
    id: 'modalidades',
    sectionId: 'modalidades',
    title: 'Modalidades de Sessão',
    category: 'Clínica',
    icon: Briefcase,
    description: 'Defina os tipos de atendimento oferecidos, durações e tabelas de valores.',
    details: [
      'Configure sessões individuais, terapia de casal, supervisão ou atendimentos sociais.',
      'Defina tempo padrão de atendimento (ex: 50 minutos) e valor base sugerido.',
      'Padroniza o lançamento de horários na agenda e o cálculo financeiro.'
    ],
    tip: 'Personalize valores diferenciados para analisandos em contexto social ou acadêmico.'
  },
  {
    id: 'relatorios',
    sectionId: 'relatorios',
    title: 'Relatórios & Métricas',
    category: 'Clínica',
    icon: TrendingUp,
    description: 'Análise profunda da performance clínica, evolução de receita e retenção de pacientes.',
    details: [
      'Gráficos de faturamento acumulado, mensal e ticket médio por sessão.',
      'Taxa de comparecimento, faltas justificadas e cancelamentos.',
      'Distribuição dos pacientes por frequência (semanal, quinzenal, avulso).',
      'Exportação de balanços para planejamento contábil do consultório.'
    ],
    tip: 'Acompanhe a métrica de retenção para identificar momentos de queda no fluxo de sessões.'
  },
  {
    id: 'previstos',
    sectionId: 'previstos',
    title: 'Retornos Previstos',
    category: 'Setting',
    icon: Activity,
    description: 'Monitore a regularidade do Setting terapêutico e garanta que nenhum paciente fique sem data.',
    details: [
      'Relação de pacientes com datas de retorno calculadas pelo intervalo de atendimento.',
      'Alertas de retornos vencidos ou pacientes que não marcaram a próxima sessão.',
      'Ação imediata com envio de mensagem de agendamento por WhatsApp.'
    ],
    tip: 'Evite o abandono silencioso acompanhando a lista semanalmente.'
  },
  {
    id: 'acompanhamento',
    sectionId: 'acompanhamento',
    title: 'Acompanhamento Crítico',
    category: 'Setting',
    icon: Heart,
    description: 'Acolhimento prioritário para casos que exigem vigilância intensificada ou apoio emergencial.',
    details: [
      'Marcação de pacientes em crise, luto recente ou transição delicada.',
      'Contatos de emergência e responsáveis sempre à mão.',
      'Painel de observações prioritárias visível com rapidez.'
    ],
    tip: 'Casos marcados como críticos recebem destaque visual imediato em toda a plataforma.'
  },
  {
    id: 'aniversariantes',
    sectionId: 'aniversariantes',
    title: 'Aniversariantes do Mês',
    category: 'Setting',
    icon: Gift,
    description: 'Fortaleça o vínculo terapêutico lembrando das datas comemorativas dos analisandos.',
    details: [
      'Lista dos pacientes aniversariantes ordenados pelo dia do mês corrente.',
      'Envio de mensagem acolhedora pré-formatada via WhatsApp com 1 clique.',
      'Registro de envio para não duplicar felicitações.'
    ],
    tip: 'Envie felicitações afetuosas preservando a discrição e a ética profissional.'
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
      'Geração de recibos profissionais com seus dados de CRP e dados do consultório.',
      'Lembretes sutis de pagamento enviados diretamente ao WhatsApp com mensagem polida.'
    ],
    tip: 'Você pode filtrar rapidamente por "Pendentes" para organizar fechamentos de mês.'
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
      'Modelos de contato empático para verificar se o paciente deseja retomar o processo.',
      'Possibilidade de atualizar o status para "Inativo" ou "Alta Terapêutica".'
    ],
    tip: 'Um contato sutil pode ser decisivo para o retorno de um paciente que hesita em procurar o analista.'
  },
  {
    id: 'bia',
    sectionId: 'bia',
    title: 'Assistente Bia (Inteligência Clínica)',
    category: 'Comunicação',
    icon: Bot,
    description: 'Sua parceira inteligente para reflexões teóricas, auxílio de escrita e apoio analítico.',
    details: [
      'Apoio na formulação de hipóteses teóricas e resumos para supervisão clínica.',
      'Sugestões de leitura e cruzamento de conceitos freudianos, lacanianos e contemporâneos.',
      'Processamento estritamente sigiloso e anônimo, sem identificação de dados de pacientes.'
    ],
    tip: 'Peça para a Bia ajudar a sintetizar impressões antes da sua sessão de supervisão.'
  },
  {
    id: 'transmissoes',
    sectionId: 'transmissoes',
    title: 'Transmissões & Grupos',
    category: 'Comunicação',
    icon: Compass,
    description: 'Comunicação coletiva para avisos de férias, recessos ou comunicados gerais.',
    details: [
      'Crie listas de transmissão para grupos específicos (ex: pacientes de segunda-feira).',
      'Envio individualizado via WhatsApp sem expor os contatos entre si.',
      'Controle de entrega e histórico das mensagens transmitidas.'
    ],
    tip: 'Ideal para avisar sobre recesso de final de ano ou mudanças de endereço do consultório.'
  },
  {
    id: 'modelos',
    sectionId: 'modelos',
    title: 'Modelos de Mensagem',
    category: 'Comunicação',
    icon: MessageSquare,
    description: 'Templates padronizados com variáveis dinâmicas para agilizar seu dia a dia.',
    details: [
      'Modelos prontos para: Confirmação de Sessão, Lembrete de Pagamento, Aniversário e Retorno.',
      'Variáveis automáticas como {nome}, {data}, {horario} e {valor}.',
      'Criação de novos modelos personalizados para o seu tom de comunicação.'
    ],
    tip: 'Ajuste os modelos para refletirem o tom e estilo da sua prática clínica.'
  },
  {
    id: 'backup',
    sectionId: 'backup',
    title: 'Backup & Cofre Local Criptografado',
    category: 'Configurações',
    icon: Database,
    description: 'Segurança absoluta: seus dados clínicos permanecem sob seu controle exclusivo.',
    details: [
      'Criptografia AES-GCM 256 bits com chave derivada exclusivamente da sua senha do cofre.',
      'Nenhum prontuário ou nota clínica é armazenado em texto puro na nuvem.',
      'Exportação de arquivo de backup (.json criptografado) com 1 clique para guardar no seu computador.',
      'Restauração transacional a qualquer momento para migrar entre dispositivos.'
    ],
    tip: 'Recomendamos baixar um backup criptografado ao final de cada semana para máxima tranquilidade.'
  },
  {
    id: 'analista',
    sectionId: 'analista',
    title: 'Meu Perfil & Consultório',
    category: 'Configurações',
    icon: FileText,
    description: 'Configure seus dados profissionais, registros do conselho (CRP/CRM) e consultório.',
    details: [
      'Dados que aparecem automaticamente nos recibos e documentos emitidos.',
      'Endereço do consultório, chave PIX para pagamentos e telefone profissional.',
      'Opções de tema visual e paletas de cores da interface.'
    ],
    tip: 'Mantenha sua chave PIX preenchida para facilitar o envio nos lembretes de cobrança.'
  }
];

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

  // When step changes, automatically navigate to section if provided
  useEffect(() => {
    if (aberto && TOUR_STEPS[passoAtual]?.sectionId) {
      onNavegarSecao(TOUR_STEPS[passoAtual].sectionId!);
    }
  }, [passoAtual, aberto]);

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

  const irParaPasso = (index: number) => {
    if (index >= 0 && index < totalPassos) {
      setPassoAtual(index);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tour Guiado do Sistema"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* TOP BAR / PROGRESS */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Compass className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                    Tour Guiado
                  </span>
                  <span>·</span>
                  <span>
                    Passo <strong className="text-foreground">{passoAtual + 1}</strong> de {totalPassos}
                  </span>
                  <span>·</span>
                  <span className="text-primary font-medium">{step.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onAbrirManual}
                className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-medium"
                title="Abrir Manual Completo em PDF"
              >
                <FileText className="size-3 text-primary" />
                <span className="hidden sm:inline">Manual do Sistema</span>
              </button>
              <button
                type="button"
                onClick={concluirTour}
                className="size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title="Fechar Tour"
                aria-label="Fechar Tour"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* STEP BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <StepIcon className="size-6 text-primary" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>

          {/* Highlights / Features */}
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 sm:p-4 space-y-2.5">
            <div className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground">
              O que você faz nesta seção
            </div>
            <ul className="space-y-2">
              {step.details.map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground/90">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tip / Shortcut */}
          {step.tip && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
              <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-semibold text-amber-950 dark:text-amber-100">Dica Prática: </strong>
                {step.tip}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Step Indicators */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => irParaPasso(idx)}
                title={`${idx + 1}. ${s.title}`}
                className={`transition-all rounded-full ${
                  idx === passoAtual
                    ? 'w-6 h-2 bg-primary'
                    : idx < passoAtual
                    ? 'size-2 bg-primary/40 hover:bg-primary/70'
                    : 'size-2 bg-muted hover:bg-muted-foreground/40'
                }`}
                aria-label={`Ir para passo ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={concluirTour}
              className="text-xs px-3 py-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Pular Tour
            </button>

            {passoAtual > 0 && (
              <button
                type="button"
                onClick={passoAnterior}
                className="text-xs px-3.5 py-2 border border-border hover:bg-muted text-foreground rounded-xl transition-all flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="size-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={proximoPasso}
              className="text-xs px-4 py-2 gradient-emerald text-primary-foreground font-semibold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <span>{passoAtual === totalPassos - 1 ? 'Concluir Tour' : 'Próximo'}</span>
              {passoAtual === totalPassos - 1 ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

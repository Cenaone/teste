import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Printer,
  Download,
  Search,
  X,
  Shield,
  Activity,
  Mic,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Sparkles,
  Bot,
  MessageSquare,
  FileText,
  Database,
  CheckCircle,
  HelpCircle,
  Copy,
  ChevronRight,
  Lock,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface ManualSection {
  id: string;
  number: string;
  title: string;
  category: 'Introdução' | 'Clínica' | 'Setting' | 'Comunicação' | 'Segurança & Config';
  summary: string;
  content: string[];
  steps?: string[];
  tips?: string[];
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'visao_geral',
    number: '01',
    title: 'Visão Geral e Filosofia do PSi4.0',
    category: 'Introdução',
    summary: 'Arquitetura voltada para a preservação do Setting psicanalítico, ética profissional e sigilo inegociável.',
    content: [
      'O PSi4.0 é um sistema especializado para a prática clínica de psicólogos, psicanalistas e terapeutas.',
      'Diferente de sistemas tradicionais que expõem os prontuários dos pacientes na nuvem aberta, o PSi4.0 opera sob o conceito de "Soberania dos Dados Clínicos".',
      'Toda informação sensível (identificação do paciente, histórico familiar, anotações de sessões, transcrições e áudios) é protegida por criptografia de nível militar em cofre local no seu próprio dispositivo.'
    ],
    tips: [
      'Mantenha sempre sua senha do cofre anotada em local físico seguro. Nem mesmo os administradores do sistema têm acesso à chave de decriptação.',
      'O sistema funciona em conformidade com as diretrizes do Conselho Federal de Psicologia (CFP) e com a LGPD.'
    ]
  },
  {
    id: 'cofre_criptografico',
    number: '02',
    title: 'Segurança, Criptografia & Cofre Local (AES-256)',
    category: 'Segurança & Config',
    summary: 'Como funciona a proteção criptográfica ponta a ponta dos seus prontuários e escutas.',
    content: [
      'O motor de segurança utiliza o padrão Web Crypto API nativo dos navegadores modernos.',
      'Algoritmo: AES-GCM com chave de 256 bits derivada via PBKDF2 (100.000 iterações com salt criptográfico único).',
      'Bloqueio automático: O cofre bloqueia automaticamente a memória após 15 minutos de inatividade para evitar acesso inadvertido caso você se afaste do consultório.',
      'Soberania Total: Você pode exportar backups criptografados com 1 clique para guardar em um pendrive ou disco seguro.'
    ],
    steps: [
      '1. Ao entrar no sistema com seu e-mail e senha, o cofre solicitará sua senha mestra.',
      '2. Digite sua senha mestra para desbloquear o acesso aos prontuários em memória RAM.',
      '3. Caso deseje pausar os atendimentos, clique no botão "Bloquear Cofre" no topo do painel.'
    ],
    tips: [
      'Nunca compartilhe a senha do seu cofre.',
      'Faça um backup semanal clicando em "Backup Criptografado" no menu superior.'
    ]
  },
  {
    id: 'dashboard',
    number: '03',
    title: 'Painel Geral (Dashboard)',
    category: 'Clínica',
    summary: 'Centro de comando para visualização rápida da saúde do consultório e pacientes do dia.',
    content: [
      'O Painel Geral reúne as principais métricas operacionais e clínicas em uma única tela.',
      'Métricas essenciais: Casos Ativos, Pacientes Recorrentes, Sessões Realizadas no Mês e Faturamento Acumulado.',
      'Alertas do Setting: Pacientes com retorno vencido, sessões aguardando confirmação e casos marcados para atenção especial.'
    ],
    steps: [
      '1. Acesse o menu "Painel Geral" na barra lateral.',
      '2. Consulte a linha de resumo com as contagens de atendimentos e retornos do dia.',
      '3. Use os atalhos de "Nova Sessão" e "Cadastrar Paciente" para iniciar procedimentos rápidos.'
    ]
  },
  {
    id: 'nova_sessao',
    number: '04',
    title: 'Nova Sessão, Gravador & Transcrição Automática',
    category: 'Clínica',
    summary: 'Registro da escuta analítica com gravação de áudio e transcrição contínua em tempo real por IA.',
    content: [
      'Desenvolvido para liberar o analista da necessidade de anotações manuais exaustivas durante a sessão.',
      'O Gravador Integrado captura a fala do atendimento pelo microfone do computador ou celular.',
      'A Transcrição Automática converte as falas em texto corrido em tempo real usando a tecnologia de reconhecimento de voz contínuo em Português do Brasil.',
      'Campos de Registro Clínico: Temas Abordados, Associações Livres, Hipóteses Diagnósticas e Encaminhamentos.',
      'Vinculação Automática de Retorno: Permite agendar a próxima sessão no exato momento da conclusão da atual.'
    ],
    steps: [
      '1. Clique no menu "Nova Sessão" ou no botão de atalho correspondente.',
      '2. Selecione o paciente na lista ou busque pelo nome.',
      '3. Clique em "Iniciar Gravação & Transcrição" e permita o acesso ao microfone.',
      '4. Durante a sessão, o texto transcrito aparecerá automaticamente na caixa de texto.',
      '5. Ao término, clique em "Pausar/Finalizar Gravação", revise os apontamentos e clique em "Salvar Sessão no Cofre".'
    ],
    tips: [
      'Use um microfone de mesa ou headset para melhor fidelidade de transcrição em ambientes com ruído.',
      'Todas as gravações e transcrições são salvas criptografadas dentro do seu cofre local.'
    ]
  },
  {
    id: 'pacientes',
    number: '05',
    title: 'Gestão de Pacientes & Prontuários Sigilosos',
    category: 'Clínica',
    summary: 'Fichas cadastrais completas, anamnese, dados de emergência e histórico temporal de evolução.',
    content: [
      'Controle rigoroso do histórico de cada analisando.',
      'Cadastro detalhado: Nome completo, data de nascimento, CPF, profissão, telefone e e-mail.',
      'Dados de Emergência: Contato de familiar ou médico responsável para situações de crise.',
      'Prontuário Eletrônico: Linha do tempo contendo todas as sessões, datas, honorários pagos e evoluções.',
      'Tag "Acompanhamento Crítico": Sinalizador visual para destacar pacientes em situação de vulnerabilidade.'
    ],
    steps: [
      '1. Acesse o menu "Meus Pacientes".',
      '2. Clique em "+ Novo Paciente" para preencher a ficha cadastral.',
      '3. Para visualizar a evolução completa, clique no ícone de prontuário na linha do paciente.',
      '4. Use o botão do WhatsApp ao lado do telefone para abrir conversa direta no aplicativo oficial.'
    ]
  },
  {
    id: 'agenda',
    number: '06',
    title: 'Agenda Clínica & Detecção de Conflitos',
    category: 'Clínica',
    summary: 'Organização da grade semanal com proteção automática contra sobreposição de horários.',
    content: [
      'Duas modalidades de visualização: Grade Semanal (visão espacial de segunda a domingo) e Lista Cronológica.',
      'Detecção de Conflitos: O sistema impede o agendamento de duas sessões no mesmo intervalo de horário.',
      'Status de Agendamento: Agendado, Confirmado, Realizado, Cancelado e Falta Justificada.',
      'Confirmação por WhatsApp: Envie a mensagem de lembrete da sessão com data e horário em um clique.'
    ],
    steps: [
      '1. Abra o menu "Agenda Clínica".',
      '2. Clique no botão "+ Agendar Horário" ou diretamente no dia/horário da grade.',
      '3. Escolha o paciente, modalidade de atendimento, data, hora de início e duração.',
      '4. Ao final da sessão, clique em "Iniciar Atendimento" para transportar os dados diretamente para a tela de Nova Sessão.'
    ]
  },
  {
    id: 'sessoes',
    number: '07',
    title: 'Sessões Realizadas & Acervo de Escuta',
    category: 'Clínica',
    summary: 'Consulta temporal de todos os atendimentos prestados, notas de evolução e áudios gravados.',
    content: [
      'Histórico completo e inalterável das sessões realizadas pelo consultório.',
      'Permite rever as hipóteses diagnósticas e anotações feitas semanas ou meses atrás.',
      'Permite reproduzir os áudios gravados e copiar transcrições para relatórios e laudos.',
      'Filtro de busca por nome do paciente e intervalo de datas.'
    ],
    steps: [
      '1. Acesse "Sessões Realizadas".',
      '2. Utilize o campo de filtro para buscar pelo nome do analisando.',
      '3. Clique em "Ver Detalhes" para ler a transcrição e anotações completas.',
      '4. Se desejar, exporte o resumo da sessão para impressão.'
    ]
  },
  {
    id: 'modalidades',
    number: '08',
    title: 'Modalidades de Sessão & Tabelas de Valor',
    category: 'Clínica',
    summary: 'Padronização dos tipos de escuta, tempos de duração e valores cobrados.',
    content: [
      'Cadastre as modalidades praticadas no seu consultório:',
      '- Sessão de Psicanálise Individual (50 min)',
      '- Psicoterapia Breve / Foco (45 min)',
      '- Terapia de Casal / Família (80 min)',
      '- Supervisão Clínica para Estudantes / Terapeutas (60 min)',
      '- Atendimento Social / Valor Solidário',
      'Cada modalidade define a duração padrão e o valor de referência que será sugerido automaticamente na agenda e no financeiro.'
    ]
  },
  {
    id: 'relatorios',
    number: '09',
    title: 'Relatórios & Métricas de Desempenho',
    category: 'Clínica',
    summary: 'Acompanhamento estatístico da adesão terapêutica, assiduidade e balanço financeiro.',
    content: [
      'Visão estratégica do consultório:',
      '- Faturamento Mensal e Médio por Sessão.',
      '- Índice de Faltas e Remarcações.',
      '- Taxa de Retenção de Pacientes.',
      '- Distribuição de atendimentos por modalidade.',
      'Exportação para relatórios contábeis e declaração anual de rendimentos.'
    ]
  },
  {
    id: 'retornos_previstos',
    number: '10',
    title: 'Retornos Previstos & Sustentação do Setting',
    category: 'Setting',
    summary: 'Evite interrupções silenciosas e monitore os pacientes com previsão de retorno.',
    content: [
      'O sistema calcula a data ideal do próximo atendimento com base na frequência definida (semanal, quinzenal, mensal).',
      'Alerta pacientes com retorno atrasado há mais de 7 dias.',
      'Possibilita o envio de mensagem sutil e acolhedora para combinar a próxima sessão.'
    ],
    steps: [
      '1. Acesse "Retornos Previstos" na aba Setting.',
      '2. Verifique os pacientes com marcação em vermelho (atrasados) ou amarelo (próximos da data).',
      '3. Clique em "Notificar Retorno" para enviar uma mensagem pré-formatada via WhatsApp.'
    ]
  },
  {
    id: 'acompanhamento_critico',
    number: '11',
    title: 'Acompanhamento Crítico & Casos Prioritários',
    category: 'Setting',
    summary: 'Vigilância clínica reforçada para analisandos em situação de crise, luto ou alto risco.',
    content: [
      'Painel dedicado a casos que demandam escuta atenta entre as sessões.',
      'Exibe imediatamente: telefone do paciente, contato de familiares/médicos e plano de contingência.',
      'Permite adicionar lembretes de contato preventivo.'
    ],
    tips: [
      'Mantenha sempre os contatos dos responsáveis atualizados na ficha do paciente para rápida ação em caso de emergência.'
    ]
  },
  {
    id: 'aniversariantes',
    number: '12',
    title: 'Aniversariantes & Fortalecimento de Vínculo',
    category: 'Setting',
    summary: 'Relação dos aniversariantes do mês com envio prático de mensagens afetuosas.',
    content: [
      'Identifica automaticamente os pacientes que fazem aniversário no mês atual.',
      'Apresenta modelo pronto de mensagem cordial, ética e acolhedora.',
      'Evita duplicidade marcando os pacientes que já receberam a mensagem comemorativa.'
    ]
  },
  {
    id: 'financeiro',
    number: '13',
    title: 'Financeiro, Consultas Pendentes/Pagas & Emissão de Recibos',
    category: 'Clínica',
    summary: 'Controle de pagamentos, conciliação de consultas clínicas e emissão de recibos oficiais para IRPF.',
    content: [
      'Visão consolidada de todas as consultas clínicas com status de pagamento (Pendente, Pago e Atrasado).',
      'Filtros velozes por período (Mês Atual, Mês Anterior, Últimos 3 Meses, Ano) e por Paciente.',
      'Emissão de Recibos Profissionais avulsos ou consolidados (Fechamento Mensal somando múltiplas sessões).',
      'Recibos com valor numérico e extenso automático, CPF do paciente, CRP do terapeuta e layout A4 para impressão e PDF.',
      'Envio do recibo ou cobrança ética diretamente no WhatsApp do paciente com 1 clique.'
    ],
    steps: [
      '1. Acesse o menu lateral "Financeiro & Recibos".',
      '2. Veja nos cards do topo o Total Recebido (Pago), A Receber (Pendentes) e Em Atraso.',
      '3. Clique em "Receber" em qualquer consulta para confirmar a quitação com o meio de pagamento (PIX, Dinheiro, Cartão).',
      '4. Clique em "Recibo" para abrir o documento timbrado e imprimir em A4/PDF ou enviar no WhatsApp.',
      '5. Na aba "Fechamento Mensal", selecione o paciente para gerar um recibo unificado de todas as sessões do mês.'
    ]
  },
  {
    id: 'reativacao',
    number: '14',
    title: 'Reativação de Pausas & Resgate Ético',
    category: 'Setting',
    summary: 'Aproximação cuidadosa com analisandos que se afastaram há mais de 30 ou 60 dias.',
    content: [
      'Lista os pacientes inativos que não formalizaram encerramento de processo analítico.',
      'Fornece modelos de mensagens empáticas com tom de escuta e disponibilidade de agenda.',
      'Permite ao analista marcar a ficha como "Alta Clínica", "Encaminhado" ou "Desistência".'
    ]
  },
  {
    id: 'assistente_bia',
    number: '15',
    title: 'Assistente Bia (Inteligência Clínica)',
    category: 'Comunicação',
    summary: 'Assistente especializada em psicanálise e psicologia para supervisão e apoio teórico.',
    content: [
      'Auxilia o analista em momentos de reflexão clínica e estudo de caso.',
      'Capacidades:',
      '- Cruzamento de conceitos (Transferência, Repetição, Pulsão, Angústia, Mecanismos de Defesa).',
      '- Sugestões bibliográficas para temas específicos.',
      '- Estruturação de resumos analíticos para supervisão profissional.',
      'Importante: A Bia não armazena nomes nem dados identificáveis de pacientes. Todo processamento respeita o sigilo absoluto.'
    ]
  },
  {
    id: 'transmissoes_modelos',
    number: '16',
    title: 'Transmissões & Modelos de Mensagem',
    category: 'Comunicação',
    summary: 'Comunicação padronizada e disparo de avisos importantes pelo WhatsApp.',
    content: [
      'Modelos de Mensagem com Tags Dinâmicas:',
      'Você pode usar variáveis que são substituídas no momento do envio:',
      '- {nome}: Nome do paciente',
      '- {data}: Data da sessão',
      '- {horario}: Horário agendado',
      '- {valor}: Valor do honorário',
      '- {pix}: Chave PIX cadastrada no perfil',
      'Transmissões Coletivas: Envie mensagens individualizadas para todos os pacientes (ex: aviso de recesso ou férias) sem criar grupos constrangedores.'
    ]
  },
  {
    id: 'backup_manutencao',
    number: '17',
    title: 'Rotina de Backup Criptografado & Restauração',
    category: 'Segurança & Config',
    summary: 'Garantia de perpetuidade e portabilidade de todos os seus registros clínicos.',
    content: [
      'Como seus dados clínicos ficam protegidos no cofre criptográfico local do navegador, é crucial manter backups regulares.',
      'O arquivo de backup (.json) gerado é totalmente cifrado com sua senha do cofre.',
      'Mesmo se alguém tiver acesso ao arquivo de backup, será impossível ler qualquer palavra sem a sua senha.',
      'Restauração: Ao trocar de computador ou formatar o dispositivo, basta carregar o arquivo de backup para restaurar prontuários, gravações, finanças e cadastros.'
    ],
    steps: [
      '1. No topo da tela, clique no botão "Backup Criptografado".',
      '2. Um arquivo chamado "backup_cofre_psi40_...json" será baixado para sua pasta de Downloads.',
      '3. Guarde este arquivo em um local seguro (pen-drive, nuvem privada pessoal, etc.).',
      '4. Para restaurar, acesse o menu "Backup & Banco Local" e clique em "Restaurar Backup do Cofre".'
    ]
  },
  {
    id: 'perfil_consultorio',
    number: '18',
    title: 'Meu Perfil, CRP & Dados do Consultório',
    category: 'Segurança & Config',
    summary: 'Configuração dos dados que constarão nos recibos, cabeçalhos e comunicações.',
    content: [
      'Configure seu Nome Profissional, Registro no Conselho (CRP/CRM), Telefone de Contato e Chave PIX.',
      'Preencha o endereço completo do Consultório Físico ou link da Sala Virtual de Atendimento.',
      'Escolha a paleta de cores preferida (Dourado Escuta, Verde Clínico, Azul Neutro, Cinza Carbon, etc.) e o modo Escuro/Claro.'
    ]
  },
  {
    id: 'faq_atalhos',
    number: '19',
    title: 'Teclas de Atalho, FAQ & Resolução de Dúvidas',
    category: 'Introdução',
    summary: 'Respostas para perguntas comuns e orientações práticas de uso.',
    content: [
      'P: O microfone não inicia a gravação da sessão. O que fazer?',
      'R: Verifique se o navegador possui permissão para usar o microfone. Clique no ícone de cadeado na barra de endereços do navegador e marque "Microfone: Permitir".',
      '',
      'P: A transcrição automática funciona sem internet?',
      'R: O reconhecimento de voz Web Speech utiliza o motor integrado do navegador (Chrome, Edge, Safari). Recomendamos conexão estável para máxima precisão de vocabulário.',
      '',
      'P: Esqueci a senha do cofre local. Como recuperar?',
      'R: Por ser uma criptografia de ponta a ponta sem chave mestra no servidor, a única forma de recuperar é restaurando um arquivo de backup anterior do qual você se lembre da senha.',
      '',
      'P: Posso usar o PSi4.0 no celular e no computador?',
      'R: Sim! O sistema é totalmente responsivo e compatível com telas de computadores, tablets e smartphones.'
    ]
  }
];

interface ManualDoSistemaModalProps {
  aberto: boolean;
  onFechar: () => void;
  nomeAnalista?: string;
  crpAnalista?: string;
}

export default function ManualDoSistemaModal({
  aberto,
  onFechar,
  nomeAnalista = 'Psicanalista / Terapeuta',
  crpAnalista = 'Registro Profissional'
}: ManualDoSistemaModalProps) {
  const [busca, setBusca] = useState('');
  const [secaoAtivaId, setSecaoAtivaId] = useState<string>('visao_geral');
  const [copiado, setCopiado] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  const secoesFiltradas = useMemo(() => {
    if (!busca.trim()) return MANUAL_SECTIONS;
    const termo = busca.toLowerCase();
    return MANUAL_SECTIONS.filter(s =>
      s.title.toLowerCase().includes(termo) ||
      s.summary.toLowerCase().includes(termo) ||
      s.category.toLowerCase().includes(termo) ||
      s.content.some(c => c.toLowerCase().includes(termo))
    );
  }, [busca]);

  const secaoSelecionada = useMemo(() => {
    return MANUAL_SECTIONS.find(s => s.id === secaoAtivaId) || MANUAL_SECTIONS[0];
  }, [secaoAtivaId]);

  if (!aberto) return null;

  const handleImprimirPDF = () => {
    // Open print dialog with customized printable manual layout
    window.print();
  };

  const handleCopiarManualTexto = () => {
    const textoCompleto = MANUAL_SECTIONS.map(s => {
      return `\n========================================\n${s.number}. ${s.title.toUpperCase()}\nCategoria: ${s.category}\n========================================\n\nResumo: ${s.summary}\n\n${s.content.join('\n\n')}\n${s.steps ? '\nPasso a Passo:\n' + s.steps.join('\n') : ''}${s.tips ? '\n\nDicas:\n' + s.tips.join('\n') : ''}`;
    }).join('\n\n');

    navigator.clipboard.writeText(`MANUAL OFICIAL DO SISTEMA PSi4.0\nProfissional: ${nomeAnalista} (${crpAnalista})\nData de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n\n${textoCompleto}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <>
      {/* PRINT-ONLY STYLES INJECTED DYNAMICALLY */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #manual-print-container, #manual-print-container * {
            visibility: visible !important;
          }
          #manual-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #111827 !important;
            padding: 20mm !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* MODAL OVERLAY */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Manual Oficial do Sistema PSi4.0"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      >
        <div className="w-full max-w-5xl h-[92vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* HEADER BAR (3 ZONES) */}
          <div className="p-4 sm:px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
            {/* Zone 1: Brand / Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl gradient-emerald text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                    Manual do Sistema PSi4.0
                  </h1>
                  <span className="hidden md:inline text-xs text-muted-foreground font-mono">
                    v4.0 · Clínico
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  Guia Prático, Criptografia, Menus e Operação do Setting
                </div>
              </div>
            </div>

            {/* Zone 2: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopiarManualTexto}
                className="text-xs px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-foreground transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                title="Copiar texto integral do manual"
              >
                {copiado ? <CheckCircle className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span className="hidden sm:inline">{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={handleImprimirPDF}
                className="text-xs px-3.5 py-1.5 gradient-emerald text-primary-foreground rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
                title="Imprimir ou Salvar em arquivo PDF"
              >
                <Printer className="size-3.5" />
                <span>Exportar PDF / Imprimir</span>
              </button>

              <button
                type="button"
                onClick={onFechar}
                className="size-8 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all ml-1 cursor-pointer"
                aria-label="Fechar Manual"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-border bg-card flex items-center gap-2">
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar por funcionalidade (ex: gravação, transcrição, cofre, agenda, honorários)..."
              className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-1"
              >
                Limpar
              </button>
            )}
          </div>

          {/* BODY: SPLIT VIEW (SUMÁRIO / LEITOR) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* SIDEBAR: TABLE OF CONTENTS (SUMÁRIO) */}
            <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-border bg-muted/10 overflow-y-auto shrink-0 max-h-48 md:max-h-full p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono flex items-center justify-between">
                <span>Sumário do Manual</span>
                <span className="text-[10px] tabular-nums font-normal">{secoesFiltradas.length} capítulos</span>
              </div>

              {secoesFiltradas.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum capítulo encontrado para "{busca}".
                </div>
              ) : (
                secoesFiltradas.map(secao => {
                  const ativa = secaoAtivaId === secao.id;
                  return (
                    <button
                      key={secao.id}
                      type="button"
                      onClick={() => setSecaoAtivaId(secao.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer text-xs ${
                        ativa
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <span className={`font-mono text-[10px] shrink-0 mt-0.5 ${ativa ? 'text-primary-foreground/80' : 'text-primary font-bold'}`}>
                        {secao.number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{secao.title}</div>
                        <div className={`text-[10px] truncate ${ativa ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {secao.category}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </aside>

            {/* READER VIEW (LEITURA DO CAPÍTULO SELECIONADO) */}
            <main
              ref={conteudoRef}
              className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-6 bg-card"
            >
              {/* Header do Capítulo */}
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono font-bold text-primary">{secaoSelecionada.number}</span>
                  <span>·</span>
                  <span className="uppercase tracking-wider font-semibold text-[10px] text-foreground">
                    {secaoSelecionada.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {secaoSelecionada.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {secaoSelecionada.summary}
                </p>
              </div>

              {/* Parágrafos de Conteúdo */}
              <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                {secaoSelecionada.content.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Passo a Passo Prático se existir */}
              {secaoSelecionada.steps && secaoSelecionada.steps.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                  <div className="text-xs uppercase font-bold tracking-wider text-foreground flex items-center gap-1.5">
                    <CheckCircle className="size-4 text-emerald-500" />
                    <span>Passo a Passo Recomendado</span>
                  </div>
                  <ol className="space-y-2">
                    {secaoSelecionada.steps.map((passo, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-foreground/90 flex items-start gap-2">
                        <span className="size-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{passo.replace(/^\d+\.\s*/, '')}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Dicas Éticas / Recomendações */}
              {secaoSelecionada.tips && secaoSelecionada.tips.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <div className="text-xs uppercase font-bold tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Shield className="size-4 text-amber-500" />
                    <span>Orientações Éticas & Segurança</span>
                  </div>
                  <ul className="space-y-1.5">
                    {secaoSelecionada.tips.map((dica, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 flex items-start gap-2">
                        <span className="text-amber-500 font-bold">·</span>
                        <span>{dica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Botão de Próximo Capítulo */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Capítulo {secaoSelecionada.number} de {MANUAL_SECTIONS.length}
                </span>

                <div className="flex items-center gap-2">
                  {(() => {
                    const currentIndex = MANUAL_SECTIONS.findIndex(s => s.id === secaoSelecionada.id);
                    const proximo = MANUAL_SECTIONS[currentIndex + 1];
                    if (!proximo) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => setSecaoAtivaId(proximo.id)}
                        className="text-xs px-3.5 py-2 border border-border hover:bg-muted text-foreground rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <span>Próximo: {proximo.title}</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* PRINTABLE A4 VIEW (HIDDEN ON SCREEN, SHOWN ONLY WHEN PRINTED TO PDF/PRINTER) */}
      <div id="manual-print-container" className="hidden">
        {/* Capa do Manual */}
        <div className="border-b-2 border-black pb-6 mb-8 text-center space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-600">
            PSi4.0 · Setting Psicanalítico & Gestão Clínica
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            MANUAL OFICIAL DO SISTEMA
          </h1>
          <p className="text-sm text-gray-700 max-w-xl mx-auto">
            Guia Completo de Operação, Prontuários Sigilosos, Gravador com Transcrição de Escuta, Cofre Criptográfico AES-256 e Fluxos do Setting.
          </p>
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-300 flex justify-center gap-6">
            <span><strong>Profissional:</strong> {nomeAnalista}</span>
            <span><strong>Registro:</strong> {crpAnalista}</span>
            <span><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        {/* Sumário Completo na Impressão */}
        <div className="avoid-break mb-8 p-4 border border-gray-300 rounded">
          <h2 className="text-lg font-bold mb-3 uppercase tracking-wide border-b border-gray-200 pb-1">
            Sumário de Capítulos
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {MANUAL_SECTIONS.map(s => (
              <div key={s.id} className="flex items-center justify-between py-0.5 border-b border-dotted border-gray-200">
                <span>{s.number}. {s.title}</span>
                <span className="text-gray-500 font-mono text-[10px]">{s.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Todos os Capítulos na Íntegra */}
        <div className="space-y-8">
          {MANUAL_SECTIONS.map((secao) => (
            <div key={secao.id} className="avoid-break border-b border-gray-300 pb-6">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                Capítulo {secao.number} · {secao.category}
              </div>
              <h2 className="text-xl font-bold text-black mb-1">
                {secao.title}
              </h2>
              <div className="text-xs text-gray-700 italic mb-3">
                {secao.summary}
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-gray-800 mb-3">
                {secao.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {secao.steps && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-900 mb-1">
                    Passo a Passo Operacional:
                  </div>
                  <ol className="space-y-1 text-xs text-gray-800">
                    {secao.steps.map((st, sidx) => (
                      <li key={sidx}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}

              {secao.tips && (
                <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-xs text-amber-950">
                  <span className="font-bold">Observações Éticas: </span>
                  {secao.tips.join(' ')}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rodapé Final do Documento */}
        <div className="page-break pt-8 text-center text-xs text-gray-500 border-t border-gray-300 mt-8 space-y-1">
          <p>Documento gerado eletronicamente pela plataforma PSi4.0.</p>
          <p>Uso estrito e confidencial do titular do consultório.</p>
        </div>
      </div>
    </>
  );
}

import {
  Analisando,
  ModalidadeAtendimento,
  SessaoClinica,
  Honorario,
  ModeloMensagem,
  TransmissaoInformativa,
  PerfilAnalista,
  ConsultorioData
} from '../types';

export function obterDatasRelativas(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString();
}

export function obterDataFutura(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

export function obterDataAniversario(diasDiferenca: number): string {
  const data = new Date();
  data.setDate(data.getDate() + diasDiferenca);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `1992-${mes}-${dia}`;
}

export const MODALIDADES_PADRAO: ModalidadeAtendimento[] = [
  {
    id: 'm1',
    nome: 'Psicanálise Individual (Presencial)',
    preco: 160,
    duracao: 50,
    intervaloDias: 7,
    categoria: 'Análise Individual',
    observacoes: 'Setting tradicional no divã ou poltrona.'
  },
  {
    id: 'm2',
    nome: 'Psicanálise Individual (Online)',
    preco: 140,
    duracao: 50,
    intervaloDias: 7,
    categoria: 'Análise Individual',
    observacoes: 'Atendimento via sala virtual criptografada.'
  },
  {
    id: 'm3',
    nome: 'Supervisão Clínica de Casos',
    preco: 200,
    duracao: 60,
    intervaloDias: 14,
    categoria: 'Supervisão',
    observacoes: 'Supervisão individual de prática clínica psicanalítica.'
  },
  {
    id: 'm4',
    nome: 'Grupo de Estudos Teóricos',
    preco: 100,
    duracao: 90,
    intervaloDias: 30,
    categoria: 'Grupo de Estudos',
    observacoes: 'Leitura comentada da obra de Freud e Lacan.'
  },
  {
    id: 'm5',
    nome: 'Terapia Psicanalítica de Casal',
    preco: 240,
    duracao: 75,
    intervaloDias: 14,
    categoria: 'Análise de Casal',
    observacoes: 'Sessões conjuntas com foco no laço conjugal.'
  },
  {
    id: 'm6',
    nome: 'Avaliação Inicial & Triagem',
    preco: 180,
    duracao: 50,
    intervaloDias: 7,
    categoria: 'Triagem',
    observacoes: 'Primeiras entrevistas preliminares para escuta da demanda.'
  }
];

export const ANALISANDOS_PADRAO: Analisando[] = [
  {
    id: 'c1',
    nome: 'Mariana de Souza Santos',
    whatsapp: '5511988880001',
    email: 'mariana.santos@email.com',
    nascimento: '1995-04-18',
    cidade: 'São Paulo',
    endereco: 'Rua Bela Cintra, 450 - Consolação',
    status: 'ativo',
    vip: true, // Caso de alta frequência (Destaque)
    tags: ['sessão-semanal', 'neurose-obsessiva', 'divã'],
    observacoes: 'Paciente apresenta forte transferência de trabalho. Em processo avançado, já utiliza o divã regularmente.',
    criadoEm: obterDatasRelativas(150),
    mensagensEnviadas: []
  },
  {
    id: 'c2',
    nome: 'Bernardo de Alencar Vasconcellos',
    whatsapp: '5511988880002',
    email: 'bernardo.alencar@email.com',
    nascimento: '1988-08-12',
    cidade: 'Rio de Janeiro',
    endereco: 'Av. Copacabana, 980 - Copacabana',
    status: 'recorrente',
    vip: false,
    tags: ['supervisão', 'quinzenal'],
    observacoes: 'Psicólogo em supervisão de seus primeiros casos clínicos de orientação lacaniana.',
    criadoEm: obterDatasRelativas(120),
    mensagensEnviadas: []
  },
  {
    id: 'c3',
    nome: 'Carla Beatriz Mendes',
    whatsapp: '5511988880003',
    email: 'carla.mendes@email.com',
    nascimento: obterDataAniversario(-1), // Aniversário ontem/hoje
    cidade: 'São Paulo',
    endereco: 'Alameda Lorena, 1200 - Jardins',
    status: 'ativo',
    vip: true,
    tags: ['sessão-semanal', 'triagem-concluida'],
    observacoes: 'Apresenta queixas relacionadas a fobias sociais e inibição profissional severa.',
    criadoEm: obterDatasRelativas(90),
    mensagensEnviadas: []
  },
  {
    id: 'c4',
    nome: 'Daniel Ferreira Lima',
    whatsapp: '5511988880004',
    email: 'daniel.f.lima@email.com',
    nascimento: '1991-11-20',
    cidade: 'Campinas',
    endereco: 'Rua Culto à Ciência, 78 - Centro',
    status: 'novo',
    vip: false,
    tags: ['entrevista-preliminar', 'ansiedade'],
    observacoes: 'Agendou primeira entrevista preliminar. Queixa de crises de pânico recorrentes nos últimos meses.',
    criadoEm: obterDatasRelativas(5),
    mensagensEnviadas: []
  },
  {
    id: 'c5',
    nome: 'Elisa Silveira Barbosa',
    whatsapp: '5511988880005',
    email: 'elisa.barbosa@email.com',
    nascimento: obterDataAniversario(2), // Aniversário daqui a 2 dias
    cidade: 'São Paulo',
    endereco: 'Rua Cardeal Arcoverde, 1800 - Pinheiros',
    status: 'ativo',
    vip: false,
    tags: ['sessão-semanal', 'foco-depressivo'],
    observacoes: 'Em análise individual online. Apresenta melhora significativa na elaboração de lutos passados.',
    criadoEm: obterDatasRelativas(60),
    mensagensEnviadas: []
  },
  {
    id: 'c6',
    nome: 'Fernanda Rocha Valente',
    whatsapp: '5511988880006',
    email: 'fernanda.valente@email.com',
    nascimento: '1984-06-30',
    cidade: 'São Caetano',
    endereco: 'Rua Piauí, 230 - Santa Paula',
    status: 'inativo',
    vip: false,
    tags: ['alta-terapeutica', 'recesso'],
    observacoes: 'Entrou em período de suspensão planejada (alta provisória acordada para elaboração autônoma).',
    criadoEm: obterDatasRelativas(300),
    mensagensEnviadas: []
  },
  {
    id: 'c7',
    nome: 'Igor Pereira da Silva',
    whatsapp: '5511988880007',
    email: 'igor.pereira@email.com',
    nascimento: obterDataAniversario(5),
    cidade: 'São Paulo',
    endereco: 'Av. Paulista, 1000 - Bela Vista',
    status: 'inativo',
    vip: false,
    tags: ['evasao', 'resistência-alta'],
    observacoes: 'Faltou às últimas 3 sessões consecutivas sem aviso prévio. Necessita contato de reativação delicado.',
    criadoEm: obterDatasRelativas(180),
    mensagensEnviadas: []
  }
];

export const SESSOES_PADRAO: SessaoClinica[] = [
  {
    id: 's1',
    analisandoId: 'c1',
    modalidadeId: 'm1',
    data: obterDatasRelativas(1),
    valorCobrado: 160,
    pagamentoStatus: 'pago',
    meioPagamento: 'pix',
    proximaSessaoData: obterDataFutura(6),
    notasSessao: 'Analisanda associou de forma muito rica um sonho recorrente de infância com a figura paterna. Avanço importante na elaboração.'
  },
  {
    id: 's2',
    analisandoId: 'c1',
    modalidadeId: 'm1',
    data: obterDatasRelativas(8),
    valorCobrado: 160,
    pagamentoStatus: 'pago',
    meioPagamento: 'pix',
    proximaSessaoData: obterDatasRelativas(1),
    notasSessao: 'Sessão com alta resistência inicial. Trabalho centrado em desconstruir mecanismos de autossabotagem profissional.'
  },
  {
    id: 's3',
    analisandoId: 'c2',
    modalidadeId: 'm3',
    data: obterDatasRelativas(5),
    valorCobrado: 200,
    pagamentoStatus: 'pago',
    meioPagamento: 'transferencia',
    proximaSessaoData: obterDataFutura(9),
    notasSessao: 'Supervisão focada no manejo de um caso de psicose. Orientação para estabilização de metáfora delirante.'
  },
  {
    id: 's4',
    analisandoId: 'c3',
    modalidadeId: 'm1',
    data: obterDatasRelativas(2),
    valorCobrado: 160,
    pagamentoStatus: 'pago',
    meioPagamento: 'pix',
    proximaSessaoData: obterDataFutura(5),
    notasSessao: 'Primeira sessão oficial no divã. Expressou forte desconforto inicial com a perda do contato visual, seguido de rica torrente associativa.'
  },
  {
    id: 's5',
    analisandoId: 'c5',
    modalidadeId: 'm2',
    data: obterDatasRelativas(3),
    valorCobrado: 140,
    pagamentoStatus: 'pendente',
    meioPagamento: 'pix',
    proximaSessaoData: obterDataFutura(4),
    notasSessao: 'Sessão online centrado na elaboração da angústia frente ao isolamento. Elaboração produtiva.'
  }
];

export const HONORARIOS_PADRAO: Honorario[] = [
  {
    id: 'h1',
    analisandoId: 'c5',
    valor: 560, // Pacote de 4 sessões online
    vencimento: obterDataFutura(3).slice(0, 10),
    status: 'pendente',
    observacao: 'Mensalidade de análises referentes a Julho.'
  },
  {
    id: 'h2',
    analisandoId: 'c7',
    valor: 320, // Sessões perdidas pendentes de acerto
    vencimento: obterDatasRelativas(2).slice(0, 10),
    status: 'atrasado',
    observacao: 'Faltas não justificadas que exigem acerto ético de honorários.'
  },
  {
    id: 'h3',
    analisandoId: 'c2',
    valor: 400, // 2 supervisões
    vencimento: obterDataFutura(10).slice(0, 10),
    status: 'pendente',
    observacao: 'Supervisões clínicas mensais.'
  }
];

export const MODELOS_MENSAGENS_PADRAO: ModeloMensagem[] = [
  {
    id: 'mod1',
    nome: 'Confirmação de Sessão',
    categoria: 'acolhimento',
    conteudo: 'Olá {nome}, tudo bem? Aqui é o psicanalista {analista}. Passando para confirmar nossa próxima sessão de {servico} agendada para {data}. Caso precise de qualquer ajuste ou cancelamento, peço que me avise com pelo menos 24 horas de antecedência por questões éticas do setting terapêutico. Um abraço.'
  },
  {
    id: 'mod2',
    nome: 'Lembrete de Honorários',
    categoria: 'honorarios',
    conteudo: 'Olá {nome}, espero que esteja bem. Passando para lembrarmos do acerto referente aos honorários de nossas sessões. O valor total de {valor} tem vencimento em {data}. Você pode realizar o pagamento por meio de nossa chave de faturamento habitual. Qualquer dúvida, estou à disposição.'
  },
  {
    id: 'mod3',
    nome: 'Mensagem de Acompanhamento (Pós-sessão)',
    categoria: 'retorno',
    conteudo: 'Olá {nome}, como vai? Após nosso último encontro analítico ({servico}), passei para saber como você se sentiu e se pôde elaborar as questões que surgiram na sessão. A análise é um percurso contínuo de elaboração e lembre-se de que nossa próxima sessão está agendada para {data}. Até lá!'
  },
  {
    id: 'mod4',
    nome: 'Reativação de Vínculo Analítico',
    categoria: 'reativacao',
    conteudo: 'Olá {nome}, tudo bem? Notei que já faz algum tempo desde nossa última sessão de análise. A continuidade é um fator precioso no processo analítico. Gostaria de saber como você está e se sente o desejo de retomar seu espaço de escuta e elaboração. Caso sim, tenho alguns horários disponíveis esta semana.'
  },
  {
    id: 'mod5',
    nome: 'Mensagem de Aniversário',
    categoria: 'aniversario',
    conteudo: 'Feliz aniversário, {nome}! Que este novo ciclo de vida traga caminhos abertos para o autoconhecimento, amadurecimento e paz subjetiva. Um carinhoso abraço do seu analista.'
  },
  {
    id: 'mod6',
    nome: 'Informativo de Recesso Clínica',
    categoria: 'informativo',
    conteudo: 'Estimado(a) {nome}, informo que nosso consultório ({empresa}) entrará em período de recesso clínico e estudos teóricos a partir de {data}. Nossas atividades regulares e sessões serão retomadas após o recesso. Se houver alguma necessidade urgente antes dessa data, por favor me comunique. Um abraço, {analista}.'
  }
];

export const CAMPANHAS_PADRAO: TransmissaoInformativa[] = [
  {
    id: 'camp1',
    nome: 'Recesso de Fim de Ano & Estudos',
    publico: 'todos',
    mensagem: 'Estimados pacientes, comunico que o consultório de Psicanálise estará em recesso para estudos e férias anuais entre as datas de 20 de Dezembro e 10 de Janeiro. Nossos horários habituais estarão reservados para o retorno. Desejo a todos um período de ricas elaborações subjetivas.',
    criadaEm: obterDatasRelativas(15)
  },
  {
    id: 'camp2',
    nome: 'Concorra ao Grupo de Estudos da Obra Freudiana',
    publico: 'vips',
    mensagem: 'Olá {nome}, estou abrindo uma nova turma exclusiva para o Grupo de Estudos da obra de Sigmund Freud, com início no próximo mês. Como você já faz parte do nosso setting terapêutico, tem preferência na reserva de vagas. Me avise se tiver interesse em participar dos encontros teóricos semanais.',
    criadaEm: obterDatasRelativas(4)
  }
];

export const PERFIL_PADRAO: PerfilAnalista = {
  nome: 'Dr. Roberto Martins',
  registroProfissional: 'Sociedade Psicanalítica CBP-12450',
  cargo: 'Psicanalista Clínico & Supervisor',
  whatsapp: '5511999990000',
  email: 'contato@robertomartins.psi.br'
};

export const CONSULTORIO_PADRAO: ConsultorioData = {
  nome: 'Martins Psicanálise & Clínica Integrada',
  segmento: 'Clínica de Psicanálise e Supervisão',
  whatsapp: '5511999990000',
  instagram: '@robertomartins.psicanalise',
  linkFeedback: 'https://forms.gle/exemploFeedbackPsi',
  cidade: 'São Paulo',
  endereco: 'Alameda Santos, 1800 - Conjunto 142 - Cerqueira César'
};

export const AGENDAMENTOS_PADRAO = [
  {
    id: 'a1',
    analisandoId: 'c1',
    modalidadeId: 'm1',
    data: obterDatasRelativas(0).split('T')[0], // Hoje
    hora: '09:00',
    status: 'realizado',
    observacao: 'Foco em transferência e associação livre'
  },
  {
    id: 'a2',
    analisandoId: 'c2',
    modalidadeId: 'm3',
    data: obterDatasRelativas(0).split('T')[0], // Hoje
    hora: '14:00',
    status: 'confirmado',
    observacao: 'Discussão de caso clínico de psicose'
  },
  {
    id: 'a3',
    analisandoId: 'c3',
    modalidadeId: 'm1',
    data: obterDataFutura(1).split('T')[0], // Amanhã
    hora: '10:30',
    status: 'confirmado',
    observacao: 'Sessão semanal regular'
  },
  {
    id: 'a4',
    analisandoId: 'c4',
    modalidadeId: 'm6',
    data: obterDataFutura(1).split('T')[0], // Amanhã
    hora: '16:00',
    status: 'pendente',
    observacao: 'Primeira entrevista preliminar (ansiedade aguda)'
  },
  {
    id: 'a5',
    analisandoId: 'c5',
    modalidadeId: 'm2',
    data: obterDataFutura(2).split('T')[0], // Depois de amanhã
    hora: '11:00',
    status: 'confirmado',
    observacao: 'Sessão de análise individual online'
  },
  {
    id: 'a6',
    analisandoId: 'c1',
    modalidadeId: 'm1',
    data: obterDatasRelativas(7).split('T')[0], // Semana passada
    hora: '09:00',
    status: 'realizado',
    observacao: 'Sessão presencial divã'
  }
];

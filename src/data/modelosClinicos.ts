/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModeloClinico } from '../types/modelosClinicos';

export const MODELOS_CLINICOS_PADRAO: ModeloClinico[] = [
  // =========================================================================
  // 1. ENCAMINHAMENTO
  // =========================================================================
  {
    id: 'encaminhamento',
    titulo: 'Encaminhamento',
    categoria: 'documento',
    descricao: 'Encaminhamento para avaliação e acompanhamento psiquiátrico.',
    badgeTexto: '# Modelo de: Documento',
    badgeClasse: 'bg-purple-700 text-white border-purple-800',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'Send',
    textoBase: `ENCAMINHAMENTO CLÍNICO INTERDISCIPLINAR

A/C: Dr(a). Médico(a) Psiquiatra
Assunto: Avaliação e Acompanhamento Psiquiátrico Compartilhado

Prezado(a) Colega,

Venho por meio deste encaminhar o(a) paciente [Nome do Paciente], portador(a) do CPF [CPF], nascido(a) em [Data de Nascimento], atualmente em acompanhamento psicoterápico sob meus cuidados profissionais desde [Data de Início ou Data de Hoje].

1. MOTIVO DO ENCAMINHAMENTO:
Encaminho o(a) paciente para criteriosa avaliação médica psiquiátrica especializada, com o objetivo de investigar a pertinência de intervenção psicofarmacológica adjuvante e/ou elucidação diagnóstica sindrômica.

2. SÍNTESE DO QUADRO CLÍNICO ATUAL:
Durante as sessões clínicas de escuta e acolhimento, foram identificadas as seguintes manifestações sintomáticas proeminentes:
- Rebaixamento persistente do humor e anedonia;
- Alterações significativas no padrão de sono (insônia inicial/intermediária);
- Sintomas ansiosos difusos com episódios de taquicardia, inquietação psicomotora e ruminação cognitiva;
- Impacto funcional moderado nas atividades ocupacionais e relacionamentos interpessoais;
- Ausência de sintomas psicóticos ou de risco auto/heteroagressivo iminente no momento da avaliação.

3. HIPÓTESE DIAGNÓSTICA (CID-11 / DSM-5-TR):
Em conformidade com a Resolução CFP nº 06/2019 e mediante expressa autorização do(a) paciente:
[Inserir Hipótese Diagnóstica, ex: F32 / 6A70 Transtorno Depressivo / F41 / 6B00 Transtorno de Ansiedade Generalizada].

4. CONDUTA TERAPÊUTICA:
O(a) paciente continuará com seus atendimentos psicoterápicos semanais. Solicito, na medida do possível, retorno/contra-referência para alinhamento da conduta interdisciplinar em prol do melhor prognóstico.

Coloco-me à inteira disposição para quaisquer esclarecimentos.

[Cidade], [Data de Hoje]

_____________________________________________
[Nome do Psicólogo]
Psicólogo(a) Clínico(a)
CRP: [CRP]
Contato: [Telefone do Consultório] | [E-mail do Consultório]`
  },

  // =========================================================================
  // 2. ANAMNESE PBE (Prática Baseada em Evidências)
  // =========================================================================
  {
    id: 'anamnese-pbe',
    titulo: 'Anamnese PBE',
    categoria: 'anamnese_geral',
    descricao: 'Modelo focado em critérios diagnósticos, metas mensuráveis e tratamentos baseados em evidências.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'Activity',
    textoBase: `PROTOCOLO DE ANAMNESE CLÍNICA BASEADA EM EVIDÊNCIAS (PBE)

1. DADOS DE IDENTIFICAÇÃO DO PACIENTE
Nome Completo: [Nome do Paciente]
Data de Nascimento: [Data de Nascimento] | Idade: [Idade] anos
Gênero / Identidade: [Gênero] | Profissão: [Profissão]
Contato: [Telefone] | Data da Avaliação Inicial: [Data de Hoje]

2. QUEIXA PRINCIPAL (Demanda formulada em palavras literais do paciente)
"[Descreva a queixa com as próprias palavras trazidas pelo analisando]"

3. CRITÉRIOS DIAGNÓSTICOS OPERACIONAIS (DSM-5-TR / CID-11)
- Sintomas nucleares presentes:
- Duração dos sintomas:
- Critérios de exclusão (condições médicas gerais, uso de substâncias):
- Nível de prejuízo funcional (escala 0 a 10): [  ]

4. LINHA DE BASE & MENSURAÇÃO DOS SINTOMAS
- Frequência semanal das crises/episódios:
- Intensidade média relatada (0 a 10):
- Instrumentos psicométricos basais aplicados: (ex: BDI, BAI, QSG-12)
- Escore inicial obtido:

5. ANÁLISE FUNCIONAL DO COMPORTAMENTO / PBE
- Antecedentes / Disparadores (contextos situacionais, estímulos internos):
- Respostas do Organismo (cognitiva, emocional, fisiológica):
- Consequências Mantenedoras (reforçamento negativo, esquiva experiencial, ganhos secundários):

6. METAS TERAPÊUTICAS SMART
- Meta 1 (Curto Prazo - 4 a 6 semanas):
- Meta 2 (Médio Prazo - 8 a 12 semanas):
- Meta 3 (Longo Prazo / Alta - Prevenção de Recaída):

7. INTERVENÇÃO BASEADA EM EVIDÊNCIAS SELECIONADA
- Abordagem principal recomendada pelas diretrizes clínicas (ex: TCC, Ativação Comportamental, Terapia de Aceitação e Compromisso):
- Frequência recomendada: Semanal (50 min)
- Cronograma estimado de reavaliação psicométrica: A cada 8 semanas.

Registrado por: [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 3. ANAMNESE TCC (Terapia Cognitivo-Comportamental)
  // =========================================================================
  {
    id: 'anamnese-tcc',
    titulo: 'Anamnese TCC',
    categoria: 'anamnese_geral',
    descricao: 'Modelo focado na identificação de pensamentos, emoções e comportamentos disfuncionais.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'Brain',
    textoBase: `AVALIAÇÃO E CONCEITUALIZAÇÃO COGNITIVA INICIAL (TCC)

Paciente: [Nome do Paciente]
Data da Sessão: [Data de Hoje] | Terapeuta: [Nome do Psicólogo] (CRP: [CRP])

1. QUEIXA INICIAL & DEMANDAS ATUAIS
- Motivo da busca por psicoterapia:
- O que espera alcançar com o processo terapêutico:

2. REGISTRO DE PENSAMENTOS AUTOMÁTICOS (RPD BASELINE)
- Situação Disparadora Típica: (Quem? Onde? Quando?)
- Pensamentos Automáticos (NATs): ("O que passou pela sua cabeça exatamente nesse instante?")
- Emoção e Intensidade: (Tristeza, Medo, Raiva, Ansiedade - 0 a 100%)
- Reação Fisiológica Corporal: (Aperto no peito, sudorese, tensão muscular)
- Resposta Comportamental: (Isolamento, fuga, evitação, procrastinação)

3. ERROS E DISTORÇÕES COGNITIVAS IDENTIFICADOS
[ ] Catastrofização ("O pior sempre vai acontecer")
[ ] Pensamento Tudo-ou-Nada / Polarizado ("Se não for perfeito, é um fracasso")
[ ] Leitura Mental ("Tenho certeza de que eles estão me julgando")
[ ] Adivinhação do Futuro
[ ] Desqualificação do Positivo
[ ] Raciocínio Emocional ("Sinto que sou incapaz, logo sou")
[ ] Imperativos ("Eu deveria...", "Eles têm que...")

4. CRENÇAS INTERMEDIÁRIAS (Regras, Suposições e Atitudes)
- Regras Condicionais ("Se eu não agradar a todos, serei rejeitado(a)"):
- Suposições Positivas / Negativas:

5. CRENÇAS CENTRAIS NUCLEARES
- Categoria predominante:
  ( ) Desamor (Não sou amável, sou rejeitável, ninguém se importa)
  ( ) Desamparo (Sou fraco, vulnerável, impotente, incapaz)
  ( ) Desvalor (Não tenho valor, sou uma fraude, sou defeituoso)

6. ESTRATÉGIAS COMPENSATÓRIAS E DE ENFRENTAMENTO
- Como o paciente tenta evitar a ativação da crença central:

7. DADOS HISTÓRICOS DE APRENDIZAGEM NA INFÂNCIA/ADOLESCÊNCIA
- Eventos de vida precoces que fundamentaram as crenças:

8. PLANO DE AÇÃO E TAREFAS DE CASA (HOMEWORK)
- RPD diário de 3 colunas
- Experimento comportamental acordado para a semana:

Terapeuta Responsável: [Nome do Psicólogo] - CRP: [CRP]`
  },

  // =========================================================================
  // 4. FORMULÁRIO DE TRIAGEM INICIAL – NR-1
  // =========================================================================
  {
    id: 'triagem-nr1',
    titulo: 'Formulário de Triagem Inicial – NR-1',
    categoria: 'anamnese_geral',
    descricao: 'Foco: Saúde Mental e Socioambiental dos Colaboradores. Formulário para avaliação inicial das condições de saúde mental e fatores socioambientais no ambiente de trabalho.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'formulario_nr1',
    icone: 'ShieldAlert',
    textoBase: `TRIAGEM DE SAÚDE MENTAL E FATORES SOCIOAMBIENTAIS – NR-1 (COLABORADOR)
Programa de Gerenciamento de Riscos Ocupacionais Psicossociais

1. DADOS OCUPACIONAIS DO COLABORADOR
Nome / Código: [Nome do Paciente]
Setor / Departamento: [Setor] | Função: [Cargo]
Tempo de Empresa: [Tempo] | Jornada / Turno: [Jornada]
Data do Preenchimento: [Data de Hoje]

2. ORGANIZAÇÃO DO TRABALHO E DEMANDAS PSICOLÓGICAS
(Avaliação de 1 a 5: 1 = Discordo Totalmente | 5 = Concordo Totalmente)
- [ ] O volume de trabalho exigido está dentro de limites sustentáveis.
- [ ] Os prazos estipulados para entrega de atividades são realistas.
- [ ] Tenho autonomia e liberdade para tomar decisões sobre como executar minhas tarefas.
- [ ] Minhas responsabilidades e papel na organização são claros e bem definidos.

3. FATORES SOCIOAMBIENTAIS E RELAÇÕES INTERPESSOAIS
- [ ] Sinto que posso contar com o apoio e colaboração dos colegas de equipe.
- [ ] O relacionamento com minha liderança direta é respeitoso e acolhedor.
- [ ] Há canais seguros e imparciais para expor dificuldades e queixas sem medo de retaliação.
- [ ] Presenciei ou sofri situações de pressão desmedida, assédio moral ou desrespeito nos últimos 6 meses. (Sim / Não): [  ]

4. SINAIS E SINTOMAS DE RISCO PSICOSSOCIAL / BURNOUT
Nos últimos 30 dias, você tem vivenciado:
- Cansaço físico e mental constante que não melhora aos finais de semana: ( ) Frequente ( ) Ocasional ( ) Raro
- Alterações de sono (dificuldade para dormir pensando nas demandas do trabalho): ( ) Frequente ( ) Ocasional ( ) Raro
- Sensação de sobrecarga emocional, irritabilidade ou ansiedade: ( ) Frequente ( ) Ocasional ( ) Raro
- Perda de sentido ou distanciamento afetivo em relação às tarefas laborais: ( ) Frequente ( ) Ocasional ( ) Raro

5. SUGESTÕES DE MELHORIA DO AMBIENTE SOCIOAMBIENTAL
- O que a organização poderia implementar para tornar seu ambiente de trabalho psicologicamente mais seguro e saudável?
[Descreva sugestões de melhoria]

6. PARECER TÉCNICO INICIAL DO PSICÓLOGO
Grau de risco psicossocial identificado: ( ) Baixo ( ) Moderado ( ) Crítico
Medida recomendada: ( ) Acompanhamento individual ( ) Adequação ergonômica/organizacional ( ) Encaminhamento

Psicólogo(a) Avaliador(a): [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 5. ANAMNESE BREVE
  // =========================================================================
  {
    id: 'anamnese-breve',
    titulo: 'Anamnese Breve',
    categoria: 'anamnese_geral',
    descricao: 'Modelo conciso para coleta rápida de informações essenciais.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'FileText',
    textoBase: `ANAMNESE CLÍNICA BREVE (TRIAGEM & PRIMEIRO ATENDIMENTO)

1. IDENTIFICAÇÃO DO PACIENTE
Nome: [Nome do Paciente]
Data de Nascimento: [Data de Nascimento] | Idade: [Idade] anos
Contato / WhatsApp: [Telefone]
Data do Atendimento: [Data de Hoje]

2. QUEIXA PRINCIPAL
- Motivo que levou à busca do atendimento:
- Há quanto tempo essa dificuldade se manifesta:

3. SINTOMAS PREDOMINANTES ATUAIS
- [ ] Tristeza, desânimo, choro fácil
- [ ] Ansiedade, taquicardia, pensamentos acelerados
- [ ] Insônia ou hipersonia
- [ ] Dificuldades em relacionamentos interpessoais / familiares
- [ ] Questões profissionais / sobrecarga de estresse
- [ ] Outros:

4. HISTÓRICO MÉDICO & PSIQUIÁTRICO
- Faz uso de medicação contínua ou psicotrópica? (Qual, dose):
- Já realizou psicoterapia ou acompanhamento psiquiátrico antes?
- Histórico de internações ou problemas graves de saúde:

5. REDE DE APOIO & CONTEXTO FAMILIAR
- Com quem reside atualmente:
- Principais pessoas de confiança em momentos de crise:

6. RASTREIO DE RISCO IMEDIATO
- Ideação suicida ou pensamentos de morte: ( ) Não ( ) Passiva ( ) Ativa
- Automutilação ou risco heteroagressivo: ( ) Não ( ) Sim

7. CONDUTA INICIAL COMBINADA
- Enquadre proposto: Semanal, 50 minutos.
- Próximo atendimento agendado para:

Profissional: [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 6. NOTAS SOAP
  // =========================================================================
  {
    id: 'notas-soap',
    titulo: 'Notas SOAP',
    categoria: 'anamnese_rotina',
    descricao: 'Modelo estruturado no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano), comum para notas de progresso.',
    badgeTexto: '# Modelo de: Anamnese de rotina',
    badgeClasse: 'bg-emerald-800 text-white border-emerald-900',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'ClipboardList',
    textoBase: `EVOLUÇÃO CLÍNICA – FORMATO S.O.A.P.

Paciente: [Nome do Paciente]
Data da Sessão: [Data de Hoje] | Horário: [Hora da Sessão] | Nº da Sessão: [Nº]
Profissional: [Nome do Psicólogo] (CRP: [CRP])

S - SUBJETIVO (Relato verbal do paciente)
- Queixa principal trazida nesta sessão:
- Como passou a última semana desde o encontro anterior:
- Relatos de humor, sentimentos predominantes e eventos significativos:
- Fala do analisando / expressões literais marcantes:

O - OBJETIVO (Observações clínicas do psicólogo)
- Apresentação geral e postura corporal:
- Afeto (congruente, embotado, expansivo, ansioso):
- Linguagem, fluxo do pensamento e contato visual:
- Cumprimento ou não das tarefas combinadas na sessão anterior:

A - AVALIAÇÃO (Síntese e compreensão diagnóstica/processual)
- Hipóteses diagnósticas ou dinâmicas psíquicas mobilizadas na sessão:
- Padrões de resistência, transferência ou mecanismos de defesa observados:
- Resposta às intervenções técnicas realizadas durante a hora clínica:
- Evolução global em relação às metas estabelecidas:

P - PLANO (Condutas para os próximos passos)
- Intervenções acordadas para a semana:
- Tarefas intersessão / exercícios de autorregistro:
- Encaminhamentos ou contato interdisciplinar necessário:
- Foco planejado para a próxima sessão:
- Próxima sessão agendada para: [Data da Próxima Sessão]

Assinatura: [Nome do Psicólogo] - CRP: [CRP]`
  },

  // =========================================================================
  // 7. ANAMNESE DETALHADA
  // =========================================================================
  {
    id: 'anamnese-detalhada',
    titulo: 'Anamnese Detalhada',
    categoria: 'anamnese_geral',
    descricao: 'Modelo abrangente para coleta de informações do paciente, adequado para psicoterapeutas e psicólogos clínicos experientes.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'BookOpen',
    textoBase: `ANAMNESE CLÍNICA APROFUNDADA (MODELO INTEGRAL BIOPSICOSSOCIAL)

1. DADOS CADASTRAIS & DEMOGRÁFICOS
Nome: [Nome do Paciente]
Data de Nascimento: [Data de Nascimento] | Idade: [Idade]
Estado Civil: [Estado Civil] | Filhos: [Filhos]
Escolaridade: [Escolaridade] | Profissão / Ocupação Atual: [Profissão]
Endereço: [Endereço] | Contato: [Telefone]
Data de Abertura do Prontuário: [Data de Hoje]

2. HISTÓRIA DA DEMANDA / QUEIXA PRINCIPAL (HDA)
- Descrição pormenorizada do sintoma ou sofrimento atual:
- Desencadeantes e contexto em que os primeiros sintomas surgiram:
- Fatores de alívio e fatores de piora:
- Tratamentos anteriores (médicos, psicológicos, alternativos):

3. HISTÓRIA DE VIDA E DESENVOLVIMENTO
- Gestação, parto e primeiros anos (relatos da família sobre infância):
- Infância e ambiente doméstico (clima emocional familiar):
- Dinâmica com figuras parentais e irmãos:
- Percurso escolar e adaptação na adolescência:

4. HISTÓRIA PROFISSIONAL E SOCIAL
- Trajetória no trabalho e satisfação ocupacional atual:
- Relações sociais, amizades e atividades de lazer:
- Autonomia financeira e estabilidade:

5. HISTÓRIA AFETIVA E SEXUAL
- Relacionamentos amorosos significativos (passados e atual):
- Satisfação afetiva e sexual, conflitos conjugais:

6. HISTÓRICO MÉDICO E SAÚDE FÍSICA
- Doenças crônicas, cirurgias, internações prévias:
- Padrão de sono, apetite e atividade física:
- Uso de substâncias psicoativas (álcool, nicotina, medicamentos controlados, outras):

7. EXAME DO ESTADO MENTAL ATUAL
- Aparência geral e atitude perante o entrevistador:
- Consciência e Orientação têmporo-espacial:
- Atenção, concentração e memória:
- Sensopercepção (ausência/presença de alucinações):
- Pensamento (curso, forma e conteúdo):
- Humor e Afeto:
- Juízo crítico da realidade e insight sobre a condição clínica:

8. FORMULAÇÃO DIAGNÓSTICA & PROGNÓSTICO
- Compreensão psicodinâmica / cognitivo-comportamental integrada:
- Fatores protetivos e recursos de enfrentamento do sujeito:
- Enquadre e metas terapêuticas estabelecidas:

Psicólogo(a) Responsável: [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 8. INVENTÁRIO DE DEPRESSÃO DE BECK (BDI)
  // =========================================================================
  {
    id: 'bdi',
    titulo: 'Inventário de Depressão de Beck (BDI)',
    categoria: 'formulario',
    descricao: 'Avaliação da intensidade dos sintomas depressivos.',
    badgeTexto: '# Modelo de: Formulário',
    badgeClasse: 'bg-slate-800 text-white border-slate-900',
    tipoPreenchimento: 'escala_psicometrica',
    icone: 'Activity',
    textoBase: `INVENTÁRIO DE DEPRESSÃO DE BECK (BDI)
Instrumento padronizado para mensuração da intensidade dos sintomas depressivos.

Paciente: [Nome do Paciente] | Data: [Data de Hoje]
Escore Total: [Escore] / 63 pontos
Classificação Clínica: [Classificação]

(O questionário interativo acima contém os 21 grupos de afirmações com cálculo automático e pontuação em tempo real).`,
    itensEscala: [
      {
        id: 1,
        rotulo: 'Tristeza',
        opcoes: [
          { valor: 0, texto: 'Não me sinto triste.' },
          { valor: 1, texto: 'Eu me sinto triste.' },
          { valor: 2, texto: 'Estou triste o tempo todo e não consigo sair disso.' },
          { valor: 3, texto: 'Estou tão triste ou infeliz que não consigo suportar.' }
        ]
      },
      {
        id: 2,
        rotulo: 'Pessimismo em Relação ao Futuro',
        opcoes: [
          { valor: 0, texto: 'Não estou desanimado(a) em relação ao meu futuro.' },
          { valor: 1, texto: 'Eu me sinto mais desanimado(a) com meu futuro do que costumava estar.' },
          { valor: 2, texto: 'Não espero nada de bom para o meu futuro.' },
          { valor: 3, texto: 'Sinto que meu futuro é sem esperança e só vai piorar.' }
        ]
      },
      {
        id: 3,
        rotulo: 'Sensação de Fracasso',
        opcoes: [
          { valor: 0, texto: 'Não me sinto um(a) fracassado(a).' },
          { valor: 1, texto: 'Sinto que fracassei mais do que uma pessoa normal.' },
          { valor: 2, texto: 'Quando olho para trás, só vejo um monte de fracassos.' },
          { valor: 3, texto: 'Sinto que sou uma pessoa totalmente fracassada.' }
        ]
      },
      {
        id: 4,
        rotulo: 'Perda de Prazer (Anedonia)',
        opcoes: [
          { valor: 0, texto: 'Tenho tanto prazer quanto antes com as coisas que gosto.' },
          { valor: 1, texto: 'Não sinto tanto prazer com as coisas como costumava sentir.' },
          { valor: 2, texto: 'Sinto muito pouco prazer com as coisas que costumava gostar.' },
          { valor: 3, texto: 'Não consigo sentir prazer algum com coisa alguma.' }
        ]
      },
      {
        id: 5,
        rotulo: 'Sentimentos de Culpa',
        opcoes: [
          { valor: 0, texto: 'Não me sinto particularmente culpado(a).' },
          { valor: 1, texto: 'Eu me sinto culpado(a) por muitas coisas que fiz ou deveria ter feito.' },
          { valor: 2, texto: 'Eu me sinto bastante culpado(a) a maior parte do tempo.' },
          { valor: 3, texto: 'Eu me sinto culpado(a) o tempo todo.' }
        ]
      },
      {
        id: 6,
        rotulo: 'Sentimentos de Punição',
        opcoes: [
          { valor: 0, texto: 'Não sinto que estou sendo punido(a).' },
          { valor: 1, texto: 'Sinto que posso vir a ser punido(a).' },
          { valor: 2, texto: 'Espero ser punido(a).' },
          { valor: 3, texto: 'Sinto que estou sendo punido(a).' }
        ]
      },
      {
        id: 7,
        rotulo: 'Autoaversão / Descontentamento',
        opcoes: [
          { valor: 0, texto: 'Sinto-me da mesma forma em relação a mim mesmo(a).' },
          { valor: 1, texto: 'Perdi a confiança em mim mesmo(a).' },
          { valor: 2, texto: 'Estou desapontado(a) comigo mesmo(a).' },
          { valor: 3, texto: 'Eu me detesto.' }
        ]
      },
      {
        id: 8,
        rotulo: 'Autocrítica',
        opcoes: [
          { valor: 0, texto: 'Não me critico nem me culpo mais do que o habitual.' },
          { valor: 1, texto: 'Sou mais crítico(a) comigo mesmo(a) do que costumava ser.' },
          { valor: 2, texto: 'Critico a mim mesmo(a) por todas as minhas falhas.' },
          { valor: 3, texto: 'Culpo a mim mesmo(a) por tudo de ruim que acontece.' }
        ]
      },
      {
        id: 9,
        rotulo: 'Pensamentos ou Desejos Suicidas [ITEM CRÍTICO]',
        critico: true,
        avisoCritico: 'Atenção Clínica: Avalie imediatamente ideação suicida, suporte familiar e plano de segurança.',
        opcoes: [
          { valor: 0, texto: 'Não tenho nenhum pensamento de me matar.' },
          { valor: 1, texto: 'Tenho pensamentos de me matar, mas não os levaria adiante.' },
          { valor: 2, texto: 'Gostaria de me matar.' },
          { valor: 3, texto: 'Eu me mataria se tivesse uma oportunidade.' }
        ]
      },
      {
        id: 10,
        rotulo: 'Choro',
        opcoes: [
          { valor: 0, texto: 'Não choro mais do que costumava chorar.' },
          { valor: 1, texto: 'Choro mais agora do que costumava.' },
          { valor: 2, texto: 'Choro por qualquer coisinha.' },
          { valor: 3, texto: 'Sinto vontade de chorar, mas não consigo.' }
        ]
      },
      {
        id: 11,
        rotulo: 'Agitação / Inquietação',
        opcoes: [
          { valor: 0, texto: 'Não me sinto mais agitado(a) ou inquieto(a) que o normal.' },
          { valor: 1, texto: 'Sinto-me mais agitado(a) ou inquieto(a) que o normal.' },
          { valor: 2, texto: 'Estou tão agitado(a) que é difícil ficar parado(a).' },
          { valor: 3, texto: 'Estou tão agitado(a) que tenho que ficar me mexendo ou fazendo algo.' }
        ]
      },
      {
        id: 12,
        rotulo: 'Perda de Interesse',
        opcoes: [
          { valor: 0, texto: 'Não perdi o interesse por outras pessoas ou atividades.' },
          { valor: 1, texto: 'Estou menos interessado(a) por outras pessoas ou coisas.' },
          { valor: 2, texto: 'Perdi a maior parte do interesse por outras pessoas ou coisas.' },
          { valor: 3, texto: 'É difícil me interessar por qualquer coisa.' }
        ]
      },
      {
        id: 13,
        rotulo: 'Indecisão',
        opcoes: [
          { valor: 0, texto: 'Tomo decisões tão bem quanto antes.' },
          { valor: 1, texto: 'Acho mais difícil tomar decisões agora do que antes.' },
          { valor: 2, texto: 'Tenho muito mais dificuldade em tomar decisões do que antes.' },
          { valor: 3, texto: 'Tenho dificuldade em tomar qualquer decisão.' }
        ]
      },
      {
        id: 14,
        rotulo: 'Desvalorização / Autoimagem',
        opcoes: [
          { valor: 0, texto: 'Não me sinto sem valor.' },
          { valor: 1, texto: 'Não me considero tão valoroso(a) e útil quanto costumava ser.' },
          { valor: 2, texto: 'Sinto-me menos valoroso(a) quando me comparo aos outros.' },
          { valor: 3, texto: 'Sinto-me completamente sem valor.' }
        ]
      },
      {
        id: 15,
        rotulo: 'Perda de Energia',
        opcoes: [
          { valor: 0, texto: 'Tenho tanta energia quanto sempre tive.' },
          { valor: 1, texto: 'Tenho menos energia do que costumava ter.' },
          { valor: 2, texto: 'Não tenho energia suficiente para fazer muitas coisas.' },
          { valor: 3, texto: 'Não tenho energia para fazer nada.' }
        ]
      },
      {
        id: 16,
        rotulo: 'Padrão de Sono',
        opcoes: [
          { valor: 0, texto: 'Não tive nenhuma mudança no meu padrão de sono.' },
          { valor: 1, texto: 'Durmo um pouco mais ou um pouco menos que o habitual.' },
          { valor: 2, texto: 'Durmo muito mais ou muito menos que o habitual.' },
          { valor: 3, texto: 'Acordo 1 a 2 horas mais cedo e não consigo voltar a dormir.' }
        ]
      },
      {
        id: 17,
        rotulo: 'Irritabilidade',
        opcoes: [
          { valor: 0, texto: 'Não estou mais irritado(a) que o normal.' },
          { valor: 1, texto: 'Estou mais irritável que o habitual.' },
          { valor: 2, texto: 'Estou muito mais irritável que o habitual.' },
          { valor: 3, texto: 'Estou irritado(a) o tempo todo.' }
        ]
      },
      {
        id: 18,
        rotulo: 'Mudanças no Apetite',
        opcoes: [
          { valor: 0, texto: 'Não tive nenhuma alteração no meu apetite.' },
          { valor: 1, texto: 'Meu apetite está um pouco menor ou um pouco maior.' },
          { valor: 2, texto: 'Meu apetite está muito menor ou muito maior.' },
          { valor: 3, texto: 'Não tenho apetite nenhum ou quero comer o tempo todo.' }
        ]
      },
      {
        id: 19,
        rotulo: 'Dificuldade de Concentração',
        opcoes: [
          { valor: 0, texto: 'Posso me concentrar tão bem quanto antes.' },
          { valor: 1, texto: 'Não consigo me concentrar tão bem quanto antes.' },
          { valor: 2, texto: 'É difícil manter a mente em qualquer coisa por muito tempo.' },
          { valor: 3, texto: 'Acho que não consigo me concentrar em nada.' }
        ]
      },
      {
        id: 20,
        rotulo: 'Cansaço ou Fadiga',
        opcoes: [
          { valor: 0, texto: 'Não estou mais cansado(a) ou fatigado(a) que o habitual.' },
          { valor: 1, texto: 'Fico cansado(a) mais facilmente do que antes.' },
          { valor: 2, texto: 'Fico cansado(a) demais para fazer muitas das coisas que costumava fazer.' },
          { valor: 3, texto: 'Fico cansado(a) demais para fazer quase tudo.' }
        ]
      },
      {
        id: 21,
        rotulo: 'Interesse Sexual',
        opcoes: [
          { valor: 0, texto: 'Não notei qualquer mudança recente em meu interesse por sexo.' },
          { valor: 1, texto: 'Estou menos interessado(a) em sexo do que costumava estar.' },
          { valor: 2, texto: 'Estou muito menos interessado(a) em sexo agora.' },
          { valor: 3, texto: 'Perdi completamente o interesse por sexo.' }
        ]
      }
    ],
    interpretacaoEscore: {
      faixas: [
        {
          min: 0,
          max: 13,
          classificacao: 'Sintomas Depressivos Mínimos',
          cor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          recomendacaoClinica: 'Quadro dentro dos limites esperados para a população geral. Manter monitoramento regular.'
        },
        {
          min: 14,
          max: 19,
          classificacao: 'Depressão Leve',
          cor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          recomendacaoClinica: 'Indicação de psicoterapia semanal com foco em ativação comportamental e reestruturação cognitiva.'
        },
        {
          min: 20,
          max: 28,
          classificacao: 'Depressão Moderada',
          cor: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30',
          recomendacaoClinica: 'Recomenda-se acompanhamento psicoterápico intensivo e avaliação psiquiátrica para farmacoterapia conjunta.'
        },
        {
          min: 29,
          max: 63,
          classificacao: 'Depressão Grave',
          cor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
          recomendacaoClinica: 'Condição clínica prioritária. Necessária intervenção imediata, suporte interdisciplinar e pactuação de plano de segurança.'
        }
      ]
    }
  },

  // =========================================================================
  // 9. QUESTIONÁRIO DE SAÚDE GERAL (QSG-12)
  // =========================================================================
  {
    id: 'qsg-12',
    titulo: 'Questionário de Saúde Geral (QSG-12)',
    categoria: 'formulario',
    descricao: 'Instrumento de rastreio de transtornos mentais não psicóticos.',
    badgeTexto: '# Modelo de: Formulário',
    badgeClasse: 'bg-slate-800 text-white border-slate-900',
    tipoPreenchimento: 'escala_psicometrica',
    icone: 'HeartPulse',
    textoBase: `QUESTIONÁRIO DE SAÚDE GERAL DE GOLDBERG (QSG-12)
Rastreio de sofrimento psicológico não psicótico e capacidade de enfrentamento.

Paciente: [Nome do Paciente] | Data: [Data de Hoje]
Escore Obtido: [Escore] pontos
Classificação: [Classificação]`,
    itensEscala: [
      {
        id: 1,
        rotulo: 'Tem conseguido se concentrar bem no que faz?',
        opcoes: [
          { valor: 0, texto: 'Melhor do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      },
      {
        id: 2,
        rotulo: 'Suas preocupações têm feito você perder muito sono?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 3,
        rotulo: 'Tem sentido que está desempenhando um papel útil na vida?',
        opcoes: [
          { valor: 0, texto: 'Mais do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      },
      {
        id: 4,
        rotulo: 'Tem se sentido capaz de tomar decisões sobre suas coisas?',
        opcoes: [
          { valor: 0, texto: 'Mais do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      },
      {
        id: 5,
        rotulo: 'Tem se sentido constantemente sob pressão ou tensão?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 6,
        rotulo: 'Tem sentido que não consegue superar suas dificuldades?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 7,
        rotulo: 'Tem sido capaz de desfrutar suas atividades normais do dia a dia?',
        opcoes: [
          { valor: 0, texto: 'Mais do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      },
      {
        id: 8,
        rotulo: 'Tem sido capaz de enfrentar seus problemas com determinação?',
        opcoes: [
          { valor: 0, texto: 'Mais do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      },
      {
        id: 9,
        rotulo: 'Tem se sentido infeliz e deprimido(a)?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 10,
        rotulo: 'Tem perdido a confiança em si mesmo(a)?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 11,
        rotulo: 'Tem pensado em si mesmo(a) como uma pessoa sem valor?',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Não mais do que de costume' },
          { valor: 2, texto: 'Um pouco mais do que de costume' },
          { valor: 3, texto: 'Muito mais do que de costume' }
        ]
      },
      {
        id: 12,
        rotulo: 'Tem se sentido razoavelmente feliz, considerando todas as coisas?',
        opcoes: [
          { valor: 0, texto: 'Mais do que de costume' },
          { valor: 1, texto: 'O mesmo que de costume' },
          { valor: 2, texto: 'Menos do que de costume' },
          { valor: 3, texto: 'Muito menos do que de costume' }
        ]
      }
    ],
    interpretacaoEscore: {
      faixas: [
        {
          min: 0,
          max: 11,
          classificacao: 'Ausência de Sofrimento Psíquico Significativo',
          cor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          recomendacaoClinica: 'Boa integridade e capacidade de enfrentamento às demandas cotidianas.'
        },
        {
          min: 12,
          max: 20,
          classificacao: 'Sofrimento Psíquico Leve a Moderado',
          cor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          recomendacaoClinica: 'Sinais de estresse emocional e sobrecarga. Aconselha-se intervenção preventiva e suporte psicológico.'
        },
        {
          min: 21,
          max: 36,
          classificacao: 'Sofrimento Psicológico Intenso / Rastreio Positivo',
          cor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
          recomendacaoClinica: 'Indicativo de provável transtorno mental não psicótico (ansiedade / depressão). Avaliação clínica prioritária.'
        }
      ]
    }
  },

  // =========================================================================
  // 10. ESCALA DE AUTOESTIMA DE ROSENBERG
  // =========================================================================
  {
    id: 'rosenberg',
    titulo: 'Escala de Autoestima de Rosenberg',
    categoria: 'formulario',
    descricao: 'Avaliação global da autoestima.',
    badgeTexto: '# Modelo de: Formulário',
    badgeClasse: 'bg-slate-800 text-white border-slate-900',
    tipoPreenchimento: 'escala_psicometrica',
    icone: 'Heart',
    textoBase: `ESCALA DE AUTOESTIMA DE ROSENBERG (EAR)
Avaliação unidimensional do sentimento global de valor próprio e autoaceitação.

Paciente: [Nome do Paciente] | Data: [Data de Hoje]
Escore Obtido: [Escore] / 40 pontos
Interpretação: [Classificação]`,
    itensEscala: [
      {
        id: 1,
        rotulo: 'Sinto que sou uma pessoa de valor, pelo menos tanto quanto as outras.',
        opcoes: [
          { valor: 1, texto: 'Discordo totalmente' },
          { valor: 2, texto: 'Discordo' },
          { valor: 3, texto: 'Concordo' },
          { valor: 4, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 2,
        rotulo: 'Sinto que tenho várias boas qualidades.',
        opcoes: [
          { valor: 1, texto: 'Discordo totalmente' },
          { valor: 2, texto: 'Discordo' },
          { valor: 3, texto: 'Concordo' },
          { valor: 4, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 3,
        rotulo: 'Levando tudo em consideração, sinto-me inclinado(a) a pensar que sou um(a) fracassado(a).',
        invertido: true,
        opcoes: [
          { valor: 4, texto: 'Discordo totalmente' },
          { valor: 3, texto: 'Discordo' },
          { valor: 2, texto: 'Concordo' },
          { valor: 1, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 4,
        rotulo: 'Sou capaz de fazer coisas tão bem quanto a maioria das pessoas.',
        opcoes: [
          { valor: 1, texto: 'Discordo totalmente' },
          { valor: 2, texto: 'Discordo' },
          { valor: 3, texto: 'Concordo' },
          { valor: 4, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 5,
        rotulo: 'Sinto que não tenho muito do que me orgulhar.',
        invertido: true,
        opcoes: [
          { valor: 4, texto: 'Discordo totalmente' },
          { valor: 3, texto: 'Discordo' },
          { valor: 2, texto: 'Concordo' },
          { valor: 1, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 6,
        rotulo: 'Tenho uma atitude positiva com relação a mim mesmo(a).',
        opcoes: [
          { valor: 1, texto: 'Discordo totalmente' },
          { valor: 2, texto: 'Discordo' },
          { valor: 3, texto: 'Concordo' },
          { valor: 4, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 7,
        rotulo: 'Em geral, estou satisfeito(a) comigo mesmo(a).',
        opcoes: [
          { valor: 1, texto: 'Discordo totalmente' },
          { valor: 2, texto: 'Discordo' },
          { valor: 3, texto: 'Concordo' },
          { valor: 4, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 8,
        rotulo: 'Gostaria de poder ter mais respeito por mim mesmo(a).',
        invertido: true,
        opcoes: [
          { valor: 4, texto: 'Discordo totalmente' },
          { valor: 3, texto: 'Discordo' },
          { valor: 2, texto: 'Concordo' },
          { valor: 1, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 9,
        rotulo: 'Às vezes me sinto verdadeiramente inútil.',
        invertido: true,
        opcoes: [
          { valor: 4, texto: 'Discordo totalmente' },
          { valor: 3, texto: 'Discordo' },
          { valor: 2, texto: 'Concordo' },
          { valor: 1, texto: 'Concordo totalmente' }
        ]
      },
      {
        id: 10,
        rotulo: 'Às vezes acho que não sirvo para nada.',
        invertido: true,
        opcoes: [
          { valor: 4, texto: 'Discordo totalmente' },
          { valor: 3, texto: 'Discordo' },
          { valor: 2, texto: 'Concordo' },
          { valor: 1, texto: 'Concordo totalmente' }
        ]
      }
    ],
    interpretacaoEscore: {
      faixas: [
        {
          min: 10,
          max: 25,
          classificacao: 'Autoestima Baixa',
          cor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
          recomendacaoClinica: 'Sentimento de inadequação acentuado, vulnerabilidade a críticas e necessidade de intervenção para fortalecimento do auto-respeito.'
        },
        {
          min: 26,
          max: 34,
          classificacao: 'Autoestima Média / Equilibrada',
          cor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          recomendacaoClinica: 'Percepção de valor próprio compatível com a normalidade clínica, com oscilações normais a eventos estressores.'
        },
        {
          min: 35,
          max: 40,
          classificacao: 'Autoestima Alta',
          cor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          recomendacaoClinica: 'Forte sentimento de autoaceitação, competência pessoal e autovalorização positiva.'
        }
      ]
    }
  },

  // =========================================================================
  // 11. ANAMNESE DE ROTINA
  // =========================================================================
  {
    id: 'anamnese-rotina',
    titulo: 'Anamnese de Rotina',
    categoria: 'anamnese_rotina',
    descricao: 'Modelo para acompanhamento regular de pacientes, focado na evolução terapêutica e questões atuais.',
    badgeTexto: '# Modelo de: Anamnese de rotina',
    badgeClasse: 'bg-emerald-800 text-white border-emerald-900',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'Clock',
    textoBase: `ROTEIRO DE ATENDIMENTO CLÍNICO REGULAR / SESSÃO DE ROTINA

Paciente: [Nome do Paciente]
Data da Sessão: [Data de Hoje] | Horário: [Hora da Sessão]

1. CHECAGEM INICIAL DE HUMOR E ESTADO GERAL
- Nível de Humor na chegada (escala 0 a 10): [  ]
- Palavra síntese com que o paciente resume sua semana:
- Acontecimentos marcantes nos últimos dias:

2. RETOMADA E REVISÃO DA SESSÃO ANTERIOR
- O que ecoou da última sessão durante a semana:
- Tarefas intersessão / exercícios combinados foram realizados? Sim / Parcial / Não:
- Obstáculos ou facilidades encontradas:

3. PAUTA CENTRAL DA SESSÃO ATUAL
- Tema principal trazido para elaboração:
- Associação livre, falas significativas e manifestações inconscientes:
- Conflitos relacionais ou decisões em andamento:

4. INTERVENÇÕES & PONTUAÇÕES DO PSICÓLOGO
- Manejo técnico empregado (escuta, interpretação, confronto afetuoso, reestruturação):
- Como o analisando recebeu as intervenções:

5. INSIGHTS E FECHAMENTO
- Compreensões ou novos pontos de vista alcançados:
- Tarefas ou reflexões acordadas para a próxima semana:
- Nível de Humor na saída (0 a 10): [  ]
- Próxima sessão: [Data da Próxima Sessão]

Profissional: [Nome do Psicólogo] - CRP: [CRP]`
  },

  // =========================================================================
  // 12. REGISTRO DIÁRIO DE HUMOR
  // =========================================================================
  {
    id: 'registro-humor',
    titulo: 'Registro Diário de Humor',
    categoria: 'formulario',
    descricao: 'Acompanhamento diário do humor, sono, atividades e eventos significativos.',
    badgeTexto: '# Modelo de: Formulário',
    badgeClasse: 'bg-slate-800 text-white border-slate-900',
    tipoPreenchimento: 'registro_humor',
    icone: 'SunMedium',
    textoBase: `REGISTRO DIÁRIO DE HUMOR E MONITORAMENTO PSICOEMOCIONAL

Paciente: [Nome do Paciente]
Período / Data: [Data de Hoje]
Terapeuta: [Nome do Psicólogo]

1. MONITORAMENTO DO HUMOR
- Nível de humor predominante no dia: ( ) 1-2 Muito baixo/deprimido  ( ) 3-4 Baixo  ( ) 5-6 Neutro/estável  ( ) 7-8 Bom/disposto  ( ) 9-10 Muito alto/eufórico
- Nível de ansiedade no dia (0 a 10): [  ]

2. QUALIDADE DO SONO
- Horas de sono na noite anterior: [  ] horas
- Qualidade percebida: ( ) Reparador  ( ) Agitado  ( ) Insônia / Despertares frequentes

3. ATIVIDADES & ROTINA DO DIA
- Atividades físicas praticadas:
- Tempo de lazer / relaxamento:
- Alimentação e ingestão de água:

4. EVENTOS SIGNIFICATIVOS & GATILHOS
- O que aconteceu de mais estressante no dia:
- Qual foi o pensamento automático imediato:
- Emoção sentida e onde repercutiu no corpo:

5. RECURSOS DE ENFRENTAMENTO E FATORES POSITIVOS
- Três coisas boas ou pelas quais sinto gratidão hoje:
  1.
  2.
  3.
- Estratégia utilizada para se acalmar ou regular a emoção:

Registro arquivado no prontuário do paciente.`
  },

  // =========================================================================
  // 13. FORMULÁRIO GERENCIAL POR ÁREA – NR-1
  // =========================================================================
  {
    id: 'gerencial-nr1',
    titulo: 'Formulário Gerencial por Área – NR-1',
    categoria: 'anamnese_geral',
    descricao: 'Triagem de Saúde Mental e Socioambiental - Resposta por Gestores. Este formulário tem como objetivo coletar informações de cada gestor sobre os riscos psicossociais, aspectos de saúde mental e condições socioambientais das equipes sob sua supervisão, conforme diretrizes da NR-1.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'formulario_nr1',
    icone: 'Building2',
    textoBase: `FORMULÁRIO GERENCIAL DE RISCOS PSICOSSOCIAIS POR ÁREA – NR-1 (GESTOR)
Programa de Gerenciamento de Riscos Ocupacionais (PGR)

1. IDENTIFICAÇÃO DO GESTOR E DA EQUIPE
Nome do Gestor(a): [Nome do Gestor / Paciente]
Área / Diretoria / Setor: [Setor]
Número Total de Colaboradores na Equipe: [Nº Colaboradores]
Data do Levantamento: [Data de Hoje]

2. INDICADORES EPIDEMIOLÓGICOS E COMPORTAMENTAIS DA EQUIPE
- Taxa percebida de absenteísmo / faltas justificadas nos últimos 90 dias: ( ) Baixa  ( ) Média  ( ) Alta
- Houve afastamentos médicos (B31 / B91) relacionados à saúde mental na área? ( ) Sim  ( ) Não
- Rotatividade de pessoal (turnover) no setor: ( ) Estável  ( ) Moderada  ( ) Elevada

3. GESTÃO DE DEMANDAS E RITMO DE TRABALHO
- A carga de trabalho da equipe é compatível com o quadro funcional existente?
- Com que frequência a equipe necessita de horas extras ou trabalho em finais de semana?
- Existem períodos de sazonalidade com picos extremos de estresse?

4. CLIMA ORGANIZACIONAL E CONFLITOS INTERPESSOAIS
- Como você avalia a cooperação mútua entre os integrantes da equipe?
- Foram reportados conflitos graves, ruídos de comunicação ou denúncias de assédio?
- Como a liderança acolhe colaboradores que apresentam sinais evidentes de esgotamento?

5. MATRIZ DE RISCO PSICOSSOCIAL DO SETOR (NR-1)
- Grau de severidade do risco psicossocial estimado: ( ) Risco Baixo  ( ) Risco Médio  ( ) Risco Alto / Crítico
- Fatores prioritários que demandam intervenção:
  [ ] Sobrecarga de tarefas e metas inatingíveis
  [ ] Falta de clareza nas atribuições
  [ ] Falta de reconhecimento e feedback construtivo
  [ ] Conflitos entre pares ou lideranças

6. PLANO DE AÇÃO GERENCIAL PREVENTIVO
- Medidas de controle a serem implementadas pela gestão:
- Treinamentos socioemocionais ou programas de acolhimento requeridos:

Parecer Técnico de Saúde Mental Ocupacional: [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 14. ATESTADO
  // =========================================================================
  {
    id: 'atestado',
    titulo: 'Atestado',
    categoria: 'documento',
    descricao: 'Atestado para afastamento do trabalho.',
    badgeTexto: '# Modelo de: Documento',
    badgeClasse: 'bg-purple-700 text-white border-purple-800',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'FileBadge',
    textoBase: `ATESTADO PSICOLÓGICO DE AFASTAMENTO LABORAL
(Emitido em estrita conformidade com a Resolução CFP nº 06/2019)

Atesto, para os devidos fins de comprovação e justificativa de afastamento das atividades laborais, que o(a) Sr(a). [Nome do Paciente], portador(a) do documento de identidade/CPF [CPF], encontra-se sob meus cuidados profissionais em acompanhamento psicoterápico.

Em virtude de manifestações de sofrimento psíquico agudo que comprometem temporariamente sua capacidade laborativa plena e exigem repouso e cuidados terapêuticos, recomendo seu afastamento das atividades de trabalho pelo período de [Número de Dias, ex: 05 (cinco)] dias, a contar desta data ([Data de Hoje]).

Em respeito ao Código de Ética Profissional do Psicólogo e ao direito à privacidade e sigilo profissional, o código de diagnóstico CID-11 / CID-10 só é informado mediante solicitação e anuência expressa por escrito do(a) paciente.
[ ] CID expressamente autorizado pelo paciente: [CID / Hipótese Diagnóstica]

Este documento possui fé pública nos termos da legislação vigente e destina-se exclusivamente à finalidade informada.

[Cidade], [Data de Hoje]

_____________________________________________
[Nome do Psicólogo]
Psicólogo(a) Clínico(a)
CRP: [CRP]
Endereço Profissional: [Endereço do Consultório]
Telefone / WhatsApp: [Telefone do Consultório]`
  },

  // =========================================================================
  // 15. CONTRATO DE SERVIÇO E TERMO DE CONSENTIMENTO
  // =========================================================================
  {
    id: 'contrato-consentimento',
    titulo: 'Contrato de serviço e termo de consentimento',
    categoria: 'documento',
    descricao: 'Contrato para contratação dos serviços terapêuticos e termo de consentimento.',
    badgeTexto: '# Modelo de: Documento',
    badgeClasse: 'bg-purple-700 text-white border-purple-800',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'FileSignature',
    textoBase: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS E TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)

Pelo presente instrumento particular, de um lado:
PROFISSIONAL: [Nome do Psicólogo], Psicólogo(a) devidamente inscrito(a) no Conselho Regional de Psicologia sob o CRP nº [CRP], com consultório profissional situado em [Endereço do Consultório].
PACIENTE / CONTRATANTE: [Nome do Paciente], portador(a) do CPF nº [CPF], residente e domiciliado(a) em [Endereço], telefone [Telefone].

Celebram o presente contrato sob as seguintes cláusulas e condições:

CLÁUSULA 1ª - DO OBJETO E MODALIDADE
O presente contrato tem por objeto a prestação de serviços profissionais de psicoterapia clínica, na modalidade [Presencial / Online via videoconferência criptografada], com sessões de 50 (cinquenta) minutos de duração, em frequência [Semanal / Quinzenal], previamente agendadas.

CLÁUSULA 2ª - DOS HONORÁRIOS E FORMA DE PAGAMENTO
O valor de cada sessão é acordado em [Valor da Sessão, ex: R$ 160,00], devendo ser quitado [por sessão / mensalmente até o dia X de cada mês], via transferência bancária, PIX ou outro meio previamente ajustado.

CLÁUSULA 3ª - DOS CANCELAMENTOS, FALTAS E REAGENDAMENTOS
Havendo necessidade de desmarcar ou reagendar a sessão, o(a) PACIENTE deverá avisar com antecedência mínima de 24 (vinte e quatro) horas. Cancelamentos com menos de 24 horas de antecedência ou não comparecimento sem justificativa ensejarão a cobrança regular dos honorários da sessão reservada, tendo em vista o bloqueio do horário na agenda clínica do(a) profissional.

CLÁUSULA 4ª - DO SIGILO PROFISSIONAL E EXCEÇÕES
Todas as informações relatadas em sessão estão resguardadas pelo sigilo profissional estrito, conforme determina o Art. 9º do Código de Ética Profissional do Psicólogo. O sigilo apenas poderá ser quebrado em situações excepcionais de iminente risco à vida do(a) paciente ou de terceiros, ou mediante determinação judicial formal, restrita ao estritamente necessário.

CLÁUSULA 5ª - DO TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
O(A) PACIENTE declara ter sido devidamente informado(a) sobre os objetivos, métodos e limites da psicoterapia, tendo ciência de que o processo envolve reflexão sobre vivências pessoais e que o tempo de tratamento varia de acordo com cada demanda. O(A) paciente tem o direito de interromper o processo a qualquer momento, recomendando-se a realização de uma sessão de encerramento para elaboração do término.

E, por estarem justos e contratados, assinam o presente em 2 (duas) vias de igual teor.

[Cidade], [Data de Hoje]

_____________________________________________
[Nome do Psicólogo] - CRP: [CRP]

_____________________________________________
[Nome do Paciente] - CPF: [CPF]`
  },

  // =========================================================================
  // 16. MODELO BRENO ALTIERES
  // =========================================================================
  {
    id: 'modelo-breno-altieres',
    titulo: 'Modelo Breno Altieres',
    categoria: 'anamnese_geral',
    descricao: 'Modelo abrangente para coleta de informações do paciente desenvolvido pelo psicólogo Breno Altieres.',
    badgeTexto: '# Modelo de: Anamnese geral',
    badgeClasse: 'bg-teal-600 text-white border-teal-700',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'Sparkles',
    textoBase: `MODELO CLÍNICO INTEGRADO BRENO ALTIERES
Mapeamento Biográfico, Estruturas de Apego e Recursos Psíquicos de Enfrentamento

Paciente: [Nome do Paciente]
Data de Abertura: [Data de Hoje] | Terapeuta: [Nome do Psicólogo] (CRP: [CRP])

1. LINHA DO TEMPO VITAL & MARCOS BIOGRÁFICOS SIGNIFICATIVOS
- As 3 memórias mais antigas ou decisivas que moldaram a visão de mundo do paciente:
  1.
  2.
  3.
- Rupturas, perdas ou transições geográficas/familiares marcantes:

2. MAPA DE VÍNCULOS PRIMÁRIOS E PADRÃO DE APEGO
- Relação com as figuras cuidadoras principais na infância:
- Sensação predominante nos relacionamentos afetivos atuais:
  ( ) Apego Seguro (Confiança e proximidade sem angústia desmedida)
  ( ) Apego Ansioso / Preocupado (Medo constante de abandono e necessidade de validação)
  ( ) Apego Evitativo / Desligado (Dificuldade em confiar, hiperautonomia defensiva)
  ( ) Apego Desorganizado (Flutuações entre busca de proximidade e pavor de intimidade)

3. ESQUEMAS CENTRAIS E MODOS DE FUNCIONAMENTO
- Narrativa de Identidade ("Se você tivesse que se descrever quando ninguém está olhando, quem é você?"):
- Crítico Interno: Como é a voz autocrítica quando algo dá errado?
- Mecanismo de Defesa Preferencial: (Racionalização, somatização, humor autodepreciativo, hiperatividade, isolamento)

4. A TRÍADE DA QUEIXA ATUAL
- O que dói hoje? (A dor concreta que motivou a terapia):
- Por que agora? (Qual foi o evento recente que esgotou a capacidade de suportar sozinho?):
- O que já foi tentado e não funcionou?:

5. RECURSOS E FORÇAS PESSOAIS (ÂNCORAS DE RESILIÊNCIA)
- Momentos passados em que o paciente superou grandes adversidades:
- Talentos, paixões, hobbies e atividades que devolvem a sensação de vitalidade:
- Pessoas que verdadeiramente acreditam no paciente:

6. BÚSSOLA DE VALORES E PACTO TERAPÊUTICO
- Se a terapia for um sucesso daqui a 1 ano, como será a vida cotidiana do paciente?
- Compromisso pessoal firmado na primeira sessão:

Avaliado por: [Nome do Psicólogo] | CRP: [CRP]`
  },

  // =========================================================================
  // 17. DECLARAÇÃO PSICOLÓGICA
  // =========================================================================
  {
    id: 'declaracao-psicologica',
    titulo: 'Declaração Psicológica',
    categoria: 'documento',
    descricao: 'Documento que confirma o acompanhamento psicológico de um(a) paciente, descrevendo o objetivo do tratamento e finalidade, sempre em conformidade com as normas éticas profissionais.',
    badgeTexto: '# Modelo de: Documento',
    badgeClasse: 'bg-purple-700 text-white border-purple-800',
    tipoPreenchimento: 'texto_estruturado',
    icone: 'FileCheck',
    textoBase: `DECLARAÇÃO PSICOLÓGICA
(Elaborada em estrita conformidade com a Resolução CFP nº 06/2019)

DECLARO, para os devidos fins e a quem possa interessar, que o(a) Sr(a). [Nome do Paciente], inscrito(a) no CPF sob o nº [CPF], nascido(a) em [Data de Nascimento], encontra-se em acompanhamento psicológico sob meus cuidados profissionais neste consultório, com início em [Data de Início ou Data de Hoje], mantendo frequência regular semanal.

FINALIDADE DO DOCUMENTO:
A presente declaração é emitida a pedido do(a) próprio(a) paciente, com a finalidade exclusiva de comprovação de comparecimento e acompanhamento terapêutico regular para fins de:
[Inserir Finalidade, ex: Comprovação acadêmica / Justificativa de horário junto à instituição empregadora / Encaminhamento para convênio de saúde].

Ressalto que este documento visa exclusivamente a certificar o acompanhamento psicológico em curso, não se prestando a avaliar incapacidade laboral nem a emitir juízo diagnóstico conclusivo, o que constitui competência exclusiva de atestados ou laudos psicológicos quando formalmente demandados.

O presente documento é expedido em observância ao Código de Ética Profissional do Psicólogo, preservando o sigilo de todas as informações confidenciais tratadas em sessão.

[Cidade], [Data de Hoje]

_____________________________________________
[Nome do Psicólogo]
Psicólogo(a) Clínico(a)
CRP: [CRP]
Consultório: [Nome da Clínica]
Telefone / WhatsApp: [Telefone do Consultório]`
  },

  // =========================================================================
  // 18. INVENTÁRIO DE ANSIEDADE DE BECK (BAI)
  // =========================================================================
  {
    id: 'bai',
    titulo: 'Inventário de Ansiedade de Beck (BAI)',
    categoria: 'formulario',
    descricao: 'Avaliação da intensidade dos sintomas de ansiedade.',
    badgeTexto: '# Modelo de: Formulário',
    badgeClasse: 'bg-slate-800 text-white border-slate-900',
    tipoPreenchimento: 'escala_psicometrica',
    icone: 'Zap',
    textoBase: `INVENTÁRIO DE ANSIEDADE DE BECK (BAI)
Instrumento padronizado para avaliação da gravidade dos sintomas somáticos e cognitivos de ansiedade.

Paciente: [Nome do Paciente] | Data: [Data de Hoje]
Escore Total: [Escore] / 63 pontos
Classificação Clínica: [Classificação]

(O questionário interativo acima contém os 21 sintomas com escala de incômodo e cálculo automático em tempo real).`,
    itensEscala: [
      {
        id: 1,
        rotulo: 'Dormência ou formigamento',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 2,
        rotulo: 'Sensação de calor / Ondas de calor',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 3,
        rotulo: 'Tremores nas pernas',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 4,
        rotulo: 'Incapaz de relaxar',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 5,
        rotulo: 'Medo de que o pior aconteça',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 6,
        rotulo: 'Tontura ou atordoamento',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 7,
        rotulo: 'Palpitação ou coração acelerado (Taquicardia)',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 8,
        rotulo: 'Sem firmeza ou equilíbrio instável',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 9,
        rotulo: 'Aterrorizado(a) ou com pânico',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 10,
        rotulo: 'Nervosismo excessivo',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 11,
        rotulo: 'Sensação de sufocação ou falta de ar',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 12,
        rotulo: 'Tremores nas mãos',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 13,
        rotulo: 'Trêmulo(a) ou abalado(a)',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 14,
        rotulo: 'Medo de perder o controle',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 15,
        rotulo: 'Dificuldade de respirar',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 16,
        rotulo: 'Medo de morrer',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 17,
        rotulo: 'Assustado(a)',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 18,
        rotulo: 'Indigestão ou desconforto no abdômen',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 19,
        rotulo: 'Sensação de desmaio',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 20,
        rotulo: 'Rosto afogueado ou rubor',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      },
      {
        id: 21,
        rotulo: 'Suores frios ou sudorese intensa',
        opcoes: [
          { valor: 0, texto: 'Absolutamente não' },
          { valor: 1, texto: 'Levemente: não me incomodou muito' },
          { valor: 2, texto: 'Moderadamente: foi muito desagradável' },
          { valor: 3, texto: 'Gravemente: quase não pude suportar' }
        ]
      }
    ],
    interpretacaoEscore: {
      faixas: [
        {
          min: 0,
          max: 7,
          classificacao: 'Grau Mínimo de Ansiedade',
          cor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          recomendacaoClinica: 'Nível basal esperado de reatividade fisiológica. Não indica intervenção farmacológica específica.'
        },
        {
          min: 8,
          max: 15,
          classificacao: 'Ansiedade Leve',
          cor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
          recomendacaoClinica: 'Indicação de técnicas de respiração diafragmática, relaxamento muscular progressivo e psicoeducação sobre ansiedade.'
        },
        {
          min: 16,
          max: 25,
          classificacao: 'Ansiedade Moderada',
          cor: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30',
          recomendacaoClinica: 'Sintomas somáticos e cognitivos interferem na rotina. Tratamento focado em exposição interoceptiva e reestruturação cognitiva.'
        },
        {
          min: 26,
          max: 63,
          classificacao: 'Ansiedade Severa / Grave',
          cor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
          recomendacaoClinica: 'Quadro limitante com alta sintomatologia autonômica. Avaliação psiquiátrica prioritária para estabilização associada à psicoterapia.'
        }
      ]
    }
  }
];

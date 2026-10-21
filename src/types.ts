/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MensagemEnviada {
  id: string;
  data: string; // ISO
  tipo: string; // 'acolhimento', 'lembrete', 'honorarios', 'reativacao', 'manual' etc.
  texto: string;
  destinatarioNome?: string;
  destinatarioContato?: string;
  dataHoraAtendimento?: string;
  status: 'preparada' | 'aberta_whatsapp' | 'solicitada_provedor' | 'entregue' | 'falha';
  statusDetalhe?: string;
}

export interface Analisando {
  id: string;
  // Identificação
  nome: string;
  nomeSocial?: string;
  nascimento: string; // YYYY-MM-DD
  cpf?: string; // Normalizado (somente dígitos) ou formatado
  // Contato
  whatsapp: string;
  telefone?: string;
  email: string;
  // Endereço
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf?: string;
  endereco?: string; // Legado para compatibilidade
  // Responsável (quando aplicável)
  temResponsavel?: boolean;
  responsavelNome?: string;
  responsavelParentesco?: string;
  responsavelContato?: string;
  responsavelCpf?: string;
  // Informações administrativas e acompanhamento
  status: 'novo' | 'ativo' | 'recorrente' | 'inativo'; // 'novo' (triagem), 'ativo', 'recorrente', 'inativo' (em pausa / alta)
  vip: boolean; // Marcar como "Destaque" ou "Caso complexo / prioritário"
  tags: string[];
  observacoes: string; // Queixa principal / demanda inicial
  criadoEm: string;
  mensagensEnviadas: MensagemEnviada[];
}

export interface ModalidadeAtendimento {
  id: string;
  nome: string;
  preco: number;
  duracao: number; // em minutos (ex: 50)
  intervaloDias: number; // Frequência típica (ex: 7 dias para semanal)
  categoria: string; // 'Análise Individual', 'Supervisão', 'Grupo de Estudos', etc.
  observacoes?: string;
}

export interface ComplementoSessao {
  id: string;
  sessaoId: string;
  autorNome: string;
  autorId?: string;
  criadoEm: string; // ISO
  texto: string;
}

export interface SessaoClinica {
  id: string;
  analisandoId: string;
  modalidadeId: string;
  agendamentoOrigemId?: string; // Vínculo com o agendamento de origem
  data: string; // YYYY-MM-DD
  hora?: string; // HH:MM
  valorCobrado: number;
  valorPago?: number; // Para pagamentos parciais
  saldoDevedor?: number; // valorCobrado - valorPago
  pagamentoStatus: 'pago' | 'pendente' | 'parcial';
  meioPagamento: 'pix' | 'dinheiro' | 'transferencia' | 'cartao';
  proximaSessaoData?: string; // Calculado com base na frequência da modalidade
  proximaSessaoAgendada?: boolean; // Se foi agendada na agenda clínica
  notasSessao?: string; // Registro clínico original confidencial (imutável)
  complementos?: ComplementoSessao[]; // Adendos com autoria e data (não sobrescrevem o original)
  transcricao?: string; // Transcrição de áudio real
  audioUrl?: string; // URL blob ou referência de áudio gravado
  audioDuracaoSegundos?: number;
  criadoEm?: string;
}

export interface Honorario {
  id: string;
  analisandoId: string;
  sessaoId?: string; // Vínculo com a sessão para evitar duplicidade de cobrança
  valor: number;
  valorPago?: number;
  saldoDevedor?: number;
  vencimento: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'parcial' | 'atrasado';
  meioPagamento?: 'pix' | 'dinheiro' | 'transferencia' | 'cartao';
  observacao?: string;
  criadoEm?: string;
}

export interface ModeloMensagem {
  id: string;
  nome: string;
  categoria: 'acolhimento' | 'retorno' | 'aniversario' | 'honorarios' | 'reativacao' | 'informativo' | 'geral';
  conteudo: string;
}

export interface TransmissaoInformativa {
  id: string;
  nome: string;
  publico: 'todos' | 'vips' | 'inativos' | 'aniversariantes' | 'tag';
  tag?: string;
  mensagem: string;
  criadaEm: string;
}

export interface PerfilAnalista {
  nome: string;
  registroProfissional?: string; // ex: Registro em Sociedade de Psicanálise / CRP
  cargo: string; // ex: Psicanalista Clínico / Psicólogo
  whatsapp: string;
  email: string;
  avatar?: string;
}

export interface ConsultorioData {
  nome: string;
  segmento: string; // ex: Psicanálise e Psicoterapia
  whatsapp: string;
  instagram: string;
  linkFeedback: string;
  cidade: string;
  endereco: string;
  logo?: string;
}

export interface RetornoStatus {
  sessaoId: string;
  status: 'pendente' | 'enviado' | 'concluido';
}

export interface AgendamentoClinico {
  id: string;
  analisandoId: string;
  modalidadeId: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  duracaoMinutos?: number;
  status: 'confirmado' | 'pendente' | 'realizado' | 'cancelado';
  sessaoRealizadaId?: string; // Vinculado à sessão concluída
  observacao?: string;
}

export type StatusAcessoSaaS = 'ativo' | 'inativo' | 'pendente';
export type PlanoSaaS = 'mensal' | 'anual' | 'semestral' | 'individual' | 'saas_pro';

export interface UsuarioConta {
  id: string; // UUID imutável da conta Supabase
  email: string;
  nomeCompleto: string;
  crp?: string;
  role?: 'admin' | 'psicologo';
  status?: StatusAcessoSaaS;
  aprovado?: boolean;
  isAdmin?: boolean;
  plano?: PlanoSaaS;
  validoAte?: string;
  diasRestantes?: number;
  criadoEm?: string;
  telefone?: string;
  aprovadoEm?: string;
  aprovadoPor?: string;
}

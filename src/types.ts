/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MensagemEnviada {
  id: string;
  data: string;
  tipo: string; // 'acolhimento', 'lembrete', 'honorarios', 'reativacao', 'manual' etc.
  texto: string;
}

export interface Analisando {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  nascimento: string;
  cidade: string;
  endereco: string;
  status: 'novo' | 'ativo' | 'recorrente' | 'inativo'; // 'novo' (triagem), 'ativo', 'recorrente', 'inativo' (em pausa)
  vip: boolean; // Marcar como "Destaque" ou "Caso complexo / prioritário"
  tags: string[];
  observacoes: string; // Notas gerais ou queixa principal
  criadoEm: string;
  mensagensEnviadas: MensagemEnviada[];
}

export interface ModalidadeAtendimento {
  id: string;
  nome: string;
  preco: number;
  duracao: number; // em minutos
  intervaloDias: number; // Frequência típica (ex: 7 dias para semanal)
  categoria: string; // 'Análise Individual', 'Supervisão', 'Grupo de Estudos', etc.
  observacoes?: string;
}

export interface SessaoClinica {
  id: string;
  analisandoId: string;
  modalidadeId: string;
  data: string;
  valorCobrado: number;
  pagamentoStatus: 'pago' | 'pendente' | 'parcial';
  meioPagamento: 'pix' | 'dinheiro' | 'transferencia' | 'cartao';
  proximaSessaoData?: string; // Calculado automaticamente com base na frequência da modalidade
  notasSessao?: string; // Prontuário confidencial / registro clínico
}

export interface Honorario {
  id: string;
  analisandoId: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'pago' | 'atrasado';
  observacao?: string;
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
  registroProfissional?: string; // ex: Registro em Sociedade de Psicanálise
  cargo: string; // ex: Psicanalista Clínico
  whatsapp: string;
  email: string;
  avatar?: string;
}

export interface ConsultorioData {
  nome: string;
  segmento: string; // ex: Psicanálise e Psicoterapia
  whatsapp: string;
  instagram: string;
  linkFeedback: string; // Link de feedback anônimo ou autoavaliação
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
  status: 'confirmado' | 'pendente' | 'realizado' | 'cancelado';
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


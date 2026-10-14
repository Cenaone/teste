import { z } from 'zod';

/**
 * Esquema de Validação flexível e robusto para Analisandos / Pacientes
 */
export const AnalisandoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => String(v)),
  nome: z.string().min(1, 'Nome é obrigatório'),
  whatsapp: z.string().optional().default(''),
  telefone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  nascimento: z.string().optional().default(''),
  cidade: z.string().optional().default(''),
  endereco: z.string().optional().default(''),
  status: z.union([
    z.enum(['novo', 'ativo', 'recorrente', 'inativo', 'pausado', 'concluido', 'alta']),
    z.string()
  ]).optional().default('novo'),
  observacoes: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  vip: z.boolean().optional().default(false),
  criadoEm: z.string().optional(),
  horarioPreferencial: z.string().optional(),
  mensagensEnviadas: z.array(z.any()).optional().default([])
}).passthrough();

/**
 * Esquema para Modalidades de Atendimento
 */
export const ModalidadeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => String(v)),
  nome: z.string().min(1),
  preco: z.number().optional().default(0),
  valor: z.number().optional(),
  duracao: z.number().optional().default(50),
  intervaloDias: z.number().optional().default(7),
  categoria: z.string().optional().default('Análise Individual'),
  observacoes: z.string().optional().default(''),
  descricao: z.string().optional().default('')
}).passthrough().transform(m => ({
  ...m,
  preco: m.preco !== undefined ? m.preco : (m.valor || 0)
}));

/**
 * Esquema para Sessões Clínicas
 */
export const SessaoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => String(v)),
  analisandoId: z.union([z.string(), z.number()]).transform(v => String(v)),
  modalidadeId: z.union([z.string(), z.number()]).optional().transform(v => v ? String(v) : 'm1'),
  data: z.string(),
  hora: z.string().optional(),
  horario: z.string().optional(),
  valorCobrado: z.number().optional().default(0),
  valor: z.number().optional(),
  pagamentoStatus: z.union([z.enum(['pago', 'pendente', 'parcial', 'atrasado']), z.string()]).optional().default('pago'),
  meioPagamento: z.union([z.enum(['pix', 'dinheiro', 'transferencia', 'cartao']), z.string()]).optional().default('pix'),
  proximaSessaoData: z.string().optional(),
  notasSessao: z.string().optional().default(''),
  resumoIA: z.string().optional(),
  anotacoesClinicas: z.string().optional()
}).passthrough().transform(s => ({
  ...s,
  valorCobrado: s.valorCobrado !== undefined ? s.valorCobrado : (s.valor || 0),
  notasSessao: s.notasSessao || s.anotacoesClinicas || ''
}));

/**
 * Esquema para Honorários e Pagamentos
 */
export const HonorarioSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => String(v)),
  analisandoId: z.union([z.string(), z.number()]).transform(v => String(v)),
  analisandoNome: z.string().optional(),
  valor: z.number().optional().default(0),
  vencimento: z.string().optional(),
  data: z.string().optional(),
  status: z.union([z.enum(['pago', 'pendente', 'atrasado', 'cancelado']), z.string()]).optional().default('pendente'),
  observacao: z.string().optional().default(''),
  descricao: z.string().optional()
}).passthrough().transform(h => ({
  ...h,
  vencimento: h.vencimento || h.data || new Date().toISOString().slice(0, 10),
  observacao: h.observacao || h.descricao || ''
}));

/**
 * Esquema para Agendamentos
 */
export const AgendamentoSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => String(v)),
  analisandoId: z.union([z.string(), z.number()]).transform(v => String(v)),
  modalidadeId: z.union([z.string(), z.number()]).optional().transform(v => v ? String(v) : 'm1'),
  analisandoNome: z.string().optional(),
  data: z.string(),
  hora: z.string().optional(),
  horario: z.string().optional(),
  status: z.union([z.enum(['confirmado', 'pendente', 'realizado', 'cancelado']), z.string()]).optional().default('confirmado'),
  observacao: z.string().optional().default('')
}).passthrough().transform(a => ({
  ...a,
  hora: a.hora || a.horario || '09:00'
}));

/**
 * Esquema de Validação Completo para Backup JSON do PSi 4.0
 */
export const BackupPSiSchema = z.object({
  sistema: z.string().optional(),
  versao_schema: z.string().optional(),
  gerado_em: z.string().optional(),
  exportadoEm: z.string().optional(),
  analisandos: z.array(AnalisandoSchema).optional(),
  modalidades: z.array(ModalidadeSchema).optional(),
  sessoes: z.array(SessaoSchema).optional(),
  honorarios: z.array(HonorarioSchema).optional(),
  agendamentos: z.array(AgendamentoSchema).optional(),
  modelos: z.array(z.any()).optional(),
  transmissoes: z.array(z.any()).optional(),
  perfil: z.record(z.string(), z.any()).optional(),
  consultorio: z.record(z.string(), z.any()).optional(),
  usuariosRegistrados: z.array(z.object({
    usuario: z.string().min(1),
    email: z.string().optional(),
    nomeCompleto: z.string().optional(),
    crp: z.string().optional(),
    senha: z.string().optional(),
    aprovado: z.boolean().optional(),
    isAdmin: z.boolean().optional(),
    podeBaixarApp: z.boolean().optional(),
    dataSolicitacao: z.string().optional()
  }).passthrough()).optional(),
  usuarios_registrados: z.array(z.any()).optional(),
  dados: z.record(z.string(), z.any()).optional()
}).passthrough();

export function validarArquivoBackupJSON(conteudoJson: any) {
  if (!conteudoJson || typeof conteudoJson !== 'object' || Array.isArray(conteudoJson)) {
    return {
      success: false as const,
      error: new z.ZodError([{ code: 'custom', message: 'Conteúdo deve ser um objeto JSON válido', path: [] }])
    };
  }

  // Suporte a arquivos snapshot empacotados com { dados: { ... } }
  let payloadParaValidar = conteudoJson;
  if (conteudoJson && typeof conteudoJson === 'object' && conteudoJson.dados && typeof conteudoJson.dados === 'object') {
    payloadParaValidar = {
      ...conteudoJson,
      ...conteudoJson.dados
    };
  }

  // Deve possuir ao menos uma coleção clínica reconhecida
  const camposReconhecidos = ['analisandos', 'sessoes', 'honorarios', 'agendamentos', 'modalidades', 'perfil', 'consultorio'];
  const possuiAoMenosUm = camposReconhecidos.some(campo => campo in payloadParaValidar);
  if (!possuiAoMenosUm) {
    return {
      success: false as const,
      error: new z.ZodError([{ code: 'custom', message: 'O arquivo não contém nenhuma coleção clínica reconhecida (analisandos, sessões, honorários, etc.)', path: [] }])
    };
  }

  return BackupPSiSchema.safeParse(payloadParaValidar);
}


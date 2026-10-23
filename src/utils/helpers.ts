/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgendamentoClinico, SessaoClinica, Honorario, ModalidadeAtendimento } from '../types';

/**
 * Formata valor numérico para Moeda Brasileira (R$)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

/**
 * Arredonda valor monetário para 2 casas decimais seguras
 */
export function arredondarMoeda(valor: number): number {
  return Math.round((Number(valor) || 0) * 100) / 100;
}

/**
 * Formata data no padrão brasileiro DD/MM/AAAA
 */
export function formatarData(dataIso: string | undefined): string {
  if (!dataIso) return '—';
  // Trata formato YYYY-MM-DD diretamente sem desvio de fuso horário
  if (typeof dataIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataIso)) {
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora no padrão brasileiro DD/MM/AAAA às HH:mm
 */
export function formatarDataHora(dataIso: string | undefined): string {
  if (!dataIso) return '—';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '—';
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function adicionarDias(dataIso: string, dias: number): string {
  const data = new Date(dataIso);
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

export function diferencaDias(dataInicio: string, dataFim: string = new Date().toISOString()): number {
  const diffTime = new Date(dataFim).getTime() - new Date(dataInicio).getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Extrai somente dígitos numéricos
 */
export function limparDigitos(valor: string | undefined | null): string {
  if (!valor) return '';
  return valor.replace(/\D/g, '');
}

/**
 * Validação oficial de CPF por dígitos verificadores (Módulo 11)
 * CPF é opcional quando não preenchido; se fornecido, validação estrita é aplicada.
 */
export function validarCPF(cpf: string | undefined | null): boolean {
  if (!cpf) return true; // Se vazio, não viola obrigatoriedade se opcional
  const limpo = limparDigitos(cpf);
  if (limpo.length === 0) return true;
  if (limpo.length !== 11) return false;

  // Bloqueia repetições conhecidas de dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(9), 10)) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Máscara visual para CPF: 000.000.000-00
 */
export function formatarCPF(cpf: string | undefined | null): string {
  const limpo = limparDigitos(cpf).slice(0, 11);
  if (limpo.length <= 3) return limpo;
  if (limpo.length <= 6) return `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
  if (limpo.length <= 9) return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

/**
 * Máscara visual para Telefone / WhatsApp: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatarTelefone(telefone: string | undefined | null): string {
  const limpo = limparDigitos(telefone).slice(0, 11);
  if (limpo.length <= 2) return limpo;
  if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
  if (limpo.length <= 10) return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
}

/**
 * Máscara visual para CEP: 00000-000
 */
export function formatarCEP(cep: string | undefined | null): string {
  const limpo = limparDigitos(cep).slice(0, 8);
  if (limpo.length <= 5) return limpo;
  return `${limpo.slice(0, 5)}-${limpo.slice(5, 8)}`;
}

export interface ResultadoViaCEP {
  sucesso: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string; // Cidade
  uf?: string;
  complemento?: string;
  erro?: string;
}

/**
 * Consulta CEP no serviço público ViaCEP com proteção contra respostas atrasadas (AbortController / signal)
 * Preenche estritamente os campos retornados pelo serviço.
 */
export async function consultarViaCEP(cep: string, signal?: AbortSignal): Promise<ResultadoViaCEP> {
  const limpo = limparDigitos(cep);
  if (limpo.length !== 8) {
    return { sucesso: false, erro: 'CEP deve possuir exatamente 8 dígitos.' };
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal
    });

    if (!resposta.ok) {
      return { sucesso: false, erro: `Serviço ViaCEP retornou status ${resposta.status}.` };
    }

    const dados = await resposta.json();
    if (dados.erro === true || dados.erro === 'true') {
      return { sucesso: false, erro: 'CEP não encontrado na base dos Correios.' };
    }

    return {
      sucesso: true,
      logradouro: dados.logradouro || '',
      bairro: dados.bairro || '',
      localidade: dados.localidade || '',
      uf: dados.uf || '',
      complemento: dados.complemento || ''
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { sucesso: false, erro: 'Consulta cancelada por nova digitação de CEP.' };
    }
    return { sucesso: false, erro: 'Falha de conexão com o serviço de CEP. Preencha manualmente.' };
  }
}

/**
 * Verifica conflito de horário considerando início e duração em minutos
 */
export function verificarConflitoHorario(
  data: string,
  horaInicio: string,
  duracaoMin: number,
  agendamentos: AgendamentoClinico[],
  agendamentoIdIgnorar?: string
): { conflito: boolean; agendamentoConflitante?: AgendamentoClinico; mensagem?: string } {
  if (!data || !horaInicio || horaInicio === '00:00' || horaInicio === '00:00:00') {
    return { conflito: false };
  }

  const [hIni, mIni] = horaInicio.split(':').map(Number);
  if (Number.isNaN(hIni) || Number.isNaN(mIni)) return { conflito: false };
  const inicioEmMinutos = hIni * 60 + mIni;
  const fimEmMinutos = inicioEmMinutos + (duracaoMin || 50);

  // Considera apenas agendamentos ativos e com horário clínico válido (ignora cancelados, realizados e placeholders 00:00)
  const mesmoDia = agendamentos.filter(a => 
    a.data === data && 
    a.status !== 'cancelado' && 
    a.status !== 'realizado' && 
    a.id !== agendamentoIdIgnorar &&
    a.hora && 
    a.hora !== '00:00' && 
    a.hora !== '00:00:00'
  );

  for (const item of mesmoDia) {
    if (!item.hora) continue;
    const [h, m] = item.hora.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const itemInicioMin = h * 60 + m;
    const itemDuracao = item.duracaoMinutos || 50;
    const itemFimMin = itemInicioMin + itemDuracao;

    // Há sobreposição se: início do novo < fim do existente E fim do novo > início do existente
    if (inicioEmMinutos < itemFimMin && fimEmMinutos > itemInicioMin) {
      return {
        conflito: true,
        agendamentoConflitante: item,
        mensagem: `Conflito de agenda: Já existe atendimento reservado das ${item.hora} às ${String(Math.floor(itemFimMin / 60)).padStart(2, '0')}:${String(itemFimMin % 60).padStart(2, '0')} nesta mesma data.`
      };
    }
  }

  return { conflito: false };
}

/**
 * Consolidador Financeiro Único: Evita duplicidade de faturamento entre Sessões e Honorários
 * - Receita recebida inclui APENAS valores efetivamente pagos
 * - Pagamentos parciais contabilizam valor pago e saldo devedor
 * - Cobranças vencidas identificadas por vencimento < hoje e saldo > 0
 */
export function calcularMetricasFinanceiras(
  sessoes: SessaoClinica[],
  honorarios: Honorario[],
  modalidades?: ModalidadeAtendimento[]
) {
  const hojeStr = new Date().toISOString().slice(0, 10);

  // Mapeia preços de modalidades para recuperação caso valorCobrado não tenha sido salvo
  const modalidadesPrecoMap = new Map<string, number>();
  if (modalidades && Array.isArray(modalidades)) {
    for (const m of modalidades) {
      if (m.id && m.preco) modalidadesPrecoMap.set(m.id, m.preco);
    }
  }

  // Mapeia IDs de sessões que já possuem registro em honorários para não duplicar
  const sessoesVinculadas = new Set<string>();
  for (const h of honorarios) {
    if (h.sessaoId) {
      sessoesVinculadas.add(h.sessaoId);
    }
  }

  let receitaRecebida = 0;
  let saldoPendente = 0;
  let saldoVencido = 0;
  let totalCobrado = 0;
  let qtdVencidos = 0;

  // 1. Processa Sessões Clínicas
  for (const s of sessoes) {
    const valorOriginal = Number(s.valorCobrado);
    const precoModalidade = s.modalidadeId ? modalidadesPrecoMap.get(s.modalidadeId) || 0 : 0;
    const valorCobrado = arredondarMoeda(
      !isNaN(valorOriginal) && valorOriginal > 0 ? valorOriginal : precoModalidade
    );
    totalCobrado += valorCobrado;

    if (s.pagamentoStatus === 'pago') {
      receitaRecebida += valorCobrado;
    } else if (s.pagamentoStatus === 'parcial') {
      const pago = arredondarMoeda(Number(s.valorPago) || 0);
      const saldo = arredondarMoeda(s.saldoDevedor !== undefined ? Number(s.saldoDevedor) : Math.max(0, valorCobrado - pago));
      receitaRecebida += pago;
      saldoPendente += saldo;
      if (s.data < hojeStr && saldo > 0) {
        saldoVencido += saldo;
        qtdVencidos++;
      }
    } else {
      // Pendente
      saldoPendente += valorCobrado;
      if (s.data < hojeStr && valorCobrado > 0) {
        saldoVencido += valorCobrado;
        qtdVencidos++;
      }
    }
  }

  // 2. Processa Honorários Avulsos (Apenas os que NÃO possuem vínculo com sessões, evitando double-counting)
  for (const h of honorarios) {
    if (h.sessaoId && sessoesVinculadas.has(h.sessaoId)) {
      continue; // Ignora para não contar duas vezes a mesma sessão
    }

    const valorCobrado = arredondarMoeda(h.valor || 0);
    totalCobrado += valorCobrado;

    if (h.status === 'pago') {
      receitaRecebida += valorCobrado;
    } else if (h.status === 'parcial') {
      const pago = arredondarMoeda(h.valorPago || 0);
      const saldo = arredondarMoeda(h.saldoDevedor !== undefined ? h.saldoDevedor : Math.max(0, valorCobrado - pago));
      receitaRecebida += pago;
      saldoPendente += saldo;
      if (h.vencimento < hojeStr && saldo > 0) {
        saldoVencido += saldo;
        qtdVencidos++;
      }
    } else {
      // Pendente ou atrasado
      saldoPendente += valorCobrado;
      if (h.vencimento < hojeStr && valorCobrado > 0) {
        saldoVencido += valorCobrado;
        qtdVencidos++;
      }
    }
  }

  return {
    receitaRecebida: arredondarMoeda(receitaRecebida),
    saldoPendente: arredondarMoeda(saldoPendente),
    saldoVencido: arredondarMoeda(saldoVencido),
    totalCobrado: arredondarMoeda(totalCobrado),
    qtdVencidos
  };
}

export function abrirWhatsApp(telefone: string, mensagem: string): void {
  const numeroLimpo = limparDigitos(telefone);
  const textoCodificado = encodeURIComponent(mensagem);
  const url = `https://wa.me/${numeroLimpo}?text=${textoCodificado}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function substituirVariaveis(texto: string, variaveis: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (match, chave) => {
    return variaveis[chave] !== undefined ? variaveis[chave] : match;
  });
}

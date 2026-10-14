/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
}

export function formatarData(dataIso: string | undefined): string {
  if (!dataIso) return '—';
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR');
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

export function abrirWhatsApp(telefone: string, mensagem: string): void {
  const numeroLimpo = telefone.replace(/\D/g, '');
  const textoCodificado = encodeURIComponent(mensagem);
  const url = `https://wa.me/${numeroLimpo}?text=${textoCodificado}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function substituirVariaveis(texto: string, variaveis: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (match, chave) => {
    return variaveis[chave] !== undefined ? variaveis[chave] : match;
  });
}

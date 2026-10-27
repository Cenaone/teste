/**
 * Converte valor numérico em reais (BRL) para texto por extenso em Português do Brasil.
 * Essencial para recibos clínicos oficiais e conformidade contábil.
 */

const UNIDADES = [
  '', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'
];

const DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
];

const CENTENAS = [
  '', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'
];

function converterAte999(num: number): string {
  if (num === 0) return '';
  if (num === 100) return 'cem';
  if (num < 20) return UNIDADES[num];
  if (num < 100) {
    const d = Math.floor(num / 10);
    const u = num % 10;
    return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`;
  }
  const c = Math.floor(num / 100);
  const resto = num % 100;
  if (resto === 0) return CENTENAS[c];
  return `${CENTENAS[c]} e ${converterAte999(resto)}`;
}

export function numeroPorExtenso(valor: number): string {
  if (!valor || isNaN(valor) || valor <= 0) return 'zero reais';

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let partes: string[] = [];

  // Milhares (até 999.999)
  if (inteiro >= 1000) {
    const milhares = Math.floor(inteiro / 1000);
    const restoMil = inteiro % 1000;
    const textoMilhar = milhares === 1 ? 'um mil' : `${converterAte999(milhares)} mil`;

    if (restoMil === 0) {
      partes.push(textoMilhar);
    } else if (restoMil <= 100 || restoMil % 100 === 0) {
      partes.push(`${textoMilhar} e ${converterAte999(restoMil)}`);
    } else {
      partes.push(`${textoMilhar}, ${converterAte999(restoMil)}`);
    }
  } else if (inteiro > 0) {
    partes.push(converterAte999(inteiro));
  }

  // Moeda (reais / real)
  let textoReais = '';
  if (inteiro > 0) {
    textoReais = `${partes.join('')} ${inteiro === 1 ? 'real' : 'reais'}`;
  }

  // Centavos
  let textoCentavos = '';
  if (centavos > 0) {
    const centExtenso = converterAte999(centavos);
    textoCentavos = `${centExtenso} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  }

  if (textoReais && textoCentavos) {
    return `${textoReais} e ${textoCentavos}`;
  }
  if (textoReais) {
    return textoReais;
  }
  if (textoCentavos) {
    return textoCentavos;
  }

  return 'zero reais';
}

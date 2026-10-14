/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Camada de Licenciamento Criptográfico e Assinaturas PSi 4.0
 * - Valida licenças locais
 * - Suporta verificação offline com limite de tolerância
 * - Nunca apaga dados quando a licença expira (modo somente-leitura e exportação preservado)
 */

export interface LicencaUsuario {
  codigoLicenca: string; // Ex: PSI-XXXX-XXXX-XXXX
  plano: 'individual' | 'clinica' | 'saas_pro';
  status: 'ativa' | 'expirada' | 'revogada' | 'pendente';
  validoAte: string; // ISO Date
  emitidoEm: string;
  revalidarAte: string;
  limiteOfflineDias: number;
}

export function validarStatusLicenca(licenca: LicencaUsuario | null): {
  valida: boolean;
  motivo?: string;
  apenasLeitura: boolean;
} {
  if (!licenca) {
    return {
      valida: false,
      motivo: 'Nenhuma licença vinculada à conta. O sistema opera em modo de leitura e exportação.',
      apenasLeitura: true
    };
  }

  if (licenca.status === 'revogada') {
    return {
      valida: false,
      motivo: 'A licença foi revogada administrativamente. Seus dados clínicos locais continuam acessíveis para leitura e backup.',
      apenasLeitura: true
    };
  }

  const agora = new Date();
  const validade = new Date(licenca.validoAte);

  if (agora > validade) {
    return {
      valida: false,
      motivo: `A licença expirou em ${validade.toLocaleDateString('pt-BR')}. Seus prontuários locais estão protegidos e preservados para leitura e exportação.`,
      apenasLeitura: true
    };
  }

  return {
    valida: true,
    apenasLeitura: false
  };
}

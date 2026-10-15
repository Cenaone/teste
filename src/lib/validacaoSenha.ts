/**
 * Utilitário de validação de complexidade e segurança de senhas.
 * Requisitos:
 * - Mínimo de 8 caracteres
 * - Letras maiúsculas e minúsculas
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 * - Confirmação idêntica à nova senha
 */

export interface RequisitoSenha {
  id: string;
  label: string;
  atendido: boolean;
}

export interface ResultadoValidacaoSenha {
  valida: boolean;
  requisitos: RequisitoSenha[];
  erro?: string;
}

export function validarComplexidadeSenha(senha: string): ResultadoValidacaoSenha {
  const requisitos: RequisitoSenha[] = [
    {
      id: 'min8',
      label: 'Mínimo de 8 caracteres',
      atendido: (senha || '').length >= 8
    },
    {
      id: 'maiuscula',
      label: 'Pelo menos uma letra maiúscula (A-Z)',
      atendido: /[A-Z]/.test(senha || '')
    },
    {
      id: 'minuscula',
      label: 'Pelo menos uma letra minúscula (a-z)',
      atendido: /[a-z]/.test(senha || '')
    },
    {
      id: 'numero',
      label: 'Pelo menos um número (0-9)',
      atendido: /[0-9]/.test(senha || '')
    },
    {
      id: 'especial',
      label: 'Pelo menos um caractere especial (!@#$%^&*...)',
      atendido: /[^A-Za-z0-9]/.test(senha || '')
    }
  ];

  const valida = requisitos.every(r => r.atendido);

  let erro: string | undefined;
  if (!requisitos[0].atendido) erro = 'A senha deve conter no mínimo 8 caracteres.';
  else if (!requisitos[1].atendido) erro = 'A senha deve conter pelo menos uma letra maiúscula (A-Z).';
  else if (!requisitos[2].atendido) erro = 'A senha deve conter pelo menos uma letra minúscula (a-z).';
  else if (!requisitos[3].atendido) erro = 'A senha deve conter pelo menos um número (0-9).';
  else if (!requisitos[4].atendido) erro = 'A senha deve conter pelo menos um caractere especial (!@#$%...).';

  return { valida, requisitos, erro };
}

export function validarConfirmacaoSenha(senha: string, confirmacao: string): { valida: boolean; erro?: string } {
  if (!confirmacao) {
    return { valida: false, erro: 'Por favor, confirme a nova senha.' };
  }
  if (senha !== confirmacao) {
    return { valida: false, erro: 'A confirmação de senha não coincide com a nova senha digitada.' };
  }
  return { valida: true };
}

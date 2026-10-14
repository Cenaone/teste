/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gerenciador de Backup Criptografado do PSi 4.0
 * - Valida versão de formato e integridade estrutural via Zod
 * - Associa identificador do cofre / conta (sem expor segredos ou tokens)
 * - Exclui senhas, tokens de autenticação ou chaves brutas
 * - Suporta restauração transacional com escolha explícita (mesclar vs substituir)
 */

import { z } from 'zod';
import { ChaveiroCofre, encriptarConteudo, descriptografarConteudo, PacoteCriptografado } from './crypto';
import { BackupPSiSchema, validarArquivoBackupJSON } from './schemas';

export const FORMATO_BACKUP_VERSAO = '4.0.3-encrypted';

export interface ArquivoBackupCriptografado {
  sistema: 'PSi 4.0';
  formato: typeof FORMATO_BACKUP_VERSAO;
  geradoEm: string;
  accountId: string;
  accountEmail?: string;
  pacoteCriptografado: PacoteCriptografado;
  checksum: string; // Hash SHA-256 do payload para garantir integridade
}

export interface OpcoesRestauracao {
  modo: 'substituir' | 'mesclar';
}

/**
 * Calcula o checksum SHA-256 de uma string para verificação de integridade.
 */
async function calcularChecksumSHA256(texto: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = enc.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera um arquivo de backup seguro e criptografado para exportação.
 */
export async function exportarBackupCriptografado(
  accountId: string,
  accountEmail: string | undefined,
  dadosClinicos: Record<string, any>,
  chaveiro: ChaveiroCofre
): Promise<ArquivoBackupCriptografado> {
  // Limpeza de campos sensíveis de autenticação antes de empacotar
  const dadosHigienizados: Record<string, any> = { ...dadosClinicos };
  delete dadosHigienizados.senha;
  delete dadosHigienizados.token;
  delete dadosHigienizados.access_token;
  delete dadosHigienizados.refresh_token;

  if (Array.isArray(dadosHigienizados.usuariosRegistrados)) {
    dadosHigienizados.usuariosRegistrados = dadosHigienizados.usuariosRegistrados.map((u: any) => {
      const clone = { ...u };
      delete clone.senha;
      delete clone.codigoRecuperacao;
      return clone;
    });
  }

  const pacote = await encriptarConteudo(chaveiro, dadosHigienizados);
  const checksum = await calcularChecksumSHA256(pacote.ciphertext);

  return {
    sistema: 'PSi 4.0',
    formato: FORMATO_BACKUP_VERSAO,
    geradoEm: new Date().toISOString(),
    accountId,
    accountEmail: accountEmail || undefined,
    pacoteCriptografado: pacote,
    checksum
  };
}

/**
 * Descriptografa e restaura um backup com verificação de integridade e schema.
 */
export async function importarBackupCriptografado(
  backupBruto: any,
  chaveiro: ChaveiroCofre
): Promise<{ ok: boolean; dados?: any; mensagem: string }> {
  if (!backupBruto || typeof backupBruto !== 'object') {
    return { ok: false, mensagem: 'Arquivo de backup inválido ou ilegível.' };
  }

  // 1. Caso seja o formato novo criptografado
  if (backupBruto.formato === FORMATO_BACKUP_VERSAO && backupBruto.pacoteCriptografado) {
    const checksumVerificado = await calcularChecksumSHA256(backupBruto.pacoteCriptografado.ciphertext);
    if (checksumVerificado !== backupBruto.checksum) {
      return { ok: false, mensagem: 'Falha na verificação de integridade: o arquivo de backup foi adulterado ou corrompido.' };
    }

    try {
      const conteudoDescriptografado = await descriptografarConteudo(chaveiro, backupBruto.pacoteCriptografado);
      const validacao = validarArquivoBackupJSON(conteudoDescriptografado);

      if (!validacao.success) {
        return { ok: false, mensagem: `Dados do backup não atendem ao schema clínico: ${validacao.error.issues[0]?.message}` };
      }

      return {
        ok: true,
        dados: validacao.data,
        mensagem: 'Backup criptografado verificado e descriptografado com sucesso!'
      };
    } catch (err: any) {
      return { ok: false, mensagem: `Não foi possível descriptografar o backup. Verifique se o cofre atual corresponde à mesma chave de criptografia.` };
    }
  }

  // 2. Caso seja um arquivo JSON legado com estrutura aberta
  const validacaoLegada = validarArquivoBackupJSON(backupBruto);
  if (validacaoLegada.success) {
    return {
      ok: true,
      dados: validacaoLegada.data,
      mensagem: 'Backup legado em JSON verificado com sucesso!'
    };
  }

  return {
    ok: false,
    mensagem: `Arquivo não reconhecido ou schema incompatível: ${validacaoLegada.error?.issues[0]?.message || 'Estrutura desconhecida'}`
  };
}

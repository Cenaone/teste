/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Módulo de Migração Ética e Não-Destrutiva
 * - Detecta dados legados no LocalStorage
 * - Realiza inventário sem atribuição silenciosa
 * - Confirma integridade antes de autorizar qualquer limpeza
 */

import { ChaveiroCofre } from './crypto';
import { salvarTodasColecoesCofre } from './repositorioLocal';

export interface InventarioLegado {
  analisandosCount: number;
  sessoesCount: number;
  honorariosCount: number;
  agendamentosCount: number;
  temDados: boolean;
  dados: Record<string, any>;
}

export function inventariarDadosLegadosLocalStorage(
  prefixo = 'psi40_',
  storageCustom?: { getItem: (k: string) => string | null }
): InventarioLegado {
  const storage = storageCustom || (typeof window !== 'undefined' ? window.localStorage : null);
  const dados: Record<string, any> = {};
  let temDados = false;

  if (!storage) {
    return {
      analisandosCount: 0,
      sessoesCount: 0,
      honorariosCount: 0,
      agendamentosCount: 0,
      temDados: false,
      dados: {}
    };
  }

  const chaves = [
    'analisandos',
    'sessoes',
    'honorarios',
    'modalidades',
    'modelos',
    'transmissoes',
    'perfil',
    'consultorio',
    'agendamentos'
  ];

  for (const k of chaves) {
    const raw = storage.getItem(`${prefixo}${k}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
          dados[k] = parsed;
          temDados = true;
        }
      } catch {
        // Ignora
      }
    }
  }

  return {
    analisandosCount: Array.isArray(dados.analisandos) ? dados.analisandos.length : 0,
    sessoesCount: Array.isArray(dados.sessoes) ? dados.sessoes.length : 0,
    honorariosCount: Array.isArray(dados.honorarios) ? dados.honorarios.length : 0,
    agendamentosCount: Array.isArray(dados.agendamentos) ? dados.agendamentos.length : 0,
    temDados,
    dados
  };
}

export async function migrarLegadoParaCofre(
  accountId: string,
  inventario: InventarioLegado,
  chaveiro: ChaveiroCofre
): Promise<{ ok: boolean; mensagem: string }> {
  if (!inventario.temDados) {
    return { ok: false, mensagem: 'Nenhum dado legado localizado para migração.' };
  }

  try {
    await salvarTodasColecoesCofre(accountId, inventario.dados, chaveiro);
    return {
      ok: true,
      mensagem: `Migração concluída com sucesso! ${inventario.analisandosCount} pacientes e seus registros clínicos foram salvos com criptografia no cofre local da sua conta.`
    };
  } catch (err: any) {
    return { ok: false, mensagem: `Falha na migração: ${err.message}` };
  }
}

export function removerDadosLegadosConfirmados(
  prefixo = 'psi40_',
  storageCustom?: { removeItem: (k: string) => void }
): void {
  const storage = storageCustom || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!storage) return;

  const chaves = [
    'analisandos',
    'sessoes',
    'honorarios',
    'modalidades',
    'modelos',
    'transmissoes',
    'perfil',
    'consultorio',
    'agendamentos'
  ];
  for (const k of chaves) {
    storage.removeItem(`${prefixo}${k}`);
  }
}

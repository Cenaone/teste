/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Camada Oficial de Repositório Local (IndexedDB com Isolamento por ID de Conta)
 * - Isola todos os registros pela UUID imutável da conta Supabase
 * - Bloqueia operações se a identidade da conta não estiver definida
 * - Confirma gravações pelo término da transação IndexedDB
 * - Trata error, abort, blocked e versionchange
 * - Encripta conteúdos confidenciais com AES-GCM
 * - Suporta migrações e controle de versão de banco
 */

import { ChaveiroCofre, PacoteCriptografado, encriptarConteudo, descriptografarConteudo } from './crypto';

const DB_NOME = 'psi40_local_vault';
const DB_VERSAO = 1;

export interface MetadadosCofre {
  accountId: string; // UUID imutável da conta Supabase
  vaultSalt: string;
  vaultHash: string;
  criadoEm: string;
  atualizadoEm: string;
  revisao: number;
}

export interface RegistroCofre {
  id: string; // Chave primária: `${accountId}:${colecao}` ou `${accountId}:${colecao}:${itemId}`
  accountId: string;
  colecao: string;
  itemId?: string;
  encryptedPayload: PacoteCriptografado;
  revisao: number;
  atualizadoEm: string;
}

let dbInstancia: IDBDatabase | null = null;

/**
 * Abre e gerencia a conexão do banco IndexedDB com tratamento de versionchange e blocked.
 */
export async function obterBancoIndexedDB(): Promise<IDBDatabase> {
  if (dbInstancia) return dbInstancia;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NOME, DB_VERSAO);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;

      // Store de metadados do cofre por conta (salts, hash para validação, revisões)
      if (!db.objectStoreNames.contains('cofre_meta')) {
        db.createObjectStore('cofre_meta', { keyPath: 'accountId' });
      }

      // Store principal de registros clínicos criptografados
      if (!db.objectStoreNames.contains('registros_clinicos')) {
        const store = db.createObjectStore('registros_clinicos', { keyPath: 'id' });
        store.createIndex('by_account_colecao', ['accountId', 'colecao'], { unique: false });
        store.createIndex('by_account', 'accountId', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstancia = request.result;

      dbInstancia.onversionchange = () => {
        dbInstancia?.close();
        dbInstancia = null;
        console.warn('[IndexedDB] Conexão encerrada devido a alteração de versão em outra aba.');
      };

      resolve(dbInstancia);
    };

    request.onerror = () => {
      reject(new Error(`Falha ao abrir IndexedDB: ${request.error?.message}`));
    };

    request.onblocked = () => {
      console.warn('[IndexedDB] Operação bloqueada. Feche outras abas do PSi 4.0 para continuar.');
      reject(new Error('Abertura do banco bloqueada por outra aba ativa.'));
    };
  });
}

/**
 * Salva ou recupera os metadados do cofre local de uma conta.
 */
export async function salvarMetadadosCofre(meta: MetadadosCofre): Promise<boolean> {
  if (!meta.accountId) throw new Error('ID imutável da conta é obrigatório.');

  const db = await obterBancoIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cofre_meta', 'readwrite');
    const store = tx.objectStore('cofre_meta');
    store.put(meta);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(new Error(`Erro ao salvar metadados do cofre: ${tx.error?.message}`));
    tx.onabort = () => reject(new Error('Transação de metadados abortada.'));
  });
}

export async function carregarMetadadosCofre(accountId: string): Promise<MetadadosCofre | null> {
  if (!accountId) throw new Error('ID imutável da conta é obrigatório.');

  const db = await obterBancoIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cofre_meta', 'readonly');
    const store = tx.objectStore('cofre_meta');
    const request = store.get(accountId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error(`Erro ao ler metadados: ${request.error?.message}`));
  });
}

/**
 * Salva uma coleção clínica completa de forma atômica e criptografada no IndexedDB da conta.
 */
export async function salvarColecaoCofre(
  accountId: string,
  colecao: string,
  dados: any,
  chaveiro: ChaveiroCofre
): Promise<boolean> {
  if (!accountId || accountId.trim() === '') {
    throw new Error('Operação bloqueada: ID imutável da conta não definido.');
  }
  if (!chaveiro || !chaveiro.cryptoKey) {
    throw new Error('Operação bloqueada: Cofre local bloqueado ou chaveiro ausente.');
  }

  const encrypted = await encriptarConteudo(chaveiro, dados);
  const db = await obterBancoIndexedDB();
  const idChave = `${accountId}:${colecao}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros_clinicos', 'readwrite');
    const store = tx.objectStore('registros_clinicos');

    const registro: RegistroCofre = {
      id: idChave,
      accountId,
      colecao,
      encryptedPayload: encrypted,
      revisao: Date.now(),
      atualizadoEm: new Date().toISOString()
    };

    store.put(registro);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(new Error(`Falha ao gravar coleção ${colecao}: ${tx.error?.message}`));
    tx.onabort = () => reject(new Error(`Gravação da coleção ${colecao} abortada.`));
  });
}

/**
 * Lê e descriptografa uma coleção clínica do cofre local.
 * Retorna null se não houver dados, lança erro se corrompido ou erro de chave.
 */
export async function carregarColecaoCofre(
  accountId: string,
  colecao: string,
  chaveiro: ChaveiroCofre
): Promise<any | null> {
  if (!accountId || accountId.trim() === '') {
    throw new Error('Operação bloqueada: ID imutável da conta não definido.');
  }
  if (!chaveiro || !chaveiro.cryptoKey) {
    throw new Error('Operação bloqueada: Cofre local bloqueado ou chaveiro ausente.');
  }

  const db = await obterBancoIndexedDB();
  const idChave = `${accountId}:${colecao}`;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros_clinicos', 'readonly');
    const store = tx.objectStore('registros_clinicos');
    const request = store.get(idChave);

    request.onsuccess = async () => {
      const registro: RegistroCofre = request.result;
      if (!registro || !registro.encryptedPayload) {
        resolve(null);
        return;
      }

      try {
        const decriptado = await descriptografarConteudo(chaveiro, registro.encryptedPayload);
        resolve(decriptado);
      } catch (err: any) {
        reject(new Error(`Falha ao descriptografar coleção '${colecao}': ${err.message}`));
      }
    };

    request.onerror = () => reject(new Error(`Erro ao ler coleção ${colecao}: ${request.error?.message}`));
  });
}

/**
 * Carrega todas as coleções clínicas de uma conta específica do cofre local.
 */
export async function carregarTodasColecoesCofre(
  accountId: string,
  chaveiro: ChaveiroCofre
): Promise<Record<string, any>> {
  if (!accountId || accountId.trim() === '') {
    throw new Error('Operação bloqueada: ID da conta ausente.');
  }

  const db = await obterBancoIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros_clinicos', 'readonly');
    const store = tx.objectStore('registros_clinicos');
    const index = store.index('by_account');
    const request = index.getAll(accountId);

    request.onsuccess = async () => {
      const registros: RegistroCofre[] = request.result || [];
      const resultado: Record<string, any> = {};

      try {
        for (const reg of registros) {
          if (reg && reg.colecao && reg.encryptedPayload) {
            resultado[reg.colecao] = await descriptografarConteudo(chaveiro, reg.encryptedPayload);
          }
        }
        resolve(resultado);
      } catch (err: any) {
        reject(new Error(`Erro ao descriptografar cofre: ${err.message}`));
      }
    };

    request.onerror = () => reject(new Error(`Falha na consulta ao banco: ${request.error?.message}`));
  });
}

/**
 * Salva todas as coleções clínicas em uma única transação atômica.
 */
export async function salvarTodasColecoesCofre(
  accountId: string,
  dados: Record<string, any>,
  chaveiro: ChaveiroCofre
): Promise<boolean> {
  if (!accountId || accountId.trim() === '') {
    throw new Error('Operação bloqueada: ID da conta ausente.');
  }

  const db = await obterBancoIndexedDB();

  // Encripta todas as coleções primeiro
  const registros: RegistroCofre[] = [];
  const agora = new Date().toISOString();
  const rev = Date.now();

  for (const [colecao, conteudo] of Object.entries(dados)) {
    const enc = await encriptarConteudo(chaveiro, conteudo);
    registros.push({
      id: `${accountId}:${colecao}`,
      accountId,
      colecao,
      encryptedPayload: enc,
      revisao: rev,
      atualizadoEm: agora
    });
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction('registros_clinicos', 'readwrite');
    const store = tx.objectStore('registros_clinicos');

    for (const reg of registros) {
      store.put(reg);
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(new Error(`Falha na transação atômica do cofre: ${tx.error?.message}`));
    tx.onabort = () => reject(new Error('Transação do cofre abortada.'));
  });
}

/**
 * Limpa com segurança as coleções clínicas locais de uma conta do IndexedDB (por exemplo, ao solicitar reset local).
 */
export async function expurgarColecoesContaCofre(accountId: string): Promise<boolean> {
  if (!accountId) return false;
  const db = await obterBancoIndexedDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['registros_clinicos', 'cofre_meta'], 'readwrite');
    const store = tx.objectStore('registros_clinicos');
    const index = store.index('by_account');
    const requestKeys = index.getAllKeys(accountId);

    requestKeys.onsuccess = () => {
      const keys = requestKeys.result || [];
      for (const k of keys) {
        store.delete(k);
      }
      tx.objectStore('cofre_meta').delete(accountId);
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(new Error(`Erro ao limpar cofre da conta: ${tx.error?.message}`));
  });
}

/**
 * Consulta a cota de armazenamento e estimativa do navegador.
 */
export async function consultarCotaArmazenamento(): Promise<{
  suportado: boolean;
  usadoBytes: number;
  totalBytes: number;
  percentualUsado: number;
  persistido: boolean;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const persistido = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const usadoBytes = estimate.usage || 0;
      const totalBytes = estimate.quota || 0;
      const percentualUsado = totalBytes > 0 ? (usadoBytes / totalBytes) * 100 : 0;

      return {
        suportado: true,
        usadoBytes,
        totalBytes,
        percentualUsado,
        persistido
      };
    } catch {
      // Fallback
    }
  }

  return {
    suportado: false,
    usadoBytes: 0,
    totalBytes: 0,
    percentualUsado: 0,
    persistido: false
  };
}

/**
 * Solicita persistência durável ao navegador (navigator.storage.persist).
 */
export async function solicitarArmazenamentoPersistente(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

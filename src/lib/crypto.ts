/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Camada Criptográfica Local com Web Crypto API (AES-GCM 256-bit + PBKDF2)
 * Garante que o cofre local seja desbloqueado apenas com a senha do cofre mantida em memória.
 * Nenhuma chave descriptografada ou senha é persistida no disco/IndexedDB/localStorage.
 */

export interface ChaveiroCofre {
  cryptoKey: CryptoKey;
  salt: Uint8Array;
}

export interface PacoteCriptografado {
  iv: string; // Base64
  salt: string; // Base64
  ciphertext: string; // Base64
  version: number;
}

const ITERATIONS_PBKDF2 = 100_000;
const HASH_ALG = 'SHA-256';
const KEY_LENGTH_BITS = 256;
const CIPHER_VERSION = 1;

// Utilitários de codificação Base64 seguros
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Deriva uma CryptoKey AES-GCM a partir da senha do cofre usando PBKDF2.
 */
export async function derivarChaveCofre(senha: string, saltExistente?: Uint8Array): Promise<ChaveiroCofre> {
  const enc = new TextEncoder();
  const senhaBuffer = enc.encode(senha);

  const salt = saltExistente || crypto.getRandomValues(new Uint8Array(16));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    senhaBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS_PBKDF2,
      hash: HASH_ALG
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false, // Não exportável
    ['encrypt', 'decrypt']
  );

  return { cryptoKey, salt };
}

/**
 * Encripta qualquer objeto ou string com AES-GCM usando novo IV a cada operação.
 */
export async function encriptarConteudo(
  chaveiro: ChaveiroCofre,
  dados: any
): Promise<PacoteCriptografado> {
  const enc = new TextEncoder();
  const jsonString = typeof dados === 'string' ? dados : JSON.stringify(dados);
  const dadosBuffer = enc.encode(jsonString);

  // IV aleatório único de 12 bytes (96 bits) por operação
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    chaveiro.cryptoKey,
    dadosBuffer
  );

  return {
    version: CIPHER_VERSION,
    iv: bufferToBase64(iv),
    salt: bufferToBase64(chaveiro.salt),
    ciphertext: bufferToBase64(ciphertextBuffer)
  };
}

/**
 * Descriptografa um pacote encriptado. Lança erro se a chave/senha estiver incorreta ou dados corrompidos.
 */
export async function descriptografarConteudo(
  chaveiro: ChaveiroCofre,
  pacote: PacoteCriptografado
): Promise<any> {
  if (!pacote || !pacote.iv || !pacote.ciphertext) {
    throw new Error('Pacote criptográfico incompleto ou inválido.');
  }

  const iv = base64ToBuffer(pacote.iv);
  const ciphertext = base64ToBuffer(pacote.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    chaveiro.cryptoKey,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonString = dec.decode(decryptedBuffer);

  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
}

/**
 * Cria um verificador de senha (hash criptográfico seguro com salt) para validação rápida de senha de cofre sem guardar texto claro.
 */
export async function gerarVerificadorCofre(senha: string): Promise<{ salt: string; hash: string }> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(senha),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS_PBKDF2,
      hash: HASH_ALG
    },
    baseKey,
    256
  );

  return {
    salt: bufferToBase64(salt),
    hash: bufferToBase64(bits)
  };
}

export async function validarSenhaCofre(senha: string, saltBase64: string, hashEsperado: string): Promise<boolean> {
  const enc = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(senha),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS_PBKDF2,
      hash: HASH_ALG
    },
    baseKey,
    256
  );

  const hashCalculado = bufferToBase64(bits);
  return hashCalculado === hashEsperado;
}

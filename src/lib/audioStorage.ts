/**
 * Armazenamento local persistente de áudios de sessão em IndexedDB (com cache em memória)
 * para que gravações e arquivos importados continuem reproduzíveis no Prontuário
 * mesmo após limpar o formulário ou recarregar o navegador.
 */

const DB_AUDIOS_NOME = 'psi40_audios_locais';
const DB_AUDIOS_VERSAO = 1;
const STORE_AUDIOS = 'audios';

export const PREFIXO_AUDIO_LOCAL = 'idb://audio/';

const audiosEmMemoria = new Map<string, Blob>();
let dbAudiosPromise: Promise<IDBDatabase> | null = null;

function abrirBancoAudios(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponível neste ambiente.'));
  }
  if (dbAudiosPromise) return dbAudiosPromise;

  dbAudiosPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_AUDIOS_NOME, DB_AUDIOS_VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_AUDIOS)) {
        db.createObjectStore(STORE_AUDIOS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbAudiosPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbAudiosPromise = null;
      reject(new Error(req.error?.message || 'Erro ao abrir banco local de áudios.'));
    };
  });

  return dbAudiosPromise;
}

export function montarReferenciaAudioLocal(sessaoId: string): string {
  return `${PREFIXO_AUDIO_LOCAL}${sessaoId}`;
}

export function extrairSessaoIdDeReferenciaAudio(audioUrl?: string | null, fallbackSessaoId?: string): string | null {
  if (audioUrl && audioUrl.startsWith(PREFIXO_AUDIO_LOCAL)) {
    return audioUrl.slice(PREFIXO_AUDIO_LOCAL.length) || fallbackSessaoId || null;
  }
  return fallbackSessaoId || null;
}

/**
 * Registra imediatamente o Blob em memória e retorna a referência persistente `idb://audio/<sessaoId>`.
 */
export function registrarAudioEmMemoria(sessaoId: string, blob: Blob): string {
  audiosEmMemoria.set(sessaoId, blob);
  return montarReferenciaAudioLocal(sessaoId);
}

/**
 * Persiste o Blob de áudio da sessão no IndexedDB (e em cache de memória).
 */
export async function salvarAudioSessaoLocal(
  sessaoId: string,
  blob: Blob,
  accountId?: string | null
): Promise<string> {
  const referencia = registrarAudioEmMemoria(sessaoId, blob);
  try {
    const db = await abrirBancoAudios();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIOS, 'readwrite');
      const store = tx.objectStore(STORE_AUDIOS);
      store.put({
        id: sessaoId,
        accountId: accountId || 'local',
        mimeType: blob.type || 'audio/webm',
        tamanho: blob.size,
        atualizadoEm: new Date().toISOString(),
        blob
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Falha ao gravar áudio no IndexedDB.'));
      tx.onabort = () => reject(new Error('Transação de gravação de áudio abortada.'));
    });
  } catch (err) {
    console.warn('[AudioStorage] Falha ao gravar áudio no IndexedDB (mantido em memória):', err);
  }
  return referencia;
}

/**
 * Recupera o Blob de áudio salvo para a sessão (cache em memória ou IndexedDB).
 */
export async function carregarAudioSessaoLocal(sessaoId: string): Promise<Blob | null> {
  const emMemoria = audiosEmMemoria.get(sessaoId);
  if (emMemoria) return emMemoria;

  try {
    const db = await abrirBancoAudios();
    const registro = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIOS, 'readonly');
      const store = tx.objectStore(STORE_AUDIOS);
      const req = store.get(sessaoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Erro ao ler áudio do IndexedDB.'));
    });

    if (registro?.blob instanceof Blob) {
      audiosEmMemoria.set(sessaoId, registro.blob);
      return registro.blob;
    }
    return null;
  } catch (err) {
    console.warn('[AudioStorage] Falha ao recuperar áudio do IndexedDB:', err);
    return null;
  }
}

export async function excluirAudioSessaoLocal(sessaoId: string): Promise<void> {
  audiosEmMemoria.delete(sessaoId);
  try {
    const db = await abrirBancoAudios();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIOS, 'readwrite');
      tx.objectStore(STORE_AUDIOS).delete(sessaoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Erro ao excluir áudio.'));
    });
  } catch (_) {}
}

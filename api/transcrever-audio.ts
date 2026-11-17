import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
const MAX_AUDIO = 3 * 1024 * 1024;

type Request = IncomingMessage & { body?: any };
type Dependencies = {
  autenticar: (token: string) => Promise<boolean>;
  transcrever: (audio: string, mime: string) => Promise<string>;
  pontuarTexto?: (texto: string) => Promise<string>;
};

export function criarHandler(deps: Dependencies) {
  return async (req: Request, res: ServerResponse) => {
    const t0 = Date.now();
    res.setHeader('Cache-Control', 'no-store');
    const responder = (status: number, dados: object, erroCodigo?: string) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(dados));
      if (status >= 400) {
        console.error('[transcricao_api]', {
          etapa: 'requisicao',
          duracaoMs: Date.now() - t0,
          status,
          erroCodigo: erroCodigo || (dados as any).erro?.slice(0, 40)
        });
      }
    };

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return responder(405, { ok: false, erro: 'Utilize POST para transcrever áudio.' }, 'METODO_NAO_PERMITIDO');
    }

    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) {
      return responder(401, { ok: false, erro: 'Entre novamente para transcrever o áudio.' }, 'TOKEN_AUSENTE');
    }

    try {
      if (!await deps.autenticar(token)) {
        return responder(401, { ok: false, erro: 'Sessão inválida. Entre novamente.' }, 'SESSAO_INVALIDA');
      }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {
          return responder(400, { ok: false, erro: 'Requisição inválida.' }, 'JSON_INVALIDO');
        }
      }

      if (body?.acao === 'pontuar_texto') {
        const textoBruto = typeof body?.texto === 'string' ? body.texto.trim() : '';
        if (!textoBruto || textoBruto.length > 150000) {
          return responder(400, { ok: false, erro: 'Texto inválido ou muito longo para pontuação.' }, 'TEXTO_INVALIDO');
        }
        if (!deps.pontuarTexto) {
          return responder(501, { ok: false, erro: 'Pontuação de texto não configurada.' }, 'RECURSO_INDISPONIVEL');
        }
        const textoOrganizado = (await deps.pontuarTexto(textoBruto)).trim();
        if (!textoOrganizado) {
          return responder(422, { ok: false, erro: 'Não foi possível organizar o texto informado.' }, 'TRANSCRICAO_VAZIA');
        }
        return responder(200, { ok: true, transcricao: textoOrganizado });
      }

      const audio = body?.audioBase64;
      const mime = typeof body?.mimeType === 'string' ? body.mimeType.split(';')[0].toLowerCase() : '';
      const formatos: Record<string, string> = {
        'audio/webm': 'audio/webm', 'audio/ogg': 'audio/ogg', 'audio/mp4': 'audio/mp4',
        'audio/m4a': 'audio/mp4', 'audio/x-m4a': 'audio/mp4', 'audio/mpeg': 'audio/mp3',
        'audio/mp3': 'audio/mp3', 'audio/wav': 'audio/wav', 'audio/x-wav': 'audio/wav',
        'audio/aac': 'audio/aac', 'audio/flac': 'audio/flac'
      };

      if (!formatos[mime]) {
        return responder(400, { ok: false, erro: 'Formato de áudio não suportado.' }, 'FORMATO_INVALIDO');
      }

      if (typeof audio !== 'string' || !audio || audio.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) {
        return responder(400, { ok: false, erro: 'Áudio inválido ou vazio.' }, 'BASE64_INVALIDO');
      }

      if (audio.length > Math.ceil(MAX_AUDIO / 3) * 4 || Buffer.from(audio, 'base64').length > MAX_AUDIO) {
        return responder(413, { ok: false, erro: 'O trecho de áudio excede 3 MB para transcrição nesta rota. Utilize processamento em trechos.' }, 'PAYLOAD_EXCEDIDO');
      }

      const transcricao = (await deps.transcrever(audio, formatos[mime])).trim();
      if (!transcricao) {
        return responder(422, { ok: false, erro: 'Não foi obtida uma transcrição. Tente novamente com fala audível.' }, 'TRANSCRICAO_VAZIA');
      }

      console.info('[transcricao_api]', {
        etapa: 'concluido',
        duracaoMs: Date.now() - t0,
        status: 200
      });

      return responder(200, { ok: true, transcricao });
    } catch (erro: any) {
      const status = Number(erro?.status || erro?.code || erro?.error?.code);
      const mensagemErro = String(erro?.message || '');
      const msgLower = mensagemErro.toLowerCase();
      const isTimeout = erro?.name === 'AbortError' ||
        erro?.code === 20 ||
        status === 504 ||
        msgLower.includes('aborted') ||
        msgLower.includes('timeout') ||
        msgLower.includes('deadline');
      const isKeyInvalid = status === 401 ||
        status === 403 ||
        mensagemErro.includes('API_KEY_INVALID') ||
        mensagemErro.includes('PERMISSION_DENIED') ||
        msgLower.includes('api key not valid');

      if (isTimeout) {
        return responder(504, { ok: false, erro: 'Tempo limite de transcrição excedido (timeout). Tente novamente.' }, 'TIMEOUT');
      }
      if (erro?.message === 'CONFIGURACAO_SUPABASE_AUSENTE') {
        return responder(503, { ok: false, erro: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY na Vercel para validar a sessão.' }, 'CONFIG_SUPABASE_AUSENTE');
      }
      if (erro?.message === 'CONFIGURACAO_AUSENTE') {
        return responder(503, { ok: false, erro: 'Serviço de transcrição não configurado. Configure GEMINI_API_KEY nas variáveis de ambiente e publique novamente.' }, 'CONFIG_GEMINI_AUSENTE');
      }
      if (status === 429 || mensagemErro.includes('RESOURCE_EXHAUSTED')) {
        return responder(429, { ok: false, erro: 'Limite do serviço de transcrição atingido. Tente novamente mais tarde.' }, 'QUOTA_EXCEDIDA');
      }
      if (isKeyInvalid) {
        return responder(502, { ok: false, erro: 'A chave do serviço de transcrição foi recusada ou é inválida. Verifique GEMINI_API_KEY nas configurações.' }, 'CHAVE_RECUSADA');
      }
      if (status === 404 || mensagemErro.includes('NOT_FOUND')) {
        return responder(502, { ok: false, erro: 'O modelo de transcrição configurado não está disponível para esta chave. Verifique GEMINI_TRANSCRIPTION_MODEL ou a permissão da chave.' }, 'MODELO_INDISPONIVEL');
      }
      console.error('[transcricao_api] Falha do provedor:', { status: Number.isFinite(status) ? status : undefined, mensagem: mensagemErro.slice(0, 200) });
      return responder(502, { ok: false, erro: 'O serviço de transcrição não respondeu corretamente. O áudio continua disponível para tentar novamente ou baixar.' }, 'ERRO_PROVEDOR');
    }
  };
}

const handler = criarHandler({
  async autenticar(token) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rkbvbmhhkllafijipwey.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYnZibWhoa2xsYWZpamlwd2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk0MjcsImV4cCI6MjEwNzU2NTQyN30._t4wVKIgdUor5nPmoWEj4z0z2xb9BRUAp6XQeyuZ0mw';
    if (!url || !key) throw new Error('CONFIGURACAO_SUPABASE_AUSENTE');
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.getUser(token);
    return !error && Boolean(data.user);
  },
  async transcrever(audio, mime) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('CONFIGURACAO_AUSENTE');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 25000,
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Modelos ativos oficiais ordenados por adequação para transcrição de áudio pré-gravado
    const modelos = [...new Set([
      process.env.GEMINI_TRANSCRIPTION_MODEL,
      'gemini-3.5-transcribe',
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite'
    ].filter(Boolean) as string[])];

    let ultimoErro: any = null;
    for (const modelo of modelos) {
      try {
        const result = await ai.models.generateContent({
          model: modelo,
          contents: { parts: [
            { inlineData: { data: audio, mimeType: mime } },
            { text: 'Transcreva fielmente o diálogo deste áudio em português do Brasil, com pontuação e parágrafos. Não invente falas, não faça análises e retorne somente a transcrição. Se não houver fala compreensível, retorne texto vazio.' }
          ] }
        });
        return (result.text || '').trim();
      } catch (err: any) {
        ultimoErro = err;
        const code = Number(err?.status || err?.code || err?.error?.code);
        const msg = String(err?.message || '');
        console.warn(`[transcricao_api] Modelo ${modelo} falhou (status ${code}):`, msg || err);
        // Se a chave for recusada ou inválida, não adianta tentar outros modelos
        if (code === 401 || code === 403 || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
          throw err;
        }
        continue;
      }
    }
    if (ultimoErro) {
      throw ultimoErro;
    }
    return '';
  },
  async pontuarTexto(textoBruto) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('CONFIGURACAO_AUSENTE');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 25000,
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const modelos = ['gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
    let ultimoErro: any = null;
    for (const modelo of modelos) {
      try {
        const result = await ai.models.generateContent({
          model: modelo,
          contents: `Você é um revisor de transcrição clínica em português do Brasil. O texto abaixo foi transcrito automaticamente sem pontuação. Apenas adicione pontuação, letras maiúsculas, acentuação corrigida quando óbvia e quebras de parágrafo naturais, SEM inventar palavras, SEM resumir e SEM fazer análises clínicas. Retorne somente o texto revisado:\n\n${textoBruto}`
        });
        return (result.text || '').trim();
      } catch (err: any) {
        ultimoErro = err;
        const code = Number(err?.status || err?.code || err?.error?.code);
        const msg = String(err?.message || '');
        if (code === 401 || code === 403 || msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED')) {
          throw err;
        }
      }
    }
    if (ultimoErro) throw ultimoErro;
    return textoBruto;
  }
});
export default handler;

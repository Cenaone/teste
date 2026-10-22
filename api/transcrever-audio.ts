import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;
const MAX_AUDIO = 3 * 1024 * 1024;

type Request = IncomingMessage & { body?: any };
type Dependencies = {
  autenticar: (token: string) => Promise<boolean>;
  transcrever: (audio: string, mime: string) => Promise<string>;
};

export function criarHandler(deps: Dependencies) {
  return async (req: Request, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    const responder = (status: number, dados: object) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(dados));
    };
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return responder(405, { ok: false, erro: 'Utilize POST para transcrever áudio.' });
    }
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return responder(401, { ok: false, erro: 'Entre novamente para transcrever o áudio.' });
    try {
      if (!await deps.autenticar(token)) return responder(401, { ok: false, erro: 'Sessão inválida. Entre novamente.' });
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { return responder(400, { ok: false, erro: 'Requisição inválida.' }); }
      }
      const audio = body?.audioBase64;
      const mime = typeof body?.mimeType === 'string' ? body.mimeType.split(';')[0].toLowerCase() : '';
      const formatos: Record<string, string> = {
        'audio/webm': 'audio/webm', 'audio/ogg': 'audio/ogg', 'audio/mp4': 'audio/mp4',
        'audio/m4a': 'audio/mp4', 'audio/x-m4a': 'audio/mp4', 'audio/mpeg': 'audio/mp3',
        'audio/mp3': 'audio/mp3', 'audio/wav': 'audio/wav', 'audio/x-wav': 'audio/wav',
        'audio/aac': 'audio/aac', 'audio/flac': 'audio/flac'
      };
      if (!formatos[mime]) return responder(400, { ok: false, erro: 'Formato de áudio não suportado.' });
      if (typeof audio !== 'string' || !audio || audio.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) {
        return responder(400, { ok: false, erro: 'Áudio inválido ou vazio.' });
      }
      if (audio.length > Math.ceil(MAX_AUDIO / 3) * 4 || Buffer.from(audio, 'base64').length > MAX_AUDIO) {
        return responder(413, { ok: false, erro: 'O áudio excede 3 MB para transcrição nesta rota. Utilize um trecho menor. A gravação permanece disponível para download.' });
      }
      const transcricao = (await deps.transcrever(audio, formatos[mime])).trim();
      if (!transcricao) return responder(422, { ok: false, erro: 'Não foi obtida uma transcrição. Tente novamente com fala audível.' });
      return responder(200, { ok: true, transcricao });
    } catch (erro: any) {
      const status = Number(erro?.status || erro?.code);
      if (erro?.message === 'CONFIGURACAO_SUPABASE_AUSENTE') return responder(503, { ok: false, erro: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY na Vercel para validar a sessão.' });
      if (erro?.message === 'CONFIGURACAO_AUSENTE') return responder(503, { ok: false, erro: 'Serviço de transcrição não configurado. Configure GEMINI_API_KEY na Vercel e publique novamente.' });
      if (status === 429) return responder(429, { ok: false, erro: 'Limite do serviço de transcrição atingido. Tente novamente mais tarde.' });
      if (status === 401 || status === 403) return responder(502, { ok: false, erro: 'A chave do serviço de transcrição foi recusada. Verifique a configuração na Vercel.' });
      return responder(502, { ok: false, erro: 'O serviço de transcrição não respondeu corretamente. O áudio continua disponível para tentar novamente ou baixar.' });
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
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 45000 } });
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_TRANSCRIPTION_MODEL || 'gemini-3.8-flash',
      contents: { parts: [
        { inlineData: { data: audio, mimeType: mime } },
        { text: 'Transcreva fielmente o diálogo deste áudio em português do Brasil, com pontuação e parágrafos. Não invente falas, não faça análises e retorne somente a transcrição. Se não houver fala compreensível, retorne texto vazio.' }
      ] }
    });
    return result.text || '';
  }
});
export default handler;

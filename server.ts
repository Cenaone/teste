import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Permite payload de áudio de até 100MB
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Endpoint de transcrição de áudio gravado sob demanda
  app.post('/api/transcrever-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ ok: false, erro: 'Áudio não fornecido para transcrição.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ ok: false, erro: 'Chave GEMINI_API_KEY não configurada no servidor.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioBase64
                }
              },
              {
                text: 'Você é um assistente de transcrição clínica em psicologia e psicanálise. Transcreva de forma fidedigna, completa e clara todo o diálogo deste áudio de sessão terapêutica em português do Brasil. Preserve as falas dos participantes com pontuação adequada e parágrafos estruturados. Retorne apenas o texto transcrito.'
              }
            ]
          }
        ]
      });

      const transcricao = response.text?.trim() || '';
      return res.json({ ok: true, transcricao });
    } catch (err: any) {
      console.error('[API /api/transcrever-audio erro]:', err);
      return res.status(500).json({ 
        ok: false, 
        erro: err?.message || 'Erro ao processar a transcrição do áudio.' 
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`PSi 4.0 Server rodando na porta ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});

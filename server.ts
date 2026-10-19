import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rkbvbmhhkllafijipwey.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrYnZibWhoa2xsYWZpamlwd2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5ODk0MjcsImV4cCI6MjEwNzU2NTQyN30._t4wVKIgdUor5nPmoWEj4z0z2xb9BRUAp6XQeyuZ0mw';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();

  // Permite payload de áudio e dados de até 100MB
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Endpoint 1: Transcrição de áudio gravado sob demanda
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

function isMasterAdminServer(email?: string): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return e === 'backupvideomidias@gmail.com' || e === 'sup.fin.adm@gmail.com';
}

  // Endpoint 2: Alternar status de acesso de usuário com sincronização imediata no Supabase
  app.post('/api/admin/alternar-status', async (req, res) => {
    try {
      const { userId, novoStatus } = req.body;
      if (!userId || !novoStatus) {
        return res.status(400).json({ ok: false, erro: 'userId e novoStatus são obrigatórios.' });
      }

      // Protege Administradores Master de desativação
      const { data: usuarioAlvo } = await supabaseAdmin.from('usuarios').select('email').eq('id', userId).maybeSingle();
      if (usuarioAlvo?.email && isMasterAdminServer(usuarioAlvo.email) && novoStatus !== 'ativo') {
        return res.status(400).json({ ok: false, erro: 'A conta de Administrador Geral Master não pode ser desativada.' });
      }

      const agora = new Date().toISOString();
      const statusAssinatura = novoStatus === 'ativo' ? 'ativa' : novoStatus === 'pendente' ? 'pendente' : 'inativa';

      // 1. Invoca RPC segura no PostgreSQL
      try {
        await supabaseAdmin.rpc('admin_alternar_status_usuario', {
          p_user_id: userId,
          p_novo_status: novoStatus
        });
      } catch (errRpc) {
        console.warn('[RPC admin_alternar_status_usuario notice]:', errRpc);
      }

      // 2. Atualiza diretamente a tabela usuarios
      await supabaseAdmin
        .from('usuarios')
        .update({
          status: novoStatus,
          atualizado_em: agora
        })
        .eq('id', userId);

      // 3. Atualiza ou insere na tabela assinaturas_saas
      await supabaseAdmin
        .from('assinaturas_saas')
        .upsert({
          user_id: userId,
          status: statusAssinatura,
          atualizado_em: agora
        }, { onConflict: 'user_id' });

      return res.json({
        ok: true,
        status: novoStatus,
        mensagem: `Status do assinante atualizado para ${novoStatus} no Supabase com sucesso.`
      });
    } catch (err: any) {
      console.error('[POST /api/admin/alternar-status erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao alternar status do usuário' });
    }
  });

  // Endpoint 3: Sincronização forçada completa de todos os usuários entre o app e o Supabase
  app.post('/api/admin/sincronizar-usuarios', async (req, res) => {
    try {
      const { usuariosLocais } = req.body;
      const agora = new Date().toISOString();

      if (Array.isArray(usuariosLocais) && usuariosLocais.length > 0) {
        for (const u of usuariosLocais) {
          if (u.id && u.email) {
            try {
              const isMaster = isMasterAdminServer(u.email);
              const statusReal = isMaster ? 'ativo' : (u.status || 'ativo');
              const roleReal = isMaster ? 'admin' : (u.role || 'psicologo');
              const statusAss = isMaster ? 'ativa' : (u.status === 'ativo' ? 'ativa' : u.status === 'pendente' ? 'pendente' : 'inativa');
              const planoReal = isMaster ? 'saas_pro' : (u.plano || 'mensal');
              const validadeReal = isMaster
                ? '2036-12-31T23:59:59.000Z'
                : (u.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

              await supabaseAdmin.from('usuarios').upsert({
                id: u.id,
                email: u.email,
                nome: u.nomeCompleto || u.nome || u.email.split('@')[0],
                crp: u.crp || null,
                telefone: u.telefone || null,
                role: roleReal,
                status: statusReal,
                senha_texto: u.senhaTexto || null,
                atualizado_em: agora
              }, { onConflict: 'id' });

              await supabaseAdmin.from('assinaturas_saas').upsert({
                user_id: u.id,
                status: statusAss,
                plano: planoReal,
                valido_ate: validadeReal,
                atualizado_em: agora
              }, { onConflict: 'user_id' });
            } catch (errUpsert) {
              console.warn('[sincronizar-usuarios upsert notice]:', errUpsert);
            }
          }
        }
      }

      // Obtém dados remotos consolidados
      const { data: usuariosRemotos } = await supabaseAdmin.from('usuarios').select('*');
      const { data: assinaturasRemotas } = await supabaseAdmin.from('assinaturas_saas').select('*');

      return res.json({
        ok: true,
        usuarios: usuariosRemotos || [],
        assinaturas: assinaturasRemotas || [],
        sincronizadoEm: agora
      });
    } catch (err: any) {
      console.error('[POST /api/admin/sincronizar-usuarios erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao sincronizar usuários' });
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

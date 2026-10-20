import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
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
        model: 'gemini-2.5-flash',
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

const ARQUIVO_USUARIOS_SERVER = path.resolve(__dirname, 'usuarios_saas.json');

const CONTAS_MASTER_PADRAO = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    email: 'backupvideomidias@gmail.com',
    senhaTexto: 'Daniel12345',
    nomeCompleto: 'Administrador Master',
    crp: '06/123456',
    role: 'admin',
    status: 'ativo',
    plano: 'saas_pro',
    validoAte: '2036-12-31T23:59:59.000Z',
    criadoEm: '2026-10-14T12:00:00.000Z',
    origem: 'local_resiliente'
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002',
    email: 'sup.fin.adm@gmail.com',
    senhaTexto: 'Daniel12345',
    nomeCompleto: 'Administrador Suporte',
    crp: '06/654321',
    role: 'admin',
    status: 'ativo',
    plano: 'saas_pro',
    validoAte: '2036-12-31T23:59:59.000Z',
    criadoEm: '2026-10-14T12:00:00.000Z',
    origem: 'local_resiliente'
  }
];

function carregarUsuariosServidor(): any[] {
  try {
    if (fs.existsSync(ARQUIVO_USUARIOS_SERVER)) {
      const conteudo = fs.readFileSync(ARQUIVO_USUARIOS_SERVER, 'utf-8');
      const dados = JSON.parse(conteudo);
      if (Array.isArray(dados) && dados.length > 0) {
        // Garante que os master admins estejam sempre presentes e ativos
        for (const m of CONTAS_MASTER_PADRAO) {
          const idx = dados.findIndex(u => u.email?.toLowerCase() === m.email.toLowerCase());
          if (idx >= 0) {
            dados[idx].role = 'admin';
            dados[idx].status = 'ativo';
          } else {
            dados.unshift(m);
          }
        }
        return dados;
      }
    }
  } catch (err) {
    console.warn('[carregarUsuariosServidor]:', err);
  }
  return [...CONTAS_MASTER_PADRAO];
}

function salvarUsuariosServidor(lista: any[]): void {
  try {
    fs.writeFileSync(ARQUIVO_USUARIOS_SERVER, JSON.stringify(lista, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[salvarUsuariosServidor]:', err);
  }
}

  // Endpoint: Cadastro de novo usuário com inclusão no banco e status pendente para aprovação do master
  app.post('/api/auth/registrar-usuario', async (req, res) => {
    try {
      const { id, email, nomeCompleto, crp, telefone, senha } = req.body;
      if (!email) {
        return res.status(400).json({ ok: false, erro: 'E-mail é obrigatório para cadastro.' });
      }

      const emailClean = email.trim().toLowerCase();
      const isMaster = isMasterAdminServer(emailClean);
      const agora = new Date().toISOString();
      const userId = id || `u_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const novoUsuario = {
        id: userId,
        email: emailClean,
        nomeCompleto: nomeCompleto || emailClean.split('@')[0],
        crp: crp || null,
        telefone: telefone || null,
        senhaTexto: senha || null,
        role: isMaster ? 'admin' : 'psicologo',
        status: isMaster ? 'ativo' : 'pendente',
        plano: isMaster ? 'saas_pro' : 'mensal',
        validoAte: isMaster
          ? '2036-12-31T23:59:59.000Z'
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        criadoEm: agora,
        atualizadoEm: agora,
        origem: 'registro_servidor'
      };

      // 1. Salva no banco de dados persistente do servidor
      const lista = carregarUsuariosServidor();
      const idx = lista.findIndex(u => u.email?.toLowerCase() === emailClean);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...novoUsuario };
      } else {
        lista.push(novoUsuario);
      }
      salvarUsuariosServidor(lista);

      // 2. Sincroniza imediatamente com o Supabase
      try {
        await supabaseAdmin.from('usuarios').upsert({
          id: userId,
          email: emailClean,
          nome: novoUsuario.nomeCompleto,
          crp: novoUsuario.crp,
          telefone: novoUsuario.telefone,
          role: novoUsuario.role,
          status: novoUsuario.status,
          senha_texto: novoUsuario.senhaTexto,
          atualizado_em: agora
        }, { onConflict: 'id' });

        await supabaseAdmin.from('assinaturas_saas').upsert({
          user_id: userId,
          status: isMaster ? 'ativa' : 'pendente',
          plano: novoUsuario.plano,
          valido_ate: novoUsuario.validoAte,
          atualizado_em: agora
        }, { onConflict: 'user_id' });
      } catch (errDb) {
        console.warn('[registrar-usuario Supabase sync notice]:', errDb);
      }

      console.log(`[REGISTRO] Novo usuário registrado: ${emailClean} (status: ${novoUsuario.status})`);

      return res.json({
        ok: true,
        usuario: novoUsuario,
        mensagem: isMaster
          ? 'Administrador Master ativo.'
          : 'Cadastro realizado com sucesso! Sua conta está aguardando ativação pelo Administrador Master.'
      });
    } catch (err: any) {
      console.error('[POST /api/auth/registrar-usuario erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao registrar usuário' });
    }
  });

  // Endpoint: Consulta status em tempo real do usuário para validação no login
  app.get('/api/auth/status-usuario', async (req, res) => {
    try {
      const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
      const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

      if (!email && !userId) {
        return res.status(400).json({ ok: false, erro: 'Informe email ou userId.' });
      }

      const lista = carregarUsuariosServidor();
      const u = lista.find(item => 
        (email && item.email?.toLowerCase() === email) || 
        (userId && item.id === userId)
      );

      if (!u) {
        return res.json({ ok: false, encontrado: false, status: 'desconhecido' });
      }

      return res.json({
        ok: true,
        encontrado: true,
        id: u.id,
        email: u.email,
        nomeCompleto: u.nomeCompleto,
        role: u.role,
        status: u.status,
        plano: u.plano,
        validoAte: u.validoAte
      });
    } catch (err: any) {
      console.error('[GET /api/auth/status-usuario erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message });
    }
  });

  // Endpoint: Listagem consolidada de todos os usuários para o painel de aprovação do master
  app.get('/api/admin/listar-usuarios', async (_req, res) => {
    try {
      const mapa = new Map<string, any>();

      // 1. Carrega do banco persistente local do servidor
      const usuariosLocais = carregarUsuariosServidor();
      for (const u of usuariosLocais) {
        if (u.id) mapa.set(u.id, { ...u });
        if (u.email) mapa.set(u.email.toLowerCase(), { ...u });
      }

      // 2. Tenta enriquecer com dados do Supabase
      try {
        const { data: remotos } = await supabaseAdmin.from('usuarios').select('*');
        if (Array.isArray(remotos)) {
          for (const u of remotos) {
            const email = (u.email || '').toLowerCase();
            const existente = mapa.get(u.id) || (email ? mapa.get(email) : undefined);
            const isMaster = isMasterAdminServer(email);

            const item = {
              id: u.id,
              email: u.email || existente?.email || '',
              nomeCompleto: u.nome || existente?.nomeCompleto || email.split('@')[0],
              crp: u.crp || existente?.crp,
              telefone: u.telefone || existente?.telefone,
              senhaTexto: u.senha_texto || existente?.senhaTexto,
              role: isMaster ? 'admin' : (u.role || existente?.role || 'psicologo'),
              status: isMaster ? 'ativo' : (u.status || existente?.status || 'pendente'),
              plano: isMaster ? 'saas_pro' : (existente?.plano || 'mensal'),
              validoAte: isMaster
                ? '2036-12-31T23:59:59.000Z'
                : (existente?.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
              criadoEm: u.criado_em || existente?.criadoEm || new Date().toISOString(),
              origem: 'supabase'
            };

            mapa.set(u.id, item);
            if (email) mapa.set(email, item);
          }
        }
      } catch (errDb) {
        console.warn('[listar-usuarios Supabase notice]:', errDb);
      }

      // Deduplica por id
      const resultado: any[] = [];
      const idsVistos = new Set<string>();
      for (const item of mapa.values()) {
        if (!idsVistos.has(item.id)) {
          idsVistos.add(item.id);
          resultado.push(item);
        }
      }

      salvarUsuariosServidor(resultado);

      return res.json({ ok: true, usuarios: resultado });
    } catch (err: any) {
      console.error('[GET /api/admin/listar-usuarios erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao listar usuários' });
    }
  });

  // Endpoint: Aprovação de usuário pendente pelo Administrador Master
  app.post('/api/admin/aprovar-usuario', async (req, res) => {
    try {
      const { userId, email, diasValidade = 30, plano = 'mensal', adminEmail } = req.body;
      if (!userId && !email) {
        return res.status(400).json({ ok: false, erro: 'userId ou email é obrigatório.' });
      }

      const agora = new Date().toISOString();
      const emailAlvo = email ? email.trim().toLowerCase() : '';

      // 1. Atualiza no armazenamento persistente do servidor
      const lista = carregarUsuariosServidor();
      let idx = lista.findIndex(u => (userId && u.id === userId) || (emailAlvo && u.email?.toLowerCase() === emailAlvo));
      
      // Validade calculada a contar da data de cadastro do usuário (criadoEm)
      const dataCadastroStr = idx >= 0 ? lista[idx].criadoEm : agora;
      const msCadastro = dataCadastroStr ? new Date(dataCadastroStr).getTime() : Date.now();
      let validadeMs = msCadastro + Number(diasValidade) * 24 * 60 * 60 * 1000;
      // Garante que não resulte em período já vencido se o cadastro foi realizado há mais tempo
      if (validadeMs < Date.now()) {
        validadeMs = Date.now() + Number(diasValidade) * 24 * 60 * 60 * 1000;
      }
      const validade = new Date(validadeMs).toISOString();

      let usuarioAtualizado = null;
      if (idx >= 0) {
        lista[idx].status = 'ativo';
        lista[idx].plano = plano;
        lista[idx].validoAte = validade;
        lista[idx].aprovadoEm = agora;
        lista[idx].aprovadoPor = adminEmail || 'Administrador Master';
        lista[idx].atualizadoEm = agora;
        usuarioAtualizado = lista[idx];
      } else {
        usuarioAtualizado = {
          id: userId || `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: emailAlvo || '',
          nomeCompleto: emailAlvo ? emailAlvo.split('@')[0] : 'Assinante',
          role: 'psicologo',
          status: 'ativo',
          plano,
          validoAte: validade,
          aprovadoEm: agora,
          aprovadoPor: adminEmail || 'Administrador Master',
          criadoEm: agora,
          atualizadoEm: agora,
          origem: 'aprovacao_servidor'
        };
        lista.push(usuarioAtualizado);
      }
      salvarUsuariosServidor(lista);

      const targetId = usuarioAtualizado.id;

      // 2. Invoca RPC do Supabase se disponível
      try {
        await supabaseAdmin.rpc('admin_aprovar_usuario', {
          p_user_id: targetId,
          p_dias_validade: Number(diasValidade),
          p_plano: plano,
          p_admin_email: adminEmail || 'Administrador Master'
        });
      } catch (_) {}

      // 3. Atualiza diretamente em public.usuarios e public.assinaturas_saas
      try {
        await supabaseAdmin
          .from('usuarios')
          .update({ status: 'ativo', atualizado_em: agora })
          .eq('id', targetId);

        await supabaseAdmin
          .from('assinaturas_saas')
          .upsert({
            user_id: targetId,
            status: 'ativa',
            plano: plano,
            valido_ate: validade,
            atualizado_em: agora
          }, { onConflict: 'user_id' });
      } catch (errDb) {
        console.warn('[aprovar-usuario Supabase sync notice]:', errDb);
      }

      console.log(`[APROVAÇÃO] Usuário ${targetId} (${usuarioAtualizado.email}) aprovado por ${diasValidade} dias a contar do cadastro.`);

      return res.json({
        ok: true,
        usuario: usuarioAtualizado,
        mensagem: `Usuário aprovado e ativado com sucesso! Acesso concedido por ${diasValidade} dias a contar da data do cadastro.`
      });
    } catch (err: any) {
      console.error('[POST /api/admin/aprovar-usuario erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao aprovar usuário' });
    }
  });

  // Endpoint: Renovar assinatura adicionando dias (+30, +60, +90 dias sucessivamente)
  app.post('/api/admin/renovar-assinatura', async (req, res) => {
    try {
      const { userId, email, diasAdicionais = 30 } = req.body;
      if (!userId && !email) {
        return res.status(400).json({ ok: false, erro: 'userId ou email é obrigatório.' });
      }

      const emailAlvo = email ? email.trim().toLowerCase() : '';
      const lista = carregarUsuariosServidor();
      let idx = lista.findIndex(u => (userId && u.id === userId) || (emailAlvo && u.email?.toLowerCase() === emailAlvo));
      if (idx < 0) {
        return res.status(404).json({ ok: false, erro: 'Usuário não encontrado.' });
      }

      const u = lista[idx];
      const agora = new Date().toISOString();
      const msAtualValidade = u.validoAte ? new Date(u.validoAte).getTime() : 0;
      // Se a validade ainda está no futuro, adiciona a partir de validoAte; caso contrário, conta a partir de agora
      const baseMs = msAtualValidade > Date.now() ? msAtualValidade : Date.now();
      const novaValidadeMs = baseMs + Number(diasAdicionais) * 24 * 60 * 60 * 1000;
      const novaValidade = new Date(novaValidadeMs).toISOString();

      lista[idx].validoAte = novaValidade;
      lista[idx].status = 'ativo';
      lista[idx].atualizadoEm = agora;
      salvarUsuariosServidor(lista);

      try {
        await supabaseAdmin.from('usuarios').update({ status: 'ativo', atualizado_em: agora }).eq('id', u.id);
        await supabaseAdmin.from('assinaturas_saas').upsert({
          user_id: u.id,
          status: 'ativa',
          valido_ate: novaValidade,
          atualizado_em: agora
        }, { onConflict: 'user_id' });
      } catch (_) {}

      return res.json({
        ok: true,
        usuario: lista[idx],
        novaValidade,
        mensagem: `Assinatura estendida por mais ${diasAdicionais} dias com sucesso! Válida até ${new Date(novaValidade).toLocaleDateString('pt-BR')}.`
      });
    } catch (err: any) {
      console.error('[POST /api/admin/renovar-assinatura erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao renovar assinatura' });
    }
  });

  // Endpoint: Alternar status de acesso de usuário (Ativar / Desativar / Bloquear)
  app.post('/api/admin/alternar-status', async (req, res) => {
    try {
      const { userId, email, novoStatus } = req.body;
      if ((!userId && !email) || !novoStatus) {
        return res.status(400).json({ ok: false, erro: 'Informe userId/email e novoStatus.' });
      }

      const emailAlvo = email ? email.trim().toLowerCase() : '';
      const lista = carregarUsuariosServidor();
      let idx = lista.findIndex(u => (userId && u.id === userId) || (emailAlvo && u.email?.toLowerCase() === emailAlvo));
      const usuarioAlvo = idx >= 0 ? lista[idx] : null;

      // Protege Administradores Master de desativação
      if (usuarioAlvo?.email && isMasterAdminServer(usuarioAlvo.email) && novoStatus !== 'ativo') {
        return res.status(400).json({ ok: false, erro: 'A conta de Administrador Geral Master não pode ser desativada.' });
      }

      const agora = new Date().toISOString();
      const statusAssinatura = novoStatus === 'ativo' ? 'ativa' : novoStatus === 'pendente' ? 'pendente' : 'inativa';

      // 1. Atualiza no banco persistente do servidor imediatamente
      let targetId = userId;
      if (idx >= 0) {
        lista[idx].status = novoStatus;
        lista[idx].atualizadoEm = agora;
        targetId = lista[idx].id;
        salvarUsuariosServidor(lista);
      } else if (emailAlvo) {
        targetId = userId || `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        lista.push({
          id: targetId,
          email: emailAlvo,
          nomeCompleto: emailAlvo.split('@')[0],
          role: 'psicologo',
          status: novoStatus,
          plano: 'mensal',
          validoAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          criadoEm: agora,
          atualizadoEm: agora,
          origem: 'status_servidor'
        });
        salvarUsuariosServidor(lista);
      }

      // 2. Invoca RPC segura no PostgreSQL do Supabase
      if (targetId) {
        try {
          await supabaseAdmin.rpc('admin_alternar_status_usuario', {
            p_user_id: targetId,
            p_novo_status: novoStatus
          });
        } catch (errRpc) {
          console.warn('[RPC admin_alternar_status_usuario notice]:', errRpc);
        }

        // 3. Atualiza diretamente a tabela usuarios no Supabase
        try {
          await supabaseAdmin
            .from('usuarios')
            .update({
              status: novoStatus,
              atualizado_em: agora
            })
            .eq('id', targetId);

          await supabaseAdmin
            .from('assinaturas_saas')
            .upsert({
              user_id: targetId,
              status: statusAssinatura,
              atualizado_em: agora
            }, { onConflict: 'user_id' });
        } catch (errDb) {
          console.warn('[alternar-status Supabase sync notice]:', errDb);
        }
      }

      console.log(`[STATUS] Usuário ${targetId} (${emailAlvo}) atualizado para status '${novoStatus}'`);

      return res.json({
        ok: true,
        status: novoStatus,
        mensagem: `Status do assinante atualizado para '${novoStatus}' com sucesso no banco de dados.`
      });
    } catch (err: any) {
      console.error('[POST /api/admin/alternar-status erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao alternar status do usuário' });
    }
  });

  // Endpoint: Atualizar dados de perfil e assinatura de usuário
  app.post('/api/admin/atualizar-usuario', async (req, res) => {
    try {
      const { userId, email, dados } = req.body;
      if (!userId && !email) {
        return res.status(400).json({ ok: false, erro: 'userId ou email é obrigatório.' });
      }

      const agora = new Date().toISOString();
      const emailAlvo = email ? email.trim().toLowerCase() : '';
      const lista = carregarUsuariosServidor();
      const idx = lista.findIndex(u => (userId && u.id === userId) || (emailAlvo && u.email?.toLowerCase() === emailAlvo));

      if (idx >= 0) {
        lista[idx] = {
          ...lista[idx],
          ...(dados.nome ? { nomeCompleto: dados.nome } : {}),
          ...(dados.crp !== undefined ? { crp: dados.crp } : {}),
          ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
          ...(dados.role ? { role: dados.role } : {}),
          ...(dados.status ? { status: dados.status } : {}),
          ...(dados.plano ? { plano: dados.plano } : {}),
          ...(dados.validoAte ? { validoAte: dados.validoAte } : {}),
          ...(dados.senha ? { senhaTexto: dados.senha } : {}),
          atualizadoEm: agora
        };
        salvarUsuariosServidor(lista);

        const targetId = lista[idx].id;
        try {
          await supabaseAdmin.from('usuarios').update({
            ...(dados.nome ? { nome: dados.nome } : {}),
            ...(dados.crp !== undefined ? { crp: dados.crp } : {}),
            ...(dados.telefone !== undefined ? { telefone: dados.telefone } : {}),
            ...(dados.role ? { role: dados.role } : {}),
            ...(dados.status ? { status: dados.status } : {}),
            ...(dados.senha ? { senha_texto: dados.senha } : {}),
            atualizado_em: agora
          }).eq('id', targetId);
        } catch (_) {}

        return res.json({ ok: true, usuario: lista[idx], mensagem: 'Usuário atualizado com sucesso no banco de dados.' });
      }

      return res.status(404).json({ ok: false, erro: 'Usuário não encontrado para atualização.' });
    } catch (err: any) {
      console.error('[POST /api/admin/atualizar-usuario erro]:', err);
      return res.status(500).json({ ok: false, erro: err?.message || 'Erro ao atualizar dados do usuário' });
    }
  });

  // Endpoint: Sincronização forçada completa de todos os usuários
  app.post('/api/admin/sincronizar-usuarios', async (req, res) => {
    try {
      const { usuariosLocais } = req.body;
      const agora = new Date().toISOString();
      const listaAtual = carregarUsuariosServidor();

      if (Array.isArray(usuariosLocais) && usuariosLocais.length > 0) {
        for (const u of usuariosLocais) {
          if (u.id && u.email) {
            const isMaster = isMasterAdminServer(u.email);
            const statusReal = isMaster ? 'ativo' : (u.status || 'ativo');
            const roleReal = isMaster ? 'admin' : (u.role || 'psicologo');
            const statusAss = isMaster ? 'ativa' : (u.status === 'ativo' ? 'ativa' : u.status === 'pendente' ? 'pendente' : 'inativa');
            const planoReal = isMaster ? 'saas_pro' : (u.plano || 'mensal');
            const validadeReal = isMaster
              ? '2036-12-31T23:59:59.000Z'
              : (u.validoAte || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

            const idx = listaAtual.findIndex(item => item.id === u.id || item.email?.toLowerCase() === u.email.toLowerCase());
            if (idx >= 0) {
              listaAtual[idx] = { ...listaAtual[idx], ...u, status: statusReal, role: roleReal, atualizadoEm: agora };
            } else {
              listaAtual.push({ ...u, status: statusReal, role: roleReal, criadoEm: agora, atualizadoEm: agora });
            }

            try {
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
        salvarUsuariosServidor(listaAtual);
      }

      return res.json({
        ok: true,
        usuarios: listaAtual,
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

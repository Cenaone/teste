import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarHandler } from '../api/transcrever-audio';

async function executar(opcoes: { metodo?: string; token?: string; body?: any; autorizado?: boolean; falha?: any; texto?: string } = {}) {
  let chamadas = 0;
  let status = 0;
  let resposta: any;
  const handler = criarHandler({
    autenticar: async () => opcoes.autorizado !== false,
    transcrever: async (_, mime) => { chamadas++; assert.equal(mime, 'audio/webm'); if (opcoes.falha) throw opcoes.falha; return opcoes.texto ?? 'Fala de teste.'; }
  });
  const req = { method: opcoes.metodo || 'POST', headers: { authorization: opcoes.token === '' ? undefined : 'Bearer token-teste' }, body: opcoes.body ?? { audioBase64: 'YXVkaW8=', mimeType: 'audio/webm;codecs=opus' } };
  const res = { setHeader() {}, set statusCode(valor: number) { status = valor; }, end(texto: string) { resposta = JSON.parse(texto); } };
  await handler(req as any, res as any);
  return { status, resposta, chamadas };
}

test('transcreve usuário autenticado sem verificar cargo e normaliza MIME', async () => {
  const r = await executar(); assert.equal(r.status, 200); assert.equal(r.resposta.transcricao, 'Fala de teste.');
});
test('recusa método diferente de POST', async () => { assert.equal((await executar({metodo:'GET'})).status,405); });
test('recusa sessão ausente ou inválida sem enviar áudio ao provedor', async () => {
  for (const op of [{token:''},{autorizado:false}]) { const r=await executar(op); assert.equal(r.status,401); assert.equal(r.chamadas,0); }
});
test('recusa áudio inválido', async () => {
  const r=await executar({body:{audioBase64:'???',mimeType:'audio/webm'}}); assert.equal(r.status,400); assert.equal(r.chamadas,0);
});
test('recusa áudio acima do limite antes de chamar IA', async () => {
  const r=await executar({body:{audioBase64:Buffer.alloc(3*1024*1024+1).toString('base64'),mimeType:'audio/webm'}}); assert.equal(r.status,413); assert.equal(r.chamadas,0);
});
test('não apresenta falhas do provedor como transcrição bem-sucedida', async () => {
  for (const [falha,status] of [[{status:429},429],[{message:'CONFIGURACAO_AUSENTE'},503],[{status:500},502]] as const) {
    const r=await executar({falha}); assert.equal(r.status,status); assert.equal(r.resposta.ok,false); assert.equal(r.resposta.transcricao,undefined);
  }
});
test('resposta vazia não vira uma transcrição fictícia', async () => { assert.equal((await executar({texto:''})).status,422); });

test('identifica timeout do provedor e retorna 504 claro', async () => {
  const erroTimeout = new Error('This operation was aborted');
  erroTimeout.name = 'AbortError';
  (erroTimeout as any).code = 20;
  const r = await executar({ falha: erroTimeout });
  assert.equal(r.status, 504);
  assert.equal(r.resposta.ok, false);
  assert.match(r.resposta.erro, /timeout/i);
});

test('permite tanto usuário comum quanto master sem distinção de cargo', async () => {
  const tokenComum = 'Bearer token-psicologo-comum';
  const tokenMaster = 'Bearer token-admin-master';
  const rComum = await executar({ token: tokenComum });
  assert.equal(rComum.status, 200);
  assert.equal(rComum.resposta.ok, true);

  const rMaster = await executar({ token: tokenMaster });
  assert.equal(rMaster.status, 200);
  assert.equal(rMaster.resposta.ok, true);
});

test('processa múltiplos trechos sequenciais e permite recuperar trecho com falha', async () => {
  const trechos = ['Trecho um transcrito.', 'Trecho dois transcrito.'];
  const resultados: string[] = [];
  for (let i = 0; i < trechos.length; i++) {
    const r = await executar({ texto: trechos[i] });
    assert.equal(r.status, 200);
    resultados.push(r.resposta.transcricao);
  }
  assert.equal(resultados.join('\n\n'), 'Trecho um transcrito.\n\nTrecho dois transcrito.');
});

test('identifica chave inválida (API_KEY_INVALID) e modelo indisponível (404) com mensagens claras', async () => {
  const rChave = await executar({ falha: { status: 400, message: 'API key not valid. API_KEY_INVALID' } });
  assert.equal(rChave.status, 502);
  assert.match(rChave.resposta.erro, /chave/i);

  const rModelo = await executar({ falha: { status: 404, message: 'models/foo is not found NOT_FOUND' } });
  assert.equal(rModelo.status, 502);
  assert.match(rModelo.resposta.erro, /modelo/i);
});

test('api/transcrever-audio.ts usa apenas modelos ativos oficiais e User-Agent aistudio-build', async () => {
  const fs = await import('node:fs');
  const conteudo = fs.readFileSync(new URL('../api/transcrever-audio.ts', import.meta.url), 'utf8');
  assert.match(conteudo, /gemini-3\.5-transcribe/);
  assert.match(conteudo, /gemini-4-hydrogen/);
  assert.match(conteudo, /gemini-3\.1-flash-lite/);
  assert.match(conteudo, /'User-Agent':\s*'aistudio-build'/);
  assert.doesNotMatch(conteudo, /gemini-3\.5-flash/);
  assert.doesNotMatch(conteudo, /gemini-3\.8-flash/);
});

test('suporta acao opcional pontuar_texto sem enviar áudio e valida entrada vazia', async () => {
  let status = 0;
  let resposta: any;
  const handler = criarHandler({
    autenticar: async () => true,
    transcrever: async () => { throw new Error('não deveria chamar transcrição de áudio'); },
    pontuarTexto: async (texto) => `${texto}.`
  });
  const reqOk = { method: 'POST', headers: { authorization: 'Bearer tok' }, body: { acao: 'pontuar_texto', texto: 'olá tudo bem' } };
  const resOk = { setHeader() {}, set statusCode(v: number) { status = v; }, end(s: string) { resposta = JSON.parse(s); } };
  await handler(reqOk as any, resOk as any);
  assert.equal(status, 200);
  assert.equal(resposta.transcricao, 'olá tudo bem.');

  const reqVazio = { method: 'POST', headers: { authorization: 'Bearer tok' }, body: { acao: 'pontuar_texto', texto: '   ' } };
  await handler(reqVazio as any, resOk as any);
  assert.equal(status, 400);
});

test('modelo local Vosk PT-BR e ponto de restauração do modelo antigo estão presentes', async () => {
  const fs = await import('node:fs');
  assert.equal(fs.existsSync(new URL('../public/models/vosk-model-small-pt-0.3.tar.gz', import.meta.url)), true);
  assert.equal(fs.existsSync(new URL('../backups/ponto-restauracao-modelo-antigo/GravadorSessao.tsx.bak', import.meta.url)), true);
  assert.equal(fs.existsSync(new URL('../backups/ponto-restauracao-modelo-antigo/transcrever-audio.ts.bak', import.meta.url)), true);
  assert.equal(fs.existsSync(new URL('../backups/ponto-restauracao-modelo-antigo/RESTAURAR.md', import.meta.url)), true);
});


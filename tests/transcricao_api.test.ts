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

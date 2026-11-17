import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('SecaoNovaSessao limpa campo 3 (Revisão & Evolução Clínica) e não restaura rascunho antigo do localStorage', () => {
  const conteudo = fs.readFileSync(new URL('../src/components/SecaoNovaSessao.tsx', import.meta.url), 'utf8');

  // Não deve restaurar nem persistir notasSessao antigas no localStorage
  assert.doesNotMatch(conteudo, /localStorage\.getItem\(RASCUNHO_STORAGE_KEY\)/);
  assert.doesNotMatch(conteudo, /localStorage\.setItem\(RASCUNHO_STORAGE_KEY/);
  assert.match(conteudo, /localStorage\.removeItem\(RASCUNHO_STORAGE_KEY\)/);

  // Deve possuir função reiniciarNovaSessao usada no salvamento, limpeza e botão Novo Atendimento
  assert.match(conteudo, /const reiniciarNovaSessao/);
  assert.match(conteudo, /setNotasSessao\(''\)/);
  assert.match(conteudo, /<div key=\{sessaoResetKey\}>\s*<GravadorSessao/);
  assert.match(conteudo, /reiniciarNovaSessao\(\{\s*manterSucessoModal:\s*true\s*\}\)/);
});

test('App.tsx cria nova chave de sessão ao iniciar qualquer nova sessão clínica', () => {
  const conteudo = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

  assert.match(conteudo, /const abrirNovaSessao/);
  assert.match(conteudo, /<div key=\{novaSessaoKey\}>\s*<SecaoNovaSessao/);
  assert.match(conteudo, /<div key=\{sessaoForm\.id\}>\s*<GravadorSessao/);
});

test('GravadorSessao disponibiliza retranscrição offline e em nuvem sempre que houver áudio importado ou gravado', () => {
  const conteudo = fs.readFileSync(new URL('../src/components/GravadorSessao.tsx', import.meta.url), 'utf8');

  // Tanto na barra pós-conclusão/falha quanto no banner de erro deve existir Retranscrever Offline (Local) sem depender do motor ativo
  const ocorrenciasOffline = conteudo.match(/Retranscrever Offline \(Local\)/g) || [];
  assert.ok(ocorrenciasOffline.length >= 2, 'Deve exibir botão Retranscrever Offline (Local) no banner de erro e na barra de ações');

  assert.match(conteudo, /alterarMotorTranscricao\('local_vosk'\);\s*processarTranscricaoLocalArquivo\(audioBlob\);/);
  assert.match(conteudo, /alterarMotorTranscricao\('ia_gemini'\);\s*processarTranscricaoServidor\(audioBlob,\s*undefined,\s*false\);/);
});

test('GravadorSessao e transcricaoLocalVosk não expõem textos internos de teste ou preços', () => {
  const gravador = fs.readFileSync(new URL('../src/components/GravadorSessao.tsx', import.meta.url), 'utf8');
  const vosk = fs.readFileSync(new URL('../src/lib/transcricaoLocalVosk.ts', import.meta.url), 'utf8');

  for (const texto of [gravador, vosk]) {
    assert.doesNotMatch(texto, /Modo 2/i);
    assert.doesNotMatch(texto, /R\$\s*0,00/);
    assert.doesNotMatch(texto, /Baixo Custo/i);
    assert.doesNotMatch(texto, /\bGrátis\b/i);
  }
});

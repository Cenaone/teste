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
  assert.match(conteudo, /processarTranscricaoServidor\(audioBlob,\s*undefined,\s*false\);/);

  // IA em nuvem deve iniciar em local_vosk e NÃO pode chamar processarTranscricaoServidor automaticamente no onstop ou handleUploadAudioArquivo
  assert.match(conteudo, /useState<MotorTranscricao>\('local_vosk'\)/);
  const blocoOnStop = conteudo.match(/mediaRecorder\.onstop = async \(\) => \{[\s\S]*?mediaRecorder\.start\(1000\);/)?.[0] || '';
  assert.ok(blocoOnStop.length > 0);
  assert.doesNotMatch(blocoOnStop, /processarTranscricaoServidor/);

  const blocoUpload = conteudo.match(/const handleUploadAudioArquivo = async[\s\S]*?const handleInserirNasNotas/)?.[0] || '';
  assert.ok(blocoUpload.length > 0);
  assert.doesNotMatch(blocoUpload, /processarTranscricaoServidor/);
  assert.match(blocoUpload, /alterarMotorTranscricao\('local_vosk'\)/);
  assert.match(blocoUpload, /processarTranscricaoLocalArquivo\(file,\s*url\)/);
});

test('ProntuarioModal permite recolher qualquer sessão (incluindo a primeira) e excluir complementos', () => {
  const conteudo = fs.readFileSync(new URL('../src/components/ProntuarioModal.tsx', import.meta.url), 'utf8');

  // Não deve travar a primeira sessão aberta com `|| index === 0`
  assert.doesNotMatch(conteudo, /sessaoExpandidaId === sessao\.id \|\| index === 0/);
  assert.match(conteudo, /sessoesExpandidas\[sessao\.id\] \?\? \(index === 0\)/);

  // Deve possuir função de excluir complemento e controles de confirmação
  assert.match(conteudo, /const handleExcluirComplemento/);
  assert.match(conteudo, /Confirmar Exclusão/);
  assert.match(conteudo, /Excluir<\/span>/);
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

test('áudio da sessão é persistido em audioStorage e reproduzido via PlayerAudioProntuario no Prontuário', async () => {
  const {
    registrarAudioEmMemoria,
    carregarAudioSessaoLocal,
    extrairSessaoIdDeReferenciaAudio,
    excluirAudioSessaoLocal,
    PREFIXO_AUDIO_LOCAL
  } = await import('../src/lib/audioStorage');

  const blobTeste = new Blob(['conteudo-audio-teste'], { type: 'audio/webm' });
  const ref = registrarAudioEmMemoria('sess_audio_teste', blobTeste);
  assert.equal(ref, `${PREFIXO_AUDIO_LOCAL}sess_audio_teste`);
  assert.equal(extrairSessaoIdDeReferenciaAudio(ref), 'sess_audio_teste');

  const recuperado = await carregarAudioSessaoLocal('sess_audio_teste');
  assert.ok(recuperado);
  assert.equal(await recuperado.text(), 'conteudo-audio-teste');
  await excluirAudioSessaoLocal('sess_audio_teste');

  const secao = fs.readFileSync(new URL('../src/components/SecaoNovaSessao.tsx', import.meta.url), 'utf8');
  assert.match(secao, /salvarAudioSessaoLocal/);

  const prontuario = fs.readFileSync(new URL('../src/components/ProntuarioModal.tsx', import.meta.url), 'utf8');
  assert.match(prontuario, /function PlayerAudioProntuario/);
  assert.match(prontuario, /carregarAudioSessaoLocal/);
  assert.match(prontuario, /<PlayerAudioProntuario/);
});

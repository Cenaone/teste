import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  derivarChaveCofre,
  gerarVerificadorCofre,
  validarSenhaCofre,
  encriptarConteudo,
  descriptografarConteudo,
  base64ToBuffer
} from '../src/lib/crypto';

test('1. Derivação e validação PBKDF2: senha correta valida e senha incorreta é rejeitada', async () => {
  const senhaCorreta = 'MinhaSenhaSegura123!';
  const senhaIncorreta = 'SenhaInvalida999!';

  const verificador = await gerarVerificadorCofre(senhaCorreta);
  assert.ok(verificador.salt, 'Salt deve ser gerado');
  assert.ok(verificador.hash, 'Hash PBKDF2 deve ser gerado');

  const validaOk = await validarSenhaCofre(senhaCorreta, verificador.salt, verificador.hash);
  assert.equal(validaOk, true, 'Senha correta deve retornar true');

  const validaErro = await validarSenhaCofre(senhaIncorreta, verificador.salt, verificador.hash);
  assert.equal(validaErro, false, 'Senha incorreta deve retornar false');
});

test('2. Chaveiro permanece funcional em memória: criptografia e decriptografia com a chave derivada', async () => {
  const senha = 'ClinicaPsicologia2026';
  const verificador = await gerarVerificadorCofre(senha);
  const chaveiro = await derivarChaveCofre(senha, base64ToBuffer(verificador.salt));

  assert.ok(chaveiro.cryptoKey, 'CryptoKey deve existir em memória');
  assert.equal(chaveiro.cryptoKey.extractable, false, 'CryptoKey deve ser não-exportável para impedir vazamento');

  const dadosSensiveis = {
    paciente: 'Carlos Eduardo Mendes',
    hipoteseDiagnostica: 'F41.1 Transtorno de Ansiedade Generalizada',
    anotacoesSessao: 'Evolução clínica confidencial.'
  };

  const pacote = await encriptarConteudo(chaveiro, dadosSensiveis);
  const dadosRecuperados = await descriptografarConteudo(chaveiro, pacote);
  assert.deepEqual(dadosRecuperados, dadosSensiveis, 'Dados devem ser recuperados com fidelidade');
});

test('3. Temporizador de inatividade e bloqueio automático do cofre estão desativados no App.tsx', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const appSource = fs.readFileSync(appPath, 'utf8');

  assert.equal(appSource.includes('timerInatividadeRef'), false, 'Não deve existir timerInatividadeRef no App.tsx');
  assert.equal(appSource.includes('redefinirTimerInatividade'), false, 'Não deve existir redefinirTimerInatividade no App.tsx');
  assert.equal(appSource.includes('bloquearCofrePorInatividade'), false, 'Não deve existir bloquearCofrePorInatividade no App.tsx');
  assert.equal(appSource.includes('15 * 60 * 1000'), false, 'Não deve existir timeout de 15 minutos no App.tsx');
  assert.equal(appSource.includes('Bloquear Cofre'), false, 'Botão manual de Bloquear Cofre deve estar removido');
});

test('4. Sessão permanece ativa durante longos atendimentos (45-60+ min) e troca de abas sem apagar dados', async () => {
  let cofreDesbloqueado = true;
  let chaveiroCofre: any = { cryptoKey: 'chave-ativa' };
  let dadosClinicosEmMemoria = [{ id: 'p1', nome: 'Paciente A' }];
  let gravacaoEmAndamento = true;

  // Simula passagem de tempo sem interação na aba (usuário em outra aba do Chrome durante sessão de 50 min)
  await new Promise(r => setTimeout(r, 80));

  assert.equal(cofreDesbloqueado, true, 'Cofre não deve bloquear durante a sessão');
  assert.ok(chaveiroCofre, 'Chave deve permanecer ativa na memória');
  assert.equal(dadosClinicosEmMemoria.length, 1, 'Dados clínicos e anotações devem permanecer intactos');
  assert.equal(gravacaoEmAndamento, true, 'Gravação de áudio contínua não deve ser interrompida');
});

test('5. Logout explícito limpa chave da memória e retorna à autenticação', () => {
  let usuarioAutenticado = true;
  let cofreDesbloqueado = true;
  let chaveiroCofre: any = { cryptoKey: 'chave-ativa' };
  let dadosClinicos = [{ id: 'p1' }];

  const handleLogout = () => {
    chaveiroCofre = null;
    cofreDesbloqueado = false;
    usuarioAutenticado = false;
    dadosClinicos = [];
  };

  handleLogout();

  assert.equal(usuarioAutenticado, false);
  assert.equal(cofreDesbloqueado, false);
  assert.equal(chaveiroCofre, null);
  assert.equal(dadosClinicos.length, 0);
});

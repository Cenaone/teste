import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { carregarIdentidadeAutenticada, listarContasAutenticadas, normalizarContasAdmin } from '../src/lib/sessaoAutenticada';
import { definirSessaoAssinanteAtiva, fazerLoginSupabaseAuth, getSupabase, obterUsuarioAutenticadoSupabase } from '../src/lib/supabase';

function clienteTeste(opcoes: { sessao?: boolean; admin?: boolean; userId?: string; acesso?: boolean; erroRpc?: string } = {}) {
  const chamadas: string[] = [];
  const user = { id: opcoes.userId || 'auth-id-real', email: 'teste@example.com', created_at: '2026-10-21', user_metadata: { role: 'admin' } };
  const cliente = {
    auth: {
      getSession: async () => ({ data: { session: opcoes.sessao === false ? null : { user } }, error: null }),
      getUser: async () => ({ data: { user }, error: null }),
    },
    rpc: async (fn: string) => {
      chamadas.push(fn);
      if (opcoes.erroRpc === fn) return { data: null, error: { code: '42501', message: 'permission denied' } };
      if (fn === 'is_admin') return { data: opcoes.admin === true, error: null };
      if (fn === 'saas_acesso_ativo') return { data: opcoes.acesso === true, error: null };
      if (fn === 'admin_listar_contas') return { data: [{ id: 'conta', email: 'pessoa@example.com', nome: 'Pessoa', status_perfil: 'pendente', acesso_liberado: false }], error: null };
      throw new Error(`RPC inesperada: ${fn}`);
    },
    from: (tabela: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
      data: tabela === 'usuarios' ? { nome: 'Nome do banco', status: opcoes.acesso ? 'ativo' : 'pendente' }
        : { plano: 'mensal', status: 'pendente', valido_ate: '2099-01-01T00:00:00Z' }, error: null
    }) }) }) }),
  } as unknown as SupabaseClient;
  return { cliente, chamadas };
}

test('sem sessão nativa não chama a RPC administrativa', async () => {
  const { cliente, chamadas } = clienteTeste({ sessao: false, admin: true });
  await assert.rejects(listarContasAutenticadas(cliente), /sessão do Supabase não está ativa/);
  assert.deepEqual(chamadas, []);
});

test('sessão de outra conta não pode substituir a sessão do administrador', async () => {
  const { cliente, chamadas } = clienteTeste({ admin: true, userId: 'conta-recem-criada' });
  await assert.rejects(listarContasAutenticadas(cliente, 'administrador'), /validar sua sessão/);
  assert.deepEqual(chamadas, []);
});

test('metadados com role admin não substituem autorização do banco', async () => {
  const { cliente, chamadas } = clienteTeste({ admin: false });
  await assert.rejects(listarContasAutenticadas(cliente), /restrito aos administradores/);
  assert.deepEqual(chamadas, ['is_admin']);
});

test('administrador validado recebe nomes e estados persistidos da RPC completa', async () => {
  const { cliente, chamadas } = clienteTeste({ admin: true });
  const contas = await listarContasAutenticadas(cliente, 'auth-id-real');
  assert.deepEqual(chamadas, ['is_admin', 'admin_listar_contas']);
  assert.equal(contas[0].nome, 'Pessoa');
  assert.equal(contas[0].status_usuario, 'pendente');
  assert.equal(contas[0].acesso_valido, false);
});

test('erro de permissão não vira uma lista vazia de sucesso', async () => {
  const { cliente } = clienteTeste({ admin: true, erroRpc: 'admin_listar_contas' });
  await assert.rejects(listarContasAutenticadas(cliente), /42501/);
});

test('validade futura ou status ativo não sobrescrevem acesso negado pelo banco', () => {
  const [conta] = normalizarContasAdmin([{ id: 'conta', email: 'x@example.com', status_perfil: 'ativo', status_assinatura: 'ativa', valido_ate: '2099-01-01', acesso_liberado: false }]);
  assert.equal(conta.acesso_valido, false);
  assert.throws(() => normalizarContasAdmin({}), /inválida/);
});

test('conta pendente com metadados admin continua pendente', async () => {
  const { cliente } = clienteTeste({ admin: false, acesso: false });
  const conta = await carregarIdentidadeAutenticada(cliente);
  assert.equal(conta.isAdmin, false);
  assert.equal(conta.status, 'pendente');
  assert.equal(conta.nomeCompleto, 'Nome do banco');
});

test('aprovação válida do banco libera a conta comum', async () => {
  const { cliente } = clienteTeste({ acesso: true });
  assert.equal((await carregarIdentidadeAutenticada(cliente)).status, 'ativo');
});

test('falha de login do administrador não concede entrada local', async () => {
  const cliente = getSupabase();
  const original = cliente.auth.signInWithPassword;
  cliente.auth.signInWithPassword = async () => ({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } } as any);
  try {
    const resultado = await fazerLoginSupabaseAuth('backupvideomidias@gmail.com', 'senha-incorreta-de-teste');
    assert.equal(resultado.ok, false);
    assert.equal(resultado.user, undefined);
  } finally { cliente.auth.signInWithPassword = original; }
});

test('restauração ignora sessão local sem token Supabase', async () => {
  const cliente = getSupabase();
  const original = cliente.auth.getSession;
  definirSessaoAssinanteAtiva({ id: 'id-local', email: 'backupvideomidias@gmail.com', nomeCompleto: 'Local', role: 'admin', status: 'ativo', plano: 'mensal', criadoEm: '2026-10-21', origem: 'local_resiliente' });
  cliente.auth.getSession = async () => ({ data: { session: null }, error: null });
  try { assert.equal(await obterUsuarioAutenticadoSupabase(), null); }
  finally { cliente.auth.getSession = original; definirSessaoAssinanteAtiva(null); }
});

# Correção do acesso administrativo — 21/10/2026

## Causa e implementação

O login e a restauração aceitavam contas locais como se fossem sessões do Supabase,
inclusive depois de falha em `signInWithPassword`. Isso abria a interface, mas não
criava o JWT exigido pelas RPCs. O resultado era `42501: permission denied for function`.

O login agora exige sessão nativa e usuário validado pelo Supabase. A restauração
não autentica a partir de cache. A autorização administrativa vem de `is_admin()`.
O callback de eventos Auth agenda consultas fora do lock interno do Supabase.

A tela usa `admin_listar_contas()`, existente no banco, e adapta seu contrato para
o componente. A antiga `admin_listar_assinaturas()` retorna apenas user_id, email,
status e valido_ate nesse projeto, insuficientes para nomes, filtros e ações da tela.
O cadastro manual usa um cliente isolado para não substituir a sessão do administrador.
Cada ação administrativa verifica novamente a identidade e a autorização no banco.

## Banco verificado

Projeto: `rkbvbmhhkllafijipwey`.

Em 21/10/2026, uma consulta de leitura no Dashboard confirmou EXECUTE para
`authenticated`, sem EXECUTE para `anon`, nas funções:

- `admin_listar_contas()`
- `admin_listar_assinaturas()`
- `is_admin()`
- `saas_is_admin()`
- `saas_acesso_ativo()`

Foi verificado no editor que `admin_listar_contas()` valida `public.is_admin()`
antes de retornar as contas. Não foram alterados funções, grants, RLS ou registros.
Esta correção de frontend não exige migration no projeto atual. Não executar o
script legado de inicialização para corrigir uma sessão ausente.

## Validação e publicação

- `npm run test:auth`: testes isolados com clientes simulados, sem gravar no Supabase.
- `npm run lint`: verificação de tipos.
- `npm run build`: build Vite usado pela aplicação web.

O antigo `npm test` contém operações contra contas e fluxos de recuperação reais;
não foi executado para evitar alterações ou envio de e-mail durante a correção.

Publicar o código pelo fluxo GitHub/Vercel usado pelo projeto. O arquivo legado
`index-offline.html` não foi regenerado: a aplicação web usa o build de `index.html`.
Depois do deploy, entrar novamente com a senha real do Supabase Auth. Uma sessão
local antiga não concede acesso ao painel. Não apagar localStorage/IndexedDB:
os cofres e dados locais existentes devem ser preservados.

Validação final depende de login real no ambiente publicado: abrir a gestão,
conferir nomes/status e recarregar. Testes de alteração de assinaturas devem usar
uma conta explicitamente identificada como descartável. Não alterar assinaturas
de usuários reais apenas para testar.

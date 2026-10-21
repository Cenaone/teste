-- Diagnóstico somente leitura; não concede nem revoga permissões.
SELECT p.proname AS funcao,
       pg_get_function_identity_arguments(p.oid) AS argumentos,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS autenticado_pode_executar,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anonimo_pode_executar
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('admin_listar_contas', 'admin_listar_assinaturas',
                   'is_admin', 'saas_is_admin', 'saas_acesso_ativo')
ORDER BY p.proname;

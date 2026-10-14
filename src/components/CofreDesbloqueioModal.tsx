import React, { useState } from 'react';
import { Lock, Key, ShieldCheck, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Card } from './ui-compact';

interface CofreDesbloqueioModalProps {
  estaConfigurado: boolean;
  onDesbloquear: (senha: string) => Promise<{ ok: boolean; erro?: string }>;
  onCriarSenhaCofre: (senha: string) => Promise<{ ok: boolean; erro?: string }>;
  emailUsuario: string;
}

export default function CofreDesbloqueioModal({
  estaConfigurado,
  onDesbloquear,
  onCriarSenhaCofre,
  emailUsuario
}: CofreDesbloqueioModalProps) {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!senha || senha.length < 8) {
      setErro('A senha do cofre deve ter no mínimo 8 caracteres.');
      return;
    }

    if (!estaConfigurado) {
      if (senha !== confirmarSenha) {
        setErro('A confirmação da senha não coincide.');
        return;
      }
      setProcessando(true);
      const res = await onCriarSenhaCofre(senha);
      setProcessando(false);
      if (!res.ok) {
        setErro(res.erro || 'Falha ao inicializar o cofre criptografado.');
      }
    } else {
      setProcessando(true);
      const res = await onDesbloquear(senha);
      setProcessando(false);
      if (!res.ok) {
        setErro(res.erro || 'Senha do cofre incorreta.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-card border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="size-12 rounded-2xl gradient-emerald text-primary-foreground mx-auto grid place-items-center shadow-lg">
            <Lock className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {estaConfigurado ? 'Desbloquear Cofre Local Clínico' : 'Definir Senha do Cofre Local'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Conta Autenticada: <strong className="text-foreground">{emailUsuario}</strong>
          </p>
        </div>

        {/* Security Disclaimers */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <div className="flex items-start gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Criptografia Web Crypto AES-GCM 256-bit:</strong> Prontuários e dados confidenciais são mantidos na máquina local. A chave descriptografada permanece somente na memória RAM enquanto a sessão estiver ativa.
            </span>
          </div>
          <div className="flex items-start gap-2 pt-1 border-t border-border/40 text-[11px]">
            <ShieldAlert className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de Segurança:</strong> Redefinir a senha da sua conta na nuvem <em>não</em> recupera o cofre local. A criptografia protege contra acesso não autorizado no disco, mas mantenha backups periódicos atualizados.
            </span>
          </div>
        </div>

        {erro && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Key className="size-3.5" />
              {estaConfigurado ? 'Digite a Senha do Cofre' : 'Crie a Senha do Cofre (mínimo 8 dígitos)'}
            </label>
            <input
              type="password"
              required
              autoFocus
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
            />
          </div>

          {!estaConfigurado && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="size-3.5" />
                Confirme a Senha do Cofre
              </label>
              <input
                type="password"
                required
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={processando}
            className="w-full h-11 gradient-emerald text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processando ? (
              <span>Derivando chaves criptográficas...</span>
            ) : (
              <>
                <Lock className="size-4" />
                <span>{estaConfigurado ? 'Desbloquear Prontuários' : 'Criar e Inicializar Cofre'}</span>
              </>
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

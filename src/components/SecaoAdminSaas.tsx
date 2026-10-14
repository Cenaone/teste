import React, { useState } from 'react';
import { Shield, Lock, ShieldCheck, Key, Database, Check, SlidersHorizontal } from 'lucide-react';
import { Card } from './ui-compact';
import ModalConfigBancoDados from './ModalConfigBancoDados';

interface SecaoAdminSaasProps {
  contaUsuario: { id: string; email: string; nomeCompleto: string; crp?: string; isAdmin?: boolean } | null;
  licencaSaas: any | null;
}

export default function SecaoAdminSaas({ contaUsuario, licencaSaas }: SecaoAdminSaasProps) {
  const [modalBancoAberto, setModalBancoAberto] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Controle de Assinaturas e Licenças SaaS (Nuvem)
          </h2>
          <p className="text-sm text-muted-foreground">
            Supervisão de contas de assinantes e códigos de ativação PSI. Prontuários e dados clínicos não transitam pela nuvem.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalBancoAberto(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-xs shrink-0"
        >
          <Database className="size-4 text-emerald-500" />
          <span>Configurar / Alterar Banco</span>
        </button>
      </div>

      {/* Status da Arquitetura Híbrida */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Autenticação & Contas</span>
            <Lock className="size-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-foreground">Supabase Auth</div>
          <p className="text-xs text-muted-foreground">
            Senhas criptografadas no servidor; credenciais nunca expostas no frontend.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Isolamento Clínico</span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">100% Local & Criptografado</div>
          <p className="text-xs text-muted-foreground">
            IndexedDB com AES-GCM 256. Pacientes, prontuários e notas nunca saem da máquina do assinante.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Licença Ativa</span>
            <Key className="size-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-foreground">
            {licencaSaas?.plano ? `Plano ${licencaSaas.plano.toUpperCase()}` : 'Assinante Ativo'}
          </div>
          <p className="text-xs text-muted-foreground">
            Conta: <span className="font-mono text-foreground font-semibold">{contaUsuario?.email}</span>
          </p>
        </Card>
      </div>

      {/* Guia de Governança de Licenças no Servidor */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2 border-b border-border pb-3">
          <Database className="size-5 text-primary" />
          Administração de Assinaturas e Códigos PSI no Supabase
        </h3>
        <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            Conforme a arquitetura de segurança do micro SaaS PSi 4.0, aprovações de contas, geração de códigos de ativação e planos de assinatura são administrados exclusivamente através de funções do servidor no painel Supabase, com verificação criptográfica e Row Level Security (RLS) habilitado.
          </p>
          <div className="bg-muted/40 p-4 rounded-xl border border-border font-mono text-[11px] space-y-1">
            <p className="font-bold text-foreground">Funções SQL Disponíveis no Banco Supabase:</p>
            <p className="text-muted-foreground">• <code>gerar_codigo_psi(plano, dias_validade, email_destinatario)</code>: Cria código atômico com verificador seguro.</p>
            <p className="text-muted-foreground">• <code>validar_codigo_psi(codigo_digitado)</code>: Associa a licença à conta do assinante de forma atômica e irreversível.</p>
            <p className="text-muted-foreground">• Script de migração seguro disponível em: <code>src/lib/migracao_supabase_segura.sql</code></p>
          </div>
          <div className="flex items-center gap-2 text-foreground font-medium pt-2">
            <Check className="size-4 text-emerald-500" />
            <span>Nenhuma senha de usuário ou dado de prontuário é trafegado para o navegador nesta visão.</span>
          </div>
        </div>
      </Card>

      <ModalConfigBancoDados
        aberto={modalBancoAberto}
        onFechar={() => setModalBancoAberto(false)}
      />
    </div>
  );
}

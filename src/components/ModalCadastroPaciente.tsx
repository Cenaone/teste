import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Users, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { Analisando } from '../types';
import { 
  validarCPF, 
  formatarCPF, 
  formatarTelefone, 
  formatarCEP, 
  limparDigitos, 
  consultarViaCEP 
} from '../utils/helpers';

interface ModalCadastroPacienteProps {
  pacienteExistente: Analisando | null;
  pacientesCadastrados: Analisando[];
  onFechar: () => void;
  onSalvar: (paciente: Analisando) => void;
}

export default function ModalCadastroPaciente({
  pacienteExistente,
  pacientesCadastrados,
  onFechar,
  onSalvar
}: ModalCadastroPacienteProps) {
  // Estado inicial preservando valores existentes ou rascunho
  const [nome, setNome] = useState(pacienteExistente?.nome || '');
  const [nomeSocial, setNomeSocial] = useState(pacienteExistente?.nomeSocial || '');
  const [nascimento, setNascimento] = useState(pacienteExistente?.nascimento ? pacienteExistente.nascimento.slice(0, 10) : '');
  const [cpf, setCpf] = useState(pacienteExistente?.cpf ? formatarCPF(pacienteExistente.cpf) : '');

  const [whatsapp, setWhatsapp] = useState(pacienteExistente?.whatsapp ? formatarTelefone(pacienteExistente.whatsapp) : '');
  const [telefone, setTelefone] = useState(pacienteExistente?.telefone ? formatarTelefone(pacienteExistente.telefone) : '');
  const [email, setEmail] = useState(pacienteExistente?.email || '');

  const [cep, setCep] = useState(pacienteExistente?.cep ? formatarCEP(pacienteExistente.cep) : '');
  const [logradouro, setLogradouro] = useState(pacienteExistente?.logradouro || pacienteExistente?.endereco || '');
  const [numero, setNumero] = useState(pacienteExistente?.numero || '');
  const [complemento, setComplemento] = useState(pacienteExistente?.complemento || '');
  const [bairro, setBairro] = useState(pacienteExistente?.bairro || '');
  const [cidade, setCidade] = useState(pacienteExistente?.cidade || '');
  const [uf, setUf] = useState(pacienteExistente?.uf || '');

  const [temResponsavel, setTemResponsavel] = useState(Boolean(pacienteExistente?.temResponsavel));
  const [responsavelNome, setResponsavelNome] = useState(pacienteExistente?.responsavelNome || '');
  const [responsavelParentesco, setResponsavelParentesco] = useState(pacienteExistente?.responsavelParentesco || '');
  const [responsavelContato, setResponsavelContato] = useState(pacienteExistente?.responsavelContato ? formatarTelefone(pacienteExistente.responsavelContato) : '');
  const [responsavelCpf, setResponsavelCpf] = useState(pacienteExistente?.responsavelCpf ? formatarCPF(pacienteExistente.responsavelCpf) : '');

  const [status, setStatus] = useState<Analisando['status']>(pacienteExistente?.status || 'novo');
  const [vip, setVip] = useState(Boolean(pacienteExistente?.vip));
  const [tagsStr, setTagsStr] = useState(Array.isArray(pacienteExistente?.tags) ? pacienteExistente.tags.join(', ') : '');
  const [observacoes, setObservacoes] = useState(pacienteExistente?.observacoes || '');

  // Estados de CEP e Validações
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [avisoCep, setAvisoCep] = useState<string | null>(null);
  const [sucessoCep, setSucessoCep] = useState(false);

  const [erros, setErros] = useState<{ [campo: string]: string }>({});
  const [alertaDuplicidade, setAlertaDuplicidade] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'identificacao' | 'contato' | 'endereco' | 'responsavel' | 'admin'>('identificacao');

  // Proteção contra respostas atrasadas (race conditions) na consulta de CEP
  const reqCepIdRef = useRef(0);
  const abortCepControllerRef = useRef<AbortController | null>(null);

  // Monitora digitação do CEP para consulta automática ao completar 8 dígitos
  const handleCepChange = async (valorDigitado: string) => {
    const cepFormatado = formatarCEP(valorDigitado);
    setCep(cepFormatado);
    setAvisoCep(null);
    setSucessoCep(false);

    const digitos = limparDigitos(valorDigitado);

    // Cancela requisição anterior pendente se houver
    if (abortCepControllerRef.current) {
      abortCepControllerRef.current.abort();
    }

    if (digitos.length === 8) {
      const currentReqId = ++reqCepIdRef.current;
      const controller = new AbortController();
      abortCepControllerRef.current = controller;

      setConsultandoCep(true);

      const resultado = await consultarViaCEP(digitos, controller.signal);

      // Se outra consulta foi disparada enquanto aguardava, ignora resposta atrasada
      if (currentReqId !== reqCepIdRef.current) {
        return;
      }

      setConsultandoCep(false);

      if (resultado.sucesso) {
        // Preenche APENAS os campos retornados pelo serviço, preservando número ou complementos manuais
        if (resultado.logradouro) setLogradouro(resultado.logradouro);
        if (resultado.bairro) setBairro(resultado.bairro);
        if (resultado.localidade) setCidade(resultado.localidade);
        if (resultado.uf) setUf(resultado.uf);
        if (resultado.complemento && !complemento) setComplemento(resultado.complemento);
        setSucessoCep(true);
      } else {
        // Falha no serviço de CEP: permite edição manual e continuidade sem travar o cadastro
        setAvisoCep(resultado.erro || 'Não foi possível autocompletar o endereço pelo CEP. Você pode preencher manualmente.');
      }
    }
  };

  // Verificação de possíveis duplicidades dentro da clínica
  const checarDuplicidade = (cpfLimpo: string, nomeLimpo: string, telLimpo: string, idAtual?: string) => {
    for (const outro of pacientesCadastrados) {
      if (idAtual && outro.id === idAtual) continue;

      // 1. Duplicidade por CPF (se preenchido)
      if (cpfLimpo && outro.cpf && limparDigitos(outro.cpf) === cpfLimpo) {
        return `Atenção: Já existe outro paciente cadastrado com este mesmo CPF (${outro.nome}).`;
      }

      // 2. Duplicidade por Nome exato + Telefone/WhatsApp
      const outroNome = (outro.nome || '').trim().toLowerCase();
      const outroTel = limparDigitos(outro.whatsapp || outro.telefone);
      if (nomeLimpo && outroNome === nomeLimpo.toLowerCase() && telLimpo && outroTel === telLimpo) {
        return `Atenção: Já existe um paciente com o mesmo nome e contato cadastrado (${outro.nome}).`;
      }
    }
    return null;
  };

  const handleValidarESalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const novosErros: { [campo: string]: string } = {};

    // 1. Validação de Identificação
    if (!nome.trim()) {
      novosErros.nome = 'Nome completo é obrigatório.';
    }

    // CPF é opcional; se preenchido, deve ser rigorosamente válido
    const cpfLimpo = limparDigitos(cpf);
    if (cpfLimpo.length > 0) {
      if (!validarCPF(cpfLimpo)) {
        novosErros.cpf = 'CPF inválido pelos dígitos verificadores. Verifique os números digitados.';
      }
    }

    // 2. Validação de Contato
    const telLimpo = limparDigitos(whatsapp);
    if (!telLimpo) {
      novosErros.whatsapp = 'Telefone ou WhatsApp é obrigatório para contato clínico.';
    } else if (telLimpo.length < 10) {
      novosErros.whatsapp = 'Telefone deve conter DDD + número (mínimo 10 dígitos).';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      novosErros.email = 'E-mail com formato inválido.';
    }

    // 3. Validação de Responsável (se marcado)
    if (temResponsavel) {
      if (!responsavelNome.trim()) {
        novosErros.responsavelNome = 'Informe o nome do responsável legal.';
      }
      const respCpfLimpo = limparDigitos(responsavelCpf);
      if (respCpfLimpo.length > 0 && !validarCPF(respCpfLimpo)) {
        novosErros.responsavelCpf = 'CPF do responsável inválido.';
      }
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      // Navega automaticamente para a aba com erro para orientar o profissional
      if (novosErros.nome || novosErros.cpf) setAbaAtiva('identificacao');
      else if (novosErros.whatsapp || novosErros.email) setAbaAtiva('contato');
      else if (novosErros.responsavelNome || novosErros.responsavelCpf) setAbaAtiva('responsavel');
      return;
    }

    setErros({});

    // 4. Detecção de Duplicidade
    const avisoDuplicado = checarDuplicidade(cpfLimpo, nome.trim(), telLimpo, pacienteExistente?.id);
    if (avisoDuplicado) {
      setAlertaDuplicidade(avisoDuplicado);
      return;
    }

    // Prepara objeto limpo e normalizado
    const pacienteSalvar: Analisando = {
      id: pacienteExistente?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      nome: nome.trim(),
      nomeSocial: nomeSocial.trim() || undefined,
      nascimento: nascimento || '',
      cpf: cpfLimpo ? formatarCPF(cpfLimpo) : undefined,
      whatsapp: telLimpo,
      telefone: limparDigitos(telefone) || undefined,
      email: email.trim().toLowerCase(),
      cep: limparDigitos(cep) || undefined,
      logradouro: logradouro.trim() || undefined,
      numero: numero.trim() || undefined,
      complemento: complemento.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || 'Não informada',
      uf: uf.trim().toUpperCase() || undefined,
      endereco: [logradouro, numero, complemento, bairro, cidade, uf].filter(Boolean).join(', ') || undefined,
      temResponsavel,
      responsavelNome: temResponsavel ? responsavelNome.trim() : undefined,
      responsavelParentesco: temResponsavel ? responsavelParentesco.trim() : undefined,
      responsavelContato: temResponsavel ? limparDigitos(responsavelContato) : undefined,
      responsavelCpf: temResponsavel && limparDigitos(responsavelCpf) ? formatarCPF(responsavelCpf) : undefined,
      status,
      vip,
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      observacoes: observacoes.trim(),
      criadoEm: pacienteExistente?.criadoEm || new Date().toISOString(),
      mensagensEnviadas: pacienteExistente?.mensagensEnviadas || []
    };

    onSalvar(pacienteSalvar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Cabeçalho */}
        <div className="gradient-emerald text-primary-foreground px-5 sm:px-6 py-4 shrink-0 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold truncate">
              {pacienteExistente ? `Editar Paciente: ${pacienteExistente.nome}` : 'Cadastrar Novo Paciente'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              Prontuário e ficha cadastral confidencial da clínica
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded-xl text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
            title="Fechar formulário"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Abas de Navegação do Formulário */}
        <div className="flex border-b border-border bg-muted/30 px-3 sm:px-6 overflow-x-auto shrink-0 scrollbar-none gap-1 py-1.5">
          <button
            type="button"
            onClick={() => setAbaAtiva('identificacao')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              abaAtiva === 'identificacao'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <User className="size-3.5" />
            <span>1. Identificação</span>
            {erros.nome || erros.cpf ? <span className="size-2 rounded-full bg-destructive inline-block" /> : null}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('contato')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              abaAtiva === 'contato'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Phone className="size-3.5" />
            <span>2. Contato</span>
            {erros.whatsapp || erros.email ? <span className="size-2 rounded-full bg-destructive inline-block" /> : null}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('endereco')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              abaAtiva === 'endereco'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <MapPin className="size-3.5" />
            <span>3. Endereço</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('responsavel')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              abaAtiva === 'responsavel'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Users className="size-3.5" />
            <span>4. Responsável</span>
            {erros.responsavelNome ? <span className="size-2 rounded-full bg-destructive inline-block" /> : null}
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('admin')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              abaAtiva === 'admin'
                ? 'bg-card text-primary shadow-sm border border-border/80'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Settings className="size-3.5" />
            <span>5. Setting & Demanda</span>
          </button>
        </div>

        {/* Alerta de Duplicidade */}
        {alertaDuplicidade && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>{alertaDuplicidade}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertaDuplicidade(null)}
              className="text-[11px] underline font-bold shrink-0 cursor-pointer"
            >
              Ignorar e Continuar
            </button>
          </div>
        )}

        {/* Conteúdo com rolagem interna */}
        <form onSubmit={handleValidarESalvar} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* ABA 1: IDENTIFICAÇÃO */}
          {abaAtiva === 'identificacao' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-border/60 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Dados de Identificação Civil
                </span>
                <span className="text-[11px] text-muted-foreground">* Campos obrigatórios</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <span>Nome Completo *</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => {
                    setNome(e.target.value);
                    if (erros.nome) setErros(prev => ({ ...prev, nome: '' }));
                  }}
                  className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    erros.nome ? 'border-destructive focus-visible:ring-destructive' : 'border-border'
                  }`}
                  placeholder="Nome civil completo do paciente"
                />
                {erros.nome && <span className="text-xs text-destructive font-medium block">{erros.nome}</span>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Nome Social (se houver)
                </label>
                <input
                  type="text"
                  value={nomeSocial}
                  onChange={e => setNomeSocial(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Nome pelo qual o paciente prefere ser chamado"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={nascimento}
                    onChange={e => setNascimento(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                    <span>CPF (Opcional)</span>
                    <span className="text-[10px] text-muted-foreground lowercase">com validação oficial</span>
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={e => {
                      setCpf(formatarCPF(e.target.value));
                      if (erros.cpf) setErros(prev => ({ ...prev, cpf: '' }));
                    }}
                    maxLength={14}
                    className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono ${
                      erros.cpf ? 'border-destructive focus-visible:ring-destructive' : 'border-border'
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {erros.cpf && <span className="text-xs text-destructive font-medium block">{erros.cpf}</span>}
                  <span className="text-[10px] text-muted-foreground block">
                    O CPF é utilizado apenas para controle cadastral de prontuário e emissão de recibos.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTATO */}
          {abaAtiva === 'contato' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Canais de Contato & Notificação
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    WhatsApp / Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={e => {
                      setWhatsapp(formatarTelefone(e.target.value));
                      if (erros.whatsapp) setErros(prev => ({ ...prev, whatsapp: '' }));
                    }}
                    maxLength={15}
                    className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono ${
                      erros.whatsapp ? 'border-destructive focus-visible:ring-destructive' : 'border-border'
                    }`}
                    placeholder="(11) 99999-9999"
                  />
                  {erros.whatsapp && <span className="text-xs text-destructive font-medium block">{erros.whatsapp}</span>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Telefone Secundário (Fixo / Recado)
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={e => setTelefone(formatarTelefone(e.target.value))}
                    maxLength={15}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                    placeholder="(11) 3333-3333"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  E-mail do Paciente
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (erros.email) setErros(prev => ({ ...prev, email: '' }));
                  }}
                  className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    erros.email ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="paciente@exemplo.com"
                />
                {erros.email && <span className="text-xs text-destructive font-medium block">{erros.email}</span>}
              </div>
            </div>
          )}

          {/* ABA 3: ENDEREÇO COM VIACEP */}
          {abaAtiva === 'endereco' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-border/60 pb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Endereço Residencial
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Search className="size-3" /> Busca automática por CEP
                </span>
              </div>

              {/* Linha do CEP com indicador de busca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                    <span>CEP</span>
                    {consultandoCep && (
                      <span className="text-[10px] text-primary flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Buscando...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cep}
                      onChange={e => handleCepChange(e.target.value)}
                      maxLength={9}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                      placeholder="00000-000"
                    />
                    {sucessoCep && (
                      <CheckCircle2 className="size-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Logradouro / Rua / Avenida
                  </label>
                  <input
                    type="text"
                    value={logradouro}
                    onChange={e => setLogradouro(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Rua, Avenida, Praça..."
                  />
                </div>
              </div>

              {avisoCep && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <Info className="size-4 shrink-0 text-amber-600" />
                  <span>{avisoCep}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Número
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="123 ou S/N"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={e => setComplemento(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Apto 42, Bloco B"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={e => setBairro(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="São Paulo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    UF (Estado)
                  </label>
                  <input
                    type="text"
                    value={uf}
                    onChange={e => setUf(e.target.value.toUpperCase())}
                    maxLength={2}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono uppercase"
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: RESPONSÁVEL LEGAL */}
          {abaAtiva === 'responsavel' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Responsável Legal (Quando Aplicável)
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-responsavel"
                  checked={temResponsavel}
                  onChange={e => setTemResponsavel(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-ring size-4 mt-0.5"
                />
                <label htmlFor="chk-responsavel" className="text-xs cursor-pointer select-none space-y-0.5">
                  <span className="font-bold text-foreground block">
                    Paciente menor de idade ou sob tutela legal
                  </span>
                  <span className="text-muted-foreground block text-[11px]">
                    Marque caso o atendimento envolva criança, adolescente ou paciente que requeira termo assinado por responsável legal.
                  </span>
                </label>
              </div>

              {temResponsavel && (
                <div className="space-y-4 p-4 rounded-xl border border-border/70 bg-card">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Nome do Responsável *
                      </label>
                      <input
                        type="text"
                        value={responsavelNome}
                        onChange={e => {
                          setResponsavelNome(e.target.value);
                          if (erros.responsavelNome) setErros(prev => ({ ...prev, responsavelNome: '' }));
                        }}
                        className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          erros.responsavelNome ? 'border-destructive' : 'border-border'
                        }`}
                        placeholder="Nome completo do pai, mãe ou tutor"
                      />
                      {erros.responsavelNome && (
                        <span className="text-xs text-destructive font-medium block">{erros.responsavelNome}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Grau de Parentesco / Vínculo
                      </label>
                      <input
                        type="text"
                        value={responsavelParentesco}
                        onChange={e => setResponsavelParentesco(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="ex: Mãe, Pai, Avô(ó), Tutor legal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Telefone / WhatsApp do Responsável
                      </label>
                      <input
                        type="text"
                        value={responsavelContato}
                        onChange={e => setResponsavelContato(formatarTelefone(e.target.value))}
                        maxLength={15}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        CPF do Responsável
                      </label>
                      <input
                        type="text"
                        value={responsavelCpf}
                        onChange={e => {
                          setResponsavelCpf(formatarCPF(e.target.value));
                          if (erros.responsavelCpf) setErros(prev => ({ ...prev, responsavelCpf: '' }));
                        }}
                        maxLength={14}
                        className={`w-full h-10 px-3 rounded-xl border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono ${
                          erros.responsavelCpf ? 'border-destructive' : 'border-border'
                        }`}
                        placeholder="000.000.000-00"
                      />
                      {erros.responsavelCpf && (
                        <span className="text-xs text-destructive font-medium block">{erros.responsavelCpf}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 5: ADMINISTRAÇÃO E DEMANDA */}
          {abaAtiva === 'admin' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-border/60 pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Situação do Acompanhamento & Demanda Inicial
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Situação do Acompanhamento
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-medium"
                  >
                    <option value="novo">Triagem / Entrevistas Preliminares</option>
                    <option value="ativo">Em Análise / Regular</option>
                    <option value="recorrente">Frequência Recorrente</option>
                    <option value="inativo">Alta Clínica / Em Pausa</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-6">
                  <input
                    type="checkbox"
                    id="chk-vip-modal"
                    checked={vip}
                    onChange={e => setVip(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-ring size-4"
                  />
                  <label htmlFor="chk-vip-modal" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Caso Prioritário / Atenção Especial (VIP)
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Tags Clínicas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={e => setTagsStr(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="ex: divã, lacaniano, neurose-grave, presencial"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Demanda Inicial / Queixa Principal / Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y leading-relaxed"
                  placeholder="Descreva a queixa que motivou a busca, encaminhamentos ou hipóteses iniciais..."
                />
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
              <span>Dados protegidos pelo sigilo ético e isolamento da conta</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2 text-sm font-bold text-primary-foreground gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                <span>{pacienteExistente ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

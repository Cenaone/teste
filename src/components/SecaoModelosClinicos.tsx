/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Send,
  Activity,
  Brain,
  ShieldAlert,
  ClipboardList,
  BookOpen,
  Heart,
  Clock,
  SunMedium,
  Building2,
  FileBadge,
  FileSignature,
  Sparkles,
  FileCheck,
  Zap,
  HeartPulse,
  Search,
  Filter,
  Check,
  Copy,
  Printer,
  Download,
  Share2,
  AlertTriangle,
  User,
  Calendar,
  X,
  ExternalLink,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Card, Badge } from './ui-compact';
import { ModeloClinico, CategoriaModeloClinico, ItemEscala } from '../types/modelosClinicos';
import { MODELOS_CLINICOS_PADRAO } from '../data/modelosClinicos';
import { Analisando, PerfilAnalista, ConsultorioData, SessaoClinica } from '../types';
import { formatarData, formatarCPF, formatarTelefone } from '../utils/helpers';

interface SecaoModelosClinicosProps {
  analisandos: Analisando[];
  perfil: PerfilAnalista;
  consultorio: ConsultorioData;
  pacientePreSelecionadoId?: string | null;
  onSalvarNoProntuario?: (sessao: Partial<SessaoClinica>) => void;
  onNavegarPaciente?: (analisandoId: string) => void;
}

export default function SecaoModelosClinicos({
  analisandos,
  perfil,
  consultorio,
  pacientePreSelecionadoId,
  onSalvarNoProntuario,
  onNavegarPaciente
}: SecaoModelosClinicosProps) {
  // Filtro de Categoria e Busca
  const [categoriaAtiva, setCategoriaAtiva] = useState<'todos' | CategoriaModeloClinico>('todos');
  const [termoBusca, setTermoBusca] = useState('');

  // Modelo Selecionado para Uso/Preenchimento
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloClinico | null>(null);

  // Paciente selecionado para preenchimento
  const [pacienteId, setPacienteId] = useState<string>(pacientePreSelecionadoId || '');

  // Respostas da escala psicométrica (se for escala)
  const [respostasEscala, setRespostasEscala] = useState<Record<number, number>>({});

  // Texto editável do documento final
  const [textoPersonalizado, setTextoPersonalizado] = useState<string>('');

  // Feedback de ações
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Ref para impressão limpa
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Mapeamento de ícones
  const iconesMap: Record<string, React.ElementType> = {
    Send,
    Activity,
    Brain,
    ShieldAlert,
    FileText,
    ClipboardList,
    BookOpen,
    Heart,
    Clock,
    SunMedium,
    Building2,
    FileBadge,
    FileSignature,
    Sparkles,
    FileCheck,
    Zap,
    HeartPulse
  };

  // Paciente atualmente selecionado
  const pacienteAtual = useMemo(() => {
    return analisandos.find(p => p.id === pacienteId) || null;
  }, [analisandos, pacienteId]);

  // Modelos filtrados
  const modelosFiltrados = useMemo(() => {
    return MODELOS_CLINICOS_PADRAO.filter(m => {
      const correspondeCategoria = categoriaAtiva === 'todos' || m.categoria === categoriaAtiva;
      const correspondeBusca =
        m.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
        m.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
        m.badgeTexto.toLowerCase().includes(termoBusca.toLowerCase());
      return correspondeCategoria && correspondeBusca;
    });
  }, [categoriaAtiva, termoBusca]);

  // Contadores por categoria
  const contadores = useMemo(() => {
    return {
      todos: MODELOS_CLINICOS_PADRAO.length,
      documento: MODELOS_CLINICOS_PADRAO.filter(m => m.categoria === 'documento').length,
      anamnese_geral: MODELOS_CLINICOS_PADRAO.filter(m => m.categoria === 'anamnese_geral').length,
      anamnese_rotina: MODELOS_CLINICOS_PADRAO.filter(m => m.categoria === 'anamnese_rotina').length,
      formulario: MODELOS_CLINICOS_PADRAO.filter(m => m.categoria === 'formulario').length
    };
  }, []);

  // Cálculo de pontuação e interpretação para escalas
  const resultadoEscala = useMemo(() => {
    if (!modeloSelecionado || modeloSelecionado.tipoPreenchimento !== 'escala_psicometrica') {
      return null;
    }

    const itens = modeloSelecionado.itensEscala || [];
    let soma = 0;
    let respondidos = 0;
    let alertaCritico = false;

    itens.forEach(item => {
      const valor = respostasEscala[item.id];
      if (valor !== undefined) {
        soma += valor;
        respondidos++;
        if (item.critico && valor > 0) {
          alertaCritico = true;
        }
      }
    });

    // Encontrar faixa de interpretação
    const faixas = modeloSelecionado.interpretacaoEscore?.faixas || [];
    const faixaEncontrada = faixas.find(f => soma >= f.min && soma <= f.max);

    return {
      soma,
      respondidos,
      totalItens: itens.length,
      completo: respondidos === itens.length,
      alertaCritico,
      classificacao: faixaEncontrada?.classificacao || 'Aguardando respostas completas',
      cor: faixaEncontrada?.cor || 'text-muted-foreground bg-muted',
      recomendacao: faixaEncontrada?.recomendacaoClinica || ''
    };
  }, [modeloSelecionado, respostasEscala]);

  // Função para substituir placeholders no texto base
  const aplicarPlaceholders = (texto: string, paciente: Analisando | null) => {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const horaAtual = hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let resultado = texto;

    // Dados do Analisando
    resultado = resultado.replaceAll('[Nome do Paciente]', paciente?.nome || '________________________________________');
    resultado = resultado.replaceAll('[CPF]', paciente?.cpf ? formatarCPF(paciente.cpf) : '___.___.___-__');
    resultado = resultado.replaceAll('[Data de Nascimento]', paciente?.nascimento ? formatarData(paciente.nascimento) : '__/__/____');
    resultado = resultado.replaceAll('[Telefone]', paciente?.whatsapp ? formatarTelefone(paciente.whatsapp) : '(  ) _____-____');
    resultado = resultado.replaceAll('[Endereço]', paciente?.endereco || paciente?.cidade || 'Endereço não informado');

    // Idade calculada
    if (paciente?.nascimento) {
      const nasc = new Date(paciente.nascimento);
      const diff = hoje.getFullYear() - nasc.getFullYear();
      resultado = resultado.replaceAll('[Idade]', String(diff));
    } else {
      resultado = resultado.replaceAll('[Idade]', '__');
    }

    // Dados do Profissional / Consultório
    resultado = resultado.replaceAll('[Nome do Psicólogo]', perfil.nome || 'Psicólogo(a) Responsável');
    resultado = resultado.replaceAll('[CRP]', perfil.registroProfissional || '00/00000');
    resultado = resultado.replaceAll('[Nome da Clínica]', consultorio.nome || 'Consultório de Psicologia');
    resultado = resultado.replaceAll('[Cidade]', consultorio.cidade || 'São Paulo');
    resultado = resultado.replaceAll('[Endereço do Consultório]', consultorio.endereco || 'Endereço Profissional');
    resultado = resultado.replaceAll('[Telefone do Consultório]', formatarTelefone(consultorio.whatsapp) || '(11) 99999-9999');
    resultado = resultado.replaceAll('[E-mail do Consultório]', perfil.email || 'contato@consultorio.com');

    // Datas e horas
    resultado = resultado.replaceAll('[Data de Hoje]', dataFormatada);
    resultado = resultado.replaceAll('[Hora da Sessão]', horaAtual);

    return resultado;
  };

  // Abrir modelo
  const handleAbrirModelo = (modelo: ModeloClinico) => {
    setModeloSelecionado(modelo);
    setRespostasEscala({});
    const textoInicial = aplicarPlaceholders(modelo.textoBase, pacienteAtual);
    setTextoPersonalizado(textoInicial);
    setCopiado(false);
    setMensagemSucesso(null);
  };

  // Trocar paciente dentro do modal
  const handleMudarPaciente = (novoId: string) => {
    setPacienteId(novoId);
    const novoPaciente = analisandos.find(p => p.id === novoId) || null;
    if (modeloSelecionado) {
      let textoAtualizado = aplicarPlaceholders(modeloSelecionado.textoBase, novoPaciente);
      if (resultadoEscala) {
        textoAtualizado = textoAtualizado
          .replaceAll('[Escore]', String(resultadoEscala.soma))
          .replaceAll('[Classificação]', resultadoEscala.classificacao);
      }
      setTextoPersonalizado(textoAtualizado);
    }
  };

  // Responder item de escala psicométrica
  const handleResponderItem = (itemId: number, valor: number) => {
    const novasRespostas = { ...respostasEscala, [itemId]: valor };
    setRespostasEscala(novasRespostas);

    // Recalcular pontuação
    if (modeloSelecionado) {
      const itens = modeloSelecionado.itensEscala || [];
      let soma = 0;
      itens.forEach(item => {
        const v = novasRespostas[item.id];
        if (v !== undefined) soma += v;
      });
      const faixas = modeloSelecionado.interpretacaoEscore?.faixas || [];
      const faixa = faixas.find(f => soma >= f.min && soma <= f.max);
      const classificacao = faixa?.classificacao || 'Pontuação em andamento';

      // Atualizar no texto
      let texto = aplicarPlaceholders(modeloSelecionado.textoBase, pacienteAtual);
      texto = texto.replaceAll('[Escore]', String(soma)).replaceAll('[Classificação]', classificacao);
      setTextoPersonalizado(texto);
    }
  };

  // Copiar para área de transferência
  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoPersonalizado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
      setMensagemSucesso('Texto do documento copiado com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch {
      setMensagemSucesso('Selecione e copie o texto manualmente.');
    }
  };

  // Imprimir / Salvar em PDF
  const handleImprimir = () => {
    window.print();
  };

  // Salvar no prontuário do paciente selecionado
  const handleSalvarNoProntuario = () => {
    if (!pacienteAtual) {
      alert('Por favor, selecione um paciente para vincular este documento ao prontuário.');
      return;
    }

    if (onSalvarNoProntuario && modeloSelecionado) {
      const hoje = new Date().toISOString().split('T')[0];
      const resumoDoc = `[${modeloSelecionado.badgeTexto}] ${modeloSelecionado.titulo}\n${resultadoEscala ? `Escore: ${resultadoEscala.soma} - ${resultadoEscala.classificacao}\n` : ''}\n${textoPersonalizado}`;

      onSalvarNoProntuario({
        analisandoId: pacienteAtual.id,
        data: hoje,
        notasSessao: resumoDoc
      });

      setMensagemSucesso(`Documento anexado com sucesso ao prontuário de ${pacienteAtual.nome}!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border border-border p-6 rounded-2xl shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="size-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Modelos Clínicos, Documentos & Escalas
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                18 modelos completos em conformidade com o CFP, diretrizes NR-1 e escalas psicométricas com cálculo automático.
              </p>
            </div>
          </div>
        </div>

        {/* Busca rápida */}
        <div className="relative w-full md:w-80">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
            placeholder="Buscar por título, foco ou palavra..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
          />
          {termoBusca && (
            <button
              onClick={() => setTermoBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* FILTROS POR CATEGORIA (ABAS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setCategoriaAtiva('todos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            categoriaAtiva === 'todos'
              ? 'bg-foreground text-background shadow-xs'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          <span>Todos os Modelos</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-bold">
            {contadores.todos}
          </span>
        </button>

        <button
          onClick={() => setCategoriaAtiva('documento')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            categoriaAtiva === 'documento'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20'
          }`}
        >
          <span># Modelo de: Documento</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {contadores.documento}
          </span>
        </button>

        <button
          onClick={() => setCategoriaAtiva('anamnese_geral')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            categoriaAtiva === 'anamnese_geral'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20'
          }`}
        >
          <span># Modelo de: Anamnese geral</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {contadores.anamnese_geral}
          </span>
        </button>

        <button
          onClick={() => setCategoriaAtiva('anamnese_rotina')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            categoriaAtiva === 'anamnese_rotina'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
          }`}
        >
          <span># Modelo de: Anamnese de rotina</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {contadores.anamnese_rotina}
          </span>
        </button>

        <button
          onClick={() => setCategoriaAtiva('formulario')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            categoriaAtiva === 'formulario'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/20'
          }`}
        >
          <span># Modelo de: Formulário</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
            {contadores.formulario}
          </span>
        </button>
      </div>

      {/* FEEDBACK DE SUCESSO GLOBAL */}
      {mensagemSucesso && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* GRADE DOS 18 MODELOS (LAYOUT IDÊNTICO AO DO SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelosFiltrados.map(modelo => {
          const IconeComponente = iconesMap[modelo.icone] || FileText;

          // Definir cor de badge correspondente à imagem
          let badgeBg = 'bg-slate-800 text-white';
          if (modelo.categoria === 'documento') {
            badgeBg = 'bg-[#6D28D9] text-white'; // Roxo escuro CFP
          } else if (modelo.categoria === 'anamnese_geral') {
            badgeBg = 'bg-[#0D9488] text-white'; // Azul esverdeado / Teal
          } else if (modelo.categoria === 'anamnese_rotina') {
            badgeBg = 'bg-[#115E59] text-white'; // Teal escuro
          } else if (modelo.categoria === 'formulario') {
            badgeBg = 'bg-[#1E293B] text-white'; // Slate escuro
          }

          return (
            <Card
              key={modelo.id}
              className="p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/40 transition-all border border-border/80 group bg-card"
            >
              <div className="space-y-3">
                {/* Badge no topo idêntico ao modelo da imagem */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md tracking-tight ${badgeBg} shadow-xs inline-flex items-center gap-1.5`}
                  >
                    {modelo.badgeTexto}
                  </span>

                  {modelo.tipoPreenchimento === 'escala_psicometrica' && (
                    <span className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      Cálculo Auto
                    </span>
                  )}
                </div>

                {/* Título e Ícone */}
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="size-8 rounded-lg bg-muted/60 text-foreground grid place-items-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <IconeComponente className="size-4" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors">
                    {modelo.titulo}
                  </h3>
                </div>

                {/* Descrição fiel da imagem */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {modelo.descricao}
                </p>
              </div>

              {/* Botão de Ação */}
              <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {modelo.categoria === 'formulario' ? 'Instrumento' : 'Modelo Clínico'}
                </span>

                <button
                  onClick={() => handleAbrirModelo(modelo)}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Usar Modelo</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {modelosFiltrados.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl p-8 space-y-3">
          <ClipboardList className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-bold text-foreground text-sm">Nenhum modelo encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não encontramos nenhum formulário correspondente ao termo "{termoBusca}". Tente outra busca ou limpe os filtros.
          </p>
          <button
            onClick={() => {
              setTermoBusca('');
              setCategoriaAtiva('todos');
            }}
            className="text-xs text-primary font-bold hover:underline"
          >
            Limpar filtros de busca
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INTERATIVO DE PREENCHIMENTO E EXPORTAÇÃO DO MODELO */}
      {/* ========================================================================= */}
      {modeloSelecionado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in-50 zoom-in-95">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${modeloSelecionado.badgeClasse}`}
                >
                  {modeloSelecionado.badgeTexto}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground text-base truncate">
                    {modeloSelecionado.titulo}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {modeloSelecionado.descricao}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModeloSelecionado(null)}
                className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Barra de Seleção de Paciente & Parâmetros */}
            <div className="p-4 border-b border-border bg-background flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1">
                <User className="size-4 text-muted-foreground shrink-0" />
                <label className="font-semibold text-foreground whitespace-nowrap">
                  Vincular ao Paciente:
                </label>
                <select
                  value={pacienteId}
                  onChange={e => handleMudarPaciente(e.target.value)}
                  className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 flex-1 max-w-sm"
                >
                  <option value="">-- Preenchimento Avulso (Sem Paciente) --</option>
                  {analisandos.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} {a.cpf ? `(CPF: ${formatarCPF(a.cpf)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {pacienteAtual && (
                <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                  <span>Nascimento: <strong>{formatarData(pacienteAtual.nascimento)}</strong></span>
                  <span>•</span>
                  <span>WhatsApp: <strong>{formatarTelefone(pacienteAtual.whatsapp)}</strong></span>
                </div>
              )}
            </div>

            {/* Conteúdo Central do Modal (Rolável) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* CASO SEJA ESCALA PSICOMÉTRICA (BDI, BAI, ROSENBERG, QSG-12) */}
              {modeloSelecionado.tipoPreenchimento === 'escala_psicometrica' &&
                modeloSelecionado.itensEscala && (
                  <div className="space-y-5">
                    {/* Painel de Escore em Tempo Real */}
                    {resultadoEscala && (
                      <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity className="size-4 text-primary" />
                            <span className="font-bold text-foreground text-sm">
                              Pontuação Atual: {resultadoEscala.soma} pontos
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({resultadoEscala.respondidos} de {resultadoEscala.totalItens} respondidos)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {resultadoEscala.recomendacao}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${resultadoEscala.cor}`}
                          >
                            {resultadoEscala.classificacao}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Alerta Crítico (ex: Ideação suicida no BDI) */}
                    {resultadoEscala?.alertaCritico && (
                      <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-2.5 animate-pulse">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>
                          ALERTA CLÍNICO PRIORITÁRIO: Resposta positiva para risco / ideação detectada. Verifique suporte familiar, pactue plano de segurança e considere encaminhamento psiquiátrico de urgência.
                        </span>
                      </div>
                    )}

                    {/* Lista de Itens da Escala com Opções */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Questionário Interativo ({modeloSelecionado.itensEscala.length} Itens)
                      </h4>

                      {modeloSelecionado.itensEscala.map(item => {
                        const respostaAtual = respostasEscala[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              respostaAtual !== undefined
                                ? 'bg-card border-primary/30 shadow-2xs'
                                : 'bg-muted/10 border-border/60 hover:border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <span className="text-xs font-bold text-foreground">
                                {item.id}. {item.rotulo}
                              </span>
                              {item.critico && (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0">
                                  Item Crítico
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.opcoes?.map(op => {
                                const selecionado = respostaAtual === op.valor;
                                return (
                                  <button
                                    key={op.valor}
                                    type="button"
                                    onClick={() => handleResponderItem(item.id, op.valor)}
                                    className={`p-2.5 rounded-lg text-left text-xs transition-all flex items-start gap-2 cursor-pointer border ${
                                      selecionado
                                        ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-2xs'
                                        : 'bg-background hover:bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <span
                                      className={`size-4 rounded-full border grid place-items-center text-[10px] shrink-0 mt-0.5 ${
                                        selecionado
                                          ? 'border-primary bg-primary text-primary-foreground font-bold'
                                          : 'border-muted-foreground/40'
                                      }`}
                                    >
                                      {selecionado && <Check className="size-2.5 stroke-[3]" />}
                                    </span>
                                    <span className="flex-1 leading-snug">{op.texto}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* EDITOR DE TEXTO / DOCUMENTO COMPLETO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" />
                    <span>Texto do Documento Clínico (Editável para emissão ou arquivamento)</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Tags dinâmicas aplicadas automaticamente
                  </span>
                </div>

                <div
                  ref={printAreaRef}
                  className="bg-background rounded-xl border border-border p-4 focus-within:ring-2 focus-within:ring-primary/30"
                >
                  <textarea
                    rows={16}
                    value={textoPersonalizado}
                    onChange={e => setTextoPersonalizado(e.target.value)}
                    className="w-full bg-transparent text-xs text-foreground font-mono leading-relaxed focus:outline-hidden resize-y"
                    placeholder="Conteúdo do modelo..."
                  />
                </div>
              </div>
            </div>

            {/* Rodapé com Ações de Emissão, Impressão e Vínculo */}
            <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copiar texto para colar em qualquer aplicativo"
                >
                  {copiado ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimir}
                  className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Imprimir documento ou salvar em formato PDF"
                >
                  <Printer className="size-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {pacienteAtual ? (
                  <button
                    type="button"
                    onClick={handleSalvarNoProntuario}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="size-3.5" />
                    <span>Anexar ao Prontuário de {pacienteAtual.nome.split(' ')[0]}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      alert('Selecione um paciente na barra superior para anexar este documento diretamente ao prontuário.');
                    }}
                    className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold border border-border cursor-pointer hover:text-foreground"
                  >
                    <span>Vincular e Anexar ao Prontuário</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setModeloSelecionado(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

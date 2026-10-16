/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Analisando,
  ModalidadeAtendimento,
  SessaoClinica,
  Honorario,
  ModeloMensagem,
  TransmissaoInformativa,
  PerfilAnalista,
  ConsultorioData,
  RetornoStatus,
  AgendamentoClinico,
  UsuarioConta
} from './types';
import {
  MODALIDADES_PADRAO,
  ANALISANDOS_PADRAO,
  SESSOES_PADRAO,
  HONORARIOS_PADRAO,
  MODELOS_MENSAGENS_PADRAO,
  CAMPANHAS_PADRAO,
  PERFIL_PADRAO,
  CONSULTORIO_PADRAO,
  AGENDAMENTOS_PADRAO
} from './data/defaultData';
import {
  formatarMoeda,
  formatarData,
  diferencaDias,
  adicionarDias,
  abrirWhatsApp
} from './utils/helpers';
import ProntuarioModal from './components/ProntuarioModal';
import WhatsAppModal from './components/WhatsAppModal';
import GravadorSessao from './components/GravadorSessao';
import TelaAutenticacao from './components/TelaAutenticacao';
import TelaRedefinirSenha from './components/TelaRedefinirSenha';
import { Card, Badge } from './components/ui-compact';
import {
  Sparkles,
  Users,
  Compass,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Gift,
  AlertTriangle,
  RotateCcw,
  BarChart,
  Settings,
  Shield,
  ShieldCheck,
  Download,
  Upload,
  Database,
  FileCode,
  Trash2,
  Plus,
  Search,
  Check,
  ChevronRight,
  Pencil,
  Sun,
  Moon,
  LogOut,
  Send,
  Activity,
  Heart,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Key,
  Menu,
  X,
  Bot,
  TrendingUp
} from 'lucide-react';
import {
  getSupabase,
  obterUsuarioAutenticadoSupabase,
  fazerLogoutSupabase,
  consultarLicencaAssinante,
  solicitarRecuperacaoSenhaOficial
} from './lib/supabase';
import {
  salvarColecaoCofre,
  carregarColecaoCofre,
  carregarTodasColecoesCofre,
  salvarTodasColecoesCofre,
  carregarMetadadosCofre,
  salvarMetadadosCofre,
  consultarCotaArmazenamento,
  solicitarArmazenamentoPersistente
} from './lib/repositorioLocal';
import {
  ChaveiroCofre,
  derivarChaveCofre,
  gerarVerificadorCofre,
  validarSenhaCofre,
  base64ToBuffer
} from './lib/crypto';
import {
  exportarBackupCriptografado,
  importarBackupCriptografado
} from './lib/backupCofre';
import {
  inventariarDadosLegadosLocalStorage,
  migrarLegadoParaCofre,
  removerDadosLegadosConfirmados,
  InventarioLegado
} from './lib/migracaoLegada';
import { validarStatusLicenca } from './lib/licenca';
import CofreDesbloqueioModal from './components/CofreDesbloqueioModal';
import SecaoAdminSaas from './components/SecaoAdminSaas';
import SecaoBia from './components/SecaoBia';

const PREFIXO_LOCAL = 'psi40_';
const PALETAS_COR = [
  { id: 'verde-claro', label: 'Verde Clínico', swatch: '#16A34A' },
  { id: 'verde-escuro', label: 'Rosa Terapêutico', swatch: '#EC4899' },
  { id: 'roxo', label: 'Roxo Psicanálise', swatch: '#7C3AED' },
  { id: 'azul', label: 'Azul Neutro', swatch: '#2563EB' },
  { id: 'dourado', label: 'Dourado Escuta', swatch: '#c5a059' },
  { id: 'carbon', label: 'Cinza Carbon', swatch: '#1F2937' },
  { id: 'terracota', label: 'Terracota Argila', swatch: '#D2691E' },
  { id: 'turquesa', label: 'Turquesa Mente', swatch: '#14B8A6' },
  { id: 'vinho', label: 'Vinho Clássico', swatch: '#800020' },
  { id: 'lavanda', label: 'Lavanda Calm', swatch: '#A78BFA' }
];

const SECTIONS = [
  { id: 'dashboard', label: 'Painel Geral', icon: BarChart, category: 'Clínica' },
  { id: 'analisandos', label: 'Meus Pacientes', icon: Users, category: 'Clínica' },
  { id: 'agenda', label: 'Agenda Clínica', icon: Calendar, category: 'Clínica' },
  { id: 'sessoes', label: 'Sessões Realizadas', icon: Clock, category: 'Clínica' },
  { id: 'modalidades', label: 'Modalidades de Sessão', icon: Briefcase, category: 'Clínica' },
  { id: 'relatorios', label: 'Relatórios & Métricas', icon: TrendingUp, category: 'Clínica' },

  { id: 'previstos', label: 'Retornos Previstos', icon: Activity, category: 'Setting' },
  { id: 'acompanhamento', label: 'Acompanhamento Crítico', icon: Heart, category: 'Setting' },
  { id: 'aniversariantes', label: 'Aniversariantes', icon: Gift, category: 'Setting' },
  { id: 'honorarios', label: 'Gestão de Honorários', icon: DollarSign, category: 'Setting' },
  { id: 'reativacao', label: 'Reativação de Pausas', icon: RotateCcw, category: 'Setting' },

  { id: 'bia', label: 'Assistente Bia (IA)', icon: Bot, category: 'Comunicação' },
  { id: 'transmissoes', label: 'Transmissões & Grupos', icon: Compass, category: 'Comunicação' },
  { id: 'modelos', label: 'Modelos de Mensagem', icon: MessageSquare, category: 'Comunicação' },

  { id: 'analista', label: 'Meu Perfil', icon: FileText, category: 'Configurações' },
  { id: 'consultorio', label: 'Dados do Consultório', icon: Settings, category: 'Configurações' },
  { id: 'backup', label: 'Backup & Banco Local', icon: Database, category: 'Configurações' },
];

export default function App() {
  // Authentication & Account State (Nuvem - Supabase Auth)
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [contaUsuario, setContaUsuario] = useState<{
    id: string;
    email: string;
    nomeCompleto: string;
    crp?: string;
    isAdmin?: boolean;
    role?: string;
    status?: string;
    plano?: string;
    validoAte?: string;
  } | null>(null);

  // Cofre Criptográfico Local (Web Crypto AES-GCM 256)
  const [cofreConfigurado, setCofreConfigurado] = useState(false);
  const [cofreDesbloqueado, setCofreDesbloqueado] = useState(false);
  const [chaveiroCofre, setChaveiroCofre] = useState<ChaveiroCofre | null>(null);
  const [solicitandoDesbloqueio, setSolicitandoDesbloqueio] = useState(false);

  // Licença SaaS (Nuvem)
  const [licencaSaas, setLicencaSaas] = useState<any | null>(null);
  const [statusLicenca, setStatusLicenca] = useState({ valida: true, apenasLeitura: false, motivo: '' });

  // Migração e Inventário de Dados Legados
  const [inventarioLegado, setInventarioLegado] = useState<InventarioLegado | null>(null);
  const [mostrarModalMigracao, setMostrarModalMigracao] = useState(false);
  const [migrandoLegado, setMigrandoLegado] = useState(false);

  // Cota de Armazenamento do Navegador
  const [cotaArmazenamento, setCotaArmazenamento] = useState({
    suportado: false,
    usadoBytes: 0,
    totalBytes: 0,
    percentualUsado: 0,
    persistido: false
  });

  // Theme & Palette State (Preferências Não Sensíveis no LocalStorage)
  const [temaEscuro, setTemaEscuro] = useState(() => {
    const salvo = localStorage.getItem(`${PREFIXO_LOCAL}tema`);
    return salvo ? salvo === 'dark' : true;
  });
  const [paletaSelecionada, setPaletaSelecionada] = useState(() => {
    return localStorage.getItem(`${PREFIXO_LOCAL}paleta`) || 'dourado';
  });

  // Active Panel Section State
  const [secaoAtiva, setSecaoAtiva] = useState('dashboard');
  const podeGerenciarAcessos = Boolean(
    contaUsuario?.isAdmin ||
    contaUsuario?.role === 'admin' ||
    contaUsuario?.email?.toLowerCase() === 'sup.fin.adm@gmail.com'
  );
  const secoesDisponiveis = podeGerenciarAcessos
    ? [...SECTIONS, { id: 'admin_users', label: 'Validação de Acessos & Assinaturas', icon: ShieldCheck, category: 'Configurações' }]
    : SECTIONS;

  // DB States Clínicos (Armazenados exclusivamente no Cofre Local do Usuário)
  const [analisandos, setAnalisandos] = useState<Analisando[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeAtendimento[]>([]);
  const [sessoes, setSessoes] = useState<SessaoClinica[]>([]);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [modelos, setModelos] = useState<ModeloMensagem[]>([]);
  const [transmissoes, setTransmissoes] = useState<TransmissaoInformativa[]>([]);
  const [perfil, setPerfil] = useState<PerfilAnalista>(PERFIL_PADRAO);
  const [consultorio, setConsultorio] = useState<ConsultorioData>(CONSULTORIO_PADRAO);
  const [retornoStatus, setRetornoStatus] = useState<RetornoStatus[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoClinico[]>([]);

  // Modals & UI States
  const [mostrarFormAgendamento, setMostrarFormAgendamento] = useState(false);
  const [agendamentoForm, setAgendamentoForm] = useState<AgendamentoClinico | null>(null);
  const [analisandoFiltro, setAnalisandoFiltro] = useState('');
  const [filtroCasoPrioritario, setFiltroCasoPrioritario] = useState(false);
  const [prontuarioSelecionado, setProntuarioSelecionado] = useState<Analisando | null>(null);
  const [whatsappAlvo, setWhatsappAlvo] = useState<{
    analisando: Analisando;
    valor?: number;
    data?: string;
    servico?: string;
  } | null>(null);

  // Edit / Form States
  const [mostrarFormAnalisando, setMostrarFormAnalisando] = useState(false);
  const [analisandoForm, setAnalisandoForm] = useState<Analisando | null>(null);
  const [mostrarFormSessao, setMostrarFormSessao] = useState(false);
  const [sessaoForm, setSessaoForm] = useState<SessaoClinica | null>(null);
  const [mostrarFormModalidade, setMostrarFormModalidade] = useState(false);
  const [modalidadeForm, setModalidadeForm] = useState<ModalidadeAtendimento | null>(null);
  const [mostrarFormHonorario, setMostrarFormHonorario] = useState(false);
  const [honorarioForm, setHonorarioForm] = useState<Honorario | null>(null);
  const [mostrarFormModelo, setMostrarFormModelo] = useState(false);
  const [modeloForm, setModeloForm] = useState<ModeloMensagem | null>(null);
  const [mostrarFormTransmissao, setMostrarFormTransmissao] = useState(false);
  const [transmissaoForm, setTransmissaoForm] = useState<TransmissaoInformativa | null>(null);

  // Agenda states
  const [agendaVisualizacao, setAgendaVisualizacao] = useState<'lista' | 'semana'>('semana');
  const [agendaFiltroStatus, setAgendaFiltroStatus] = useState<string>('todos');

  // Menu Celular
  const [menuCelularAberto, setMenuCelularAberto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inatividade para bloqueio automático do cofre (15 minutos)
  const timerInatividadeRef = useRef<any>(null);

  const redefinirTimerInatividade = () => {
    if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);
    timerInatividadeRef.current = setTimeout(() => {
      if (cofreDesbloqueado) {
        setChaveiroCofre(null);
        setCofreDesbloqueado(false);
        setSolicitandoDesbloqueio(true);
      }
    }, 15 * 60 * 1000);
  };

  useEffect(() => {
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => redefinirTimerInatividade();
    eventos.forEach(ev => window.addEventListener(ev, handler));
    return () => {
      eventos.forEach(ev => window.removeEventListener(ev, handler));
      if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);
    };
  }, [cofreDesbloqueado]);

  // Consulta cota de armazenamento na montagem
  useEffect(() => {
    consultarCotaArmazenamento().then(setCotaArmazenamento).catch(() => {});
  }, []);

  // Monitora autenticação na nuvem (Supabase Auth oficial)
  useEffect(() => {
    (async () => {
      try {
        const usuarioServer = await obterUsuarioAutenticadoSupabase();
        if (usuarioServer && usuarioServer.id) {
          setContaUsuario(usuarioServer);
          setUsuarioAutenticado(true);
          await verificarCofreUsuario(usuarioServer.id);
        }
      } catch (err) {
        console.warn('Verificação de sessão Supabase Auth:', err);
      }
    })();
  }, []);

  // Verifica existência de metadados do cofre para a conta autenticada
  const verificarCofreUsuario = async (accountId: string, senhaTentativa?: string) => {
    try {
      const meta = await carregarMetadadosCofre(accountId);

      // Consulta licença SaaS na nuvem
      const licenca = await consultarLicencaAssinante(accountId);
      if (licenca) {
        setLicencaSaas(licenca);
        const st = validarStatusLicenca(licenca);
        setStatusLicenca(st);
      }

      // Se foi fornecida senha na autenticação, tenta auto-desbloqueio ou auto-criação do cofre
      if (senhaTentativa) {
        if (meta && meta.vaultHash) {
          const valida = await validarSenhaCofre(senhaTentativa, meta.vaultSalt, meta.vaultHash);
          if (valida) {
            const chaveiro = await derivarChaveCofre(senhaTentativa, base64ToBuffer(meta.vaultSalt));
            setChaveiroCofre(chaveiro);
            const dadosCofre = await carregarTodasColecoesCofre(accountId, chaveiro);
            setAnalisandos(dadosCofre.analisandos || []);
            setModalidades(dadosCofre.modalidades || MODALIDADES_PADRAO);
            setSessoes(dadosCofre.sessoes || []);
            setHonorarios(dadosCofre.honorarios || []);
            setModelos(dadosCofre.modelos || MODELOS_MENSAGENS_PADRAO);
            setTransmissoes(dadosCofre.transmissoes || CAMPANHAS_PADRAO);
            setPerfil(dadosCofre.perfil || PERFIL_PADRAO);
            setConsultorio(dadosCofre.consultorio || CONSULTORIO_PADRAO);
            setAgendamentos(dadosCofre.agendamentos || []);
            setCofreConfigurado(true);
            setCofreDesbloqueado(true);
            setSolicitandoDesbloqueio(false);
            redefinirTimerInatividade();
            return;
          }
        } else {
          // Cofre ainda não inicializado para esta conta: inicializa automaticamente com a senha do login!
          await handleCriarSenhaCofre(senhaTentativa);
          return;
        }
      }

      if (meta && meta.vaultHash) {
        setCofreConfigurado(true);
      } else {
        setCofreConfigurado(false);
      }
      setSolicitandoDesbloqueio(true);

      // Inventaria dados legados no navegador para oferecer migração
      const inv = inventariarDadosLegadosLocalStorage();
      if (inv.temDados) {
        setInventarioLegado(inv);
        setMostrarModalMigracao(true);
      }
    } catch (err) {
      console.warn('Erro ao verificar cofre do usuário:', err);
    }
  };

  // Inicializa a senha do cofre local
  const handleCriarSenhaCofre = async (senha: string) => {
    if (!contaUsuario?.id) return { ok: false, erro: 'Conta de usuário não identificada.' };

    try {
      const verificador = await gerarVerificadorCofre(senha);
      const chaveiro = await derivarChaveCofre(senha, base64ToBuffer(verificador.salt));

      await salvarMetadadosCofre({
        accountId: contaUsuario.id,
        vaultSalt: verificador.salt,
        vaultHash: verificador.hash,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        revisao: 1
      });

      // Se for a primeira inicialização do cofre e não houver registros, carrega os padrões clínicos locais
      const dadosIniciais = {
        analisandos: ANALISANDOS_PADRAO,
        modalidades: MODALIDADES_PADRAO,
        sessoes: SESSOES_PADRAO,
        honorarios: HONORARIOS_PADRAO,
        modelos: MODELOS_MENSAGENS_PADRAO,
        transmissoes: CAMPANHAS_PADRAO,
        perfil: PERFIL_PADRAO,
        consultorio: CONSULTORIO_PADRAO,
        agendamentos: AGENDAMENTOS_PADRAO
      };

      await salvarTodasColecoesCofre(contaUsuario.id, dadosIniciais, chaveiro);

      setAnalisandos(ANALISANDOS_PADRAO);
      setModalidades(MODALIDADES_PADRAO);
      setSessoes(SESSOES_PADRAO);
      setHonorarios(HONORARIOS_PADRAO);
      setModelos(MODELOS_MENSAGENS_PADRAO);
      setTransmissoes(CAMPANHAS_PADRAO);
      setPerfil(PERFIL_PADRAO);
      setConsultorio(CONSULTORIO_PADRAO);
      setAgendamentos(AGENDAMENTOS_PADRAO);

      setChaveiroCofre(chaveiro);
      setCofreConfigurado(true);
      setCofreDesbloqueado(true);
      setSolicitandoDesbloqueio(false);

      return { ok: true };
    } catch (err: any) {
      return { ok: false, erro: err.message };
    }
  };

  // Desbloqueia o cofre local da conta com a senha fornecida
  const handleDesbloquearCofre = async (senha: string) => {
    if (!contaUsuario?.id) return { ok: false, erro: 'Conta não autenticada.' };

    try {
      const meta = await carregarMetadadosCofre(contaUsuario.id);
      if (!meta) {
        return { ok: false, erro: 'Cofre ainda não configurado para esta conta.' };
      }

      const valida = await validarSenhaCofre(senha, meta.vaultSalt, meta.vaultHash);
      if (!valida) {
        return { ok: false, erro: 'Senha do cofre incorreta. Acesso aos prontuários bloqueado.' };
      }

      const chaveiro = await derivarChaveCofre(senha, base64ToBuffer(meta.vaultSalt));
      setChaveiroCofre(chaveiro);

      // Carrega coleções do repositório local
      const dadosCofre = await carregarTodasColecoesCofre(contaUsuario.id, chaveiro);

      setAnalisandos(dadosCofre.analisandos || []);
      setModalidades(dadosCofre.modalidades || MODALIDADES_PADRAO);
      setSessoes(dadosCofre.sessoes || []);
      setHonorarios(dadosCofre.honorarios || []);
      setModelos(dadosCofre.modelos || MODELOS_MENSAGENS_PADRAO);
      setTransmissoes(dadosCofre.transmissoes || CAMPANHAS_PADRAO);
      setPerfil(dadosCofre.perfil || PERFIL_PADRAO);
      setConsultorio(dadosCofre.consultorio || CONSULTORIO_PADRAO);
      setAgendamentos(dadosCofre.agendamentos || []);

      setCofreDesbloqueado(true);
      setSolicitandoDesbloqueio(false);
      redefinirTimerInatividade();

      return { ok: true };
    } catch (err: any) {
      return { ok: false, erro: err.message };
    }
  };

  // Gravação exclusiva no Repositório Local (IndexedDB com isolamento por ID de conta e AES-GCM)
  const salvarDadosLocal = async (chave: string, dados: any) => {
    if (!contaUsuario?.id || !chaveiroCofre) {
      console.warn('Tentativa de gravação com cofre bloqueado ou sem identidade de conta.');
      return;
    }

    try {
      await salvarColecaoCofre(contaUsuario.id, chave, dados, chaveiroCofre);
    } catch (err) {
      console.error(`Erro ao gravar coleção ${chave} no cofre local:`, err);
    }
  };
  // Setters com persistência transacional exclusiva no cofre local
  const atualizarAnalisandos = (novos: Analisando[]) => {
    setAnalisandos(novos);
    salvarDadosLocal('analisandos', novos);
  };

  const atualizarSessoes = (novos: SessaoClinica[]) => {
    setSessoes(novos);
    salvarDadosLocal('sessoes', novos);
  };

  const atualizarAgendamentos = (novos: AgendamentoClinico[]) => {
    setAgendamentos(novos);
    salvarDadosLocal('agendamentos', novos);
  };

  const atualizarModalidades = (novos: ModalidadeAtendimento[]) => {
    setModalidades(novos);
    salvarDadosLocal('modalidades', novos);
  };

  const atualizarHonorarios = (novos: Honorario[]) => {
    setHonorarios(novos);
    salvarDadosLocal('honorarios', novos);
  };

  const atualizarModelos = (novos: ModeloMensagem[]) => {
    setModelos(novos);
    salvarDadosLocal('modelos', novos);
  };

  const atualizarTransmissoes = (novos: TransmissaoInformativa[]) => {
    setTransmissoes(novos);
    salvarDadosLocal('transmissoes', novos);
  };

  const atualizarPerfil = (novo: PerfilAnalista) => {
    setPerfil(novo);
    salvarDadosLocal('perfil', novo);
  };

  const atualizarConsultorio = (novo: ConsultorioData) => {
    setConsultorio(novo);
    salvarDadosLocal('consultorio', novo);
  };

  // Toggle Dark Mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', temaEscuro);
    localStorage.setItem(`${PREFIXO_LOCAL}tema`, temaEscuro ? 'dark' : 'light');
  }, [temaEscuro]);

  // Apply Palette selection
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', paletaSelecionada);
    localStorage.setItem(`${PREFIXO_LOCAL}paleta`, paletaSelecionada);
  }, [paletaSelecionada]);

  // General Calculated Stats
  const dashboardStats = useMemo(() => {
    const ativos = analisandos.filter(a => a.status === 'ativo').length;
    const novos = analisandos.filter(a => a.status === 'novo').length;
    const recorrentes = analisandos.filter(a => a.status === 'recorrente').length;
    const inativos = analisandos.filter(a => a.status === 'inativo').length;

    const totalFaturamento = sessoes
      .filter(s => s.pagamentoStatus === 'pago')
      .reduce((sum, s) => sum + s.valorCobrado, 0);

    const ticketMedio = sessoes.length
      ? totalFaturamento / sessoes.length
      : 0;

    const hojeStr = new Date().toISOString().slice(0, 10);
    const retornosHoje = sessoes.filter(s => s.proximaSessaoData && s.proximaSessaoData.slice(0, 10) === hojeStr).length;

    const honorariosPendentes = honorarios.filter(h => h.status !== 'pago').length;

    const acompanhamentosCriticos = sessoes.filter(s => {
      // Cases with less than 5 days interval needing critical review
      const dias = s.proximaSessaoData ? diferencaDias(s.data, s.proximaSessaoData) : 7;
      return dias <= 3;
    }).length;

    // Monthly Session Stats
    const volumeSessoesMes = sessoes.filter(s => s.data.slice(5, 7) === String(new Date().getMonth() + 1).padStart(2, '0')).length;

    return {
      ativos,
      novos,
      recorrentes,
      inativos,
      totalFaturamento,
      ticketMedio,
      retornosHoje,
      honorariosPendentes,
      acompanhamentosCriticos,
      volumeSessoesMes
    };
  }, [analisandos, sessoes, honorarios]);

  // Kanban Filtered Analisandos
  const analisandosFiltrados = useMemo(() => {
    return analisandos.filter(a => {
      if (filtroCasoPrioritario && !a.vip) return false;
      if (analisandoFiltro) {
        const busca = analisandoFiltro.toLowerCase();
        return (
          a.nome.toLowerCase().includes(busca) ||
          a.whatsapp.includes(busca) ||
          a.tags.some(t => t.toLowerCase().includes(busca))
        );
      }
      return true;
    });
  }, [analisandos, analisandoFiltro, filtroCasoPrioritario]);

  // Log new WhatsApp message sent
  const handleMensagemEnviada = (analisandoId: string, texto: string, tipo: string) => {
    const novosAnalisandos = analisandos.map(a => {
      if (a.id === analisandoId) {
        const novaMensagem = {
          id: `${Date.now()}`,
          data: new Date().toISOString(),
          tipo,
          texto
        };
        return {
          ...a,
          mensagensEnviadas: [novaMensagem, ...(a.mensagensEnviadas || [])]
        };
      }
      return a;
    });
    atualizarAnalisandos(novosAnalisandos);
  };

  // Drag and drop handler for Kanban
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, novoStatus: 'novo' | 'ativo' | 'recorrente' | 'inativo') => {
    const id = e.dataTransfer.getData('text/plain');
    const novosAnalisandos = analisandos.map(a => {
      if (a.id === id) {
        return { ...a, status: novoStatus };
      }
      return a;
    });
    atualizarAnalisandos(novosAnalisandos);
  };

  // Gerenciamento do Cofre Local
  const handleResetarDadosDemo = async () => {
    if (!contaUsuario?.id || !chaveiroCofre) {
      alert('O cofre local precisa estar desbloqueado.');
      return;
    }
    if (window.confirm('Isso carregará dados demonstrativos no seu cofre local criptografado. Deseja continuar?')) {
      await atualizarAnalisandos(ANALISANDOS_PADRAO);
      await atualizarModalidades(MODALIDADES_PADRAO);
      await atualizarSessoes(SESSOES_PADRAO);
      await atualizarHonorarios(HONORARIOS_PADRAO);
      await atualizarModelos(MODELOS_MENSAGENS_PADRAO);
      await atualizarTransmissoes(CAMPANHAS_PADRAO);
      await atualizarPerfil(PERFIL_PADRAO);
      await atualizarConsultorio(CONSULTORIO_PADRAO);
      await atualizarAgendamentos(AGENDAMENTOS_PADRAO as AgendamentoClinico[]);
      alert('Dados demonstrativos carregados com sucesso no seu cofre local!');
    }
  };

  const handleLimparDados = async () => {
    if (!contaUsuario?.id || !chaveiroCofre) {
      alert('O cofre local precisa estar desbloqueado.');
      return;
    }
    if (window.confirm('Tem certeza de que deseja apagar permanentemente os pacientes e prontuários do seu cofre local?')) {
      await atualizarAnalisandos([]);
      await atualizarSessoes([]);
      await atualizarModalidades([]);
      await atualizarHonorarios([]);
      await atualizarTransmissoes([]);
      await atualizarAgendamentos([]);
      alert('Cofre local limpo com sucesso.');
    }
  };

  // Exportar Backup Criptografado com integridade e isolamento de segredos
  const handleExportarJSON = async () => {
    if (!contaUsuario?.id || !chaveiroCofre) {
      alert('O cofre local precisa estar desbloqueado para exportar um backup.');
      return;
    }

    try {
      const dadosAtuais = {
        analisandos,
        modalidades,
        sessoes,
        honorarios,
        modelos,
        transmissoes,
        perfil,
        consultorio,
        agendamentos,
        exportadoEm: new Date().toISOString()
      };

      const backup = await exportarBackupCriptografado(
        contaUsuario.id,
        contaUsuario.email,
        dadosAtuais,
        chaveiroCofre
      );

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `psi40-backup-criptografado-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Erro ao gerar backup criptografado: ${err.message}`);
    }
  };

  // Importar Backup com escolha explícita (Substituir vs Mesclar), validação Zod e confirmação
  const handleImportarJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!contaUsuario?.id || !chaveiroCofre) {
      alert('Desbloqueie o cofre local antes de restaurar qualquer arquivo de backup.');
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const conteudoBruto = JSON.parse(event.target?.result as string);
        const resultado = await importarBackupCriptografado(conteudoBruto, chaveiroCofre);

        if (!resultado.ok || !resultado.dados) {
          alert(`Falha ao restaurar backup: ${resultado.mensagem}`);
          e.target.value = '';
          return;
        }

        const dadosRestaurados = resultado.dados;
        const modoSubstituir = window.confirm(
          'Deseja SUBSTITUIR os registros locais atuais pelos dados deste backup?\n\n' +
          'Clique em "OK" para SUBSTITUIR completamente a base atual.\n' +
          'Clique em "Cancelar" para MESCLAR com os registros já existentes.'
        );

        if (modoSubstituir) {
          if (!window.confirm('Confirmação final: Todos os dados atuais que não estiverem no backup serão substituídos. Deseja prosseguir?')) {
            e.target.value = '';
            return;
          }
          if (dadosRestaurados.analisandos) atualizarAnalisandos(dadosRestaurados.analisandos);
          if (dadosRestaurados.modalidades) atualizarModalidades(dadosRestaurados.modalidades);
          if (dadosRestaurados.sessoes) atualizarSessoes(dadosRestaurados.sessoes);
          if (dadosRestaurados.honorarios) atualizarHonorarios(dadosRestaurados.honorarios);
          if (dadosRestaurados.modelos) atualizarModelos(dadosRestaurados.modelos);
          if (dadosRestaurados.transmissoes) atualizarTransmissoes(dadosRestaurados.transmissoes);
          if (dadosRestaurados.perfil) atualizarPerfil(dadosRestaurados.perfil);
          if (dadosRestaurados.consultorio) atualizarConsultorio(dadosRestaurados.consultorio);
          if (dadosRestaurados.agendamentos) atualizarAgendamentos(dadosRestaurados.agendamentos);
        } else {
          // Mesclar
          if (Array.isArray(dadosRestaurados.analisandos)) {
            const mapa = new Map(analisandos.map(a => [a.id, a]));
            dadosRestaurados.analisandos.forEach((a: any) => mapa.set(a.id, a));
            atualizarAnalisandos(Array.from(mapa.values()) as Analisando[]);
          }
          if (Array.isArray(dadosRestaurados.sessoes)) {
            const mapa = new Map(sessoes.map(s => [s.id, s]));
            dadosRestaurados.sessoes.forEach((s: any) => mapa.set(s.id, s));
            atualizarSessoes(Array.from(mapa.values()) as SessaoClinica[]);
          }
          if (Array.isArray(dadosRestaurados.honorarios)) {
            const mapa = new Map(honorarios.map(h => [h.id, h]));
            dadosRestaurados.honorarios.forEach((h: any) => mapa.set(h.id, h));
            atualizarHonorarios(Array.from(mapa.values()) as Honorario[]);
          }
        }

        alert('Restauração transacional concluída com sucesso no seu cofre local!');
        setSecaoAtiva('dashboard');
      } catch (err: any) {
        alert(`Erro na leitura do arquivo: ${err.message}`);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Monitoramento e validação de sessão nativa via Supabase Auth no servidor
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Verifica se já existe uma sessão ativa válida no servidor
    (async () => {
      try {
        const usuarioServer = await obterUsuarioAutenticadoSupabase();
        if (usuarioServer && usuarioServer.id) {
          setContaUsuario(usuarioServer);
          setUsuarioAutenticado(true);
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão Supabase Auth:', err);
      }
    })();

    // 2. Escuta alterações em tempo real no estado de autenticação do Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const usuarioServer = await obterUsuarioAutenticadoSupabase();
        if (usuarioServer && usuarioServer.id) {
          setContaUsuario(usuarioServer);
          setUsuarioAutenticado(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setUsuarioAutenticado(false);
        setContaUsuario(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fazerLogoutSupabase();
    } catch (err) {
      console.warn('Erro ao deslogar do Supabase:', err);
    }
    // Limpeza de chaves em memória e bloqueio do cofre
    setChaveiroCofre(null);
    setCofreDesbloqueado(false);
    setContaUsuario(null);
    setUsuarioAutenticado(false);
    setSecaoAtiva('dashboard');
    setProntuarioSelecionado(null);
    setMostrarFormAnalisando(false);
    setMostrarFormSessao(false);
    setMostrarFormAgendamento(false);
    if (timerInatividadeRef.current) clearTimeout(timerInatividadeRef.current);
  };

  if (!usuarioAutenticado || !contaUsuario) {
    return (
      <TelaAutenticacao
        onLoginSucesso={async (usuario, senhaUtilizada) => {
          setContaUsuario(usuario);
          setUsuarioAutenticado(true);
          await verificarCofreUsuario(usuario.id, senhaUtilizada);
        }}
        temaEscuro={temaEscuro}
        onToggleTema={() => setTemaEscuro(!temaEscuro)}
      />
    );
  }

  // Se a conta está autenticada mas o cofre local ainda não foi desbloqueado com a senha do cofre
  if (!cofreDesbloqueado) {
    return (
      <CofreDesbloqueioModal
        estaConfigurado={cofreConfigurado}
        onDesbloquear={handleDesbloquearCofre}
        onCriarSenhaCofre={handleCriarSenhaCofre}
        emailUsuario={contaUsuario.email}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200">
      {/* MOBILE HEADER */}
      <header className="flex md:hidden items-center justify-between px-5 py-3.5 bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary grid place-items-center text-primary-foreground shadow-sm shrink-0">
            <Activity className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight text-foreground">
              {secoesDisponiveis.find(s => s.id === secaoAtiva)?.label || 'PSi4.0'}
            </div>
            <div className="text-[9px] uppercase font-bold tracking-wider text-primary">PSi4.0 Setting</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick backup button */}
          <button
            onClick={handleExportarJSON}
            className="size-8 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all flex items-center justify-center shrink-0"
            title="Fazer Backup"
          >
            <Download className="size-4" />
          </button>

          <button
            onClick={() => setMenuCelularAberto(!menuCelularAberto)}
            className="size-8 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shrink-0"
            aria-label="Abrir Menu"
          >
            {menuCelularAberto ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE DROPDOWN MENU (MENU SUSPENSO) */}
      {menuCelularAberto && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bottom-0 z-30 bg-background/98 backdrop-blur-lg flex flex-col justify-between p-5 animate-in slide-in-from-top-4 duration-200 border-b border-border overflow-y-auto shadow-2xl">
          <div className="space-y-5">
            <nav className="space-y-5">
              {['Clínica', 'Setting', 'Comunicação', 'Configurações'].map(categoria => {
                const items = secoesDisponiveis.filter(s => s.category === categoria);
                return (
                  <div key={categoria} className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60 px-2 font-mono">
                      {categoria}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {items.map(item => {
                        const Icon = item.icon;
                        const ativo = secaoAtiva === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSecaoAtiva(item.id);
                              setMenuCelularAberto(false);
                            }}
                            className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all active:scale-95 duration-100 ${
                              ativo
                                ? 'bg-primary text-primary-foreground shadow-md font-bold'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-border/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon className={`size-3.5 shrink-0 ${ativo ? 'text-primary-foreground' : 'text-primary/70'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-border pt-5 mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-primary/10 grid place-items-center text-primary text-xs font-bold border border-primary/20 overflow-hidden shrink-0">
                {perfil.avatar ? (
                  <img src={perfil.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  perfil.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div className="leading-none min-w-0">
                <div className="font-bold text-xs truncate text-foreground">{perfil.nome}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {perfil.registroProfissional || 'Analista'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTemaEscuro(!temaEscuro)}
                className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-90 shrink-0"
                title="Alternar Tema"
              >
                {temaEscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={() => {
                  setMenuCelularAberto(false);
                  handleLogout();
                }}
                className="p-2 rounded-lg border border-border bg-card text-destructive hover:bg-destructive/10 transition-all active:scale-90 shrink-0"
                title="Sair do Setting"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-64 bg-card border-r border-border shrink-0 flex-col justify-between">
        <div>
          {/* LOGO */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="size-10 rounded-xl gradient-emerald grid place-items-center text-primary-foreground shadow-md">
              <Activity className="size-6" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-lg tracking-tight text-foreground">PSi4.0</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-primary">Psicanálise Clínica</div>
            </div>
          </div>

          {/* SESSIONS & NAVIGATION */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[70vh]">
            {['Clínica', 'Setting', 'Comunicação', 'Configurações'].map(categoria => {
              const items = secoesDisponiveis.filter(s => s.category === categoria);
              return (
                <div key={categoria} className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-3">
                    {categoria}
                  </span>
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon;
                      const ativo = secaoAtiva === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSecaoAtiva(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            ativo
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <Icon className="size-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* PROFILE AT BOTTOM */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-primary/10 grid place-items-center text-primary text-sm font-bold border border-primary/20 overflow-hidden">
              {perfil.avatar ? (
                <img src={perfil.avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                perfil.nome.charAt(0).toUpperCase()
              )}
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-semibold text-xs truncate max-w-[110px]">{perfil.nome}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">
                {perfil.registroProfissional || 'Analista'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTemaEscuro(!temaEscuro)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all animate-none"
              title="Alternar Tema"
              aria-label="Alternar Tema"
            >
              {temaEscuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
              title="Sair do Setting"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md hidden md:flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {secoesDisponiveis.find(s => s.id === secaoAtiva)?.label || 'PSi4.0'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Setting stats in banner */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{dashboardStats.ativos} pacientes ativos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>{dashboardStats.retornosHoje} agendados hoje</span>
              </div>
            </div>

            {/* Status do Cofre */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Shield className="size-3.5" />
              <span>Cofre Local Ativo</span>
            </div>

            {/* Quick backup button */}
            <button
              onClick={handleExportarJSON}
              className="text-xs px-3 py-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all flex items-center gap-1.5 font-medium"
            >
              <Download className="size-3.5" />
              <span>Backup Criptografado</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6">
          {/* ======================================================== */}
          {/* 1. DASHBOARD PANEL */}
          {/* ======================================================== */}
          {secaoAtiva === 'dashboard' && (
            <div className="space-y-6">
              {/* Profile welcome */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-card border border-border p-6 rounded-2xl shadow-sm gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">Olá, {perfil.nome || contaUsuario.nomeCompleto}</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gerencie seu consultório, prontuários de escuta psicanalítica e Setting terapêutico.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
                    Conta: <strong>{contaUsuario.email}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setChaveiroCofre(null);
                      setCofreDesbloqueado(false);
                      setSolicitandoDesbloqueio(true);
                    }}
                    className="text-xs px-3 py-1.5 border border-border hover:bg-muted rounded-xl text-foreground font-semibold flex items-center gap-1.5"
                    title="Bloquear cofre imediatamente"
                  >
                    <Lock className="size-3.5 text-amber-500" />
                    <span>Bloquear Cofre</span>
                  </button>
                </div>
              </div>

              {/* Cascade stats counts */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-muted/20 border-border/40 hover:border-primary/20 transition-all flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Casos Ativos
                    </span>
                    <span className="text-2xl font-bold block mt-1">{dashboardStats.ativos}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      {dashboardStats.recorrentes} quinzenais / mensais
                    </span>
                  </div>
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Users className="size-5" />
                  </div>
                </Card>

                <Card className="p-4 bg-muted/20 border-border/40 hover:border-primary/20 transition-all flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Faturamento Total
                    </span>
                    <span className="text-2xl font-bold block mt-1">{formatarMoeda(dashboardStats.totalFaturamento)}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Sessões registradas no setting
                    </span>
                  </div>
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <DollarSign className="size-5" />
                  </div>
                </Card>

                <Card className="p-4 bg-muted/20 border-border/40 hover:border-primary/20 transition-all flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Sessões Previstas Hoje
                    </span>
                    <span className="text-2xl font-bold block mt-1">{dashboardStats.retornosHoje}</span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Frequência programada
                    </span>
                  </div>
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Calendar className="size-5" />
                  </div>
                </Card>

                <Card className="p-4 bg-muted/20 border-border/40 hover:border-primary/20 transition-all flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Honorários Pendentes
                    </span>
                    <span className="text-2xl font-bold text-destructive block mt-1">
                      {dashboardStats.honorariosPendentes}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Mensalidades em aberto
                    </span>
                  </div>
                  <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
                    <AlertTriangle className="size-5" />
                  </div>
                </Card>
              </div>

              {/* Caseload breakdown */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-5 lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Sessões Clínicas Realizadas por Mês
                  </h3>
                  {/* Custom beautifully designed SVG Chart */}
                  <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-border">
                    {/* Dummy chart values */}
                    {[12, 18, 15, 24, 28, dashboardStats.volumeSessoesMes || 32].map((val, idx) => {
                      const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun/Jul'];
                      const heightPercent = Math.min(100, (val / 35) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <span className="text-[10px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-primary/80 to-primary rounded-t-lg transition-all"
                            style={{ height: `${heightPercent}px`, minHeight: '8px' }}
                          />
                          <span className="text-[11px] text-muted-foreground mt-1">{labels[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                      Estruturas e Estados Clínicos
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Em Triagem (Novos)', count: dashboardStats.novos, color: 'bg-sky-500' },
                        { label: 'Sessão Ativa Regular', count: dashboardStats.ativos, color: 'bg-emerald-500' },
                        { label: 'Frequência Recorrente', count: dashboardStats.recorrentes, color: 'bg-purple-500' },
                        { label: 'Alta Clínica / Pausa', count: dashboardStats.inativos, color: 'bg-zinc-400' }
                      ].map((item, idx) => {
                        const total = analisandos.length || 1;
                        const pct = (item.count / total) * 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{item.label}</span>
                              <span>{item.count}</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => setSecaoAtiva('analisandos')}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1.5 mt-4"
                  >
                    <span>Ver lista de pacientes</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </Card>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. ANALISANDOS (KANBAN BOARD) */}
          {/* ======================================================== */}
          {secaoAtiva === 'analisandos' && (
            <div className="space-y-6">
              {/* Filter tools */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="w-full sm:max-w-md relative">
                  <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={analisandoFiltro}
                    onChange={e => setAnalisandoFiltro(e.target.value)}
                    placeholder="Buscar por nome, tag ou WhatsApp..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="filtroPrioritario"
                      checked={filtroCasoPrioritario}
                      onChange={e => setFiltroCasoPrioritario(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-ring size-4"
                    />
                    <label htmlFor="filtroPrioritario" className="text-xs font-semibold text-muted-foreground uppercase">
                      Apenas prioridades
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      setAnalisandoForm({
                        id: `${Date.now()}`,
                        nome: '',
                        whatsapp: '',
                        email: '',
                        nascimento: '',
                        cidade: '',
                        endereco: '',
                        status: 'novo',
                        vip: false,
                        tags: [],
                        observacoes: '',
                        criadoEm: new Date().toISOString(),
                        mensagensEnviadas: []
                      });
                      setMostrarFormAnalisando(true);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="size-4" />
                    <span>Novo Paciente</span>
                  </button>
                </div>
              </div>

              {/* Kanban columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { id: 'novo', label: 'Triagem / Entrevistas', color: 'bg-sky-500' },
                  { id: 'ativo', label: 'Em Análise (Regular)', color: 'bg-emerald-500' },
                  { id: 'recorrente', label: 'Análise Recorrente', color: 'bg-purple-500' },
                  { id: 'inativo', label: 'Alta Clínica / Pausa', color: 'bg-zinc-400' }
                ].map(col => {
                  const analisandosColuna = analisandosFiltrados.filter(a => a.status === col.id);
                  return (
                    <div
                      key={col.id}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, col.id as any)}
                      className="bg-muted/15 border border-border/80 rounded-2xl p-4 flex flex-col min-h-[400px]"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/60">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`size-2.5 rounded-full ${col.color}`} />
                          <h3 className="text-xs font-bold text-foreground truncate uppercase tracking-wider">
                            {col.label}
                          </h3>
                        </div>
                        <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                          {analisandosColuna.length}
                        </Badge>
                      </div>

                      {/* Cards Container */}
                      <div className="space-y-3 flex-1">
                        {analisandosColuna.length === 0 ? (
                          <div className="text-center py-12 text-xs text-muted-foreground/60 border-2 border-dashed border-border/40 rounded-xl">
                            Arraste ou solte um paciente aqui
                          </div>
                        ) : (
                          analisandosColuna.map(a => (
                            <Card
                              key={a.id}
                              draggable
                              onDragStart={e => handleDragStart(e, a.id)}
                              className="p-4 cursor-grab hover:shadow-md transition-shadow select-none space-y-3 relative group"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-sm text-foreground leading-tight truncate">
                                    {a.nome}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.whatsapp || 'Sem telefone'}</p>
                                </div>
                                {a.vip && (
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                    Prioritário
                                  </span>
                                )}
                              </div>

                              {a.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {a.tags.slice(0, 3).map(tag => (
                                    <span
                                      key={tag}
                                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold border border-border/40"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions footer on card */}
                              <div className="flex items-center gap-1.5 pt-2 border-t border-border/40 justify-end">
                                <button
                                  onClick={() => setProntuarioSelecionado(a)}
                                  className="text-[11px] px-2 py-1 rounded-md text-primary font-medium hover:bg-primary/10 transition-colors flex items-center gap-1"
                                >
                                  <FileText className="size-3.5" />
                                  <span>Prontuário</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setAnalisandoForm(a);
                                    setMostrarFormAnalisando(true);
                                  }}
                                  className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  title="Editar cadastro do paciente"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Excluir paciente ${a.nome} permanentemente?`)) {
                                      atualizarAnalisandos(analisandos.filter(x => x.id !== a.id));
                                    }
                                  }}
                                  className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. SESSÕES REALIZADAS */}
          {/* ======================================================== */}
          {secaoAtiva === 'sessoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Registro completo de sessões de análise e supervisões concluídas.
                </p>
                <button
                  onClick={() => {
                    setSessaoForm({
                      id: `${Date.now()}`,
                      analisandoId: '',
                      modalidadeId: '',
                      data: new Date().toISOString().slice(0, 10),
                      valorCobrado: 0,
                      pagamentoStatus: 'pago',
                      meioPagamento: 'pix',
                      notasSessao: ''
                    });
                    setMostrarFormSessao(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Nova Sessão</span>
                </button>
              </div>

              {/* Session table */}
              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Data</th>
                        <th className="text-left px-4 py-3 font-semibold">Analisando</th>
                        <th className="text-left px-4 py-3 font-semibold">Modalidade</th>
                        <th className="text-right px-4 py-3 font-semibold">Valor</th>
                        <th className="text-left px-4 py-3 font-semibold">Meio</th>
                        <th className="text-left px-4 py-3 font-semibold">Status Pagto</th>
                        <th className="text-left px-4 py-3 font-semibold">Próximo Retorno</th>
                        <th className="text-right px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sessoes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            Nenhuma sessão registrada neste setting ainda.
                          </td>
                        </tr>
                      ) : (
                        sessoes.map(s => {
                          const paciente = analisandos.find(a => a.id === s.analisandoId);
                          const modalidade = modalidades.find(m => m.id === s.modalidadeId);
                          return (
                            <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap font-medium">{formatarData(s.data)}</td>
                              <td className="px-4 py-3 font-semibold text-foreground">{paciente?.nome || '—'}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{modalidade?.nome || '—'}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">
                                {formatarMoeda(s.valorCobrado)}
                              </td>
                              <td className="px-4 py-3 uppercase text-xs font-semibold">{s.meioPagamento}</td>
                              <td className="px-4 py-3">
                                <Badge variant={s.pagamentoStatus === 'pago' ? 'default' : 'destructive'}>
                                  {s.pagamentoStatus}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatarData(s.proximaSessaoData)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Excluir este registro de sessão?')) {
                                      atualizarSessoes(sessoes.filter(x => x.id !== s.id));
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. MODALIDADES DE SESSÃO */}
          {/* ======================================================== */}
          {secaoAtiva === 'modalidades' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Gerencie as modalidades de atendimento (análise individual, online, supervisão, grupos).
                </p>
                <button
                  onClick={() => {
                    setModalidadeForm({
                      id: `${Date.now()}`,
                      nome: '',
                      preco: 0,
                      duracao: 50,
                      intervaloDias: 7,
                      categoria: 'Análise Individual',
                      observacoes: ''
                    });
                    setMostrarFormModalidade(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Nova Modalidade</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modalidades.map(m => (
                  <Card key={m.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold mb-1">
                            {m.categoria}
                          </Badge>
                          <h3 className="font-bold text-base text-foreground leading-tight truncate">{m.nome}</h3>
                        </div>
                        <span className="text-lg font-bold text-primary shrink-0">{formatarMoeda(m.preco)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {m.observacoes || 'Sem observações adicionais.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4 text-xs text-muted-foreground">
                      <span>{m.duracao} min / {m.intervaloDias} dias frequência</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setModalidadeForm(m);
                            setMostrarFormModalidade(true);
                          }}
                          className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Excluir esta modalidade de sessão?')) {
                              atualizarModalidades(modalidades.filter(x => x.id !== m.id));
                            }
                          }}
                          className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 5. FREQUÊNCIA & AGENDAS (RETORNOS PREVISTOS) */}
          {/* ======================================================== */}
          {secaoAtiva === 'previstos' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Lista de analisandos com retorno de sessão programada, ideal para lembrete e agendamento preventivo.
              </p>

              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Analisando</th>
                        <th className="text-left px-4 py-3 font-semibold">WhatsApp</th>
                        <th className="text-left px-4 py-3 font-semibold">Última Modalidade</th>
                        <th className="text-left px-4 py-3 font-semibold">Data Prevista</th>
                        <th className="text-left px-4 py-3 font-semibold">Ausente Há</th>
                        <th className="text-left px-4 py-3 font-semibold">Status Setting</th>
                        <th className="text-right px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {analisandos.filter(a => a.status !== 'inativo').map(a => {
                        const sessoesPaciente = sessoes.filter(s => s.analisandoId === a.id);
                        const sessoesOrdenadas = [...sessoesPaciente].sort((x, y) => y.data.localeCompare(x.data));
                        const ultima = sessoesOrdenadas[0];
                        if (!ultima) return null;

                        const modalidade = modalidades.find(m => m.id === ultima.modalidadeId);
                        const dataPrevista = ultima.proximaSessaoData;
                        if (!dataPrevista) return null;

                        const diasAtraso = diferencaDias(dataPrevista);
                        const statusAlerta = retornoStatus.find(rs => rs.sessaoId === ultima.id)?.status || 'pendente';

                        return (
                          <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground">{a.nome}</td>
                            <td className="px-4 py-3 text-muted-foreground">{a.whatsapp || '—'}</td>
                            <td className="px-4 py-3">{modalidade?.nome || '—'}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{formatarData(dataPrevista)}</td>
                            <td className="px-4 py-3">
                              {diasAtraso > 0 ? (
                                <span className="text-destructive font-semibold">
                                  {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'} de atraso
                                </span>
                              ) : (
                                <span className="text-emerald-500 font-semibold">No prazo</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={statusAlerta}
                                onChange={e => {
                                  const novosStatus = retornoStatus.filter(rs => rs.sessaoId !== ultima.id);
                                  const novo = { sessaoId: ultima.id, status: e.target.value as any };
                                  const atualizados = [...novosStatus, novo];
                                  setRetornoStatus(atualizados);
                                  localStorage.setItem('psi40_retornoStatus', JSON.stringify(atualizados));
                                }}
                                className="px-2.5 py-1 rounded-md border border-border text-xs bg-card text-foreground"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="enviado">Alerta Enviado</option>
                                <option value="concluido">Agendado</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setWhatsappAlvo({
                                  analisando: a,
                                  data: dataPrevista,
                                  servico: modalidade?.nome,
                                  valor: modalidade?.preco
                                })}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                              >
                                <Send className="size-3.5" />
                                <span>Avisar</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* 6. ACOMPANHAMENTO CLÍNICO */}
          {/* ======================================================== */}
          {secaoAtiva === 'acompanhamento' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Pacientes com alta prioridade ou que demandam acompanhamento ético inter-sessões devido à gravidade do caso.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analisandos.filter(a => a.vip || a.tags.includes('neurose-grave') || a.tags.includes('bipolar')).map(a => {
                  const sessoesPaciente = sessoes.filter(s => s.analisandoId === a.id);
                  const ultima = [...sessoesPaciente].sort((x, y) => y.data.localeCompare(x.data))[0];
                  return (
                    <Card key={a.id} className="p-5 space-y-4 hover:shadow-md transition-all border-l-4 border-l-amber-500">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-foreground text-base leading-tight">{a.nome}</h3>
                          <Badge variant="destructive">Alta Prioridade</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Caso clínico prioritário</p>
                      </div>

                      <div className="bg-muted/40 p-3 rounded-lg text-xs leading-relaxed space-y-2">
                        <div>
                          <strong>Última sessão:</strong> {ultima ? formatarData(ultima.data) : 'Nenhuma sessão'}
                        </div>
                        {ultima?.notasSessao && (
                          <div className="italic text-muted-foreground line-clamp-3">
                            &ldquo;{ultima.notasSessao}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setProntuarioSelecionado(a)}
                          className="flex-1 py-1.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FileText className="size-3.5" />
                          <span>Prontuário</span>
                        </button>
                        <button
                          onClick={() => setWhatsappAlvo({ analisando: a, servico: 'acompanhamento clínico' })}
                          className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Send className="size-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 7. ANIVERSARIANTES */}
          {/* ======================================================== */}
          {secaoAtiva === 'aniversariantes' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Pacientes que fazem aniversário este mês. Fortaleça o vínculo transferencial com uma mensagem afetuosa.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analisandos.filter(a => a.nascimento).map(a => {
                  const dataNascto = new Date(a.nascimento);
                  const hoje = new Date();
                  const mesAniv = dataNascto.getMonth() + 1;
                  const mesAtual = hoje.getMonth() + 1;

                  if (mesAniv !== mesAtual) return null;

                  return (
                    <Card key={a.id} className="p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{a.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Faz aniversário dia {dataNascto.getDate()} de {dataNascto.toLocaleString('pt-BR', { month: 'long' })}
                        </p>
                      </div>

                      <button
                        onClick={() => setWhatsappAlvo({ analisando: a, servico: 'aniversário' })}
                        className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-md transition-colors"
                        title="Enviar parabéns"
                      >
                        <Gift className="size-4" />
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 8. GESTÃO DE HONORÁRIOS */}
          {/* ======================================================== */}
          {secaoAtiva === 'honorarios' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Monitore e controle mensalidades, pacotes de sessões e faturamentos de seus analisandos.
                </p>
                <button
                  onClick={() => {
                    setHonorarioForm({
                      id: `${Date.now()}`,
                      analisandoId: '',
                      valor: 0,
                      vencimento: new Date().toISOString().slice(0, 10),
                      status: 'pendente',
                      observacao: ''
                    });
                    setMostrarFormHonorario(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Lançar Honorário</span>
                </button>
              </div>

              <Card className="overflow-hidden border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Analisando</th>
                        <th className="text-right px-4 py-3 font-semibold">Valor Acertado</th>
                        <th className="text-left px-4 py-3 font-semibold">Data Vencimento</th>
                        <th className="text-left px-4 py-3 font-semibold">Observações</th>
                        <th className="text-left px-4 py-3 font-semibold">Situação</th>
                        <th className="text-right px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {honorarios.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            Nenhuma pendência ou acerto de honorários lançado.
                          </td>
                        </tr>
                      ) : (
                        honorarios.map(h => {
                          const paciente = analisandos.find(a => a.id === h.analisandoId);
                          return (
                            <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 font-semibold text-foreground">{paciente?.nome || '—'}</td>
                              <td className="px-4 py-3 text-right font-bold text-primary">
                                {formatarMoeda(h.valor)}
                              </td>
                              <td className="px-4 py-3">{formatarData(h.vencimento)}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                                {h.observacao || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={h.status}
                                  onChange={e => {
                                    const novos = honorarios.map(x => x.id === h.id ? { ...x, status: e.target.value as any } : x);
                                    atualizarHonorarios(novos);
                                    if (e.target.value === 'pago' && paciente) {
                                      // Log an automatic paid session setting
                                      const novaSessao = {
                                        id: `${Date.now()}`,
                                        analisandoId: paciente.id,
                                        modalidadeId: 'm1', // Default
                                        data: new Date().toISOString().slice(0, 10),
                                        valorCobrado: h.valor,
                                        pagamentoStatus: 'pago' as any,
                                        meioPagamento: 'pix' as any,
                                        notasSessao: `Honorários compensados referentes ao acerto lançado de vencimento em ${formatarData(h.vencimento)}.`
                                      };
                                      atualizarSessoes([novaSessao, ...sessoes]);
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-md border border-border text-xs bg-card text-foreground font-semibold"
                                >
                                  <option value="pendente">Pendente</option>
                                  <option value="pago">Pago</option>
                                  <option value="atrasado">Atrasado</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => setWhatsappAlvo({
                                    analisando: paciente!,
                                    valor: h.valor,
                                    data: h.vencimento,
                                    servico: h.observacao || 'honorários analíticos'
                                  })}
                                  disabled={!paciente}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1"
                                >
                                  <Send className="size-3" />
                                  <span>Enviar WhatsApp</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Excluir este lançamento de honorário?')) {
                                      atualizarHonorarios(honorarios.filter(x => x.id !== h.id));
                                    }
                                  }}
                                  className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors inline-flex"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* 9. REATIVAÇÃO DE PAUSAS */}
          {/* ======================================================== */}
          {secaoAtiva === 'reativacao' && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Analisandos em pausa prolongada ou afastados. Envie um contato ético oferecendo novos horários para acolhimento de sua demanda.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analisandos.filter(a => a.status === 'inativo').map(a => {
                  const sessoesPaciente = sessoes.filter(s => s.analisandoId === a.id);
                  const ultima = [...sessoesPaciente].sort((x, y) => y.data.localeCompare(x.data))[0];
                  const diasAusencia = ultima ? diferencaDias(ultima.data) : 120; // Default large gap
                  return (
                    <Card key={a.id} className="p-5 space-y-4 hover:shadow-md transition-shadow">
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{a.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ultima ? `Última sessão em: ${formatarData(ultima.data)}` : 'Sem sessões no registro'}
                        </p>
                        <p className="text-xs text-destructive font-semibold mt-1">
                          Afastado(a) há {diasAusencia} dias
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-lg">
                        {a.observacoes || 'Sem queixa registrada.'}
                      </p>

                      <button
                        onClick={() => setWhatsappAlvo({ analisando: a, servico: 'retomada de análise' })}
                        className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send className="size-3.5" />
                        <span>Contatar paciente</span>
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 10. TRANSMISSÕES & GRUPOS */}
          {/* ======================================================== */}
          {secaoAtiva === 'transmissoes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Gere transmissões para avisos, recessos teóricos, lançamentos de seminários ou grupos de estudos.
                </p>
                <button
                  onClick={() => {
                    setTransmissaoForm({
                      id: `${Date.now()}`,
                      nome: '',
                      publico: 'todos',
                      mensagem: '',
                      criadaEm: new Date().toISOString()
                    });
                    setMostrarFormTransmissao(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Nova Transmissão</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {transmissoes.map(t => {
                  const contatosAlvo = analisandos.filter(a => {
                    if (t.publico === 'vips' && !a.vip) return false;
                    if (t.publico === 'inativos' && a.status !== 'inativo') return false;
                    if (t.publico === 'tag' && t.tag && !a.tags.includes(t.tag)) return false;
                    return true;
                  });

                  return (
                    <Card key={t.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-foreground text-base leading-tight">{t.nome}</h3>
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {t.publico === 'todos' ? 'Geral' : t.publico}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 bg-muted/20 p-2.5 rounded-lg whitespace-pre-wrap">
                          {t.mensagem}
                        </p>
                      </div>

                      <div className="border-t border-border/50 pt-4 mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-primary">{contatosAlvo.length} contatos alvo</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Trigger transmission logic
                              if (contatosAlvo.length === 0) {
                                alert('Nenhum contato encontrado neste filtro de público.');
                                return;
                              }
                              // Open first contact to start the sequence
                              setWhatsappAlvo({
                                analisando: contatosAlvo[0],
                                servico: t.nome
                              });
                            }}
                            className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                            title="Disparar"
                          >
                            <Send className="size-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Excluir esta transmissão?')) {
                                atualizarTransmissoes(transmissoes.filter(x => x.id !== t.id));
                              }
                            }}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 11. MODELOS DE MENSAGEM */}
          {/* ======================================================== */}
          {secaoAtiva === 'modelos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Personalize os roteiros de acolhimento, setting e cobranças que são enviados pelo WhatsApp.
                </p>
                <button
                  onClick={() => {
                    setModeloForm({
                      id: `${Date.now()}`,
                      nome: '',
                      categoria: 'geral',
                      conteudo: ''
                    });
                    setMostrarFormModelo(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Novo Modelo</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {modelos.map(m => (
                  <Card key={m.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="secondary" className="capitalize text-[10px] mb-1">
                            {m.categoria}
                          </Badge>
                          <h3 className="font-bold text-foreground text-sm leading-tight">{m.nome}</h3>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setModeloForm(m);
                              setMostrarFormModelo(true);
                            }}
                            className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Excluir este modelo de mensagem?')) {
                                atualizarModelos(modelos.filter(x => x.id !== m.id));
                              }
                            }}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-6 bg-muted/10 p-2.5 rounded-xl border">
                        {m.conteudo}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 12. MEU PERFIL (ANALISTA) */}
          {/* ======================================================== */}
          {secaoAtiva === 'analista' && (
            <div className="max-w-2xl">
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Credenciais & Dados Profissionais</h3>
                    <p className="text-xs text-muted-foreground">Informe seus registros de associação psicanalítica.</p>
                  </div>
                  {podeGerenciarAcessos && (
                    <button
                      type="button"
                      onClick={() => setSecaoAtiva('admin_users')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all shrink-0"
                    >
                      <ShieldCheck className="size-3.5" />
                      <span>Painel de Validação de Acessos</span>
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Nome completo</label>
                    <input
                      type="text"
                      value={perfil.nome}
                      onChange={e => atualizarPerfil({ ...perfil, nome: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Cargo / Especialidade</label>
                    <input
                      type="text"
                      value={perfil.cargo}
                      onChange={e => atualizarPerfil({ ...perfil, cargo: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Registro Profissional</label>
                    <input
                      type="text"
                      value={perfil.registroProfissional || ''}
                      onChange={e => atualizarPerfil({ ...perfil, registroProfissional: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Ex: Registro Psicanalítico CBP-123"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp Profissional</label>
                    <input
                      type="text"
                      value={perfil.whatsapp}
                      onChange={e => atualizarPerfil({ ...perfil, whatsapp: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">E-mail</label>
                    <input
                      type="text"
                      value={perfil.email}
                      onChange={e => atualizarPerfil({ ...perfil, email: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Lock className="size-3.5 text-primary" />
                        Autenticação da Conta (Nuvem)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                        Supabase Auth Ativo
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por segurança e privacidade, senhas nunca são armazenadas no navegador. A conta é gerenciada exclusivamente pelo Supabase Auth oficial.
                    </p>
                    {contaUsuario?.email && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await solicitarRecuperacaoSenhaOficial(contaUsuario.email);
                          alert(res.mensagem);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground rounded-lg transition-all"
                      >
                        Enviar link oficial para redefinir senha
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      atualizarPerfil(perfil);
                      alert('Perfil do analista salvo e sincronizado com sucesso!');
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Check className="size-4" />
                    Salvar Dados
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* 13. DADOS DO CONSULTÓRIO */}
          {/* ======================================================== */}
          {secaoAtiva === 'consultorio' && (
            <div className="max-w-2xl">
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Dados do Consultório / Clínica</h3>
                    <p className="text-xs text-muted-foreground">Configurações para preenchimento de variáveis.</p>
                  </div>
                  {podeGerenciarAcessos && (
                    <button
                      type="button"
                      onClick={() => setSecaoAtiva('admin_users')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all shrink-0"
                    >
                      <ShieldCheck className="size-3.5" />
                      <span>Painel de Validação de Acessos</span>
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Nome Fantasia</label>
                    <input
                      type="text"
                      value={consultorio.nome}
                      onChange={e => atualizarConsultorio({ ...consultorio, nome: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Atuação principal</label>
                    <input
                      type="text"
                      value={consultorio.segmento}
                      onChange={e => atualizarConsultorio({ ...consultorio, segmento: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade de Setting</label>
                    <input
                      type="text"
                      value={consultorio.cidade}
                      onChange={e => atualizarConsultorio({ ...consultorio, cidade: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço Presencial</label>
                    <input
                      type="text"
                      value={consultorio.endereco}
                      onChange={e => atualizarConsultorio({ ...consultorio, endereco: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Link de Sala de Atendimento Virtual (Zoom/Meet)</label>
                    <input
                      type="text"
                      value={consultorio.linkFeedback}
                      onChange={e => atualizarConsultorio({ ...consultorio, linkFeedback: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      atualizarConsultorio(consultorio);
                      alert('Dados do consultório salvos e sincronizados com sucesso!');
                    }}
                    className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Check className="size-4" />
                    Salvar Dados
                  </button>
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* 14. BACKUP DE DADOS & BANCO LOCAL */}
          {/* ======================================================== */}
          {secaoAtiva === 'backup' && (
            <div className="space-y-6">
              {podeGerenciarAcessos && (
                <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Painel do Administrador Micro SaaS</h4>
                      <p className="text-xs text-muted-foreground">Valide acessos de novos psicólogos, ative e desative contas de clientes e renove assinaturas mensais.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSecaoAtiva('admin_users')}
                    className="px-3.5 py-2 rounded-xl gradient-emerald text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="size-4" />
                    <span>Gerenciar Acessos & Assinaturas</span>
                  </button>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Exportar Backup Criptografado */}
                <Card className="p-5 flex flex-col justify-between h-48 hover:shadow-md transition-shadow border-emerald-500/30 bg-emerald-500/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-1">
                        <Download className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Cofre Local
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm">Exportar Backup Criptografado</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Gere um arquivo JSON com integridade verificada e conteúdo encriptado pelo seu cofre local (sem expor credenciais).
                    </p>
                  </div>
                  <button onClick={handleExportarJSON} className="btn-emerald w-full mt-4 flex items-center justify-center gap-1.5">
                    <Download className="size-3.5" />
                    <span>Baixar Backup (.json)</span>
                  </button>
                </Card>

                {/* 2. Importar Backup Criptografado */}
                <Card className="p-5 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-1">
                        <Upload className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                        Restauração
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm">Importar Backup JSON</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Restaure pacientes e sessões com validação estrutural e escolha transacional entre mesclar ou substituir.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleImportarJSON}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Upload className="size-3.5" />
                    <span>Selecionar Arquivo JSON</span>
                  </button>
                </Card>

                {/* 3. Cota e Armazenamento do Navegador */}
                <Card className="p-5 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="size-9 rounded-lg bg-blue-500/10 text-blue-500 grid place-items-center mb-1">
                        <Database className="size-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {cotaArmazenamento.persistido ? 'Persistente' : 'Armazenamento'}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-sm">Cota do Navegador</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cotaArmazenamento.suportado ? (
                        <>Usado: {(cotaArmazenamento.usadoBytes / (1024 * 1024)).toFixed(1)} MB de {(cotaArmazenamento.totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB ({cotaArmazenamento.percentualUsado.toFixed(1)}%)</>
                      ) : (
                        'Dados salvos no IndexedDB local do seu navegador.'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if ('storage' in navigator && 'persist' in navigator.storage) {
                        const persistido = await navigator.storage.persist();
                        setCotaArmazenamento(prev => ({ ...prev, persistido }));
                        alert(persistido ? 'Armazenamento persistente concedido pelo navegador!' : 'O navegador manteve o modo padrão de armazenamento.');
                      } else {
                        alert('Recurso de persistência não suportado neste navegador.');
                      }
                    }}
                    className="w-full border border-border hover:bg-muted text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    <span>{cotaArmazenamento.persistido ? 'Armazenamento Protegido' : 'Solicitar Persistência'}</span>
                  </button>
                </Card>

                {/* 4. Resetar Setting & Dados */}
                <Card className="p-5 flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                  <div className="space-y-1.5">
                    <div className="size-9 rounded-lg bg-amber-500/10 text-amber-500 grid place-items-center mb-1">
                      <RotateCcw className="size-5" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm">Resetar Setting & Dados</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Carregue casos clínicos iniciais demonstrativos diretamente no seu cofre local criptografado.
                    </p>
                  </div>
                  <button onClick={handleResetarDadosDemo} className="w-full btn-emerald mt-4">
                    Restaurar Dados Demonstrativos
                  </button>
                </Card>
              </div>

              {/* Clean up block */}
              <Card className="p-6 border-destructive/20 bg-destructive/5 space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-destructive text-sm">Zona Perigosa: Excluir Tudo</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Isso excluirá permanentemente todos os registros clínicos salvos na memória LocalStorage deste navegador. Esta ação não pode ser desfeita. Recomendamos baixar um backup antes de prosseguir.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleLimparDados}
                    className="px-4 py-2 text-xs font-bold text-white bg-destructive hover:bg-destructive/90 rounded-xl transition-all"
                  >
                    Limpar banco de dados local
                  </button>
                </div>
              </Card>

              {/* Theme Settings (compact inside backup view/separately) */}
              <Card className="p-6 space-y-4">
                <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                  <Settings className="size-5 text-primary animate-spin-slow" />
                  Selecione a Paleta de Cores do Setting
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escolha o visual do seu setting virtual. A aparência será salva neste navegador.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PALETAS_COR.map(p => {
                    const ativa = paletaSelecionada === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPaletaSelecionada(p.id)}
                        className={`relative text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
                          ativa ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                        }`}
                      >
                        <div
                          className="h-10 w-full rounded-lg mb-3 shadow-inner"
                          style={{ background: `linear-gradient(135deg, ${p.swatch}, ${p.swatch}cc)` }}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{p.label}</span>
                          {ativa && <Check className="size-4 text-primary shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* SEÇÃO ADMIN: GERENCIAMENTO DE ACESSOS */}
          {/* ======================================================== */}
          {secaoAtiva === 'admin_users' && podeGerenciarAcessos && (
            <SecaoAdminSaas
              contaUsuario={contaUsuario}
              licencaSaas={licencaSaas}
              onVoltarParaConfiguracoes={() => setSecaoAtiva('consultorio')}
            />
          )}
          {/* ======================================================== */}
          {/* A. AGENDA CLÍNICA */}
          {/* ======================================================== */}
          {secaoAtiva === 'agenda' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Agenda Clínica de Sessões</h2>
                  <p className="text-sm text-muted-foreground">
                    Gerencie seus horários semanais de análise e supervisão de forma integrada.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAgendaVisualizacao(agendaVisualizacao === 'semana' ? 'lista' : 'semana')}
                    className="px-4 py-2 text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground rounded-xl transition-all"
                  >
                    Visualizar em {agendaVisualizacao === 'semana' ? 'Lista' : 'Grade Semanal'}
                  </button>
                  <button
                    onClick={() => {
                      setAgendamentoForm({
                        id: `ag_${Date.now()}`,
                        analisandoId: '',
                        modalidadeId: modalidades[0]?.id || '',
                        data: new Date().toISOString().split('T')[0],
                        hora: '09:00',
                        status: 'confirmado',
                        observacao: ''
                      });
                      setMostrarFormAgendamento(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="size-4" />
                    <span>Novo Agendamento</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center justify-between p-4 bg-muted/30 border border-border/60 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Filtrar por Status:</span>
                  <div className="flex gap-1">
                    {['todos', 'confirmado', 'pendente', 'realizado', 'cancelado'].map(st => (
                      <button
                        key={st}
                        onClick={() => setAgendaFiltroStatus(st)}
                        className={`px-3 py-1 text-xs capitalize font-medium rounded-lg transition-all ${
                          agendaFiltroStatus === st
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-muted-foreground hover:bg-muted border border-border/40'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {agendamentos.length} agendamentos no total
                </div>
              </div>

              {/* Content Grid */}
              {agendaVisualizacao === 'semana' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Dynamic days of current week */}
                  {(() => {
                    const hoje = new Date();
                    const diaSemanaHoje = hoje.getDay();
                    const segunda = new Date(hoje);
                    const diff = diaSemanaHoje === 0 ? -6 : 1 - diaSemanaHoje;
                    segunda.setDate(hoje.getDate() + diff);

                    const dias = [];
                    for (let i = 0; i < 6; i++) {
                      const dia = new Date(segunda);
                      dia.setDate(segunda.getDate() + i);
                      dias.push({
                        nome: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][i],
                        dataStr: dia.toISOString().split('T')[0],
                        diaMes: dia.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
                      });
                    }

                    return dias.map(d => {
                      const agendamentosDoDia = agendamentos.filter(a => a.data === d.dataStr && (agendaFiltroStatus === 'todos' || a.status === agendaFiltroStatus));
                      const isHoje = d.dataStr === hoje.toISOString().split('T')[0];

                      return (
                        <Card key={d.dataStr} className={`p-4 border flex flex-col min-h-[320px] ${isHoje ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border'}`}>
                          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                            <div>
                              <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">{d.nome}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{d.diaMes}</p>
                            </div>
                            {isHoje && <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-primary text-primary-foreground">Hoje</span>}
                          </div>

                          <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] pr-1">
                            {agendamentosDoDia.length === 0 ? (
                              <div className="text-center py-8 text-[11px] text-muted-foreground font-mono">Sem sessões</div>
                            ) : (
                              agendamentosDoDia.sort((x, y) => x.hora.localeCompare(y.hora)).map(a => {
                                const paciente = analisandos.find(p => p.id === a.analisandoId);
                                const modalidade = modalidades.find(m => m.id === a.modalidadeId);
                                const corStatus = a.status === 'confirmado' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' :
                                                 a.status === 'pendente' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                 a.status === 'realizado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                 'bg-destructive/10 border-destructive/20 text-destructive';

                                return (
                                  <div key={a.id} className="p-2.5 rounded-xl border border-border/80 bg-card hover:shadow-sm transition-all group relative">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="font-mono text-[10px] font-bold text-primary">{a.hora}</span>
                                      <span className={`px-1.5 py-0.5 text-[9px] rounded-md font-semibold capitalize border ${corStatus}`}>
                                        {a.status}
                                      </span>
                                    </div>
                                    <h5 className="font-bold text-xs text-foreground line-clamp-1">{paciente?.nome || 'Inexistente'}</h5>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{modalidade?.nome || '—'}</p>
                                    {a.observacao && (
                                      <p className="text-[9px] text-muted-foreground italic mt-1.5 border-t border-border/40 pt-1 line-clamp-2">
                                        "{a.observacao}"
                                      </p>
                                    )}

                                    {/* Action overlays on hover */}
                                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-xl p-2 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all duration-150">
                                      {a.status !== 'realizado' && (
                                        <button
                                          onClick={() => {
                                            const confirmacao = window.confirm(`Deseja marcar o agendamento de ${paciente?.nome} como REALIZADO e registrá-lo automaticamente no histórico de Sessões Realizadas?`);
                                            if (!confirmacao) return;
                                            // Conclude
                                            const novos = agendamentos.map(x => x.id === a.id ? { ...x, status: 'realizado' as const } : x);
                                            atualizarAgendamentos(novos);
                                            // Add to sessions
                                            const novaSessao: SessaoClinica = {
                                              id: `sess_${Date.now()}`,
                                              analisandoId: a.analisandoId,
                                              modalidadeId: a.modalidadeId,
                                              data: a.data,
                                              valorCobrado: modalidade ? modalidade.preco : 0,
                                              pagamentoStatus: 'pago',
                                              meioPagamento: 'pix',
                                              notasSessao: a.observacao || 'Sessão concluída automaticamente via Agenda.'
                                            };
                                            atualizarSessoes([novaSessao, ...sessoes]);
                                          }}
                                          title="Concluir e Registrar"
                                          className="size-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                        >
                                          <Check className="size-3.5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (!paciente) return;
                                          const msgText = `Olá ${paciente.nome}, passando para confirmar nosso horário de análise agendado para ${formatarData(a.data)} às ${a.hora}. Até lá!`;
                                          abrirWhatsApp(paciente.whatsapp || '', msgText);
                                        }}
                                        title="Confirmar via WhatsApp"
                                        className="size-7 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                      >
                                        <Send className="size-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAgendamentoForm(a);
                                          setMostrarFormAgendamento(true);
                                        }}
                                        title="Editar"
                                        className="size-7 rounded-lg bg-zinc-700 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                      >
                                        <Pencil className="size-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                                            atualizarAgendamentos(agendamentos.filter(x => x.id !== a.id));
                                          }
                                        }}
                                        title="Excluir"
                                        className="size-7 rounded-lg bg-destructive text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </Card>
                      );
                    });
                  })()}
                </div>
              ) : (
                /* List View */
                <Card className="overflow-hidden border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-xs uppercase text-muted-foreground border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold">Data & Hora</th>
                          <th className="text-left px-4 py-3 font-semibold">Analisando</th>
                          <th className="text-left px-4 py-3 font-semibold">Modalidade</th>
                          <th className="text-left px-4 py-3 font-semibold">Observações</th>
                          <th className="text-left px-4 py-3 font-semibold">Status</th>
                          <th className="text-right px-4 py-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {agendamentos.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                              Nenhum agendamento registrado na lista.
                            </td>
                          </tr>
                        ) : (
                          agendamentos
                            .filter(a => agendaFiltroStatus === 'todos' || a.status === agendaFiltroStatus)
                            .sort((x, y) => `${x.data} ${x.hora}`.localeCompare(`${y.data} ${y.hora}`))
                            .map(a => {
                              const paciente = analisandos.find(p => p.id === a.analisandoId);
                              const modalidade = modalidades.find(m => m.id === a.modalidadeId);
                              const corStatus = a.status === 'confirmado' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' :
                                               a.status === 'pendente' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                               a.status === 'realizado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                               'bg-destructive/10 border-destructive/20 text-destructive';

                              return (
                                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className="font-semibold text-foreground">{formatarData(a.data)}</span>
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-xs">{a.hora}</span>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-foreground">{paciente?.nome || '—'}</td>
                                  <td className="px-4 py-3">{modalidade?.nome || '—'}</td>
                                  <td className="px-4 py-3 text-xs italic text-muted-foreground">
                                    {a.observacao ? `"${a.observacao}"` : '—'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize border ${corStatus}`}>
                                      {a.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      {a.status !== 'realizado' && (
                                        <button
                                          onClick={() => {
                                            const confirmacao = window.confirm(`Deseja marcar o agendamento de ${paciente?.nome} como REALIZADO e registrá-lo automaticamente no histórico de Sessões Realizadas?`);
                                            if (!confirmacao) return;
                                            const novos = agendamentos.map(x => x.id === a.id ? { ...x, status: 'realizado' as const } : x);
                                            atualizarAgendamentos(novos);
                                            const novaSessao: SessaoClinica = {
                                              id: `sess_${Date.now()}`,
                                              analisandoId: a.analisandoId,
                                              modalidadeId: a.modalidadeId,
                                              data: a.data,
                                              valorCobrado: modalidade ? modalidade.preco : 0,
                                              pagamentoStatus: 'pago',
                                              meioPagamento: 'pix',
                                              notasSessao: a.observacao || 'Sessão concluída automaticamente via Agenda.'
                                            };
                                            atualizarSessoes([novaSessao, ...sessoes]);
                                          }}
                                          title="Concluir Atendimento"
                                          className="p-1.5 rounded-lg border border-border bg-card hover:bg-emerald-500/10 hover:text-emerald-500 text-muted-foreground transition-colors"
                                        >
                                          <Check className="size-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (!paciente) return;
                                          const msgText = `Olá ${paciente.nome}, passando para confirmar nosso horário de análise agendado para ${formatarData(a.data)} às ${a.hora}. Até lá!`;
                                          abrirWhatsApp(paciente.whatsapp || '', msgText);
                                        }}
                                        title="WhatsApp"
                                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-blue-500/10 hover:text-blue-500 text-muted-foreground transition-colors"
                                      >
                                        <Send className="size-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setAgendamentoForm(a);
                                          setMostrarFormAgendamento(true);
                                        }}
                                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                      >
                                        <Pencil className="size-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                                            atualizarAgendamentos(agendamentos.filter(x => x.id !== a.id));
                                          }
                                        }}
                                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* B. RELATÓRIOS & MÈTRICAS */}
          {/* ======================================================== */}
          {secaoAtiva === 'relatorios' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl font-bold text-foreground">Relatórios & Métricas Clínicas</h2>
                <p className="text-sm text-muted-foreground">
                  Análise de atendimentos, faturamento financeiro e mapeamento de demandas clínicas.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-5 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Consultas Realizadas</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{sessoes.length}</span>
                    <span className="text-xs text-emerald-500 font-semibold font-mono">Concluídas</span>
                  </div>
                </Card>
                <Card className="p-5 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Faturamento Clínico</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {formatarMoeda(sessoes.reduce((acc, c) => acc + c.valorCobrado, 0))}
                    </span>
                    <span className="text-xs text-muted-foreground">Total Acumulado</span>
                  </div>
                </Card>
                <Card className="p-5 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Tempo de Clínico Acumulado</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {Math.round(
                        sessoes.reduce((acc, c) => {
                          const mod = modalidades.find(m => m.id === c.modalidadeId);
                          return acc + (mod ? mod.duracao : 50);
                        }, 0) / 60
                      )}{' '}
                      h
                    </span>
                    <span className="text-xs text-muted-foreground">Horas Escuta</span>
                  </div>
                </Card>
                <Card className="p-5 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Honorários Pendentes</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-amber-500">
                      {formatarMoeda(
                        honorarios.filter(h => h.status === 'pendente').reduce((acc, c) => acc + c.valor, 0)
                      )}
                    </span>
                    <span className="text-xs text-amber-500 font-semibold font-mono">
                      {honorarios.filter(h => h.status === 'pendente').length} em aberto
                    </span>
                  </div>
                </Card>
              </div>

              {/* Charts layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Atendimentos por Analisando */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Volume de Consultas por Analisando</h3>
                  <div className="space-y-3.5 pt-2">
                    {(() => {
                      const dados = analisandos.map(a => {
                        const count = sessoes.filter(s => s.analisandoId === a.id).length;
                        return { nome: a.nome, total: count };
                      }).sort((x, y) => y.total - x.total);

                      const max = Math.max(...dados.map(d => d.total), 1);

                      if (sessoes.length === 0) {
                        return <div className="text-center py-8 text-xs text-muted-foreground">Ainda sem histórico de sessões para gerar dados.</div>;
                      }

                      return dados.slice(0, 5).map(d => {
                        const pct = (d.total / max) * 100;
                        return (
                          <div key={d.nome} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-foreground">{d.nome}</span>
                              <span className="font-bold text-muted-foreground">{d.total} sessões</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>

                {/* 2. Sintomatologia & Categorias de Caso */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Segmentação de Demandas Clínicas (Sintomas)</h3>
                  <div className="space-y-3.5 pt-2">
                    {(() => {
                      const contagemTags: Record<string, number> = {};
                      analisandos.forEach(a => {
                        (a.tags || []).forEach(t => {
                          contagemTags[t] = (contagemTags[t] || 0) + 1;
                        });
                      });

                      const tagsOrdenadas = Object.entries(contagemTags)
                        .map(([tag, total]) => ({ tag, total }))
                        .sort((x, y) => y.total - x.total);

                      const max = Math.max(...tagsOrdenadas.map(d => d.total), 1);

                      if (tagsOrdenadas.length === 0) {
                        return <div className="text-center py-8 text-xs text-muted-foreground">Registre tags em "Meus Pacientes" para ver a segmentação de demandas.</div>;
                      }

                      return tagsOrdenadas.slice(0, 5).map(d => {
                        const pct = (d.total / max) * 100;
                        return (
                          <div key={d.tag} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-primary capitalize">#{d.tag.replace('-', ' ')}</span>
                              <span className="font-bold text-muted-foreground">{d.total} pacientes</span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#c5a059] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>

                {/* 3. Meios de Pagamento Preferidos */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Distribuição por Meio de Pagamento</h3>
                  <div className="space-y-4 pt-2">
                    {(() => {
                      const totalSessoes = sessoes.length;
                      if (totalSessoes === 0) {
                        return <div className="text-center py-8 text-xs text-muted-foreground">Nenhuma sessão financeira registrada.</div>;
                      }

                      const contagem = { pix: 0, dinheiro: 0, transferência: 0, boleto: 0 };
                      sessoes.forEach(s => {
                        const meio = (s.meioPagamento || 'pix').toLowerCase();
                        if (meio.includes('pix')) contagem.pix++;
                        else if (meio.includes('dinheiro') || meio.includes('money')) contagem.dinheiro++;
                        else if (meio.includes('boleto')) contagem.boleto++;
                        else contagem.transferência++;
                      });

                      return Object.entries(contagem).map(([meio, total]) => {
                        const pct = Math.round((total / totalSessoes) * 100);
                        return (
                          <div key={meio} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-foreground capitalize">{meio}</span>
                              <span className="font-bold text-muted-foreground">{pct}% ({total})</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>

                {/* 4. Resumo de Faturamento das Sessões por Modalidade */}
                <Card className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Faturamento Realizado por Modalidade</h3>
                  <div className="space-y-1.5 pt-2">
                    {(() => {
                      const faturamentoTotal = sessoes.reduce((acc, c) => acc + c.valorCobrado, 0);
                      if (faturamentoTotal === 0) {
                        return <div className="text-center py-8 text-xs text-muted-foreground">Nenhuma receita registrada ainda.</div>;
                      }

                      const faturamentoPorMod: Record<string, number> = {};
                      sessoes.forEach(s => {
                        const mod = modalidades.find(m => m.id === s.modalidadeId);
                        const nomeMod = mod ? mod.nome : 'Outros';
                        faturamentoPorMod[nomeMod] = (faturamentoPorMod[nomeMod] || 0) + s.valorCobrado;
                      });

                      return Object.entries(faturamentoPorMod).map(([nomeMod, valor]) => {
                        const pct = Math.round((valor / faturamentoTotal) * 100);
                        return (
                          <div key={nomeMod} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-foreground line-clamp-1">{nomeMod}</span>
                              <span className="font-bold text-primary">{formatarMoeda(valor)} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-500 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* C. ASSISTENTE BIA (IA) */}
          {/* ======================================================== */}
          {secaoAtiva === 'bia' && (
            <SecaoBia />
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* GLOBAL MODALS */}
      {/* ======================================================== */}

      {/* 1. PRONTUÁRIO COMPLETO MODAL (360) */}
      {prontuarioSelecionado && (
        <ProntuarioModal
          analisando={prontuarioSelecionado}
          sessoes={sessoes}
          modalidades={modalidades}
          onFechar={() => setProntuarioSelecionado(null)}
          onAtualizarObservacoes={novasObs => {
            const atualizados = analisandos.map(a =>
              a.id === prontuarioSelecionado.id ? { ...a, observacoes: novasObs } : a
            );
            atualizarAnalisandos(atualizados);
            setProntuarioSelecionado({ ...prontuarioSelecionado, observacoes: novasObs });
          }}
          onAbrirMensagem={a => {
            setProntuarioSelecionado(null);
            setWhatsappAlvo({ analisando: a });
          }}
          onEditarPaciente={a => {
            setProntuarioSelecionado(null);
            setAnalisandoForm(a);
            setMostrarFormAnalisando(true);
          }}
          onNovaSessaoRapida={analisandoId => {
            setProntuarioSelecionado(null);
            setSessaoForm({
              id: `${Date.now()}`,
              analisandoId,
              modalidadeId: '',
              data: new Date().toISOString().slice(0, 10),
              valorCobrado: 0,
              pagamentoStatus: 'pago',
              meioPagamento: 'pix',
              notasSessao: ''
            });
            setMostrarFormSessao(true);
          }}
        />
      )}

      {/* 2. WHATSAPP SENDER COMPOSER MODAL */}
      {whatsappAlvo && (
        <WhatsAppModal
          analisando={whatsappAlvo.analisando}
          modelos={modelos}
          perfil={perfil}
          consultorio={consultorio}
          valorReferencia={whatsappAlvo.valor}
          dataReferencia={whatsappAlvo.data}
          servicoReferencia={whatsappAlvo.servico}
          onFechar={() => setWhatsappAlvo(null)}
          onMensagemEnviada={handleMensagemEnviada}
        />
      )}

      {/* 3. NEW/EDIT ANALISANDO FORM MODAL */}
      {mostrarFormAnalisando && analisandoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {analisandos.some(a => a.id === analisandoForm.id) ? 'Editar dados do paciente' : 'Novo Paciente'}
              </h3>
              <button
                onClick={() => setMostrarFormAnalisando(false)}
                className="p-1 rounded-lg text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                title="Fechar formulário"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome completo *</label>
                <input
                  type="text"
                  value={analisandoForm.nome || ''}
                  onChange={e => setAnalisandoForm({ ...analisandoForm, nome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Nome do paciente"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">WhatsApp / Celular</label>
                  <input
                    type="text"
                    value={analisandoForm.whatsapp || ''}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, whatsapp: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="5511999999999"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">E-mail</label>
                  <input
                    type="text"
                    value={analisandoForm.email || ''}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="paciente@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Nascimento</label>
                  <input
                    type="date"
                    value={analisandoForm.nascimento ? analisandoForm.nascimento.slice(0, 10) : ''}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, nascimento: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade de residência</label>
                  <input
                    type="text"
                    value={analisandoForm.cidade || ''}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, cidade: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="São Paulo"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço completo</label>
                <input
                  type="text"
                  value={analisandoForm.endereco || ''}
                  onChange={e => setAnalisandoForm({ ...analisandoForm, endereco: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Logradouro, número, apto"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Estado setting</label>
                  <select
                    value={analisandoForm.status || 'novo'}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, status: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="novo">Triagem / Entrevistas Preliminares</option>
                    <option value="ativo">Em Análise (Regular)</option>
                    <option value="recorrente">Frequência Recorrente</option>
                    <option value="inativo">Alta Clínica / Pausa</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-6">
                  <input
                    type="checkbox"
                    id="vip-form"
                    checked={Boolean(analisandoForm.vip)}
                    onChange={e => setAnalisandoForm({ ...analisandoForm, vip: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-ring size-4"
                  />
                  <label htmlFor="vip-form" className="text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none">
                    Caso Prioritário (VIP)
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Tags clínicas (separadas por vírgula)</label>
                <input
                  type="text"
                  value={Array.isArray(analisandoForm.tags) ? analisandoForm.tags.join(', ') : ''}
                  onChange={e => setAnalisandoForm({
                    ...analisandoForm,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="ex: divã, lacaniano, neurose-grave"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Demanda / Notas iniciais</label>
                <textarea
                  value={analisandoForm.observacoes || ''}
                  onChange={e => setAnalisandoForm({ ...analisandoForm, observacoes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Motivo da busca, queixa inicial ou impressões clínicas do setting terapêutico"
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormAnalisando(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!analisandoForm.nome?.trim()) {
                    alert('Por favor, informe o nome do paciente.');
                    return;
                  }
                  const pacienteFormatado: Analisando = {
                    id: String(analisandoForm.id || Date.now()),
                    nome: analisandoForm.nome.trim(),
                    whatsapp: analisandoForm.whatsapp ? analisandoForm.whatsapp.trim() : '',
                    email: analisandoForm.email ? analisandoForm.email.trim() : '',
                    nascimento: analisandoForm.nascimento || '',
                    cidade: analisandoForm.cidade ? analisandoForm.cidade.trim() : '',
                    endereco: analisandoForm.endereco ? analisandoForm.endereco.trim() : '',
                    status: analisandoForm.status || 'novo',
                    vip: Boolean(analisandoForm.vip),
                    tags: Array.isArray(analisandoForm.tags) ? analisandoForm.tags : [],
                    observacoes: analisandoForm.observacoes || '',
                    criadoEm: analisandoForm.criadoEm || new Date().toISOString(),
                    mensagensEnviadas: Array.isArray(analisandoForm.mensagensEnviadas) ? analisandoForm.mensagensEnviadas : []
                  };

                  const cadastrado = analisandos.some(a => a.id === pacienteFormatado.id);
                  if (cadastrado) {
                    atualizarAnalisandos(analisandos.map(a => a.id === pacienteFormatado.id ? pacienteFormatado : a));
                    if (prontuarioSelecionado && prontuarioSelecionado.id === pacienteFormatado.id) {
                      setProntuarioSelecionado(pacienteFormatado);
                    }
                  } else {
                    atualizarAnalisandos([...analisandos, pacienteFormatado]);
                  }
                  setMostrarFormAnalisando(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md hover:opacity-95 transition-opacity"
              >
                Salvar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. NEW/EDIT SESSÃO CLINICA FORM MODAL */}
      {mostrarFormSessao && sessaoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">Registrar nova sessão realizada</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Paciente *</label>
                <select
                  value={sessaoForm.analisandoId}
                  onChange={e => setSessaoForm({ ...sessaoForm, analisandoId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Selecione o paciente —</option>
                  {analisandos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Modalidade clínica *</label>
                <select
                  value={sessaoForm.modalidadeId}
                  onChange={e => {
                    const mod = modalidades.find(x => x.id === e.target.value);
                    setSessaoForm({
                      ...sessaoForm,
                      modalidadeId: e.target.value,
                      valorCobrado: mod ? mod.preco : sessaoForm.valorCobrado
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Selecione a modalidade —</option>
                  {modalidades.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} (Sugerido: {formatarMoeda(m.preco)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Data da consulta</label>
                  <input
                    type="date"
                    value={sessaoForm.data.slice(0, 10)}
                    onChange={e => setSessaoForm({ ...sessaoForm, data: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Valor cobrado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sessaoForm.valorCobrado || ''}
                    onChange={e => setSessaoForm({ ...sessaoForm, valorCobrado: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Meio de pagamento</label>
                  <select
                    value={sessaoForm.meioPagamento}
                    onChange={e => setSessaoForm({ ...sessaoForm, meioPagamento: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="pix">Pix</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="dinheiro">Dinheiro físico</option>
                    <option value="cartao">Cartão de Crédito/Débito</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Situação faturamento</label>
                  <select
                    value={sessaoForm.pagamentoStatus}
                    onChange={e => setSessaoForm({ ...sessaoForm, pagamentoStatus: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente de acerto</option>
                    <option value="parcial">Compensado parcial</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notas confidenciais de evolução terapêutica</label>
                
                {/* Gravador & Transcritor de Áudio da Sessão */}
                <GravadorSessao
                  nomePaciente={analisandos.find(a => a.id === sessaoForm.analisandoId)?.nome || 'Paciente'}
                  textoAtual={sessaoForm.notasSessao || ''}
                  onInserirTexto={(novoTexto) => {
                    setSessaoForm({ ...sessaoForm, notasSessao: novoTexto });
                  }}
                />

                <textarea
                  value={sessaoForm.notasSessao || ''}
                  onChange={e => setSessaoForm({ ...sessaoForm, notasSessao: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Escreva livremente sobre insights transferenciais, resistência, significantes importantes que surgiram..."
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormSessao(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!sessaoForm.analisandoId || !sessaoForm.modalidadeId) {
                    alert('Por favor, selecione o paciente e a modalidade.');
                    return;
                  }
                  // Automatic next session date calculation
                  const mod = modalidades.find(x => x.id === sessaoForm.modalidadeId);
                  const diasFrequencia = mod ? mod.intervaloDias : 7;
                  const proximaData = adicionarDias(sessaoForm.data, diasFrequencia).slice(0, 10);
                  
                  const novaSessao = {
                    ...sessaoForm,
                    proximaSessaoData: proximaData
                  };

                  atualizarSessoes([novaSessao, ...sessoes]);
                  setMostrarFormSessao(false);
                  alert('Sessão registrada no setting clínico!');
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Registrar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. NEW/EDIT MODALIDADE FORM MODAL */}
      {mostrarFormModalidade && modalidadeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">
                {modalidades.some(m => m.id === modalidadeForm.id) ? 'Editar modalidade' : 'Nova modalidade'}
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome da modalidade</label>
                <input
                  type="text"
                  value={modalidadeForm.nome}
                  onChange={e => setModalidadeForm({ ...modalidadeForm, nome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Análise Individual Semanal (Online)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Categoria</label>
                  <input
                    type="text"
                    value={modalidadeForm.categoria}
                    onChange={e => setModalidadeForm({ ...modalidadeForm, categoria: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Ex: Análise Individual"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Valor sugerido (R$)</label>
                  <input
                    type="number"
                    value={modalidadeForm.preco || ''}
                    onChange={e => setModalidadeForm({ ...modalidadeForm, preco: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Duração (minutos)</label>
                  <input
                    type="number"
                    value={modalidadeForm.duracao || ''}
                    onChange={e => setModalidadeForm({ ...modalidadeForm, duracao: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Intervalo sugerido (dias)</label>
                  <input
                    type="number"
                    value={modalidadeForm.intervaloDias || ''}
                    onChange={e => setModalidadeForm({ ...modalidadeForm, intervaloDias: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Observações do setting</label>
                <textarea
                  value={modalidadeForm.observacoes || ''}
                  onChange={e => setModalidadeForm({ ...modalidadeForm, observacoes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormModalidade(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!modalidadeForm.nome.trim()) return alert('Informe o nome da modalidade.');
                  const salvo = modalidades.some(x => x.id === modalidadeForm.id);
                  if (salvo) {
                    atualizarModalidades(modalidades.map(x => x.id === modalidadeForm.id ? modalidadeForm : x));
                  } else {
                    atualizarModalidades([...modalidades, modalidadeForm]);
                  }
                  setMostrarFormModalidade(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Salvar Modalidade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. NEW/EDIT HONORARIO FORM MODAL */}
      {mostrarFormHonorario && honorarioForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">Lançar acerto de honorários</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Paciente</label>
                <select
                  value={honorarioForm.analisandoId}
                  onChange={e => setHonorarioForm({ ...honorarioForm, analisandoId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Selecione o paciente —</option>
                  {analisandos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Valor total (R$)</label>
                  <input
                    type="number"
                    value={honorarioForm.valor || ''}
                    onChange={e => setHonorarioForm({ ...honorarioForm, valor: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Data de vencimento</label>
                  <input
                    type="date"
                    value={honorarioForm.vencimento.slice(0, 10)}
                    onChange={e => setHonorarioForm({ ...honorarioForm, vencimento: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Situação inicial</label>
                <select
                  value={honorarioForm.status}
                  onChange={e => setHonorarioForm({ ...honorarioForm, status: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Em atraso</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Observações ou descrição do acerto</label>
                <textarea
                  value={honorarioForm.observacao || ''}
                  onChange={e => setHonorarioForm({ ...honorarioForm, observacao: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Ex: Mensalidade de análises (4 sessões)"
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormHonorario(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!honorarioForm.analisandoId) return alert('Selecione o paciente.');
                  const salvo = honorarios.some(x => x.id === honorarioForm.id);
                  if (salvo) {
                    atualizarHonorarios(honorarios.map(x => x.id === honorarioForm.id ? honorarioForm : x));
                  } else {
                    atualizarHonorarios([honorarioForm, ...honorarios]);
                  }
                  setMostrarFormHonorario(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Salvar Honorário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. NEW/EDIT MODELO DE MENSAGEM FORM MODAL */}
      {mostrarFormModelo && modeloForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">
                {modelos.some(x => x.id === modeloForm.id) ? 'Editar modelo' : 'Novo modelo'}
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Título do modelo</label>
                <input
                  type="text"
                  value={modeloForm.nome}
                  onChange={e => setModeloForm({ ...modeloForm, nome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Lembrete de Sessão de Análise"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Categoria do Setting</label>
                <select
                  value={modeloForm.categoria}
                  onChange={e => setModeloForm({ ...modeloForm, categoria: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="acolhimento">Acolhimento & Triagem</option>
                  <option value="retorno">Lembrete de Sessão</option>
                  <option value="aniversario">Aniversário</option>
                  <option value="honorarios">Cobrança de Honorários</option>
                  <option value="reativacao">Reativação de Paciente</option>
                  <option value="informativo">Informativo Geral</option>
                  <option value="geral">Mensagem Livre</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Conteúdo do roteiro</label>
                  <span className="text-[10px] text-muted-foreground">Variáveis suportadas: &#123;nome&#125;, &#123;analista&#125;, &#123;empresa&#125;, &#123;servico&#125;, &#123;valor&#125;, &#123;data&#125;</span>
                </div>
                <textarea
                  value={modeloForm.conteudo}
                  onChange={e => setModeloForm({ ...modeloForm, conteudo: e.target.value })}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Escreva seu roteiro de WhatsApp usando as chaves de preenchimento para personalizar..."
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormModelo(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!modeloForm.nome.trim() || !modeloForm.conteudo.trim()) return alert('Preencha os campos obrigatórios.');
                  const salvo = modelos.some(x => x.id === modeloForm.id);
                  if (salvo) {
                    atualizarModelos(modelos.map(x => x.id === modeloForm.id ? modeloForm : x));
                  } else {
                    atualizarModelos([...modelos, modeloForm]);
                  }
                  setMostrarFormModelo(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NEW/EDIT TRANSMISSAO FORM MODAL */}
      {mostrarFormTransmissao && transmissaoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">Criar nova transmissão de grupo</h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Título da transmissão</label>
                <input
                  type="text"
                  value={transmissaoForm.nome}
                  onChange={e => setTransmissaoForm({ ...transmissaoForm, nome: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ex: Aviso de Recesso Clínico de Fim de Ano"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Público alvo</label>
                <select
                  value={transmissaoForm.publico}
                  onChange={e => setTransmissaoForm({ ...transmissaoForm, publico: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="todos">Todos os cadastrados</option>
                  <option value="vips">Casos prioritários (Vips)</option>
                  <option value="inativos">Pacientes em pausa/alta</option>
                  <option value="aniversariantes">Aniversariantes do mês</option>
                  <option value="tag">Filtro por Tag clínica</option>
                </select>
              </div>

              {transmissaoForm.publico === 'tag' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Tag específica</label>
                  <input
                    type="text"
                    value={transmissaoForm.tag || ''}
                    onChange={e => setTransmissaoForm({ ...transmissaoForm, tag: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Ex: divã"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Mensagem de transmissão</label>
                <textarea
                  value={transmissaoForm.mensagem}
                  onChange={e => setTransmissaoForm({ ...transmissaoForm, mensagem: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Escreva a mensagem que deseja transmitir..."
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormTransmissao(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!transmissaoForm.nome.trim() || !transmissaoForm.mensagem.trim()) return alert('Preencha todos os campos obrigatórios.');
                  const salvo = transmissoes.some(x => x.id === transmissaoForm.id);
                  if (salvo) {
                    atualizarTransmissoes(transmissoes.map(x => x.id === transmissaoForm.id ? transmissaoForm : x));
                  } else {
                    atualizarTransmissoes([transmissaoForm, ...transmissoes]);
                  }
                  setMostrarFormTransmissao(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Criar Transmissão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. EDIT/NEW CLINICAL APPOINTMENT FORM MODAL */}
      {mostrarFormAgendamento && agendamentoForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="gradient-emerald text-primary-foreground px-5 py-4 shrink-0">
              <h3 className="text-lg font-bold">
                {agendamentos.some(x => x.id === agendamentoForm.id) ? 'Editar Horário de Sessão' : 'Novo Agendamento na Agenda'}
              </h3>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Paciente *</label>
                <select
                  value={agendamentoForm.analisandoId}
                  onChange={e => setAgendamentoForm({ ...agendamentoForm, analisandoId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">— Escolha um paciente cadastrado —</option>
                  {analisandos.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Modalidade Clínica *</label>
                <select
                  value={agendamentoForm.modalidadeId}
                  onChange={e => setAgendamentoForm({ ...agendamentoForm, modalidadeId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {modalidades.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} ({formatarMoeda(m.preco)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Data da Sessão *</label>
                  <input
                    type="date"
                    value={agendamentoForm.data}
                    onChange={e => setAgendamentoForm({ ...agendamentoForm, data: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Horário *</label>
                  <input
                    type="time"
                    value={agendamentoForm.hora}
                    onChange={e => setAgendamentoForm({ ...agendamentoForm, hora: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Status Inicial *</label>
                <select
                  value={agendamentoForm.status}
                  onChange={e => setAgendamentoForm({ ...agendamentoForm, status: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-sm text-foreground focus-visible:outline-none"
                >
                  <option value="confirmado">Confirmado</option>
                  <option value="pendente">Pendente de Confirmação</option>
                  <option value="realizado">Realizado / Concluído</option>
                  <option value="cancelado">Cancelado pelo Paciente</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Observações da sessão</label>
                <textarea
                  value={agendamentoForm.observacao || ''}
                  onChange={e => setAgendamentoForm({ ...agendamentoForm, observacao: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Ex: Primeira entrevista clínica; focar na transferência"
                />
              </div>
            </div>
            <div className="border-t border-border px-5 py-3.5 sm:py-4 flex justify-end gap-2 bg-muted/30 shrink-0">
              <button
                onClick={() => setMostrarFormAgendamento(false)}
                className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted text-muted-foreground rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!agendamentoForm.analisandoId) {
                    alert('Por favor, selecione um paciente cadastrado!');
                    return;
                  }
                  const existe = agendamentos.some(x => x.id === agendamentoForm.id);
                  if (existe) {
                    atualizarAgendamentos(agendamentos.map(x => x.id === agendamentoForm.id ? agendamentoForm : x));
                  } else {
                    atualizarAgendamentos([agendamentoForm, ...agendamentos]);
                  }
                  setMostrarFormAgendamento(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-white gradient-emerald rounded-xl shadow-md"
              >
                Salvar Horário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Bot, 
  ShieldAlert, 
  BookOpen, 
  Search, 
  MessageSquare, 
  Compass, 
  Check, 
  Copy
} from 'lucide-react';
import { Card } from './ui-compact';

interface ConceitoPsicanalitico {
  termo: string;
  autor: 'Freud' | 'Lacan' | 'Freud & Lacan' | 'Ética Clínica';
  definicao: string;
  relevanciaClinica: string;
}

const CONCEITOS_LOCAIS: ConceitoPsicanalitico[] = [
  {
    termo: 'Inconsciente',
    autor: 'Freud & Lacan',
    definicao: 'Para Freud, instância psíquica estruturada por processos primários e conteúdos recalcados. Para Lacan, estruturado como uma linguagem, revelando-se nas falhas e fendas do discurso consciente.',
    relevanciaClinica: 'O analista orienta a escuta para os tropeços da fala (atos falhos, lapsos, chistes, silêncios), onde a verdade do sujeito emerge.'
  },
  {
    termo: 'Transferência',
    autor: 'Freud & Lacan',
    definicao: 'Atualização no presente da relação analítica de figuras e demandas do passado infantil. Lacan introduz a transferência articulada ao Sujeito Suposto Saber.',
    relevanciaClinica: 'Motor e, ao mesmo tempo, resistência na análise. O manejo ético exige sustentar a transferência sem alimentar o circuito de demanda imaginária.'
  },
  {
    termo: 'Resistência',
    autor: 'Freud & Lacan',
    definicao: 'Toda força psíquica que se opõe ao trabalho de elaboração analítica. Lacan pontua que, com frequência, "não há resistência do paciente, há resistência do analista" quando este se apega à sua própria contratransferência.',
    relevanciaClinica: 'Não deve ser combatida com persuasão ou pedagogia, mas acolhida e pontuada no setting como índice da proximidade do Real angustiante.'
  },
  {
    termo: 'Regra da Abstinência',
    autor: 'Freud',
    definicao: 'Preceito fundamental de que o tratamento deve transcorrer sob renúncia à satisfação substitutiva direta das pulsões no vínculo com o analista.',
    relevanciaClinica: 'O analista não oferece conselhos pessoais, validação moral, diretrizes de vida ou intimidade afetiva, preservando o lugar da falta.'
  },
  {
    termo: 'Tempo Lógico & Corte',
    autor: 'Lacan',
    definicao: 'Articulação do tempo em três momentos: instante do olhar, tempo de compreender e momento de concluir. O corte da sessão opera como pontuação no significante.',
    relevanciaClinica: 'A sessão não precisa ser cronométrica: o corte visa provocar uma precipitação lógica no sujeito sobre algo decisivo enunciado.'
  },
  {
    termo: 'Pulsão de Morte (Todestrieb)',
    autor: 'Freud',
    definicao: 'Tendência inerente à vida orgânica de retornar ao estado inorgânico, manifestando-se na compulsão à repetição (Além do Princípio do Prazer).',
    relevanciaClinica: 'Ajuda a compreender ciclos autodestrutivos, sintomas refratários e a insistência do sujeito em caminhos de sofrimento sintomático.'
  },
  {
    termo: 'Associação Livre',
    autor: 'Freud',
    definicao: 'A regra de ouro da psicanálise: o analisando deve comunicar tudo o que lhe vier à mente, renunciando à censura, coerência lógica ou pudor.',
    relevanciaClinica: 'Permite o desmantelamento das defesas do ego consciente e abre passagem para a fala do sujeito do inconsciente.'
  },
  {
    termo: 'Neutralidade Analítica',
    autor: 'Ética Clínica',
    definicao: 'Postura pela qual o analista se abstém de julgar valorativamente, intervir com sua visão de mundo ou direcionar escolhas existenciais do paciente.',
    relevanciaClinica: 'Garante o espaço para que a singularidade do desejo do analisando emerja sem alienação às expectativas do terapeuta.'
  }
];

const MODELOS_COMUNICACAO = [
  {
    titulo: 'Reativação de Setting por Pausa Não Comunicada',
    texto: 'Olá, [Nome]. Notei sua ausência no horário agendado para hoje. Nosso espaço no setting clínico permanece reservado para sua escuta. Caso deseje confirmar seu retorno na próxima semana ou conversar sobre o andamento das sessões, estou à disposição. Um abraço.'
  },
  {
    titulo: 'Comunicação Ética de Reajuste Anual de Honorários',
    texto: 'Olá, [Nome]. Como parte do nosso acordo inicial de acompanhamento no setting, realizo anualmente a atualização do valor das sessões. A partir de [Mês], o valor será ajustado para [Valor]. Gostaria de pontuar esse tema em nosso próximo encontro presencial/online para alinharmos juntos.'
  },
  {
    titulo: 'Aviso Prévio de Recesso / Férias do Consultório',
    texto: 'Olá, [Nome]. Informo que o consultório estará em recesso profissional no período de [Data Início] a [Data Fim]. Nossos atendimentos regulares serão retomados a partir de [Data Retorno]. Estarei com comunicações reduzidas durante esse intervalo.'
  }
];

export default function SecaoBia() {
  const [busca, setBusca] = useState('');
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);

  const conceitosFiltrados = CONCEITOS_LOCAIS.filter(c => 
    c.termo.toLowerCase().includes(busca.toLowerCase()) ||
    c.definicao.toLowerCase().includes(busca.toLowerCase()) ||
    c.relevanciaClinica.toLowerCase().includes(busca.toLowerCase()) ||
    c.autor.toLowerCase().includes(busca.toLowerCase())
  );

  const handleCopiar = (texto: string, idx: number) => {
    navigator.clipboard.writeText(texto);
    setCopiadoIdx(idx);
    setTimeout(() => setCopiadoIdx(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bot className="size-6 text-primary" />
            <span>Guia de Orientação Teórica e Ética Clínica (Bia)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Consulta rápida de fundamentos freudianos e lacanianos, modelos de enquadre e diretrizes de setting.
          </p>
        </div>
      </div>

      {/* Alerta Estrutural de Privacidade e Sigilo Clínico */}
      <Card className="p-4 border-2 border-emerald-500/30 bg-emerald-500/5 space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
          <ShieldAlert className="size-4" />
          <span>Privacidade Absoluta: Zero Transmissão Externa</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          O PSi 4.0 opera sob o compromisso ético de não-compartilhamento de dados clínicos. Prontuários, notas de sessão, nomes de analisandos e gravações de áudio permanecem exclusivamente no seu cofre criptografado local e <strong>nunca são enviados para APIs externas de inteligência artificial (como Gemini ou OpenAI)</strong>. A formulação diagnóstica e a escuta clínica são atos humanos e indelegáveis do profissional.
        </p>
      </Card>

      {/* Grid: Conceitos Teóricos & Modelos de Setting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Biblioteca de Conceitos */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Compêndio Conceitual de Psicanálise (100% Local)
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  placeholder="Pesquisar conceito ou termo..."
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {conceitosFiltrados.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2 flex flex-col justify-between hover:border-primary/40 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{item.termo}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {item.autor}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.definicao}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/60 text-[11px] text-foreground/80 italic">
                    <span className="font-semibold not-italic text-primary">Manejo: </span>
                    {item.relevanciaClinica}
                  </div>
                </div>
              ))}
            </div>

            {conceitosFiltrados.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Nenhum conceito encontrado para a busca "{busca}".
              </div>
            )}
          </Card>
        </div>

        {/* Painel Direito: Modelos Éticos de Comunicação de Setting */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
              <MessageSquare className="size-4 text-primary" />
              Modelos de Mensagem Ética
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Textos sóbrios e respeitosos ao enquadre clínico, prontos para uso manual sem quebra de neutralidade.
            </p>

            <div className="space-y-3">
              {MODELOS_COMUNICACAO.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{m.titulo}</span>
                    <button
                      onClick={() => handleCopiar(m.texto, idx)}
                      className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      title="Copiar texto"
                    >
                      {copiadoIdx === idx ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground italic bg-card p-2.5 rounded-lg border border-border/50 leading-relaxed">
                    "{m.texto}"
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-2 bg-muted/20 border border-border">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Compass className="size-4 text-primary" />
              Supervisão e Formação Contínua
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Lembre-se: o tripé da formação analítica apoia-se em análise pessoal, supervisão clínica com pares e estudo teórico rigoroso. Nenhuma automação substitui a escuta transferencial.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

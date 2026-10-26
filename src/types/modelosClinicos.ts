/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoriaModeloClinico =
  | 'documento'
  | 'anamnese_geral'
  | 'anamnese_rotina'
  | 'formulario';

export type TipoPreenchimento =
  | 'texto_estruturado'
  | 'escala_psicometrica'
  | 'registro_humor'
  | 'formulario_nr1';

export interface OpcaoEscala {
  valor: number;
  texto: string;
}

export interface ItemEscala {
  id: number;
  rotulo: string;
  pergunta?: string;
  opcoes?: OpcaoEscala[];
  invertido?: boolean;
  critico?: boolean; // Para alerta clínico (ex: item 9 do BDI - ideação suicida)
  avisoCritico?: string;
}

export interface CampoEstruturado {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'texto' | 'textarea' | 'select' | 'numero' | 'escala_likert' | 'data';
  opcoesSelect?: string[];
  valorPadrao?: string;
  obrigatorio?: boolean;
}

export interface ModeloClinico {
  id: string;
  titulo: string;
  categoria: CategoriaModeloClinico;
  subcategoria?: string;
  descricao: string;
  badgeTexto: string;
  badgeClasse: string;
  tipoPreenchimento: TipoPreenchimento;
  icone: string;
  textoBase: string; // Template de texto com placeholders como [Nome do Paciente], [CPF], etc.
  camposEstruturados?: CampoEstruturado[];
  itensEscala?: ItemEscala[];
  interpretacaoEscore?: {
    faixas: {
      min: number;
      max: number;
      classificacao: string;
      cor: string;
      recomendacaoClinica: string;
    }[];
  };
}

export interface DocumentoPreenchidoSalvo {
  id: string;
  modeloId: string;
  tituloModelo: string;
  categoria: CategoriaModeloClinico;
  analisandoId: string;
  pacienteNome: string;
  dataCriacao: string; // ISO
  dataUltimaEdicao: string;
  conteudoTexto: string;
  escoreObtido?: number;
  classificacaoEscore?: string;
  respostasEstruturadas?: Record<string, any>;
  respostasEscala?: Record<number, number>;
  alertaClinico?: string;
  assinado?: boolean;
}

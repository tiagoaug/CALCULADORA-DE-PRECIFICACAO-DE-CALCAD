
export interface Insumo {
  id: string;
  nome: string;
  peca?: string;
  material?: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  quantidadeCompra?: number;
  fator?: number; // Fator de conversão específico para este material
  rendimento?: number; // Rendimento do material (quantos pares produz)
  comentario?: string;
  consumptionCalcState?: any;
}

export interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
  comentario?: string;
}

export interface ProductionSettings {
  diasTrabalhados: number;
  producaoDiaria: number;
}

export interface MarkupSettings {
  impostos: number;
  comissao: number;
  frete: number;
  freteFixo: number;
  perdas: number;
  perdasMode?: 'percent' | 'fixed';
  margemLucro: number;
  margemLucroMode?: 'percent' | 'fixed';
  selectedImpostos?: string[];
  selectedComissoes?: string[];
  selectedFretes?: string[];
}

export interface Comissao {
  id: string;
  nome: string;
  aliquota: number;
}

export interface Frete {
  id: string;
  nome: string;
  valor: number;
}


export interface Imposto {
  id: string;
  nome: string;
  aliquota: number;
}

export interface ProductData {
  id: string;
  name: string;
  client?: string;
  lastModified: number;
  type?: 'detailed' | 'ready';
  purchasePrice?: number;
  insumos: Insumo[];
  terceirizados: Insumo[];
  custosFixos: CustoFixo[];
  custosIndiretos: CustoFixo[];
  production: ProductionSettings;
  markup: MarkupSettings;
  precoVendaManual?: number; // Novo campo para preço inserido pelo usuário
}

export interface AppSettings {
  productionDays: number;
  dailyProduction: number;
  currency: string;
  theme: 'light' | 'dark';
  unidadesMedida?: UnidadeMedida[]; // Adicionado para unidades personalizáveis
}

export interface UnidadeMedida {
    id: string;
    nome: string;
    fator?: number; // Fator de conversão (ex: 1000 para Kg)
}

export interface LibraryData {
    pecas: Insumo[];
    insumos: Insumo[];
    terceirizados: Insumo[];
    custosFixos: CustoFixo[];
    custosIndiretos: CustoFixo[];
    impostos: Imposto[];
    comissoes: Comissao[];
    fretes: Frete[];
    solados: Sola[];
    unidadesMedida: UnidadeMedida[];
}

export interface MaterialPriceRecord {
  id: string;
  material: string;
  fornecedor: string;
  preco: number;
  data: number;
  unidade?: string;
  largura?: number;
}

export interface SolaGradeItem {
  id: string;
  tamanho: string;
  peso: number;
}

export interface SolaLaborItem {
  id: string;
  nome: string;
  valor: number;
}

export interface SolaMaterial {
  id: string;
  materialId: string;
  pesoGrams: number; // Peso deste material no solado em gramas
  precoAlternativo?: number; // Preço manual que sobrescreve o da biblioteca
  tipoCalculo?: 'peso' | 'rendimento' | 'porcentagem'; // Modo de cálculo
  rendimentoPares?: number; // Rendimento: quantos pares produz com 1kg deste material
  porcentagem?: number; // Porcentagem do material na mistura (0-100)
}

export interface Sola {
  id: string;
  nome: string;
  fornecedor: string;
  valor?: number; // Preço do solado pronto (opcional)
  tipo?: 'simples' | 'mistura' | 'porcentagem'; // Tipo de composição
  rendimentoGlobal?: number; // Rendimento para modo mistura por porcentagem
  materiais: SolaMaterial[]; // Lista de materiais usados
  grade: SolaGradeItem[];
  maoDeObra: SolaLaborItem[];
  lastModified: number;
}

export interface Supplier {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface AppDatabase {
  uid?: string; // UID Pinning to prevent cross-account data leakage
  products: ProductData[];
  library: LibraryData;
  settings: AppSettings;
  lastSelectedProductId?: string;
  materialPrices?: MaterialPriceRecord[];
  suppliers?: Supplier[];
  clients?: Client[];
}

export interface PriceSummary {
  producaoMensal: number;
  custoMaterial: number;
  custoTerceirizados: number;
  custoFixoUnitario: number;
  custoIndiretoUnitario: number;
  custoFixoPorUnidade: number;
  valorPerdaUnitario: number;
  custoProducaoUnitario: number;
  valorImpostoUnitario: number;
  valorComissaoUnitaria: number;
  valorFreteUnitario: number;
  lucroUnitario: number;
  precoFinal: number; // Preço sugerido pela margem alvo
  precoPraticado: number; // Preço inserido manualmente
  margemReal: number; // Margem alcançada com o preço praticado
  lucroRealUnitario: number; // Lucro em R$ com o preço praticado
  custoTotalMensal: number;
  faturamentoMensal: number;
}

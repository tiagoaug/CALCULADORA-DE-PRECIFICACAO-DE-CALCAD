
export interface Insumo {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  comentario?: string;
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
  perdas: number;
  margemLucro: number;
}

export interface ProductData {
  id: string;
  name: string;
  lastModified: number;
  insumos: Insumo[];
  terceirizados: Insumo[];
  custosFixos: CustoFixo[];
  custosIndiretos: CustoFixo[];
  production: ProductionSettings;
  markup: MarkupSettings;
  precoVendaManual?: number; // Novo campo para preço inserido pelo usuário
}

export interface LibraryData {
  insumos: Insumo[];
  servicos: Insumo[];
  custosFixos: CustoFixo[];
  custosVariaveis: CustoFixo[];
}

export interface AppDatabase {
  version: string;
  products: ProductData[];
  lastSelectedProductId: string;
  library: LibraryData;
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
  lucroUnitario: number;
  precoFinal: number; // Preço sugerido pela margem alvo
  precoPraticado: number; // Preço inserido manualmente
  margemReal: number; // Margem alcançada com o preço praticado
  lucroRealUnitario: number; // Lucro em R$ com o preço praticado
  custoTotalMensal: number;
  faturamentoMensal: number;
}


import { Insumo, CustoFixo, ProductionSettings, MarkupSettings, PriceSummary, Sola, UnidadeMedida } from '../types';

/**
 * Procura o fator de conversão para uma unidade de medida.
 * Ex: 'Milheiro' -> 1000, 'Unidade' -> 1
 */
export const findUnitFactor = (nome: string, unidadesMedida: UnidadeMedida[] = [], materialFator?: number) => {
  // 1. Se o material já tem um fator definido, usa ele (Prioridade Máxima)
  if (materialFator !== undefined && materialFator > 0) return materialFator;

  if (!nome) return 1;
  const n = nome.trim().toLowerCase();
  
  // 2. Procurar na lista de unidades (Prioridade Média)
  const unit = unidadesMedida.find(u => 
    u.nome && u.nome.trim().toLowerCase() === n
  );
  if (unit && unit.fator) return unit.fator;

  // 3. Fallbacks para unidades comuns (Prioridade Baixa)
  switch (n) {
    case 'kg':
    case 'kilo':
    case 'quilo':
    case 'quilograma':
    case 'kilograma':
    case 'kgs':
      return 1000;
    case 'g':
    case 'gr':
    case 'grama':
    case 'gramas':
      return 1;
    case 'mil':
    case 'milheiro':
      return 1000;
    case 'par':
    case 'pares':
    case 'un':
    case 'unidade':
    case 'unidades':
    case 'm':
    case 'metro':
    case 'metros':
    case 'm²':
    case 'm2':
    case 'ml':
      return 1;
    default:
      return 1;
  }
};

export const calculateSummary = (
  insumos: Insumo[] = [],
  custosFixos: CustoFixo[] = [],
  custosIndiretos: CustoFixo[] = [],
  production: ProductionSettings = { diasTrabalhados: 0, producaoDiaria: 0 },
  markup: MarkupSettings = { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 0 },
  terceirizados: Insumo[] = [],
  precoManual: number = 0,
  type: 'detailed' | 'ready' = 'detailed',
  purchasePrice: number = 0,
  unidadesMedida: UnidadeMedida[] = []
): PriceSummary => {
  // Garantia de valores numéricos
  const dias = production?.diasTrabalhados || 0;
  const qtdDiaria = production?.producaoDiaria || 0;
  const producaoMensal = dias * qtdDiaria;

  // 1. Custo de Materiais (Unitário)
  const custoMaterial = type === 'ready' 
    ? (purchasePrice || 0)
    : (insumos || []).reduce((acc, curr) => {
        const factor = findUnitFactor(curr.unidade, unidadesMedida, curr.fator);
        const valorReal = (curr.valorUnitario || 0) / (factor || 1);
        return acc + ((curr.quantidade || 0) * valorReal);
      }, 0);

  // 2. Custo de Terceirizados (Unitário)
  const custoTerceirizados = (terceirizados || []).reduce((acc, curr) => {
    const factor = findUnitFactor(curr.unidade, unidadesMedida, curr.fator);
    const valorReal = (curr.valorUnitario || 0) / (factor || 1);
    return acc + ((curr.quantidade || 0) * valorReal);
  }, 0);

  // 3. Custos Operacionais Totais
  const custoFixoTotal = (custosFixos || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const custoIndiretoTotal = (custosIndiretos || []).reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // 4. Custos Operacionais Unitários (Diluídos)
  const fixedUnitary = producaoMensal > 0 ? custoFixoTotal / producaoMensal : 0;
  const indirectUnitary = producaoMensal > 0 ? custoIndiretoTotal / producaoMensal : 0;
  const custoOperacionalUnitario = fixedUnitary + indirectUnitary;

  // 5. Custo Base (Soma tudo antes das perdas)
  const custoBase = custoMaterial + custoTerceirizados + custoOperacionalUnitario;

  // 6. Perdas de Produção
  const valorPerdaUnitario = custoBase * ((markup?.perdas || 0) / 100);
  const custoProducaoUnitario = custoBase + valorPerdaUnitario;

  // 7. Preço Sugerido (Baseado na MARGEM ALVO e TAXAS DE VENDA)
  const percImposto = (markup?.impostos || 0) / 100;
  const percComissao = (markup?.comissao || 0) / 100;
  const percMargemAlvo = (markup?.margemLucro || 0) / 100;
  const freteFixo = (markup?.freteFixo || 0);

  const divisorMarkup = Math.max(0.1, 1 - percImposto - percComissao - percMargemAlvo);
  const precoSugerido = (custoProducaoUnitario + freteFixo) / divisorMarkup;

  // 8. Preço Praticado (O que o usuário inseriu ou o sugerido se vazio)
  const precoPraticado = precoManual > 0 ? precoManual : precoSugerido;

  // 9. Cálculo das Taxas Reais e Margem Real
  const valorImpostoUnitario = precoPraticado * percImposto;
  const valorComissaoUnitaria = precoPraticado * percComissao;
  const valorFreteUnitario = freteFixo;
  
  const lucroRealUnitario = precoPraticado - valorImpostoUnitario - valorComissaoUnitaria - valorFreteUnitario - custoProducaoUnitario;
  const margemReal = precoPraticado > 0 ? (lucroRealUnitario / precoPraticado) * 100 : 0;

  return {
    producaoMensal,
    custoMaterial,
    custoTerceirizados,
    custoFixoUnitario: fixedUnitary,
    custoIndiretoUnitario: indirectUnitary,
    custoFixoPorUnidade: custoOperacionalUnitario,
    valorPerdaUnitario,
    custoProducaoUnitario,
    valorImpostoUnitario,
    valorComissaoUnitaria,
    valorFreteUnitario,
    lucroUnitario: precoSugerido - (precoSugerido * (percImposto + percComissao)) - freteFixo - custoProducaoUnitario,
    precoFinal: precoSugerido,
    precoPraticado,
    margemReal,
    lucroRealUnitario,
    custoTotalMensal: custoProducaoUnitario * producaoMensal,
    faturamentoMensal: precoPraticado * producaoMensal
  };
};

export const formatCurrency = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value).replace(/\s/g, ' ');
};

export const formatNumber = (value: number, decimals: number = 2) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const calculateSolaMaterialsTotal = (sola: Sola, libraryInsumos: Insumo[], unidadesMedida: UnidadeMedida[] = []) => {
  return (sola.materiais || []).reduce((acc, mat) => {
    const libraryMat = libraryInsumos.find(m => m.id === (mat as any).materialId || m.id === mat.id);
    if (!libraryMat) return acc;

    // Lógica específica para solados: converte Kg para Gramas apenas aqui
    let factor = findUnitFactor(libraryMat.unidade || '', unidadesMedida, libraryMat.fator);
    const unitName = (libraryMat.unidade || '').toLowerCase();
    
    // Se a unidade for Kg e o fator ainda for 1 (padrão), assume que o usuário quer converter para Gramas (1000)
    // Mas se o usuário definiu um fator explicitamente (via material.fator), findUnitFactor já retornou ele.
    
    const price = Number(mat.precoAlternativo !== undefined ? mat.precoAlternativo : (libraryMat.valorUnitario || 0));
    const peso = Number(mat.pesoGrams || 0);
    
    return acc + ((price / factor) * peso);
  }, 0);
};

export const calculateSolaLaborTotal = (sola: Sola) => {
  return (sola.maoDeObra || []).reduce((sum, item) => sum + Number(item.valor || 0), 0);
};

export const calculateSolaAverageCost = (sola: Sola, libraryInsumos: Insumo[], unidadesMedida: UnidadeMedida[] = []) => {
  // Se o solado tiver um valor fixo (solado pronto), retorna este valor
  const fixo = Number(sola.valor || 0);
  if (fixo > 0) {
    return fixo;
  }

  const materialCost = Number(calculateSolaMaterialsTotal(sola, libraryInsumos, unidadesMedida) || 0);
  const laborCost = Number(calculateSolaLaborTotal(sola) || 0);

  return materialCost + laborCost;
};

export const calculateSolaAverageWeight = (sola: Sola) => {
    if (!sola.grade || sola.grade.length === 0) return 0;
    const totalWeight = sola.grade.reduce((sum, item) => sum + (item.peso || 0), 0);
    return totalWeight / sola.grade.length;
};

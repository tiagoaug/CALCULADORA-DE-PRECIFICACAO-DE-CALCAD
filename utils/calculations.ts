
import { Insumo, CustoFixo, ProductionSettings, MarkupSettings, PriceSummary, Sola } from '../types';

export const calculateSummary = (
  insumos: Insumo[] = [],
  custosFixos: CustoFixo[] = [],
  custosIndiretos: CustoFixo[] = [],
  production: ProductionSettings = { diasTrabalhados: 0, producaoDiaria: 0 },
  markup: MarkupSettings = { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 0 },
  terceirizados: Insumo[] = [],
  precoManual: number = 0,
  type: 'detailed' | 'ready' = 'detailed',
  purchasePrice: number = 0
): PriceSummary => {
  // Garantia de valores numéricos
  const dias = production?.diasTrabalhados || 0;
  const qtdDiaria = production?.producaoDiaria || 0;
  const producaoMensal = dias * qtdDiaria;

  // 1. Custo de Materiais (Unitário)
  const custoMaterial = type === 'ready' 
    ? (purchasePrice || 0)
    : (insumos || []).reduce((acc, curr) => acc + ((curr.quantidade || 0) * (curr.valorUnitario || 0)), 0);

  // 2. Custo de Terceirizados (Unitário)
  const custoTerceirizados = (terceirizados || []).reduce((acc, curr) => acc + ((curr.quantidade || 0) * (curr.valorUnitario || 0)), 0);

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
  // Usando Markup por Dentro: Preco = (Custo + FreteFixo) / (1 - %Imposto - %Comissao - %Margem)
  const percImposto = (markup?.impostos || 0) / 100;
  const percComissao = (markup?.comissao || 0) / 100;
  const percMargemAlvo = (markup?.margemLucro || 0) / 100;
  const freteFixo = (markup?.freteFixo || 0);

  const divisorMarkup = 1 - percImposto - percComissao - percMargemAlvo;
  // Fallback para evitar divisão por zero se a soma de taxas for >= 100%
  const precoSugerido = (divisorMarkup > 0.01) ? (custoProducaoUnitario + freteFixo) / divisorMarkup : (custoProducaoUnitario + freteFixo) * 2;

  // 8. Preço Praticado (O que o usuário inseriu ou o sugerido se vazio)
  const precoPraticado = precoManual > 0 ? precoManual : precoSugerido;

  // 9. Cálculo das Taxas Reais e Margem Real
  // As taxas reais são calculadas sobre o preço praticado (venda final)
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

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value).replace(/\s/g, ' ');
};

export const calculateSolaAverageCost = (sola: Sola, libraryInsumos: Insumo[]) => {
  // 1. Custo de materiais (peso em g * preço/kg / 1000)
  const materialCost = (sola.materiais || []).reduce((acc, mat) => {
    const libraryMat = libraryInsumos.find(m => m.id === mat.materialId);
    const price = mat.precoAlternativo !== undefined ? mat.precoAlternativo : (libraryMat?.valorUnitario || 0);
    return acc + ((price / 1000) * (mat.pesoGrams || 0));
  }, 0);

  // 2. Custo de mão de obra
  const laborCost = (sola.maoDeObra || []).reduce((sum, item) => sum + (item.valor || 0), 0);

  return materialCost + laborCost;
};

export const calculateSolaAverageWeight = (sola: Sola) => {
    if (!sola.grade || sola.grade.length === 0) return 0;
    const totalWeight = sola.grade.reduce((sum, item) => sum + (item.peso || 0), 0);
    return totalWeight / sola.grade.length;
};

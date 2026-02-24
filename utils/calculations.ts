
import { Insumo, CustoFixo, ProductionSettings, MarkupSettings, PriceSummary } from '../types';

export const calculateSummary = (
  insumos: Insumo[] = [],
  custosFixos: CustoFixo[] = [],
  custosIndiretos: CustoFixo[] = [],
  production: ProductionSettings = { diasTrabalhados: 0, producaoDiaria: 0 },
  markup: MarkupSettings = { impostos: 0, perdas: 0, margemLucro: 0 },
  terceirizados: Insumo[] = [],
  precoManual: number = 0
): PriceSummary => {
  // Garantia de valores numéricos
  const dias = production?.diasTrabalhados || 0;
  const qtdDiaria = production?.producaoDiaria || 0;
  const producaoMensal = dias * qtdDiaria;

  // 1. Custo de Materiais (Unitário)
  const custoMaterial = (insumos || []).reduce((acc, curr) => acc + ((curr.quantidade || 0) * (curr.valorUnitario || 0)), 0);

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

  // 7. Preço Sugerido (Baseado na MARGEM ALVO)
  const percImposto = (markup?.impostos || 0) / 100;
  const percMargemAlvo = (markup?.margemLucro || 0) / 100;

  // Cálculo do preço base com impostos (sem lucro) - Markup por dentro
  const divisorImposto = 1 - percImposto;
  const precoSemLucro = (divisorImposto > 0 && custoProducaoUnitario > 0) ? custoProducaoUnitario / divisorImposto : custoProducaoUnitario;

  // Preço sugerido aplicando a margem sobre o preço que já contém impostos
  const divisorLucro = 1 - percMargemAlvo;
  const precoSugerido = (divisorLucro > 0) ? precoSemLucro / divisorLucro : precoSemLucro;

  // 8. Preço Praticado (O que o usuário inseriu ou o sugerido se vazio)
  const precoPraticado = precoManual > 0 ? precoManual : precoSugerido;

  // 9. Cálculo do Imposto e Margem Real
  // O imposto é calculado sobre a base sem lucro, conforme solicitado
  const valorImpostoUnitario = precoSemLucro * percImposto;
  const lucroRealUnitario = precoPraticado - valorImpostoUnitario - custoProducaoUnitario;
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
    lucroUnitario: precoSugerido - valorImpostoUnitario - custoProducaoUnitario,
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
  }).format(value);
};

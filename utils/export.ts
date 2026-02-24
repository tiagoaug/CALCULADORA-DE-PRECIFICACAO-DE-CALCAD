
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Insumo, CustoFixo, PriceSummary } from '../types';
import { formatCurrency } from './calculations';

export const exportToXLS = (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string
) => {
  const wsData = [
    ['Relatório de Precificação - ' + productName],
    [''],
    ['Resumo Financeiro'],
    ['Produção Mensal', summary.producaoMensal],
    ['Custo de Materiais (por Par/Unid.)', formatCurrency(summary.custoMaterial)],
    ['Custo de Terceirizados (por Par/Unid.)', formatCurrency(summary.custoTerceirizados)],
    ['Custo Fixo/Indireto (por Par/Unid.)', formatCurrency(summary.custoFixoPorUnidade)],
    ['Custo de Produção Total (por Par/Unid.)', formatCurrency(summary.custoProducaoUnitario)],
    ['Preço de Venda Praticado', formatCurrency(summary.precoPraticado)],
    ['Margem Real Alcançada', `${summary.margemReal.toFixed(2)}%`],
    ['Lucro Real (por Par/Unid.)', formatCurrency(summary.lucroRealUnitario)],
    [''],
    ['Composição de Insumos'],
    ['Nome', 'Quantidade', 'Unidade', 'Valor Unit.', 'Subtotal'],
    ...(insumos || []).map(i => [i.nome, i.quantidade, i.unidade, i.valorUnitario, i.quantidade * i.valorUnitario])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Precificacao');
  XLSX.writeFile(wb, `Precificacao_${productName.replace(/\s/g, '_')}.xlsx`);
};

// Formata números decimais para o PDF (ex: quantidades)
const formatDecimal = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(val);
};

const generatePDFBlob = (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[] = []
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const primary = [30, 41, 59]; 
  const accent = [37, 99, 235];  
  const success = [16, 185, 129]; 
  const warning = [217, 119, 6];   
  const border = [226, 232, 240]; 
  const textSecondary = [100, 116, 139];

  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('PREÇO PRO', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO DE FORMAÇÃO DE PREÇO', 15, 28);
  
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 15, 36);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text((productName || 'Produto').toUpperCase(), 15, 60);
  
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(15, 65, pageWidth - 15, 65);

  const margin = 15;
  const gap = 8;
  const cardWidth = (pageWidth - (margin * 2) - (gap * 2)) / 3;
  const cardY = 75;
  const cardHeight = 35;
  
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(margin, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(warning[0], warning[1], warning[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTO DE PRODUÇÃO', margin + 5, cardY + 10);
  doc.setFontSize(14);
  doc.text(formatCurrency(summary.custoProducaoUnitario), margin + 5, cardY + 25);
  doc.setFontSize(7);
  doc.text('TOTAL UNITÁRIO', margin + 5, cardY + 31);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin + cardWidth + gap, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('PREÇO PRATICADO', margin + cardWidth + gap + 5, cardY + 10);
  doc.setFontSize(14);
  doc.text(formatCurrency(summary.precoPraticado), margin + cardWidth + gap + 5, cardY + 25);
  doc.setFontSize(7);
  doc.text('VALOR DE VENDA', margin + cardWidth + gap + 5, cardY + 31);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin + (cardWidth * 2) + (gap * 2), cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(success[0], success[1], success[2]);
  doc.text('MARGEM REAL', margin + (cardWidth * 2) + (gap * 2) + 5, cardY + 10);
  doc.setFontSize(14);
  doc.text(`${summary.margemReal.toFixed(1)}%`, margin + (cardWidth * 2) + (gap * 2) + 5, cardY + 25);
  doc.setFontSize(7);
  doc.text(`LUCRO: ${formatCurrency(summary.lucroRealUnitario)}`, margin + (cardWidth * 2) + (gap * 2) + 5, cardY + 31);

  let currentY = 125;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('Resumo Operacional Mensal', 15, currentY);
  
  currentY += 10;
  const gridData = [
    ['Produção Mensal Estimada:', `${formatDecimal(summary.producaoMensal)} unidades`],
    ['Custo de Matéria-Prima (Unit.):', formatCurrency(summary.custoMaterial)],
    ['Custo de Terceirizados (Unit.):', formatCurrency(summary.custoTerceirizados)],
    ['Custos Operacionais Diluídos (Unit.):', formatCurrency(summary.custoFixoPorUnidade)],
    ['Projeção de Perdas (Unit.):', formatCurrency(summary.valorPerdaUnitario)],
    ['Faturamento Mensal Estimado:', formatCurrency(summary.faturamentoMensal)],
  ];

  doc.setFontSize(10);
  gridData.forEach((row, index) => {
    const y = currentY + (index * 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(row[0], 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(row[1], pageWidth - 15, y, { align: 'right' });
    
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y + 2, pageWidth - 15, y + 2);
  });

  currentY += (gridData.length * 8) + 15;
  
  const renderTable = (title: string, data: Insumo[]) => {
    if (!data || data.length === 0) return;
    if (currentY > 240) { doc.addPage(); currentY = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(title, 15, currentY);
    
    currentY += 8;
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(15, currentY, pageWidth - 30, 10, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Item / Descrição', 18, currentY + 6.5);
    doc.text('Qtd', 100, currentY + 6.5, { align: 'center' });
    doc.text('Un', 115, currentY + 6.5, { align: 'center' });
    doc.text('V. Unit', 140, currentY + 6.5, { align: 'right' });
    doc.text('Subtotal', pageWidth - 18, currentY + 6.5, { align: 'right' });
    
    currentY += 10;
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont('helvetica', 'normal');

    data.forEach((i, index) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
        doc.setFillColor(primary[0], primary[1], primary[2]);
        doc.rect(15, currentY, pageWidth - 30, 8, 'F');
        currentY += 8;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, pageWidth - 30, 8, 'F');
      }

      doc.text(i.nome || '-', 18, currentY + 5.5);
      // Format quantity using the helper
      doc.text(formatDecimal(i.quantidade || 0), 100, currentY + 5.5, { align: 'center' });
      doc.text(i.unidade || '-', 115, currentY + 5.5, { align: 'center' });
      doc.text(formatCurrency(i.valorUnitario || 0), 140, currentY + 5.5, { align: 'right' });
      doc.text(formatCurrency((i.quantidade || 0) * (i.valorUnitario || 0)), pageWidth - 18, currentY + 5.5, { align: 'right' });
      
      currentY += 8;
    });
    currentY += 10;
  };

  renderTable('Detalhamento de Materiais', insumos);
  renderTable('Detalhamento de Terceirizados', terceirizados);

  const totalPages = doc.internal.pages.length - 1;
  for (let j = 1; j <= totalPages; j++) {
    doc.setPage(j);
    doc.setFontSize(8);
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
    doc.text(`Página ${j} de ${totalPages} | PREÇO PRO - Gestão de Custos`, pageWidth / 2, 290, { align: 'center' });
  }

  return doc;
};

export const exportToPDF = (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[] = []
) => {
  const doc = generatePDFBlob(insumos, summary, productName, terceirizados);
  doc.save(`Relatorio_Precificacao_${productName.replace(/\s/g, '_')}.pdf`);
};

export const sharePDF = async (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[] = []
) => {
  const doc = generatePDFBlob(insumos, summary, productName, terceirizados);
  const pdfOutput = doc.output('blob');
  const fileName = `Relatorio_Precificacao_${productName.replace(/\s/g, '_')}.pdf`;
  const file = new File([pdfOutput], fileName, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Relatório Preço PRO',
        text: `Confira a formação de preço de: ${productName}`,
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
      }
    }
  } else {
    doc.save(fileName);
    alert('PDF baixado automaticamente.');
  }
};

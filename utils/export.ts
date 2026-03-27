import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Insumo, CustoFixo, PriceSummary } from '../types';
import { formatCurrency } from './calculations';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

const sanitizeFilename = (name: string) => {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
};

export const exportToXLS = async (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[],
  type: 'ready' | 'production',
  selectedImpostos: string[] = [],
  libraryImpostos: any[] = [],
  selectedComissoes: string[] = [],
  libraryComissoes: any[] = [],
  selectedFretes: string[] = [],
  libraryFretes: any[] = []
) => {
  const taxDetailRows = selectedImpostos.map(id => {
    const tax = libraryImpostos.find(t => t.id === id);
    if (!tax) return null;
    const val = summary.precoPraticado * (tax.aliquota / 100);
    return [`   - Imposto: ${tax.nome} (${tax.aliquota}%)`, val];
  }).filter(Boolean) as any[][];

  const comissaoDetailRows = selectedComissoes.map(id => {
    const item = libraryComissoes.find(t => t.id === id);
    if (!item) return null;
    const val = summary.precoPraticado * (item.aliquota / 100);
    return [`   - Comissão: ${item.nome} (${item.aliquota}%)`, val];
  }).filter(Boolean) as any[][];

  const freteDetailRows = selectedFretes.map(id => {
    const item = libraryFretes.find(t => t.id === id);
    if (!item) return null;
    const val = summary.precoPraticado * (item.aliquota / 100);
    return [`   - Frete: ${item.nome} (${item.aliquota}%)`, val];
  }).filter(Boolean) as any[][];

  const wsData = [
    ['Relatório de Precificação - ' + productName],
    [''],
    ['Resumo Financeiro'],
    ['Produção Mensal', summary.producaoMensal],
    [type === 'ready' ? 'Preço de Compra (Produto)' : 'Custo de Materiais (por Par/Unid.)', formatCurrency(summary.custoMaterial)],
    ['Custo de Terceirizados (por Par/Unid.)', formatCurrency(summary.custoTerceirizados)],
    ['Custo Fixo/Indireto (por Par/Unid.)', formatCurrency(summary.custoFixoPorUnidade)],
    ['Custo de Produção Total (por Par/Unid.)', formatCurrency(summary.custoProducaoUnitario)],
    ['Preço de Venda Praticado', formatCurrency(summary.precoPraticado)],
    ['Margem Real Alcançada', `${summary.margemReal.toFixed(2)}%`],
    ['Lucro Real (por Par/Unid.)', formatCurrency(summary.lucroRealUnitario)],
    ['Lucro Mensal Estimado', formatCurrency(summary.lucroRealUnitario * summary.producaoMensal)],
    [''],
    ['Impostos sobre Venda', summary.valorImpostoUnitario],
    ...taxDetailRows,
    ['Comissões de Venda', summary.valorComissaoUnitaria],
    ...comissaoDetailRows,
    ['Fretes de Venda', summary.valorFreteUnitario],
    ...freteDetailRows,
    [''],
    ['Composição de Insumos'],
    ['Nome', 'Quantidade', 'Unidade', 'Valor Unit.', 'Subtotal'],
    ...(insumos || []).map(i => [i.nome, i.quantidade, i.unidade, i.valorUnitario, i.quantidade * i.valorUnitario])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Precificacao');
  const fileName = `Precificacao_${sanitizeFilename(productName)}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = XLSX.write(wb, { type: 'base64' });
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });
      alert('Arquivo XLSX salvo com sucesso na pasta Documentos!');
    } catch (error) {
      console.error('Erro ao exportar XLS no app:', error);
      alert('Erro ao exportar XLS no dispositivo.');
    }
  } else {
    XLSX.writeFile(wb, fileName);
  }
};

// Formata números decimais para o PDF (ex: quantidades)
const formatDecimal = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(val).replace(/\s/g, ' ');
};

export const generatePDFBlob = (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[],
  type: 'ready' | 'production',
  selectedImpostos: string[] = [],
  libraryImpostos: any[] = [],
  selectedComissoes: string[] = [],
  libraryComissoes: any[] = [],
  selectedFretes: string[] = [],
  libraryFretes: any[] = []
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
  const safeProductName = (productName || 'Produto').toUpperCase().replace(/\u00A0/g, ' ');
  doc.text(safeProductName, 15, 60);

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
  const taxBreakdownRows = selectedImpostos.map(id => {
    const tax = libraryImpostos.find(t => t.id === id);
    if (!tax) return null;
    const val = summary.precoPraticado * (tax.aliquota / 100);
    return [`   - Imposto: ${tax.nome} (${tax.aliquota}%):`, `+ ${formatCurrency(val)}`];
  }).filter(Boolean) as string[][];

  const comBreakdownRows = selectedComissoes.map(id => {
    const item = libraryComissoes.find(t => t.id === id);
    if (!item) return null;
    const val = summary.precoPraticado * (item.aliquota / 100);
    return [`   - Comis: ${item.nome} (${item.aliquota}%):`, `+ ${formatCurrency(val)}`];
  }).filter(Boolean) as string[][];

  const freBreakdownRows = selectedFretes.map(id => {
    const item = libraryFretes.find(t => t.id === id);
    if (!item) return null;
    const val = summary.precoPraticado * (item.aliquota / 100);
    return [`   - Frete: ${item.nome} (${item.aliquota}%):`, `+ ${formatCurrency(val)}`];
  }).filter(Boolean) as string[][];

  const gridData = [
    ['Produção Mensal Estimada:', `${formatDecimal(summary.producaoMensal)} unidades`],
    [type === 'ready' ? 'Preço de Compra (Produto):' : 'Custo de Matéria-Prima (Unit.):', formatCurrency(summary.custoMaterial)],
    ['Custo de Terceirizados (Unit.):', formatCurrency(summary.custoTerceirizados)],
    ['Custos Operacionais Diluídos (Unit.):', formatCurrency(summary.custoFixoPorUnidade)],
    ['Projeção de Perdas de Produção:', `+ ${formatCurrency(summary.valorPerdaUnitario)}`],
    ['Impostos sobre Venda:', `+ ${formatCurrency(summary.valorImpostoUnitario)}`],
    ...taxBreakdownRows,
    ['Comissões de Venda:', `+ ${formatCurrency(summary.valorComissaoUnitaria)}`],
    ...comBreakdownRows,
    ['Fretes de Venda:', `+ ${formatCurrency(summary.valorFreteUnitario)}`],
    ...freBreakdownRows,
    ['Total de Encargos (Perda + Taxas):', `+ ${formatCurrency(summary.valorPerdaUnitario + summary.valorImpostoUnitario + summary.valorComissaoUnitaria + summary.valorFreteUnitario)}`],
    ['Custo Total Real (Fábrica + Taxas):', formatCurrency(summary.custoProducaoUnitario + summary.valorImpostoUnitario + summary.valorComissaoUnitaria + summary.valorFreteUnitario)],
    ['Faturamento Mensal Estimado:', formatCurrency(summary.faturamentoMensal)],
    ['Lucro Mensal Estimado:', formatCurrency(summary.lucroRealUnitario * summary.producaoMensal)],
  ];

  doc.setFontSize(10);
  gridData.forEach((row, index) => {
    const y = currentY + (index * 8);
    doc.setFont('helvetica', 'normal');

    if (row[0].includes('Total') || row[0].includes('Venda')) {
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2]);
      doc.setFont('helvetica', 'normal');
    }

    doc.text(row[0].replace(/\u00A0/g, ' '), 15, y);

    if (row[0].includes('Sugestão') || row[0].includes('Sugerido')) {
      doc.setTextColor(accent[0], accent[1], accent[2]);
    } else if (row[0].includes('Total')) {
      doc.setTextColor(primary[0], primary[1], primary[2]);
    }

    doc.text(row[1].replace(/\u00A0/g, ' '), pageWidth - 15, y, { align: 'right' });

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

      doc.text((i.nome || '-').replace(/\u00A0/g, ' '), 18, currentY + 5.5);
      doc.text(formatDecimal(i.quantidade || 0), 100, currentY + 5.5, { align: 'center' });
      doc.text((i.unidade || '-').replace(/\u00A0/g, ' '), 115, currentY + 5.5, { align: 'center' });
      doc.text(formatCurrency(i.valorUnitario || 0), 140, currentY + 5.5, { align: 'right' });
      doc.text(formatCurrency((i.quantidade || 0) * (i.valorUnitario || 0)), pageWidth - 18, currentY + 5.5, { align: 'right' });

      currentY += 8;
    });
    currentY += 10;
  };

  if (type !== 'ready') {
    renderTable('Detalhamento de Materiais', insumos);
  }
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

export const downloadPDF = async (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[],
  type: 'ready' | 'production',
  selectedImpostos: string[] = [],
  libraryImpostos: any[] = [],
  selectedComissoes: string[] = [],
  libraryComissoes: any[] = [],
  selectedFretes: string[] = [],
  libraryFretes: any[] = []
) => {
  try {
    const doc = generatePDFBlob(
      insumos, 
      summary, 
      productName, 
      terceirizados, 
      type, 
      selectedImpostos, 
      libraryImpostos,
      selectedComissoes,
      libraryComissoes,
      selectedFretes,
      libraryFretes
    );
    const fileName = `Relatorio_Precificacao_${sanitizeFilename(productName)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBytes = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(pdfBytes);
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      const res = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Baixar Relatório PDF',
        text: `Salvar relatório de: ${productName}`,
        files: [res.uri],
      });
    } else {
      doc.save(fileName);
    }
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    alert('Erro ao baixar o PDF.');
  }
};

export const sharePDF = async (
  insumos: Insumo[],
  summary: PriceSummary,
  productName: string,
  terceirizados: Insumo[],
  type: 'ready' | 'production',
  selectedImpostos: string[] = [],
  libraryImpostos: any[] = [],
  selectedComissoes: string[] = [],
  libraryComissoes: any[] = [],
  selectedFretes: string[] = [],
  libraryFretes: any[] = []
) => {
  try {
    const doc = generatePDFBlob(
      insumos, 
      summary, 
      productName, 
      terceirizados, 
      type, 
      selectedImpostos, 
      libraryImpostos,
      selectedComissoes,
      libraryComissoes,
      selectedFretes,
      libraryFretes
    );
    const fileName = `Relatorio_Precificacao_${sanitizeFilename(productName)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBytes = doc.output('arraybuffer');
      const uint8Array = new Uint8Array(pdfBytes);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      const res = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: 'Relatório Preço PRO',
        text: `Confira a formação de preço de: ${productName}`,
        files: [res.uri],
      });
    } else {
      const pdfOutput = doc.output('blob');
      const file = new File([pdfOutput], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Relatório Preço PRO',
          text: `Confira a formação de preço de: ${productName}`,
        });
      } else {
        doc.save(fileName);
        alert('Compartilhamento não suportável neste dispositivo. O arquivo foi baixado manualmente.');
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Erro ao compartilhar PDF:', error);
      alert('Erro ao compartilhar o PDF.');
    }
  }
};

export const shareFile = async (data: string, fileName: string, title: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const res = await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: title,
        text: `Backup de dados: ${fileName}`,
        files: [res.uri],
      });
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Backup de dados: ${fileName}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        alert('Compartilhamento não suportável. O arquivo foi baixado manualmente.');
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Erro ao compartilhar arquivo:', error);
      alert('Erro ao exportar/compartilhar o arquivo.');
    }
  }
};

export const shareTextReport = async (
  summary: PriceSummary,
  productName: string,
  type: 'ready' | 'production',
  selectedImpostos: string[] = [],
  libraryImpostos: any[] = [],
  selectedComissoes: string[] = [],
  libraryComissoes: any[] = [],
  selectedFretes: string[] = [],
  libraryFretes: any[] = []
) => {
  try {
    const textReport = `
📊 *RELATÓRIO DE PRECIFICAÇÃO: ${productName.toUpperCase()}* 📊

*RESUMO FINANCEIRO*
----------------------------------------
💰 *Custo de Produção:* ${formatCurrency(summary.custoProducaoUnitario)}
🛒 *Preço Sugerido:*    ${formatCurrency(summary.precoFinal)}
🎯 *Preço Praticado:*   ${formatCurrency(summary.precoPraticado)}
📈 *Margem Real:*       ${summary.margemReal.toFixed(2)}%
💵 *Lucro Real/Par:*    ${formatCurrency(summary.lucroRealUnitario)}
📊 *Lucro Mensal:*      ${formatCurrency(summary.lucroRealUnitario * summary.producaoMensal)}

*CUSTOS UNITÁRIOS*
----------------------------------------
${type === 'ready' ? 'Preço Produto: ' : 'Materiais:     '}${formatCurrency(summary.custoMaterial)}
Terceirizados: ${formatCurrency(summary.custoTerceirizados)}
Fixo/Indireto: ${formatCurrency(summary.custoFixoPorUnidade)}
Perdas:        ${formatCurrency(summary.valorPerdaUnitario)}
Impostos:      ${formatCurrency(summary.valorImpostoUnitario)}
Comissões:     ${formatCurrency(summary.valorComissaoUnitaria)}
Fretes:        ${formatCurrency(summary.valorFreteUnitario)}

${selectedImpostos.length > 0 ? '\n*DETALHE IMPOSTOS*' : ''}
${selectedImpostos.map(id => {
  const tax = libraryImpostos.find(t => t.id === id);
  if (!tax) return '';
  const val = summary.precoPraticado * (tax.aliquota / 100);
  return `• ${tax.nome} (${tax.aliquota}%): ${formatCurrency(val)}`;
}).filter(s => s !== '').join('\n')}

${selectedComissoes.length > 0 ? '\n*DETALHE COMISSÕES*' : ''}
${selectedComissoes.map(id => {
  const item = libraryComissoes.find(t => t.id === id);
  if (!item) return '';
  const val = summary.precoPraticado * (item.aliquota / 100);
  return `• ${item.nome} (${item.aliquota}%): ${formatCurrency(val)}`;
}).filter(s => s !== '').join('\n')}

${selectedFretes.length > 0 ? '\n*DETALHE FRETES*' : ''}
${selectedFretes.map(id => {
  const item = libraryFretes.find(t => t.id === id);
  if (!item) return '';
  const val = summary.precoPraticado * (item.aliquota / 100);
  return `• ${item.nome} (${item.aliquota}%): ${formatCurrency(val)}`;
}).filter(s => s !== '').join('\n')}

Gerado por: Preço PRO - ${new Date().toLocaleDateString('pt-BR')}
`;

    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: `Relatório: ${productName}`,
        text: textReport,
        dialogTitle: 'Compartilhar Resumo de Precificação',
      });
    } else {
      if (navigator.share) {
        await navigator.share({
          title: `Relatório: ${productName}`,
          text: textReport,
        });
      } else {
        await copyToClipboard(textReport, 'Resumo copiado para a área de transferência!');
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Erro ao compartilhar texto:', error);
      alert('Erro ao compartilhar o resumo.');
    }
  }
};

export const copyToClipboard = async (text: string, successMessage: string = 'Copiado para a área de transferência!') => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Clipboard.write({
        string: text
      });
      alert(successMessage);
    } else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert(successMessage);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert(successMessage);
        } catch (err) {
          console.error('Falha ao copiar:', err);
          alert('Não foi possível copiar o texto.');
        }
        document.body.removeChild(textArea);
      }
    }
    return true;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    alert('Erro ao tentar copiar dados.');
    return false;
  }
};

export const copyBackupToClipboard = async (data: string) => {
  await copyToClipboard(data, 'Código de Backup copiado! Cole-o em um local seguro (bloco de notas, email, etc).');
};

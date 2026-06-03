import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Package,
  TrendingUp,
  Settings,
  Calculator,
  ChevronDown,
  Sun,
  Moon,
  FolderOpen,
  Database,
  X,
  Check,
  Target,
  Users,
  Download,
  Upload,
  Cloud,
  Copy,
  RefreshCw,
  CheckCircle2,
  Ruler,
  Scissors,
  Layout,
  Share,
  ClipboardPaste,
  MessageSquare,
  FileSpreadsheet,
  Search,
  Edit,
  Calendar,
  Phone,
  LogOut,
  ChevronRight,
  AlertCircle,
  Mail,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  DollarSign,
  Percent
} from 'lucide-react';
import { ProductData, AppDatabase, LibraryData, Insumo, MaterialPriceRecord, Sola, Supplier, UnidadeMedida } from './types';
import { calculateSummary, formatCurrency, calculateSolaAverageCost, findUnitFactor, formatNumber } from './utils/calculations';
import {
  downloadPDF,
  generatePDFBlob,
  sharePDF,
  shareTextReport,
  copyToClipboard,
  readFromClipboard,
  shareFile,
  exportToXLS,
  copyBackupToClipboard
} from './utils/export';
import LibraryView from './LibraryView';
import AutocompleteInput from './AutocompleteInput';
import QuickAddModal from './QuickAddModal';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { firebaseService } from './firebaseService';
import AuthScreen from './AuthScreen';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';


const DB_KEY = 'preco_pro_db_v1';
const getScopedDbKey = (uid: string | null) => uid ? `${DB_KEY}_${uid}` : DB_KEY;

const DEFAULT_UNITS: UnidadeMedida[] = [
  { id: 'u1', nome: 'Quilograma', fator: 1000 },
  { id: 'u2', nome: 'Unidade', fator: 1 },
  { id: 'u3', nome: 'Par', fator: 1 },
  { id: 'u4', nome: 'Metro', fator: 1 },
  { id: 'u5', nome: 'Metro Quadrado', fator: 1 },
  { id: 'u6', nome: 'Metro Linear', fator: 1 },
  { id: 'u7', nome: 'Rolo', fator: 1 },
  { id: 'u8', nome: 'Lata', fator: 1 },
  { id: 'u9', nome: 'Milheiro', fator: 1000 },
];

// Dados do Backup fornecidos pelo usuário
// O backup foi removido para deixar o programa limpo.


const DEFAULT_PRODUCT = (id: string = 'new'): ProductData => ({
  id,
  name: 'Novo Produto',
  lastModified: Date.now(),
  type: 'detailed',
  purchasePrice: 0,
  insumos: [],
  terceirizados: [],
  custosFixos: [{ id: 'f1', nome: 'Aluguel/Luz', valor: 0 }],
  custosIndiretos: [{ id: 'i1', nome: 'Manutenção', valor: 0 }],
  production: { diasTrabalhados: 22, producaoDiaria: 0 },
  markup: { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 30, selectedImpostos: [], selectedComissoes: [], selectedFretes: [] },
  precoVendaManual: 0
});

const PriceReadjustmentModal: React.FC<{
  item: any;
  type: string;
  onConfirm: (updatedFields: any) => void;
  onClose: () => void;
}> = ({ item, type, onConfirm, onClose }) => {
  const [form, setForm] = useState({
    valor: (type === 'impostos' || type === 'comissoes' ? item.aliquota : (item.valorUnitario || item.valor || 0)).toString(),
    unidade: item.unidade || '',
    quantidadeCompra: (item.quantidadeCompra || 1).toString(),
    fator: (item.fator || 1).toString(),
    rendimento: (item.rendimento || 1).toString()
  });

  const isMaterial = type === 'insumos' || type === 'terceirizados';
  const hasCalculation = isMaterial && parseFloat(form.quantidadeCompra) > 1;
  const calculatedUnitPrice = hasCalculation ? (parseFloat(form.valor) || 0) / parseFloat(form.quantidadeCompra) : (parseFloat(form.valor) || 0);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white animate-pulse">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 animate-pulse">REAJUSTAR GERAL</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atualize este item em todo o sistema</p>
            </div>
          </div>
          <button onClick={onClose} title="Fechar Reajuste" aria-label="Fechar Reajuste" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Selecionado</p>
          <p className="text-base font-black text-slate-800 dark:text-white uppercase truncate mb-6">{item.nome}</p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 block">
                {hasCalculation ? 'Novo Preço de Compra (Embalagem)' : 'Novo Preço / Alíquota'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {type === 'impostos' || type === 'comissoes' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  title="Novo Valor"
                  placeholder="0,00"
                  value={form.valor.replace('.', ',')}
                  onChange={e => {
                    const val = e.target.value.replace(',', '.');
                    if (/^\d*\.?\d*$/.test(val)) setForm({ ...form, valor: val });
                  }}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-xl font-black font-mono text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {isMaterial && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Qtd na Embalagem</label>
                  <input
                    type="text"
                    value={form.quantidadeCompra}
                    onChange={e => setForm({ ...form, quantidadeCompra: e.target.value.replace(',', '.') })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Unidade</label>
                  <input
                    type="text"
                    value={form.unidade}
                    onChange={e => setForm({ ...form, unidade: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Fator Conv.</label>
                  <input
                    type="text"
                    value={form.fator}
                    onChange={e => setForm({ ...form, fator: e.target.value.replace(',', '.') })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Rendimento (Par)</label>
                  <input
                    type="text"
                    value={form.rendimento}
                    onChange={e => setForm({ ...form, rendimento: e.target.value.replace(',', '.') })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {hasCalculation && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-2">
                 <span className="text-slate-400">Qtd na Embalagem</span>
                 <span className="text-slate-600 dark:text-slate-300">{form.quantidadeCompra} {form.unidade}</span>
               </div>
               <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
                 <span className="text-blue-500">Novo Custo Unitário</span>
                 <span className="text-emerald-500 text-lg">{formatCurrency(calculatedUnitPrice, 4)}</span>
               </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 mb-8 flex gap-4 items-start">
          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Atenção!</p>
            <p className="text-[9px] font-bold text-amber-600/80 dark:text-amber-500/80 leading-relaxed uppercase">
              Esta alteração será gravada na biblioteca e atualizará **TODOS** os produtos que utilizam este item.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all">Cancelar</button>
          <button 
            onClick={() => onConfirm({
              valor: parseFloat(form.valor) || 0,
              unidade: form.unidade,
              quantidadeCompra: parseFloat(form.quantidadeCompra) || 1,
              fator: parseFloat(form.fator) || 1,
              rendimento: parseFloat(form.rendimento) || 1
            })}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const InlineCalculator: React.FC<{
  onApply: (val: number) => void;
  onClose: () => void;
  initialValue: number;
}> = ({ onApply, onClose, initialValue }) => {
  const [display, setDisplay] = useState(initialValue > 0 ? initialValue.toString() : '0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const clear = () => { setDisplay('0'); setPrevValue(null); setOperator(null); setWaitingForOperand(false); };

  const inputDigit = (digit: string) => {
    if (waitingForOperand) { setDisplay(digit); setWaitingForOperand(false); }
    else { setDisplay(display === '0' ? digit : display + digit); }
  };

  const inputDot = () => {
    if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); }
    else if (!display.includes('.')) { setDisplay(display + '.'); }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);
    if (prevValue === null) { setPrevValue(inputValue); }
    else if (operator) {
      const currentValue = prevValue || 0;
      let newValue = currentValue;
      switch (operator) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '*': newValue = currentValue * inputValue; break;
        case '/': newValue = inputValue !== 0 ? currentValue / inputValue : 0; break;
      }
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }
    setWaitingForOperand(true);
    setOperator(nextOperator === '=' ? null : nextOperator);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[340px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-[0_30px_90px_rgba(0,0,0,0.6)] rounded-xl p-7 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-blue-500" />
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Calculadora PRO</span>
          </div>
          <button onClick={onClose} title="Fechar Calculadora" aria-label="Fechar Calculadora" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-lg mb-6 text-right border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="text-[11px] text-slate-400 h-4 font-mono truncate mb-1">{prevValue !== null ? `${prevValue} ${operator || ''}` : '\u00A0'}</div>
          <div className="text-4xl font-black text-slate-900 dark:text-white truncate font-mono tracking-tighter">{display.replace('.', ',')}</div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {['7', '8', '9', '/'].map(btn => <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
          {['4', '5', '6', '*'].map(btn => <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
          {['1', '2', '3', '-'].map(btn => <button key={btn} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
          <button onClick={clear} className="p-4 rounded-2xl text-lg font-bold bg-red-100 text-red-600 active:scale-90 transition-all">C</button>
          <button onClick={() => inputDigit('0')} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 active:scale-90 transition-all">0</button>
          <button onClick={inputDot} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 active:scale-90 transition-all">,</button>
          <button onClick={() => performOperation('+')} className="p-4 rounded-2xl text-lg font-bold bg-blue-100 text-blue-600 active:scale-90 transition-all">+</button>
          <button onClick={() => performOperation('=')} className="col-span-2 p-4 rounded-2xl text-xl font-black bg-slate-200 dark:bg-slate-700 active:scale-95 transition-all">=</button>
          <button onClick={() => onApply(parseFloat(display))} className="col-span-2 p-4 rounded-2xl text-xs font-black bg-emerald-600 text-white flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"><Check className="w-5 h-5" /> Aplicar</button>
        </div>
      </div>
    </div>
  );
};

const ConsumptionCalculator: React.FC<{
  onApply: (val: number, state: any) => void;
  onClose: (state: any) => void;
  initialValue: number;
  initialState?: any;
}> = ({ onApply, onClose, initialValue, initialState }) => {
  const [mode, setMode] = useState<'paper' | 'cut'>(initialState?.mode || 'paper');

  // Mode 1: Papel Milimetrado
  const [linearMeterWidth, setLinearMeterWidth] = useState(initialState?.linearMeterWidth || '100');
  const [side1, setSide1] = useState(initialState?.side1 || '');
  const [side2, setSide2] = useState(initialState?.side2 || '');
  const [piecesPerPair, setPiecesPerPair] = useState(initialState?.piecesPerPair || '2');

  // Mode 2: Corte em material
  const [totalMeters, setTotalMeters] = useState(initialState?.totalMeters || '');
  const [totalPairs, setTotalPairs] = useState(initialState?.totalPairs || '');

  const getState = () => ({
    mode,
    linearMeterWidth,
    side1,
    side2,
    piecesPerPair,
    totalMeters,
    totalPairs
  });

  const handleClose = () => {
    onClose(getState());
  };

  const calculateMode1Linear = () => {
    const w = parseFloat(linearMeterWidth);
    const s1 = parseFloat(side1);
    const s2 = parseFloat(side2);
    const p = parseFloat(piecesPerPair);
    if (w && s1 && s2 && p) {
      const areaPiece = (s1 * s2) / w / 100;
      return areaPiece * p;
    }
    return 0;
  };

  const calculateMode1Square = () => {
    const s1 = parseFloat(side1);
    const s2 = parseFloat(side2);
    const p = parseFloat(piecesPerPair);
    if (s1 && s2 && p) {
      return ((s1 * s2) / 10000) * p;
    }
    return 0;
  };

  const calculateMode2 = () => {
    const m = parseFloat(totalMeters.replace(',', '.'));
    const p = parseFloat(totalPairs.replace(',', '.'));
    if (m && p) {
      return m / p;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-[0_30px_90px_rgba(0,0,0,0.6)] rounded-xl p-7 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-emerald-500" />
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Calculador de Consumo</span>
          </div>
          <button onClick={handleClose} title="Fechar Calculador de Consumo" aria-label="Fechar Calculador de Consumo" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-950 rounded-md border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMode('paper')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${mode === 'paper' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Papel Milimetrado
          </button>
          <button
            onClick={() => setMode('cut')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all ${mode === 'cut' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Corte em Material
          </button>
        </div>

        {mode === 'paper' ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Largura L.M. (cm)</label>
              <input type="number" value={linearMeterWidth} title="Largura Linear em cm" placeholder="100" onChange={e => setLinearMeterWidth(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Lado 1 (cm)</label>
                <input type="number" value={side1} title="Lado 1 em cm" placeholder="0" onChange={e => setSide1(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Lado 2 (cm)</label>
                <input type="number" value={side2} title="Lado 2 em cm" placeholder="0" onChange={e => setSide2(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Peças por Par</label>
              <input type="number" value={piecesPerPair} title="Quantidade de peças por par" placeholder="2" onChange={e => setPiecesPerPair(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 dark:border-blue-800/50 mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-blue-500 uppercase">Metro Linear (L.M.)</span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono">{calculateMode1Linear().toFixed(4).replace('.', ',')}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(calculateMode1Linear().toFixed(4).replace('.', ','));
                      alert('Metro Linear copiado!');
                    }}
                    title="Copiar Metro Linear"
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-all active:scale-90"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onApply(calculateMode1Linear(), getState())}
                    title="Aplicar Metro Linear"
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-90"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-blue-100 dark:border-blue-800/50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Metro Quadrado (M2)</span>
                  <span className="text-lg font-black text-slate-600 dark:text-slate-300 font-mono">{calculateMode1Square().toFixed(4).replace('.', ',')}</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(calculateMode1Square().toFixed(4).replace('.', ','));
                      alert('Metro Quadrado copiado!');
                    }}
                    title="Copiar Metro Quadrado"
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-blue-500 transition-all active:scale-90"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onApply(calculateMode1Square(), getState())}
                    title="Aplicar Metro Quadrado"
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all active:scale-90"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Metros Consumidos</label>
              <input type="text" value={totalMeters} title="Metros consumidos" placeholder="0,00" onChange={e => setTotalMeters(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Total de Pares Curtados</label>
              <input type="text" value={totalPairs} title="Total de pares cortados" placeholder="0" onChange={e => setTotalPairs(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-md border border-emerald-100 dark:border-emerald-800/50 mt-6">
              <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">Consumo por Par</span>
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tighter">{calculateMode2().toFixed(4).replace('.', ',')}</span>
            </div>
          </div>
        )}

        {mode === 'cut' && (
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={() => {
                const val = calculateMode2();
                navigator.clipboard.writeText(val.toFixed(4).replace('.', ','));
                alert('Copiado para a área de transferência!');
              }}
              className="p-4 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-tight shadow-sm"
              title="Copiar Resultado"
            >
              <Copy className="w-4 h-4" /> Copiar
            </button>
            <button
              onClick={() => onApply(calculateMode2(), getState())}
              className="p-4 rounded-md text-[10px] font-black bg-emerald-600 text-white flex items-center justify-center gap-2 uppercase tracking-tight shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              title="Aplicar Resultado"
            >
              <Check className="w-4 h-4" /> Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const INITIAL_LIBRARY: LibraryData = {
  insumos: [],
  pecas: [],
  terceirizados: [],
  custosFixos: [],
  custosIndiretos: [],
  impostos: [],
  comissoes: [],
  fretes: [],
  solados: [],
  unidadesMedida: DEFAULT_UNITS
};

const getInitialDbState = (uid?: string): AppDatabase => ({
  uid,
  products: [DEFAULT_PRODUCT()],
  lastSelectedProductId: 'new',
  library: INITIAL_LIBRARY,
  materialPrices: [],
  suppliers: [],
  settings: {
    productionDays: 22,
    dailyProduction: 0,
    currency: 'BRL',
    theme: 'light',
    unidadesMedida: DEFAULT_UNITS
  }
});

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    console.log("App: Initializing Firebase Authentication listener...");

    // Timeout fallback to prevent forever-loading
    const timer = setTimeout(() => {
      if (isLoadingAuth) {
        console.warn("App: Auth initialization taking too long. Forcing loader off.");
        setIsLoadingAuth(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("App: Auth state changed:", currentUser ? "User logged in" : "No user");
      clearTimeout(timer);
      setUser(currentUser);
      setIsLoadingAuth(false);
    }, (error) => {
      console.error("App: Auth state change error:", error);
      clearTimeout(timer);
      setIsLoadingAuth(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const migrateDb = useCallback((data: any): AppDatabase => {
    // Basic migration to ensure all required fields exist
    // Removed legacy cleanup logic that was causing systematic data loss
    const incomingLibrary = data.library || {};

    const migratedLibrary: LibraryData = {
      ...INITIAL_LIBRARY,
      ...incomingLibrary,
      // Ensure arrays exist for each category
      insumos: incomingLibrary.insumos || [],
      pecas: incomingLibrary.pecas || [],
      terceirizados: incomingLibrary.terceirizados || [],
      custosFixos: incomingLibrary.custosFixos || [],
      custosIndiretos: incomingLibrary.custosIndiretos || [],
      impostos: incomingLibrary.impostos || [],
      comissoes: incomingLibrary.comissoes || [],
      fretes: incomingLibrary.fretes || [],
      solados: incomingLibrary.solados || [],
      unidadesMedida: (incomingLibrary.unidadesMedida && incomingLibrary.unidadesMedida.length > 0
        ? incomingLibrary.unidadesMedida
        : DEFAULT_UNITS).map((u: any) => ({
          ...u,
          compraEm: u.compraEm || (u.nome.toLowerCase() === 'milheiro' ? 'Un' : u.nome),
          quantidadeCompra: u.quantidadeCompra || (u.nome.toLowerCase() === 'milheiro' ? 1000 : u.fator || 1),
          rendimento: u.rendimento || u.fator || 1,
          fator: u.fator || 1
        }))
    };

    const migratedProducts = (data.products || []).map((p: ProductData) => ({
      ...p,
      type: p.type || 'detailed',
      purchasePrice: p.purchasePrice || 0,
      insumos: (p.insumos || []).map(i => ({ ...i, peca: i.peca || '' })),
      markup: {
        ...p.markup,
        impostos: p.markup?.impostos || 0,
        comissao: p.markup?.comissao || 0,
        frete: p.markup?.frete || 0,
        selectedImpostos: p.markup?.selectedImpostos || [],
        selectedComissoes: p.markup?.selectedComissoes || [],
        selectedFretes: p.markup?.selectedFretes || [],
      }
    }));

    return {
      ...data,
      products: migratedProducts,
      library: migratedLibrary,
      materialPrices: data.materialPrices || [],
      suppliers: data.suppliers || [],
      settings: data.settings ? {
        ...data.settings,
        unidadesMedida: data.settings.unidadesMedida || DEFAULT_UNITS
      } : {
        productionDays: 22,
        dailyProduction: 0,
        currency: 'BRL',
        theme: 'light',
        unidadesMedida: DEFAULT_UNITS
      }
    };
  }, []);

  // Load cloud data upon login
  useEffect(() => {
    if (user && isInitialLoad) {
      const loadCloudData = async () => {
        try {
          console.log(`App: Loading cloud data for user ${user.uid}...`);
          const cloudData = await firebaseService.loadFullDatabase(user.uid);

          if (cloudData) {
            setDb(migrateDb(cloudData));
          } else {
            // If cloud is empty, check for LOCAL data FOR THIS SPECIFIC USER
            // We NO LONGER migrate the generic DB_KEY to new users to prevent data leaks.
            const scopedKey = getScopedDbKey(user.uid);
            const localData = localStorage.getItem(scopedKey);

            if (localData) {
              const parsed = JSON.parse(localData);
              const migrated = migrateDb(parsed);
              // Force the UID onto the migrated state
              migrated.uid = user.uid;
              await firebaseService.syncLocalToFirebase(user.uid, migrated);
              setDb(migrated);
            } else {
              // Truly new account with no local data
              setDb(getInitialDbState(user.uid));
            }
          }
          setIsInitialLoad(false);
        } catch (error) {
          console.error("Error syncing cloud data:", error);
          setSyncStatus('error');
        }
      };
      loadCloudData();
    }
  }, [user, isInitialLoad, migrateDb]);

  const [db, setDb] = useState<AppDatabase>(getInitialDbState());

  // Handle data persistence with scoped keys
  const persistData = useCallback(async () => {
    // SECURITY: CRITICAL CHECK
    // 1. Don't persist if no user
    // 2. Don't persist if we are still doing the initial cloud load (prevent wiping data)
    if (!user || isInitialLoad) return;

    // 3. PIN CHECK: Don't persist if the DB state doesn't belong to this user
    // CRITICAL: Must have a UID and it MUST match the user.uid
    if (!db.uid || db.uid !== user.uid) {
      console.warn(`App: Sync blocked - UID mismatch or unassigned state. (DB:${db.uid} vs User:${user.uid})`);
      return;
    }

    setSaveStatus('saving');
    setSyncStatus('syncing');

    try {
      const scopedKey = getScopedDbKey(user.uid);

      // Local backup (Immediate)
      localStorage.setItem(scopedKey, JSON.stringify(db));

      // Sync to Cloud (Always pinned to user.uid)
      await firebaseService.syncLocalToFirebase(user.uid, db);
      setSyncStatus('synced');
    } catch (error: any) {
      console.error("App: Sync error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      }, 200);
    }
  }, [db, user, isInitialLoad]);

  // Trigger persistence when DB changes
  useEffect(() => {
    const debounceTimer = setTimeout(persistData, 2000);
    return () => clearTimeout(debounceTimer);
  }, [db, persistData]);

  const [activeLibraryTarget, setActiveLibraryTarget] = useState<{ id: string, type: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copiedItem, setCopiedItem] = useState<{ type: string; data: any } | null>(null);



  const [editingValue, setEditingValue] = useState<{ id: string, field: string, val: string } | null>(null);
  const [activeCalc, setActiveCalc] = useState<{ id: string, field: string } | null>(null);
  const [activeConsumptionCalc, setActiveConsumptionCalc] = useState<string | null>(null);
  const [commentingItem, setCommentingItem] = useState<{ id: string, type: string, comment: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');

  // Sync theme to document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showMaterialPrices, setShowMaterialPrices] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingClient, setEditingClient] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedInsumoIds, setSelectedInsumoIds] = useState<string[]>([]);
  const [selectedTerceirizadoIds, setSelectedTerceirizadoIds] = useState<string[]>([]);
  const [readjustmentItem, setReadjustmentItem] = useState<{ item: any, type: string } | null>(null);
  const [selectedCustoFixoIds, setSelectedCustoFixoIds] = useState<string[]>([]);
  const [selectedCustoIndiretoIds, setSelectedCustoIndiretoIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const [showQuickAdd, setShowQuickAdd] = useState<{ type: 'insumos' | 'terceirizados' | 'pecas', initialName?: string, context?: any } | null>(null);

  const getThemeColor = (type: string) => {
    switch (type) {
      case 'insumos': return 'emerald';
      case 'pecas': return 'emerald';
      case 'terceirizados': return 'orange';
      case 'fixos': return 'purple';
      case 'variaveis': return 'blue';
      case 'solados': return 'indigo';
      default: return 'blue';
    }
  };

  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Limpar seleção ao trocar de projeto
  useEffect(() => {
    setSelectedInsumoIds([]);
    setSelectedTerceirizadoIds([]);
    setSelectedCustoFixoIds([]);
    setSelectedCustoIndiretoIds([]);
  }, [db.lastSelectedProductId]);

  const currentProduct = useMemo(() => {
    const found = db.products.find(p => p.id === db.lastSelectedProductId);
    return found || db.products[0] || DEFAULT_PRODUCT();
  }, [db]);

  const combinedMaterialsSuggestions = useMemo(() => {
    const insumos = (db.library.insumos || []).map(i => ({ ...i, _type: 'insumos' }));
    const solados = (db.library.solados || []).map(s => ({ ...s, _type: 'solados' }));
    return [...insumos, ...solados];
  }, [db.library.insumos, db.library.solados]);


  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  }, [theme]);

  const updateCurrentProduct = useCallback((updates: Partial<ProductData>) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.map(p => {
        if (p.id === prev.lastSelectedProductId) {
          const updated = { ...p, ...updates, lastModified: Date.now() };

          // Especial handling for nested objects to avoid overwriting them entirely if not intended
          // but here updates is Partial<ProductData>, so if updates.markup exists, it replaces p.markup.
          // To be safe against uninitialized state in older data:
          if (updates.markup) {
            updated.markup = {
              impostos: p.markup?.impostos ?? 0,
              comissao: p.markup?.comissao ?? 0,
              frete: p.markup?.frete ?? 0,
              freteFixo: p.markup?.freteFixo ?? 0,
              perdas: p.markup?.perdas ?? 0,
              margemLucro: p.markup?.margemLucro ?? 0,
              selectedImpostos: p.markup?.selectedImpostos || [],
              selectedComissoes: p.markup?.selectedComissoes || [],
              selectedFretes: p.markup?.selectedFretes || [],
              ...updates.markup
            };
          }
          if (updates.production) {
            updated.production = {
              diasTrabalhados: p.production?.diasTrabalhados || 0,
              producaoDiaria: p.production?.producaoDiaria || 0,
              ...updates.production
            };
          }
          return updated;
        }
        return p;
      })
    }));
  }, [db.lastSelectedProductId]);

  const checkDuplicateInsumo = useCallback((peca: string, material: string, excludeId?: string, showAlert = true) => {
    const isDuplicate = currentProduct.insumos.some(i =>
      i.id !== excludeId &&
      (i.peca || '').toLowerCase().trim() === (peca || '').toLowerCase().trim() &&
      (i.material || '').toLowerCase().trim() === (material || '').toLowerCase().trim()
    );
    if (isDuplicate && showAlert) {
      alert(`Atenção: A combinação "${peca || '(sem peça)'}" + "${material || '(sem material)'}" já existe neste produto.`);
    }
    return isDuplicate;
  }, [currentProduct.insumos]);


  const handleCopyToClipboard = useCallback(async (type: string, data: any) => {
    const payload = {
      type,
      data,
      source: 'preco-pro-app',
      timestamp: Date.now()
    };
    await copyToClipboard(JSON.stringify(payload), 'Copiado para a área de transferência!');
  }, []);

  const handlePasteFromClipboard = useCallback(async (targetSection: 'insumos' | 'terceirizados' | 'custosFixos' | 'custosIndiretos') => {
    try {
      const text = await readFromClipboard();
      if (!text) {
        alert('Área de transferência vazia.');
        return;
      }

      let payload;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        alert('Os dados na área de transferência não são do Preço PRO ou estão corrompidos.');
        return;
      }

      if (payload.source !== 'preco-pro-app') {
        alert('Dados inválidos. Copie um item ou seção dentro do aplicativo primeiro.');
        return;
      }

      const { data } = payload;

      if (Array.isArray(data)) {
        if (!confirm(`Deseja adicionar ${data.length} itens à seção atual?`)) return;

        const newItems = data.map(item => ({
          ...item,
          id: Math.random().toString(36)
        }));

        updateCurrentProduct({
          [targetSection]: [...(currentProduct[targetSection] as any[]), ...newItems]
        });
      } else {
        const newItem = {
          ...data,
          id: Math.random().toString(36)
        };

        updateCurrentProduct({
          [targetSection]: [...(currentProduct[targetSection] as any[]), ...newItem]
        });
      }
      alert('Dados colados com sucesso!');
    } catch (error) {
      console.error('Erro ao colar:', error);
      alert('Erro ao tentar colar dados.');
    }
  }, [currentProduct, updateCurrentProduct]);

  const handleAddItemToLibrary = useCallback((type: keyof LibraryData, item: any) => {
    // Auto-calculate fator for unidades de medida: rendimento / quantidadeCompra
    const processedItem = type === 'unidadesMedida'
      ? {
        ...item,
        fator: item.rendimento && item.quantidadeCompra
          ? Number(item.rendimento) / Number(item.quantidadeCompra)
          : item.rendimento || item.fator || 1
      }
      : item;
    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: [...prev.library[type], { ...processedItem, id: Math.random().toString(36) }]
      }
    }));
  }, []);

  const handleDeleteItemFromLibrary = useCallback((type: keyof LibraryData, id: string) => {
    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: prev.library[type].filter(item => item.id !== id)
      }
    }));
  }, []);

  const handleUpdateItemInLibrary = useCallback((type: keyof LibraryData, id: string, updatedItem: any) => {
    // Auto-calculate fator for unidades de medida: rendimento / quantidadeCompra
    const processedItem = type === 'unidadesMedida'
      ? {
        ...updatedItem,
        fator: updatedItem.rendimento && updatedItem.quantidadeCompra
          ? Number(updatedItem.rendimento) / Number(updatedItem.quantidadeCompra)
          : updatedItem.rendimento || updatedItem.fator || 1
      }
      : updatedItem;
    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: prev.library[type].map(item => item.id === id ? { ...processedItem, id } : item)
      }
    }));
  }, []);

  const handlePerformReadjustment = (item: any, type: string, updatedFields: any) => {
    setDb(prev => {
      const newDb = { ...prev };
      const itemName = item.nome;
      const quantity = updatedFields.quantidadeCompra || 1;
      const unitPrice = updatedFields.valor / quantity;

      // 1. Atualizar na Biblioteca
      const libraryList = newDb.library[type as keyof LibraryData];
      if (Array.isArray(libraryList)) {
        newDb.library[type as keyof LibraryData] = (libraryList as any[]).map(i => {
          if (i.id === item.id) {
            const updated = { ...i, ...updatedFields };
            if (type === 'impostos' || type === 'comissoes') updated.aliquota = updatedFields.valor;
            else if (type === 'custosFixos' || type === 'custosIndiretos' || type === 'fretes') updated.valor = updatedFields.valor;
            else {
              updated.valorUnitario = updatedFields.valor; // Na biblioteca, valorUnitario é o preço de compra (embalagem)
            }
            return updated;
          }
          return i;
        });
      }

      // 2. Propagar para TODOS os produtos
      newDb.products = newDb.products.map(product => {
        let updated = false;
        const newProduct = { ...product };

        if (type === 'insumos') {
          newProduct.insumos = (newProduct.insumos || []).map(ins => {
            if (ins.material === itemName || ins.nome === itemName) {
              updated = true;
              return { 
                ...ins, 
                valorUnitario: unitPrice,
                unidade: updatedFields.unidade || ins.unidade,
                quantidadeCompra: updatedFields.quantidadeCompra || ins.quantidadeCompra,
                fator: updatedFields.fator || ins.fator,
                rendimento: updatedFields.rendimento || ins.rendimento
              };
            }
            return ins;
          });
        } else if (type === 'terceirizados') {
          newProduct.terceirizados = (newProduct.terceirizados || []).map(t => {
            if (t.nome === itemName) {
              updated = true;
              return { 
                ...t, 
                valorUnitario: unitPrice,
                unidade: updatedFields.unidade || t.unidade,
                quantidadeCompra: updatedFields.quantidadeCompra || t.quantidadeCompra,
                fator: updatedFields.fator || t.fator,
                rendimento: updatedFields.rendimento || t.rendimento
              };
            }
            return t;
          });
        } else if (type === 'custosFixos') {
          newProduct.custosFixos = (newProduct.custosFixos || []).map(cf => {
            if (cf.nome === itemName) {
              updated = true;
              return { ...cf, valor: newPrice };
            }
            return cf;
          });
        } else if (type === 'custosIndiretos') {
          newProduct.custosIndiretos = (newProduct.custosIndiretos || []).map(ci => {
            if (ci.nome === itemName) {
              updated = true;
              return { ...ci, valor: newPrice };
            }
            return ci;
          });
        } else if (type === 'impostos' && newProduct.markup?.selectedImpostos?.includes(item.id)) {
          updated = true;
          const total = newDb.library.impostos
            .filter(i => newProduct.markup.selectedImpostos.includes(i.id))
            .reduce((sum, i) => sum + i.aliquota, 0);
          newProduct.markup = { ...newProduct.markup, impostos: total };
        } else if (type === 'comissoes' && newProduct.markup?.selectedComissoes?.includes(item.id)) {
          updated = true;
          const total = newDb.library.comissoes
            .filter(i => newProduct.markup.selectedComissoes.includes(i.id))
            .reduce((sum, i) => sum + i.aliquota, 0);
          newProduct.markup = { ...newProduct.markup, comissao: total };
        } else if (type === 'fretes' && newProduct.markup?.selectedFretes?.includes(item.id)) {
          updated = true;
          const total = newDb.library.fretes
            .filter(i => newProduct.markup.selectedFretes.includes(i.id))
            .reduce((sum, i) => sum + i.valor, 0);
          newProduct.markup = { ...newProduct.markup, freteFixo: total };
        }

        return updated ? newProduct : product;
      });

      return newDb;
    });

    setReadjustmentItem(null);
  };

  const handleSaveToLibrary = useCallback((type: keyof LibraryData, name: string) => {
    const existing = db.library[type].find(item => item.nome.toLowerCase() === name.toLowerCase());
    if (existing) {
      alert('Este item já existe no banco de dados.');
      return;
    }

    const newItem: any = {
      id: Math.random().toString(36),
      nome: name,
      unidade: (type === 'insumos' || type === 'pecas') ? 'un' : 'par',
      valorUnitario: 0,
      valor: 0
    };

    if (type === 'pecas') newItem.peca = name;
    if (type === 'insumos') newItem.material = name;

    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: [...prev.library[type], newItem]
      }
    }));
    alert(`"${name}" salvo com sucesso no banco de dados!`);
    // Optional: auto-open library? User approved plan but I'll stick to alert first as primary feedback.
    // setActiveLibraryTarget({ id: '', type }); setShowDatabase(true); 
  }, [db.library]);

  const handleSelectItem = useCallback((type: string, item: any) => {
    if (activeLibraryTarget && activeLibraryTarget.type === type) {
      // Preencher item existente
      const id = activeLibraryTarget.id;
      switch (type) {
        case 'pecas':
          if (checkDuplicateInsumo(item.nome, currentProduct.insumos.find(i => i.id === id)?.material || '', id)) return;
          updateCurrentProduct({
            insumos: currentProduct.insumos.map(i => i.id === id ? {
              ...i,
              peca: item.nome,
              nome: `${item.nome}${i.material ? ' - ' + i.material : ''}`
            } : i)
          });
          break;
        case 'insumos':
          if (checkDuplicateInsumo(currentProduct.insumos.find(i => i.id === id)?.peca || '', item.nome, id)) return;
          updateCurrentProduct({
            insumos: currentProduct.insumos.map(i => {
              if (i.id === id) {
                const resolvedUnit = db.library.unidadesMedida.find(u =>
                  (u.nome && u.nome.toLowerCase() === (item.unidade || '').toLowerCase())
                );
                return {
                  ...i,
                  material: item.nome,
                  nome: `${i.peca ? i.peca + ' - ' : ''}${item.nome}`,
                  unidade: resolvedUnit ? resolvedUnit.nome.toUpperCase() : (item.unidade || i.unidade || 'UN').toUpperCase(),
                  valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || item.valor || 0
                };
              }
              return i;
            })
          });
          break;
        case 'terceirizados':
          updateCurrentProduct({
            terceirizados: currentProduct.terceirizados.map(i => {
              if (i.id === id) {
                const resolvedUnit = db.library.unidadesMedida.find(u =>
                  (u.nome && u.nome.toLowerCase() === (item.unidade || '').toLowerCase())
                );
                return {
                  ...i,
                  nome: item.nome,
                  unidade: resolvedUnit ? resolvedUnit.nome.toUpperCase() : (item.unidade || i.unidade || 'UN').toUpperCase(),
                  valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || item.valor || 0
                };
              }
              return i;
            })
          });
          break;
        case 'custosFixos':
        case 'fixos':
          updateCurrentProduct({
            custosFixos: currentProduct.custosFixos.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              valor: item.valor || i.valor
            } : i)
          });
          break;
        case 'custosIndiretos':
        case 'variaveis':
          updateCurrentProduct({
            custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              valor: item.valor || i.valor
            } : i)
          });
          break;
        case 'unidadesMedida':
          // Check if the target is an insumo or a terceirizado
          // Store the unit name (uppercase) so findUnitFactor can match it by name in the library
          if (currentProduct.insumos.find(i => i.id === id)) {
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i =>
                i.id === id ? { ...i, unidade: item.nome.toUpperCase() } : i
              )
            });
          } else if (currentProduct.terceirizados.find(t => t.id === id)) {
            updateCurrentProduct({
              terceirizados: currentProduct.terceirizados.map(t =>
                t.id === id ? { ...t, unidade: item.nome.toUpperCase() } : t
              )
            });
          }
          setShowDatabase(false);
          break;
      }
      setActiveLibraryTarget(null);
    } else {
      // Adicionar novo item (comportamento original)
      switch (type) {
        case 'pecas':
          updateCurrentProduct({
            insumos: [
              ...currentProduct.insumos,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                peca: item.nome,
                material: '',
                quantidade: 1,
                unidade: 'un',
                valorUnitario: 0
              }
            ]
          });
          break;
        case 'insumos': {
          const resolvedUnitInsumo = db.library.unidadesMedida.find(u =>
            (u.nome && u.nome.toLowerCase() === (item.unidade || '').toLowerCase())
          );
          const finalCost = (item.quantidadeCompra && item.quantidadeCompra > 0)
            ? Math.round((item.valorUnitario / item.quantidadeCompra) * 100) / 100
            : Math.round((item.valor_unitario || item.valorUnitario || item.valor || 0) * 100) / 100;

          updateCurrentProduct({
            insumos: [
              ...currentProduct.insumos,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                peca: '',
                material: item.nome,
                quantidade: item.rendimento && item.rendimento > 1
                  ? Math.round(((item.fator || 1) / item.rendimento) * 10000) / 10000
                  : Math.round((item.quantidade || 1) * 10000) / 10000,
                unidade: resolvedUnitInsumo ? resolvedUnitInsumo.nome.toUpperCase() : (item.unidade || 'UN').toUpperCase(),
                valorUnitario: finalCost
              }
            ]
          });
          break;
        }
        case 'terceirizados': {
          const resolvedUnitTerceirizado = db.library.unidadesMedida.find(u =>
            (u.nome && u.nome.toLowerCase() === (item.unidade || '').toLowerCase())
          );
          updateCurrentProduct({
            terceirizados: [
              ...currentProduct.terceirizados,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                quantidade: item.rendimento && item.rendimento > 1
                  ? Math.round(((item.fator || 1) / item.rendimento) * 10000) / 10000
                  : 1,
                unidade: resolvedUnitTerceirizado ? resolvedUnitTerceirizado.nome.toUpperCase() : (item.unidade || 'UN').toUpperCase(),
                valorUnitario: item.valor_unitario || item.valorUnitario || item.valor || 0
              }
            ]
          });
          break;
        }
        case 'custosFixos':
        case 'fixos':
          updateCurrentProduct({
            custosFixos: [
              ...currentProduct.custosFixos,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                valor: item.valor || 0
              }
            ]
          });
          break;
        case 'custosIndiretos':
        case 'variaveis':
          updateCurrentProduct({
            custosIndiretos: [
              ...currentProduct.custosIndiretos,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                valor: item.valor || 0
              }
            ]
          });
          break;
        case 'solados':
          if (checkDuplicateInsumo('Solado', item.nome)) return;
          const solaCost = calculateSolaAverageCost(item, db.library.insumos, db.library.unidadesMedida);
          updateCurrentProduct({
            insumos: [
              ...currentProduct.insumos,
              {
                id: Math.random().toString(36),
                nome: `Sola: ${item.nome}`,
                peca: 'Solado',
                material: item.nome,
                quantidade: 1,
                unidade: 'par',
                valorUnitario: solaCost
              }
            ]
          });
          break;
      }
    }
    setShowDatabase(false);
    alert('Item atualizado/adicionado!');
  }, [currentProduct, updateCurrentProduct, activeLibraryTarget, db.library.insumos]);

  const handleSelectMultipleItems = useCallback((type: string, items: any[]) => {
    switch (type) {
      case 'pecas':
      case 'insumos':
      case 'solados':
        const newInsumos = items.map(item => {
          if (type === 'pecas') {
            return {
              id: Math.random().toString(36),
              nome: item.nome,
              peca: item.nome,
              material: '',
              quantidade: 1,
              unidade: 'un',
              valorUnitario: 0
            };
          } else if (type === 'solados') {
            const solaCost = calculateSolaAverageCost(item, db.library.insumos, db.library.unidadesMedida);
            return {
              id: Math.random().toString(36),
              nome: `Sola: ${item.nome}`,
              peca: 'Solado',
              material: item.nome,
              quantidade: 1,
              unidade: 'par',
              valorUnitario: solaCost
            };
          } else {
            const finalCost = (item.quantidadeCompra && item.quantidadeCompra > 0)
              ? Math.round((item.valorUnitario / item.quantidadeCompra) * 100) / 100
              : Math.round((item.valor_unitario || item.valorUnitario || item.valor || 0) * 100) / 100;
            return {
              id: Math.random().toString(36),
              nome: item.nome,
              peca: '',
              material: item.nome,
              quantidade: item.rendimento && item.rendimento > 1
                ? Math.round(((item.fator || 1) / item.rendimento) * 10000) / 10000
                : Math.round((item.quantidade || 1) * 10000) / 10000,
              unidade: (item.unidade || 'un').toUpperCase(),
              valorUnitario: finalCost
            };
          }
        });
        const filteredNewInsumos = newInsumos.filter(ni => !checkDuplicateInsumo(ni.peca, ni.material));
        if (filteredNewInsumos.length < newInsumos.length) {
          if (filteredNewInsumos.length === 0) {
            alert('Todos os itens selecionados já existem neste produto.');
            return;
          }
          alert(`${newInsumos.length - filteredNewInsumos.length} itens duplicados foram ignorados.`);
        }
        updateCurrentProduct({ insumos: [...currentProduct.insumos, ...filteredNewInsumos] });
        break;
      case 'terceirizados':
        const newTerceirizados = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          quantidade: 1,
          unidade: 'par',
          valorUnitario: item.valor_unitario || item.valorUnitario || item.valor || 0
        }));
        updateCurrentProduct({ terceirizados: [...currentProduct.terceirizados, ...newTerceirizados] });
        break;
      case 'custosFixos':
      case 'fixos':
        const newFixos = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          valor: item.valor || item.valorUnitario || 0
        }));
        updateCurrentProduct({ custosFixos: [...currentProduct.custosFixos, ...newFixos] });
        break;
      case 'custosIndiretos':
      case 'variaveis':
        const newVariaveis = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          valor: item.valor || item.valorUnitario || 0
        }));
        updateCurrentProduct({ custosIndiretos: [...currentProduct.custosIndiretos, ...newVariaveis] });
        break;
      case 'impostos':
        const newImpostos = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          aliquota: item.aliquota || 0
        }));
        updateCurrentProduct({ impostos: [...currentProduct.impostos, ...newImpostos] });
        break;
      case 'comissoes':
        const newComissoes = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          aliquota: item.aliquota || 0
        }));
        updateCurrentProduct({ comissoes: [...currentProduct.comissoes, ...newComissoes] });
        break;
      case 'fretes':
        const newFretes = items.map(item => ({
          id: Math.random().toString(36),
          nome: item.nome,
          valor: item.valor || 0
        }));
        updateCurrentProduct({ fretes: [...currentProduct.fretes, ...newFretes] });
        break;
    }
    setShowDatabase(false);
    alert(`${items.length} itens adicionados com sucesso ao projeto!`);
  }, [currentProduct, updateCurrentProduct, db.library.insumos]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(db, null, 2);
    const fileName = `backup_preco_pro_${new Date().toISOString().slice(0, 10)}.json`;
    shareFile(dataStr, fileName, 'Backup Preço PRO');
  };

  const handleShareBackup = () => {
    const dataStr = JSON.stringify(db, null, 2);
    const fileName = `backup_preco_pro_${new Date().toISOString().slice(0, 10)}.json`;
    shareFile(dataStr, fileName, 'Backup Preço PRO');
  };

  const handleCopyBackup = () => {
    const dataStr = JSON.stringify(db, null, 2);
    copyBackupToClipboard(dataStr);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedDb = JSON.parse(e.target?.result as string);
        if (importedDb.products && Array.isArray(importedDb.products)) {
          if (confirm('Atenção: Isso substituirá todos os seus projetos e a biblioteca local. Deseja continuar?')) {
            setDb({
              ...importedDb,
              library: importedDb.library || INITIAL_LIBRARY
            });
            setShowProjectList(false);
            alert('Backup restaurado com sucesso!');
          }
        }
      } catch (err) { alert('Erro ao ler o arquivo de backup.'); }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    downloadPDF(
      currentProduct.insumos,
      summary,
      currentProduct.name,
      currentProduct.terceirizados,
      currentProduct.type,
      currentProduct.markup.selectedImpostos,
      db.library.impostos,
      currentProduct.markup.selectedComissoes,
      db.library.comissoes,
      currentProduct.markup.selectedFretes,
      db.library.fretes
    );
  };

  const handleSharePDF = () => {
    const summary = calculateSummary(currentProduct, db.library, db.settings);
    sharePDF(
      currentProduct.insumos,
      summary,
      currentProduct.name,
      currentProduct.terceirizados,
      currentProduct.type,
      currentProduct.markup.selectedImpostos,
      db.library.impostos,
      currentProduct.markup.selectedComissoes,
      db.library.comissoes,
      currentProduct.markup.selectedFretes,
      db.library.fretes
    );
  };

  const handleShareText = () => {
    const summary = calculateSummary(currentProduct, db.library, db.settings);
    shareTextReport(
      summary,
      currentProduct.name,
      currentProduct.type,
      currentProduct.markup.selectedImpostos,
      db.library.impostos,
      currentProduct.markup.selectedComissoes,
      db.library.comissoes,
      currentProduct.markup.selectedFretes,
      db.library.fretes
    );
  };

  const handleExportExcel = () => {
    exportToXLS(
      currentProduct.insumos,
      summary,
      currentProduct.name,
      currentProduct.terceirizados,
      currentProduct.type,
      currentProduct.markup.selectedImpostos,
      db.library.impostos,
      currentProduct.markup.selectedComissoes,
      db.library.comissoes,
      currentProduct.markup.selectedFretes,
      db.library.fretes
    );
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair da sua conta? Todas as alterações sincronizadas estão seguras na nuvem. Os dados locais deste dispositivo serão limpos para sua segurança.")) {
      const targetUid = user?.uid; // Store current UID before resetting state

      try {
        // Reset App State immediately to prevent flashing old data
        // Pinned to null/undefined to disable sync until new login
        setDb(getInitialDbState(undefined));
        setIsInitialLoad(true);
        setShowProjectList(false);
        setShowDatabase(false);

        // Clear Scoped Storage
        if (targetUid) {
          const scopedKey = getScopedDbKey(targetUid);
          localStorage.removeItem(scopedKey);
          localStorage.removeItem(scopedKey + '_lastId');
        }

        // Clear Generic Storage (just in case)
        localStorage.removeItem(DB_KEY);
        localStorage.removeItem(DB_KEY + '_lastId');

        // Clear Firebase session (JS SDK)
        await signOut(auth);

        // Clear native session if on mobile (Capacitor plugin)
        if (Capacitor.isNativePlatform()) {
          await FirebaseAuthentication.signOut();
        }

        console.log("App: User signed out and local state cleared.");
      } catch (error) {
        console.error("App: Logout error:", error);
        alert("Erro ao sair da conta.");
      }
    }
  };

  // Movi a definição do summary para cima para ser acessível aos handlers de exportação
  const summary = useMemo(() =>
    calculateSummary(
      currentProduct.insumos || [],
      currentProduct.custosFixos || [],
      currentProduct.custosIndiretos || [],
      currentProduct.production || { diasTrabalhados: 0, producaoDiaria: 0 },
      currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 },
      currentProduct.terceirizados || [],
      currentProduct.precoVendaManual || 0,
      currentProduct.type || 'detailed',
      currentProduct.purchasePrice || 0,
      db.library.unidadesMedida || []
    ),
    [currentProduct, db.library.unidadesMedida]
  );


  const handleUpdateComment = (id: string, type: string, comment: string) => {
    switch (type) {
      case 'insumos':
        updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === id ? { ...i, comentario: comment } : i) });
        break;
      case 'terceirizados':
        updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === id ? { ...i, comentario: comment } : i) });
        break;
      case 'custosFixos':
        updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === id ? { ...i, comentario: comment } : i) });
        break;
      case 'custosIndiretos':
        updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === id ? { ...i, comentario: comment } : i) });
        break;
    }
  };

  const handleNumericChange = (id: string, field: string, value: string, updateFn: (val: number) => void) => {
    setEditingValue({ id, field, value });
    const normalizedValue = value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);

    if (!isNaN(numValue)) {
      // f: fixo, i: indireto (se não for do markup 'm'), ff: frete fixo, purchase: preço compra
      const isPrice = ['v', 'tv', 'purchase', 'manual', 'f', 'ff'].includes(field) || (field === 'i' && id !== 'm');
      const isInteger = ['d', 'u'].includes(field);
      // Item 5: Metas e Taxas (id 'm') devem ter 1 casa decimal
      const isOneDecimal = id === 'm' && ['i', 'c', 'l', 'p', 'ff'].includes(field);
      
      const roundedValue = isInteger 
        ? Math.round(numValue) 
        : (isOneDecimal ? Math.round(numValue * 10) / 10 : (isPrice ? Math.round(numValue * 100) / 100 : Math.round(numValue * 10000) / 10000));
        
      updateFn(roundedValue);
    }
  };

  const handleBulkCopy = (type: 'insumos' | 'terceirizados' | 'custosFixos' | 'custosIndiretos') => {
    let itemsToCopy: any[] = [];
    switch (type) {
      case 'insumos': itemsToCopy = currentProduct.insumos.filter(i => selectedInsumoIds.includes(i.id)); break;
      case 'terceirizados': itemsToCopy = currentProduct.terceirizados.filter(i => selectedTerceirizadoIds.includes(i.id)); break;
      case 'custosFixos': itemsToCopy = currentProduct.custosFixos.filter(i => selectedCustoFixoIds.includes(i.id)); break;
      case 'custosIndiretos': itemsToCopy = currentProduct.custosIndiretos.filter(i => selectedCustoIndiretoIds.includes(i.id)); break;
    }
    if (itemsToCopy.length === 0) return;

    handleCopyToClipboard(type, itemsToCopy);

    // Clear selections
    switch (type) {
      case 'insumos': setSelectedInsumoIds([]); break;
      case 'terceirizados': setSelectedTerceirizadoIds([]); break;
      case 'custosFixos': setSelectedCustoFixoIds([]); break;
      case 'custosIndiretos': setSelectedCustoIndiretoIds([]); break;
    }
  };

  const handleBulkDelete = (type: 'insumos' | 'terceirizados' | 'custosFixos' | 'custosIndiretos') => {
    let count = 0;
    switch (type) {
      case 'insumos': count = selectedInsumoIds.length; break;
      case 'terceirizados': count = selectedTerceirizadoIds.length; break;
      case 'custosFixos': count = selectedCustoFixoIds.length; break;
      case 'custosIndiretos': count = selectedCustoIndiretoIds.length; break;
    }
    if (count === 0) return;
    if (!confirm(`Deseja excluir os ${count} itens selecionados?`)) return;
    switch (type) {
      case 'insumos': updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => !selectedInsumoIds.includes(i.id)) }); setSelectedInsumoIds([]); break;
      case 'terceirizados': updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => !selectedTerceirizadoIds.includes(i.id)) }); setSelectedTerceirizadoIds([]); break;
      case 'custosFixos': updateCurrentProduct({ custosFixos: currentProduct.custosFixos.filter(i => !selectedCustoFixoIds.includes(i.id)) }); setSelectedCustoFixoIds([]); break;
      case 'custosIndiretos': updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.filter(i => !selectedCustoIndiretoIds.includes(i.id)) }); setSelectedCustoIndiretoIds([]); break;
    }
  };

  const toggleSelectItem = (type: 'insumos' | 'terceirizados' | 'custosFixos' | 'custosIndiretos', id: string) => {
    if (type === 'insumos') setSelectedInsumoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'terceirizados') setSelectedTerceirizadoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'custosFixos') setSelectedCustoFixoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (type === 'custosIndiretos') setSelectedCustoIndiretoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = (type: 'insumos' | 'terceirizados' | 'custosFixos' | 'custosIndiretos') => {
    switch (type) {
      case 'insumos': setSelectedInsumoIds(selectedInsumoIds.length === currentProduct.insumos.length ? [] : currentProduct.insumos.map(i => i.id)); break;
      case 'terceirizados': setSelectedTerceirizadoIds(selectedTerceirizadoIds.length === currentProduct.terceirizados.length ? [] : currentProduct.terceirizados.map(i => i.id)); break;
      case 'custosFixos': setSelectedCustoFixoIds(selectedCustoFixoIds.length === currentProduct.custosFixos.length ? [] : currentProduct.custosFixos.map(i => i.id)); break;
      case 'custosIndiretos': setSelectedCustoIndiretoIds(selectedCustoIndiretoIds.length === currentProduct.custosIndiretos.length ? [] : currentProduct.custosIndiretos.map(i => i.id)); break;
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncStatus('syncing');
    try {
      await firebaseService.syncLocalToFirebase(user.uid, db);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Manual sync error:", error);
      setSyncStatus('error');
      alert('Erro ao sincronizar com a nuvem. Verifique sua conexão.');
    }
  };

  const handleResetCloud = async () => {
    if (!user) return;
    if (!confirm('ATENÇÃO: Isso apagará TODOS os dados salvos na sua conta da nuvem (Firebase) e enviará os dados atuais. Deseja prosseguir com a limpeza total?')) return;

    setSyncStatus('syncing');
    try {
      await firebaseService.clearFullDatabase(user.uid);
      await firebaseService.syncLocalToFirebase(user.uid, db);
      setSyncStatus('synced');
      alert('Nuvem limpa e sincronizada com sucesso!');
    } catch (error) {
      console.error("Reset cloud error:", error);
      setSyncStatus('error');
      alert('Erro ao limpar a nuvem. Verifique sua conexão.');
    }
  };

  const getDisplayValue = (value: number, id: string, field: string) => {
    if (editingValue && editingValue.id === id && editingValue.field === field) {
      return editingValue.value;
    }
    // Determina se o campo é um valor monetário (2 casas), quantidade (4 casas) ou inteiro (0 casas)
    const isPrice = ['v', 'tv', 'purchase', 'manual', 'f', 'ff'].includes(field) || (field === 'i' && id !== 'm');
    const isInteger = ['d', 'u'].includes(field);
    // Item 5: Metas e Taxas (id 'm') devem ter 1 casa decimal
    const isOneDecimal = id === 'm' && ['i', 'c', 'l', 'p', 'ff'].includes(field);
    
    const decimals = isInteger ? 0 : (isOneDecimal ? 1 : (isPrice ? 2 : 4));
    return formatNumber(value, decimals);
  };

  const inputBase = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-[12px] font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100";

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-black animate-pulse uppercase tracking-[2px] text-[10px]">PREÇO PRO: Sincronizando Cloud</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen pb-10 bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans overflow-x-hidden md:px-0 px-2 lg:px-4">

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 md:top-2 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md rounded-b-xl md:rounded-xl mx-[-8px] md:mx-0 print:hidden mt-0 md:mt-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowProjectList(true)} title="Abrir Lista de Projetos" aria-label="Projetos" className="p-2 sm:p-2.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm">
              <FolderOpen className="w-5 h-5 text-amber-500" />
            </button>
            <button onClick={() => setShowDatabase(true)} title="Abrir Biblioteca de Itens" aria-label="Biblioteca" className="p-2 sm:p-2.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm">
              <Database className="w-5 h-5 text-emerald-600" />
            </button>
            <button
              onClick={() => setShowMaterialPrices(true)}
              title="Comparação de Preços"
              aria-label="Preços"
              className="p-2 sm:p-2.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
            >
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </button>
          </div>

          <div className="flex flex-col flex-1 min-w-0 border-l border-slate-200 dark:border-slate-700 pl-3">
            <input 
              value={currentProduct.name || ''} 
              title="Nome do Produto" 
              aria-label="Nome do Produto" 
              onChange={(e) => updateCurrentProduct({ name: e.target.value })} 
              className="bg-transparent border-none font-black text-base sm:text-lg focus:ring-0 w-full min-w-0 truncate leading-tight p-0 text-slate-800 dark:text-white" 
              placeholder="Nome do Produto" 
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={handleManualSync}
                disabled={syncStatus === 'syncing'}
                title="Clique para sincronizar com a nuvem agora"
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${syncStatus === 'synced' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' :
                  syncStatus === 'syncing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-wait' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                  }`}>
                {syncStatus === 'synced' ? <><Cloud className="w-3 h-3" /> Nuvem Ativa</> :
                  syncStatus === 'syncing' ? <><RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando</> :
                    <><AlertCircle className="w-3 h-3" /> Erro Cloud</>}
              </button>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-tight truncate hidden sm:inline-block">
                {saveStatus === 'saving' ? 'Gravando...' : 'Seguro'}
              </span>
            </div>
          </div>
        </div>


      </header>

      {/* Print Only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-slate-900 uppercase">PREÇO PRO</h1>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Relatório de Formação de Preço</h2>
        <div className="flex justify-between items-end mt-4">
          <div>
            <p className="text-xs text-slate-400">Produto:</p>
            <p className="text-xl font-black text-slate-800 uppercase">{currentProduct.name || 'Produto Não Nomeado'}</p>
          </div>
          <p className="text-xs text-slate-400">Gerado: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <main id="main-content-top" className="max-w-[1440px] mx-auto md:px-6 px-0 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:gap-4">
        <div className="lg:col-span-9 space-y-6 print:space-y-4">

          <Section title="1. Materiais e Peças ou Compra de Modelo" icon={<Package className="text-emerald-500 w-5 h-5" />} expanded={expandedSection === 'insumos'} onToggle={() => toggleSection('insumos')}>

            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-6 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => updateCurrentProduct({ type: 'detailed' })}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${currentProduct.type !== 'ready' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Materiais e Peças
              </button>
              <button
                onClick={() => updateCurrentProduct({ type: 'ready' })}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${currentProduct.type === 'ready' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Compra de Modelo
              </button>
            </div>

            {currentProduct.type === 'ready' ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço de Compra do Produto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600 pointer-events-none">R$</span>
                  <input
                    type="text"
                    value={getDisplayValue(currentProduct.purchasePrice || 0, 'product', 'purchase')}
                    onChange={(e) => handleNumericChange('product', 'purchase', e.target.value, (v) => updateCurrentProduct({ purchasePrice: v }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-12 py-4 text-2xl font-black text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="0,00"
                  />
                  <button onClick={() => setActiveCalc({ id: 'product', field: 'purchase' })} title="Abrir Calculadora" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500">
                    <Calculator className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Custos adicionais (serviços, fixos e impostos) serão somados a este valor.
                </p>
              </div>
            ) : (
              <>
                {/* Toolbar Copiar/Colar */}
                <div className="flex justify-end gap-2 mb-4 print:hidden">
                  <button
                    onClick={() => handlePasteFromClipboard('insumos')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" /> Colar da Área de Transferência
                  </button>
                </div>

                {/* Bulk Selection Toolbar for Materials */}
                {selectedInsumoIds.length > 0 && (
                  <div className="sticky top-20 z-[45] flex items-center justify-between bg-emerald-600 text-white px-2 sm:px-4 py-2 rounded-xl shadow-lg mb-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-500/50">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0 flex items-center">
                        <input
                          type="checkbox"
                          id="bulk-select-all-insumos"
                          title="Selecionar todos os materiais"
                          checked={selectedInsumoIds.length === currentProduct.insumos.length && currentProduct.insumos.length > 0}
                          onChange={() => toggleSelectAll('insumos')}
                          className="w-5 h-5 rounded border-white/30 bg-white/20 checked:bg-white checked:border-white text-emerald-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer accent-white"
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate">
                        {selectedInsumoIds.length} <span className="hidden sm:inline">selecionados</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleBulkCopy('insumos')}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Copiar</span>
                      </button>
                      <button
                        onClick={() => handleBulkDelete('insumos')}
                        className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Excluir</span>
                      </button>
                      <button
                        onClick={() => setSelectedInsumoIds([])}
                        title="Limpar seleção"
                        className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* MOBILE VIEW */}
                <div className="md:hidden space-y-4 mb-4 max-h-[850px] overflow-y-auto custom-scrollbar pr-2">
                  {currentProduct.insumos.map((insumo) => (
                    <div key={insumo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative group mb-4">
                      {/* Checkbox and Header */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`insumo-select-${insumo.id}`}
                            title="Selecionar item"
                            checked={selectedInsumoIds.includes(insumo.id)}
                            onChange={() => toggleSelectItem('insumos', insumo.id)}
                            className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-600"
                          />
                          <label htmlFor={`insumo-select-${insumo.id}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Selecionar</label>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <button
                            onClick={() => toggleItemExpansion(insumo.id)}
                            title={expandedItems[insumo.id] ? "Recolher detalhes" : "Expandir detalhes"}
                            className={`p-1.5 rounded-lg transition-all ${expandedItems[insumo.id] ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 rotate-180' : 'text-slate-400'}`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleCopyToClipboard('insumos', insumo)} title="Copiar Material" className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} title="Excluir Material" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 mb-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Peça</label>
                          <div className="relative group">
                            <AutocompleteInput
                              id={`peca-${insumo.id}`}
                              value={insumo.peca || ''}
                              suggestions={db.library.pecas}
                              placeholder="Ex: Cabedal..."
                              hidePrice={true}
                              className={`${inputBase} w-full pr-10`}
                              onChange={(val) => {
                                if (checkDuplicateInsumo(val, insumo.material || '', insumo.id, false)) return;
                                updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, peca: val, nome: `${val}${i.material ? ' - ' + i.material : ''}` } : i) });
                              }}
                              onSelect={(item) => {
                                if (checkDuplicateInsumo(item.nome, insumo.material || '', insumo.id)) return;
                                updateCurrentProduct({
                                  insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                                    ...i,
                                    peca: item.nome,
                                    nome: `${item.nome}${i.material ? ' - ' + i.material : ''}`,
                                    valorUnitario: 0 // Peça selection sets price to 0
                                  } : i)
                                });
                              }}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex gap-0.5">
                              {(insumo.peca || '').trim().length > 2 && !db.library.pecas.find(p => p.nome.toLowerCase() === (insumo.peca || '').toLowerCase()) ? (
                                <button
                                  onClick={() => setShowQuickAdd({ type: 'pecas', initialName: insumo.peca, context: { id: insumo.id } })}
                                  title="Salvar Peça no Banco"
                                  className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md text-amber-500 relative"
                                >
                                  <Database className="w-4 h-4" />
                                  <Plus className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setActiveLibraryTarget({ id: insumo.id, type: 'pecas' }); setShowDatabase(true); }}
                                  title="Buscar Peça na Biblioteca"
                                  className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md text-amber-500 transition-all"
                                >
                                  <Database className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Material</label>
                          <div className="relative group">
                            <AutocompleteInput
                              id={`material-${insumo.id}`}
                              value={insumo.material || ''}
                              suggestions={combinedMaterialsSuggestions.filter(s => {
                                const sName = (s as any)._type === 'solados' ? `SOLA: ${s.nome}` : s.nome;
                                return !currentProduct.insumos.some(i => i.material === sName && i.id !== insumo.id);
                              })}
                              placeholder="Ex: Couro ou Sola..."
                              className={`${inputBase} w-full pr-10`}
                              onChange={(val) => {
                                if (checkDuplicateInsumo(insumo.peca || '', val, insumo.id, false)) return;
                                updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, material: val, nome: `${i.peca ? i.peca + ' - ' : ''}${val}` } : i) });
                              }}
                              onSelect={(item) => {
                                const isSola = (item as any)._type === 'solados';
                                const materialName = isSola ? `SOLA: ${item.nome}` : item.nome;
                                if (checkDuplicateInsumo(isSola ? 'Solado' : (insumo.peca || ''), materialName, insumo.id)) return;

                                const finalCost = isSola
                                  ? calculateSolaAverageCost(item as any, db.library.insumos, db.settings.unidadesMedida)
                                  : ((item.quantidadeCompra && item.quantidadeCompra > 0)
                                    ? Math.round((item.valorUnitario / item.quantidadeCompra) * 100) / 100
                                    : Math.round((item.valor_unitario || item.valorUnitario || 0) * 100) / 100);
                                updateCurrentProduct({
                                  insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                                    ...i,
                                    material: materialName,
                                    nome: isSola ? materialName : `${i.peca ? i.peca + ' - ' : ''}${item.nome}`,
                                    peca: isSola ? 'Solado' : i.peca,
                                    unidade: isSola ? 'par' : (item.unidade || i.unidade),
                                    valorUnitario: finalCost
                                  } : i)
                                });
                              }}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex gap-0.5">
                              {(insumo.material || '').trim().length > 2 && !db.library.insumos.find(m => m.nome.toLowerCase() === (insumo.material || '').toLowerCase()) ? (
                                <button
                                  onClick={() => setShowQuickAdd({ type: 'insumos', initialName: insumo.material, context: { id: insumo.id } })}
                                  title="Salvar Material no Banco"
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-md text-emerald-600 relative"
                                >
                                  <Database className="w-4 h-4" />
                                  <Plus className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 text-white rounded-full border border-white dark:border-slate-900" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => { setActiveLibraryTarget({ id: insumo.id, type: 'insumos' }); setShowDatabase(true); }}
                                  title="Buscar Material na Biblioteca"
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-md text-emerald-600 transition-all"
                                >
                                  <Database className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedItems[insumo.id] && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Detalhes de Quantidade e Valor */}

                          <div className="mb-3">
                            <div className="relative group/field">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Unid.</label>
                              <AutocompleteInput
                                id={`unid-${insumo.id}`}
                                value={insumo.unidade}
                                suggestions={db.library.unidadesMedida}
                                placeholder="Un..."
                                hidePrice={true}
                                className={`${inputBase} text-center uppercase px-1 h-11 pr-7`}
                                onChange={(val) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: val.toUpperCase() } : i) })}
                                onSelect={(item) => updateCurrentProduct({
                                  insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: item.nome.toUpperCase() } : i)
                                })}
                              />
                              <div className="absolute right-1 top-1/2 translate-y-[-2px] opacity-0 group-hover/field:opacity-100 transition-all z-10">
                                <button
                                  onClick={() => {
                                    setActiveLibraryTarget({ id: insumo.id, type: 'unidadesMedida' });
                                    setTimeout(() => setShowDatabase(true), 10);
                                  }}
                                  title="Buscar na Biblioteca de Unidades"
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Quantidade</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={getDisplayValue(insumo.quantidade, insumo.id, 'q')}
                                  title="Quantidade"
                                  onBlur={() => setEditingValue(null)}
                                  onChange={(e) => handleNumericChange(insumo.id, 'q', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, quantidade: v } : i) }))}
                                  className={`${inputBase} text-center font-mono pr-16 h-11`}
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                  <button onClick={() => setActiveConsumptionCalc(insumo.id)} title="Calculador de Consumo" className="w-7 h-7 flex items-center justify-center text-emerald-500 hover:text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><Ruler className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => setActiveCalc({ id: insumo.id, field: 'q' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-lg"><Calculator className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Valor Unitário</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={getDisplayValue(insumo.valorUnitario, insumo.id, 'v')}
                                  title="Valor Unitário"
                                  onBlur={() => setEditingValue(null)}
                                  onChange={(e) => handleNumericChange(insumo.id, 'v', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, valorUnitario: v } : i) }))}
                                  className={`${inputBase} text-right font-mono pr-12 h-11`}
                                />
                                <button onClick={() => setActiveCalc({ id: insumo.id, field: 'v' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                  <Calculator className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>


                          {/* Nota do item */}
                          {insumo.comentario && (
                            <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed line-clamp-2">{insumo.comentario}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Subtotal</span>
                              <span className="text-[15px] font-black text-blue-600 font-mono">{formatCurrency((insumo.quantidade / (findUnitFactor(insumo.unidade, db.library.unidadesMedida) || 1)) * insumo.valorUnitario)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setCommentingItem({ id: insumo.id, type: 'insumos', comment: insumo.comentario || '' })}
                                title={insumo.comentario ? 'Ver / Editar Anotação' : 'Adicionar Anotação'}
                                className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-colors print:hidden ${insumo.comentario ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
                                  }`}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleCopyToClipboard('insumos', insumo)} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 transition-colors print:hidden">
                                <Copy className="w-4 h-4" /> Copiar
                              </button>
                              <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors print:hidden">
                                <Trash2 className="w-4 h-4" /> Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* DESKTOP VIEW */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-2 px-2">
                  <div className="min-w-[780px] pb-4">
                    <div className="grid grid-cols-[40px_1.2fr_1.5fr_0.6fr_0.9fr_1.2fr_1fr_0.5fr] gap-3 px-3 py-2.5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          title="Selecionar Todos os Materiais"
                          checked={selectedInsumoIds.length === currentProduct.insumos.length && currentProduct.insumos.length > 0}
                          onChange={() => toggleSelectAll('insumos')}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div className="pl-1">Peça</div><div>Material</div><div className="text-center">Unid.</div><div className="text-center">Qtd</div><div className="text-center">Valor Unit.</div><div className="text-right">V. Total</div><div className="text-center">Ações</div>
                    </div>
                    <div className="space-y-2 p-1">
                      {currentProduct.insumos.map((insumo) => (
                        <div key={insumo.id} className={`grid grid-cols-[40px_1.2fr_1.5fr_0.6fr_0.9fr_1.2fr_1fr_0.5fr] gap-3 p-2 border rounded-xl items-center transition-all shadow-sm group ${selectedInsumoIds.includes(insumo.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'}`}>
                          <div className="flex justify-center">
                            <input
                              type="checkbox"
                              id={`insumo-desktop-select-${insumo.id}`}
                              title="Selecionar material"
                              checked={selectedInsumoIds.includes(insumo.id)}
                              onChange={() => toggleSelectItem('insumos', insumo.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>
                          {/* PEÇA */}
                          <div className="relative group/field">
                            <AutocompleteInput
                              id={`peca-desktop-${insumo.id}`}
                              value={insumo.peca || ''}
                              suggestions={db.library.pecas}
                              placeholder="Ex: Cabedal..."
                              hidePrice={true}
                              className={`${inputBase} !bg-transparent truncate pr-8`}
                              onChange={(val) => {
                                if (checkDuplicateInsumo(val, insumo.material || '', insumo.id, false)) return;
                                updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, peca: val, nome: `${val}${i.material ? ' - ' + i.material : ''}` } : i) });
                              }}
                              onSelect={(item) => {
                                if (checkDuplicateInsumo(item.nome, insumo.material || '', insumo.id)) return;
                                updateCurrentProduct({
                                  insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                                    ...i,
                                    peca: item.nome,
                                    nome: `${item.nome}${i.material ? ' - ' + i.material : ''}`,
                                    valorUnitario: 0 // Peça selection sets price to 0
                                  } : i)
                                });
                              }}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-all z-10 flex gap-0.5">
                              {(insumo.peca || '').trim().length > 2 && !db.library.pecas.find(p => p.nome.toLowerCase() === (insumo.peca || '').toLowerCase()) ? (
                                <button
                                  onClick={() => setShowQuickAdd({ type: 'pecas', initialName: insumo.peca, context: { id: insumo.id } })}
                                  title="Salvar Peça no Banco"
                                  className="p-1 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded text-amber-500 relative"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveLibraryTarget({ id: insumo.id, type: 'pecas' });
                                    setTimeout(() => setShowDatabase(true), 10);
                                  }}
                                  title="Buscar na Biblioteca de Peças"
                                  className="p-1 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded text-amber-500"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* MATERIAL */}
                          <div className="relative group/field">
                            <AutocompleteInput
                              id={`material-desktop-${insumo.id}`}
                              value={insumo.material || ''}
                              suggestions={combinedMaterialsSuggestions.filter(s => {
                                const sName = (s as any)._type === 'solados' ? `SOLA: ${s.nome}` : s.nome;
                                return !currentProduct.insumos.some(i => i.material === sName && i.id !== insumo.id);
                              })}
                              placeholder="Ex: Couro ou Sola..."
                              className={`${inputBase} !bg-transparent truncate pr-14`}
                              onChange={(val) => {
                                if (checkDuplicateInsumo(insumo.peca || '', val, insumo.id, false)) return;
                                updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, material: val, nome: `${i.peca ? i.peca + ' - ' : ''}${val}` } : i) });
                              }}
                              onSelect={(item) => {
                                const isSola = (item as any)._type === 'solados';
                                const materialName = isSola ? `SOLA: ${item.nome}` : item.nome;
                                if (checkDuplicateInsumo(isSola ? 'Solado' : (insumo.peca || ''), materialName, insumo.id)) return;

                                const finalCost = isSola
                                  ? calculateSolaAverageCost(item as any, db.library.insumos, db.settings.unidadesMedida)
                                  : ((item.quantidadeCompra && item.quantidadeCompra > 0)
                                    ? Math.round((item.valorUnitario / item.quantidadeCompra) * 100) / 100
                                    : Math.round((item.valor_unitario || item.valorUnitario || 0) * 100) / 100);

                                updateCurrentProduct({
                                  insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                                    ...i,
                                    material: materialName,
                                    nome: isSola ? materialName : `${i.peca ? i.peca + ' - ' : ''}${item.nome}`,
                                    peca: isSola ? 'Solado' : i.peca,
                                    unidade: isSola ? 'par' : (item.unidade || i.unidade),
                                    valorUnitario: finalCost
                                  } : i)
                                });
                              }}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover/field:opacity-100 transition-all z-10">
                              <button
                                onClick={() => setCommentingItem({ id: insumo.id, type: 'insumos', comment: insumo.comentario || '' })}
                                title={insumo.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                                className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all ${insumo.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              {(insumo.material || '').trim().length > 2 && !db.library.insumos.find(m => m.nome.toLowerCase() === (insumo.material || '').toLowerCase()) ? (
                                <button
                                  onClick={() => setShowQuickAdd({ type: 'insumos', initialName: insumo.material, context: { id: insumo.id } })}
                                  title="Salvar Material no Banco"
                                  className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded text-blue-500 relative"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 text-white rounded-full border border-white dark:border-slate-900" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveLibraryTarget({ id: insumo.id, type: 'insumos' });
                                    setTimeout(() => setShowDatabase(true), 10);
                                  }}
                                  title="Buscar na Biblioteca de Materiais"
                                  className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded text-blue-500"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="relative group/field">
                            <AutocompleteInput
                              id={`unid-desktop-${insumo.id}`}
                              value={insumo.unidade}
                              suggestions={db.library.unidadesMedida}
                              placeholder="Un..."
                              hidePrice={true}
                              className={`${inputBase} text-center uppercase text-[10px] !bg-transparent pr-7`}
                              onChange={(val) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: val.toUpperCase() } : i) })}
                              onSelect={(item) => updateCurrentProduct({
                                insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: item.nome.toUpperCase() } : i)
                              })}
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-all z-10 flex gap-0.5">
                              <button
                                onClick={() => {
                                  setActiveLibraryTarget({ id: insumo.id, type: 'unidadesMedida' });
                                  setTimeout(() => setShowDatabase(true), 10);
                                }}
                                title="Buscar na Biblioteca de Unidades"
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                              >
                                <Database className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="relative">
                            <input type="text" value={getDisplayValue(insumo.quantidade, insumo.id, 'q')} title="Quantidade" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(insumo.id, 'q', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, quantidade: v } : i) }))} className={`${inputBase} text-center font-mono pr-12`} />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                              <button onClick={() => setActiveConsumptionCalc(insumo.id)} title="Calculador de Consumo" className="w-6 h-6 flex items-center justify-center text-emerald-500 hover:text-emerald-600"><Ruler className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setActiveCalc({ id: insumo.id, field: 'q' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          <div className="relative">
                            <input type="text" value={getDisplayValue(insumo.valorUnitario, insumo.id, 'v')} title="Valor Unitário" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(insumo.id, 'v', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, valorUnitario: v } : i) }))} className={`${inputBase} text-right font-mono pr-10`} />
                            <button onClick={() => setActiveCalc({ id: insumo.id, field: 'v' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-4 h-4" /></button>
                          </div>
                          <div className="text-right text-[12px] font-black text-blue-600 font-mono">{formatCurrency((insumo.quantidade / (findUnitFactor(insumo.unidade, db.library.unidadesMedida) || 1)) * insumo.valorUnitario)}</div>
                          <div className="flex justify-center gap-1.5 items-center print:hidden">
                            <button
                              onClick={() => setCommentingItem({ id: insumo.id, type: 'insumos', comment: insumo.comentario || '' })}
                              title={insumo.comentario ? 'Ver / Editar Anotação' : 'Adicionar Anotação'}
                              className={`p-1.5 rounded transition-all ${insumo.comentario ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 hover:text-amber-500'}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button onClick={() => setCopiedItem({ type: 'insumos', data: insumo })} title="Copiar Material" className="text-slate-300 hover:text-blue-500 p-1.5"><Copy className="w-4 h-4" /></button>
                            <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} title="Excluir Material" aria-label="Excluir Material" className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={() => updateCurrentProduct({ insumos: [...currentProduct.insumos, { id: Math.random().toString(36), nome: '', peca: '', material: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }] })} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-600 text-[11px] font-black uppercase flex items-center justify-center gap-2 print:hidden"><Plus className="w-4 h-4" /> NOVO MATERIAL</button>


                {/* Subtotal da Seção 1 */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total de Materiais</h4>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium italic">Soma total de todos os insumos aplicados por par.</p>
                      </div>
                      <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                        {formatCurrency(currentProduct.insumos.reduce((acc, curr) => acc + ((curr.quantidade / (findUnitFactor(curr.unidade, db.library.unidadesMedida) || 1)) * curr.valorUnitario), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Section>

          <Section title="2. Mão de Obra e Serviços" icon={<Users className="text-orange-500 w-5 h-5" />} expanded={expandedSection === 'terceirizados'} onToggle={() => toggleSection('terceirizados')} disabled={currentProduct.type === 'ready'}>

            <div className="flex justify-end gap-2 mb-4 print:hidden">
              <button
                onClick={() => handlePasteFromClipboard('terceirizados')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Colar da Área de Transferência
              </button>
            </div>

            {/* Toolbar de Seleção em Massa (Terceirizados) */}
            {selectedTerceirizadoIds.length > 0 && (
              <div className="sticky top-[72px] z-[40] -mx-4 px-2 sm:px-4 py-2.5 bg-orange-600 shadow-lg border-b border-orange-500 animate-in slide-in-from-top duration-300 print:hidden flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-black text-xs sm:text-sm shadow-sm ring-2 ring-orange-400/50">
                    {selectedTerceirizadoIds.length}
                  </div>
                  <div className="truncate">
                    <span className="text-white font-black text-[10px] sm:text-[11px] uppercase tracking-wider block leading-tight truncate">
                      <span className="hidden xs:inline">Serviços</span> Selecionados
                    </span>
                    <span className="text-orange-200 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest leading-tight hidden sm:block">Ações em massa disponíveis</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleBulkCopy('terceirizados')}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all border border-white/20 hover:scale-105 active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5 text-orange-200" /> <span className="hidden xs:inline">Copiar</span>
                  </button>
                  <button
                    onClick={() => handleBulkDelete('terceirizados')}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-all border border-red-400/30 hover:scale-105 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Excluir</span>
                  </button>
                  <button
                    onClick={() => setSelectedTerceirizadoIds([])}
                    title="Limpar seleção"
                    className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 mb-4 max-h-[850px] overflow-y-auto custom-scrollbar pr-2">
              {currentProduct.terceirizados.map((t) => (
                <div key={t.id} className={`bg-white dark:bg-slate-900 border ${selectedTerceirizadoIds.includes(t.id) ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-4 shadow-sm relative group`}>
                  {/* SELEÇÃO MOBILE */}
                  <div className="mb-3">
                    <button
                      onClick={() => toggleSelectItem('terceirizados', t.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedTerceirizadoIds.includes(t.id)
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedTerceirizadoIds.includes(t.id) ? 'border-transparent bg-white' : 'border-slate-400'
                        }`}>
                        {selectedTerceirizadoIds.includes(t.id) && <Check className="w-2.5 h-2.5 text-orange-600" />}
                      </div>
                      {selectedTerceirizadoIds.includes(t.id) ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                  <div className="mb-4">
                    <div className="relative group">
                      <AutocompleteInput
                        value={t.nome}
                        suggestions={db.library.terceirizados.filter(s => !currentProduct.terceirizados.some(i => i.nome === s.nome && i.id !== t.id))}
                        placeholder="Ex: Corte, Costura, Montagem..."
                        className={`${inputBase} w-full pr-16`}
                        onChange={(val) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, nome: val } : i) })}
                        onSelect={(item) => updateCurrentProduct({
                          terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? {
                            ...i,
                            nome: item.nome,
                            unidade: item.unidade || i.unidade,
                            valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || i.valor || 0
                          } : i)
                        })}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                        <button
                          onClick={() => setCommentingItem({ id: t.id, type: 'terceirizados', comment: t.comment || '' })}
                          title={t.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                          className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${t.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {t.nome.trim().length > 2 && !db.library.terceirizados.find(s => s.nome.toLowerCase() === t.nome.toLowerCase()) ? (
                          <button
                            onClick={() => setShowQuickAdd({ type: 'terceirizados', initialName: t.nome, context: { id: t.id } })}
                            title="Salvar no Cadastro"
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md text-amber-500 transition-all relative"
                          >
                            <Database className="w-4 h-4" />
                            <Plus className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveLibraryTarget({ id: t.id, type: 'terceirizados' });
                              setTimeout(() => setShowDatabase(true), 10);
                            }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="relative group/field">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Unid.</label>
                      <AutocompleteInput
                        id={`unid-terc-${t.id}`}
                        value={t.unidade}
                        suggestions={db.library.unidadesMedida}
                        placeholder="Un..."
                        hidePrice={true}
                        className={`${inputBase} text-center uppercase px-1 h-11 pr-7`}
                        onChange={(val) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: val.toUpperCase() } : i) })}
                        onSelect={(item) => updateCurrentProduct({
                          terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: item.nome.toUpperCase() } : i)
                        })}
                      />
                      <div className="absolute right-1 top-1/2 translate-y-[-2px] opacity-0 group-hover/field:opacity-100 transition-all z-10">
                        <button
                          onClick={() => {
                            setActiveLibraryTarget({ id: t.id, type: 'unidadesMedida' });
                            setTimeout(() => setShowDatabase(true), 10);
                          }}
                          title="Buscar na Biblioteca de Unidades"
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Database className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Quantidade</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(t.quantidade, t.id, 'tq')}
                          title="Quantidade"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(t.id, 'tq', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, quantidade: v } : i) }))}
                          className={`${inputBase} text-center font-mono pr-12 h-11`}
                        />
                        <button onClick={() => setActiveCalc({ id: t.id, field: 'tq' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Valor Unitário</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(t.valorUnitario, t.id, 'tv')}
                          title="Valor Unitário"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(t.id, 'tv', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, valorUnitario: v } : i) }))}
                          className={`${inputBase} text-right font-mono pr-12 h-11`}
                        />
                        <button onClick={() => setActiveCalc({ id: t.id, field: 'tv' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Calculator className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>


                  {t.comentario && (
                    <div className="mb-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed line-clamp-2">{t.comentario}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Subtotal</span>
                      <span className="text-[15px] font-black text-orange-600 font-mono">{formatCurrency((t.quantidade / (findUnitFactor(t.unidade, db.library.unidadesMedida) || 1)) * t.valorUnitario)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCommentingItem({ id: t.id, type: 'terceirizados', comment: t.comentario || '' })}
                        title={t.comentario ? 'Ver / Editar Anotação' : 'Adicionar Anotação'}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg hover:bg-amber-100 transition-colors print:hidden ${t.comentario ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'
                          }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCopyToClipboard('terceirizados', t)} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 transition-colors print:hidden">
                        <Copy className="w-4 h-4" /> Copiar
                      </button>
                      <button onClick={() => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => i.id !== t.id) })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors print:hidden">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-2 px-2">
              <div className="min-w-[780px] pb-4 space-y-2">
                <div className="grid grid-cols-[40px_1.8fr_0.8fr_0.8fr_1.2fr_1fr_0.5fr] gap-3 px-3 py-2.5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleSelectAll('terceirizados')}
                      className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${selectedTerceirizadoIds.length === currentProduct.terceirizados.length && currentProduct.terceirizados.length > 0
                        ? 'bg-orange-600 border-orange-600'
                        : 'bg-white border-slate-300'
                        }`}
                    >
                      {selectedTerceirizadoIds.length === currentProduct.terceirizados.length && currentProduct.terceirizados.length > 0 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="pl-1">Serviço</div><div className="text-center">Unidade</div><div className="text-center">Quantidade</div><div className="text-center">V. Unitário</div><div className="text-right">V. Total</div><div className="text-center">Ações</div>
                </div>
                {currentProduct.terceirizados.map((t) => (
                  <div key={t.id} className={`grid grid-cols-[40px_1.8fr_0.8fr_0.8fr_1.2fr_1fr_0.5fr] gap-3 p-2 bg-white dark:bg-slate-900 border ${selectedTerceirizadoIds.includes(t.id) ? 'border-orange-500 bg-orange-50/20 shadow-sm relative z-10' : 'border-slate-200 dark:border-slate-800'} rounded-xl items-center shadow-sm hover:border-orange-400 transition-all`}>
                    <div className="flex justify-center group-hover:scale-110 transition-transform">
                      <button
                        onClick={() => toggleSelectItem('terceirizados', t.id)}
                        className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${selectedTerceirizadoIds.includes(t.id)
                          ? 'bg-orange-600 border-orange-600 shadow-sm'
                          : 'bg-white border-slate-300'
                          }`}
                      >
                        {selectedTerceirizadoIds.includes(t.id) && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                    <div className="relative group">
                      <AutocompleteInput
                        value={t.nome}
                        suggestions={db.library.terceirizados.filter(s => !currentProduct.terceirizados.some(i => i.nome === s.nome && i.id !== t.id))}
                        placeholder="Ex: Corte..."
                        className={`${inputBase} !bg-transparent truncate pr-16`}
                        onChange={(val) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, nome: val } : i) })}
                        onSelect={(item) => updateCurrentProduct({
                          terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? {
                            ...i,
                            nome: item.nome,
                            unidade: item.unidade || i.unidade,
                            valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || i.valor || 0
                          } : i)
                        })}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                        <button
                          onClick={() => setCommentingItem({ id: t.id, type: 'terceirizados', comment: t.comentario || '' })}
                          title={t.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                          className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all ${t.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        {t.nome.trim().length > 2 && !db.library.terceirizados.find(s => s.nome.toLowerCase() === t.nome.toLowerCase()) ? (
                          <button
                            onClick={() => setShowQuickAdd({ type: 'terceirizados', initialName: t.nome, context: { id: t.id } })}
                            title="Salvar no Cadastro"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded transition-all relative"
                          >
                            <Database className="w-4 h-4" />
                            <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActiveLibraryTarget({ id: t.id, type: 'terceirizados' }); setShowDatabase(true); }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative group/field">
                      <AutocompleteInput
                        id={`unid-terc-desktop-${t.id}`}
                        value={t.unidade}
                        suggestions={db.library.unidadesMedida}
                        placeholder="Un..."
                        hidePrice={true}
                        className={`${inputBase} text-center uppercase text-[10px] !bg-transparent pr-7`}
                        onChange={(val) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: val.toUpperCase() } : i) })}
                        onSelect={(item) => updateCurrentProduct({
                          terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: item.nome.toUpperCase() } : i)
                        })}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-all z-10 flex gap-0.5">
                        <button
                          onClick={() => {
                            setActiveLibraryTarget({ id: t.id, type: 'unidadesMedida' });
                            setTimeout(() => setShowDatabase(true), 10);
                          }}
                          title="Buscar na Biblioteca de Unidades"
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                        >
                          <Database className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <input type="text" value={getDisplayValue(t.quantidade, t.id, 'tq')} title="Quantidade" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tq', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, quantidade: v } : i) }))} className={`${inputBase} text-center font-mono`} />
                    <div className="relative">
                      <input type="text" value={getDisplayValue(t.valorUnitario, t.id, 'tv')} onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tv', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, valorUnitario: v } : i) }))} className={`${inputBase} text-right font-mono pr-10`} />
                      <button onClick={() => setActiveCalc({ id: t.id, field: 'tv' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-4 h-4" /></button>
                    </div>
                    <div className="text-right text-[12px] font-black text-orange-600 font-mono">{formatCurrency((t.quantidade / (findUnitFactor(t.unidade, db.library.unidadesMedida) || 1)) * t.valorUnitario)}</div>
                    <div className="flex justify-center gap-1.5 items-center print:hidden">
                      <button
                        onClick={() => setCommentingItem({ id: t.id, type: 'terceirizados', comment: t.comentario || '' })}
                        title={t.comentario ? 'Ver / Editar Anotação' : 'Adicionar Anotação'}
                        className={`p-1.5 rounded transition-all ${t.comentario ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-300 hover:text-amber-500'}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCopyToClipboard('terceirizados', t)} title="Copiar Serviço" className="text-slate-300 hover:text-blue-500 p-1.5"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => i.id !== t.id) })} title="Excluir Serviço" aria-label="Excluir Serviço" className="text-slate-300 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => updateCurrentProduct({ terceirizados: [...currentProduct.terceirizados, { id: Math.random().toString(36), nome: '', quantidade: 1, unidade: 'par', valorUnitario: 0 }] })} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-orange-600 text-[11px] font-black uppercase flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> NOVO SERVIÇO</button>

            {/* Subtotal da Seção 2 */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-orange-50/30 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Total de Mão de Obra e Serviços</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium italic">Soma total de mão de obra e serviços terceirizados por par.</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black font-mono text-orange-600 dark:text-orange-400">
                      {formatCurrency(currentProduct.terceirizados.reduce((acc, curr) => acc + ((curr.quantidade / (findUnitFactor(curr.unidade, db.library.unidadesMedida) || 1)) * curr.valorUnitario), 0))}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Total Acumulado (Item 2)</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="3. Operacional e Fixos" icon={<TrendingUp className="text-purple-500 w-5 h-5" />} expanded={expandedSection === 'operacional'} onToggle={() => toggleSection('operacional')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Fixos Mensais</h4>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={() => handlePasteFromClipboard('custosFixos')}
                      title="Colar da área de transferência"
                      className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <ClipboardPaste className="w-3 h-3" /> Colar
                    </button>
                  </div>
                </div>

                {/* Bulk Selection Toolbar for Fixed Costs */}
                {selectedCustoFixoIds.length > 0 && (
                  <div className="sticky top-20 z-[45] flex items-center justify-between bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg mb-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-500/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        title="Selecionar Todos os Custos Fixos"
                        checked={selectedCustoFixoIds.length === currentProduct.custosFixos.length && currentProduct.custosFixos.length > 0}
                        onChange={() => toggleSelectAll('custosFixos')}
                        className="w-5 h-5 rounded border-white/30 bg-white/20 checked:bg-white checked:border-white text-emerald-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer accent-white"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">
                        {selectedCustoFixoIds.length} selecionados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBulkCopy('custosFixos')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all">
                        <Copy className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Copiar</span>
                      </button>
                      <button onClick={() => handleBulkDelete('custosFixos')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Excluir</span>
                      </button>
                      <button onClick={() => setSelectedCustoFixoIds([])} title="Limpar Seleção" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {currentProduct.custosFixos.map(cf => (
                  <div key={cf.id} className={`relative bg-white dark:bg-slate-900 border transition-all p-4 rounded-2xl shadow-sm ${selectedCustoFixoIds.includes(cf.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'}`}>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cf-select-${cf.id}`}
                          checked={selectedCustoFixoIds.includes(cf.id)}
                          onChange={() => toggleSelectItem('custosFixos', cf.id)}
                          className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-600"
                        />
                        <label htmlFor={`cf-select-${cf.id}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Selecionar</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1 relative group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Fixo</label>
                        <AutocompleteInput
                          id={`custo-fixo-${cf.id}`}
                          value={cf.nome}
                          suggestions={db.library.custosFixos.filter(s => !currentProduct.custosFixos.some(i => i.nome === s.nome && i.id !== cf.id))}
                          placeholder="Ex: Aluguel..."
                          className={`${inputBase} !bg-transparent !py-2 pr-10`}
                          onChange={(val) => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === cf.id ? { ...i, nome: val } : i) })}
                          onSelect={(item) => updateCurrentProduct({
                            custosFixos: currentProduct.custosFixos.map(i => i.id === cf.id ? {
                              ...i,
                              nome: item.nome,
                              valor: item.valor || i.valor
                            } : i)
                          })}
                        />
                        <div className="absolute right-1 top-[22px] flex gap-1 z-10">
                          <button
                            onClick={() => setCommentingItem({ id: cf.id, type: 'custosFixos', comment: cf.comentario || '' })}
                            title={cf.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${cf.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {cf.nome.trim().length > 2 && !db.library.custosFixos.find(s => s.nome.toLowerCase() === cf.nome.toLowerCase()) ? (
                            <button
                              onClick={() => handleSaveToLibrary('custosFixos', cf.nome)}
                              title="Salvar no Cadastro"
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md transition-all relative"
                            >
                              <Database className="w-4 h-4" />
                              <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setActiveLibraryTarget({ id: cf.id, type: 'custosFixos' }); setShowDatabase(true); }}
                              title="Buscar na Biblioteca"
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                            >
                              <Database className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end gap-1">
                        <button
                          onClick={() => handleCopyToClipboard('custosFixos', cf)}
                          title="Copiar Custo Fixo"
                          className="p-2 text-slate-300 hover:text-blue-500 transition-colors print:hidden"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.filter(i => i.id !== cf.id) })}
                          title="Excluir Custo Fixo"
                          aria-label="Excluir Custo Fixo"
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Valor Mensal (R$)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(cf.valor, cf.id, 'f')}
                          title="Valor do Custo Fixo"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(cf.id, 'f', e.target.value, (v) => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === cf.id ? { ...i, valor: v } : i) }))}
                          className={`${inputBase} font-mono !py-2 pr-10 text-right !text-sm font-black !text-red-600 dark:!text-red-500`}
                        />
                        <button
                          onClick={() => setActiveCalc({ id: cf.id, field: 'f' })}
                          title="Abrir Calculadora"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateCurrentProduct({ custosFixos: [...currentProduct.custosFixos, { id: Math.random().toString(36), nome: '', valor: 0 }] })} title="Adicionar Novo Custo Fixo" className="w-full py-2.5 text-[9px] font-black text-blue-500 uppercase border border-dashed border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all">+ Novo Fixo</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Variáveis Mensais</h4>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={() => handlePasteFromClipboard('custosIndiretos')}
                      title="Colar da área de transferência"
                      className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <ClipboardPaste className="w-3 h-3" /> Colar
                    </button>
                  </div>
                </div>

                {/* Bulk Selection Toolbar for Indirect Costs */}
                {selectedCustoIndiretoIds.length > 0 && (
                  <div className="sticky top-20 z-[45] flex items-center justify-between bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg mb-4 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-500/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        title="Selecionar Todos os Custos Variáveis"
                        checked={selectedCustoIndiretoIds.length === currentProduct.custosIndiretos.length && currentProduct.custosIndiretos.length > 0}
                        onChange={() => toggleSelectAll('custosIndiretos')}
                        className="w-5 h-5 rounded border-white/30 bg-white/20 checked:bg-white checked:border-white text-emerald-600 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer accent-white"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">
                        {selectedCustoIndiretoIds.length} selecionados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBulkCopy('custosIndiretos')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all">
                        <Copy className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Copiar</span>
                      </button>
                      <button onClick={() => handleBulkDelete('custosIndiretos')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Excluir</span>
                      </button>
                      <button onClick={() => setSelectedCustoIndiretoIds([])} title="Limpar Seleção" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {currentProduct.custosIndiretos.map(ci => (
                  <div key={ci.id} className={`relative bg-white dark:bg-slate-900 border transition-all p-4 rounded-2xl shadow-sm ${selectedCustoIndiretoIds.includes(ci.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'}`}>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`ci-select-${ci.id}`}
                          checked={selectedCustoIndiretoIds.includes(ci.id)}
                          onChange={() => toggleSelectItem('custosIndiretos', ci.id)}
                          className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-600"
                        />
                        <label htmlFor={`ci-select-${ci.id}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer">Selecionar</label>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1 relative group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Variável</label>
                        <AutocompleteInput
                          id={`custo-indireto-${ci.id}`}
                          value={ci.nome}
                          suggestions={db.library.custosIndiretos.filter(s => !currentProduct.custosIndiretos.some(i => i.nome === s.nome && i.id !== ci.id))}
                          placeholder="Ex: Manutenção..."
                          className={`${inputBase} !bg-transparent !py-2 pr-10`}
                          onChange={(val) => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === ci.id ? { ...i, nome: val } : i) })}
                          onSelect={(item) => updateCurrentProduct({
                            custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === ci.id ? {
                              ...i,
                              nome: item.nome,
                              valor: item.valor || i.valor
                            } : i)
                          })}
                        />
                        <div className="absolute right-1 top-[22px] flex gap-1 z-10">
                          <button
                            onClick={() => setCommentingItem({ id: ci.id, type: 'custosIndiretos', comment: ci.comentario || '' })}
                            title={ci.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${ci.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {ci.nome.trim().length > 2 && !db.library.custosIndiretos.find(s => s.nome.toLowerCase() === ci.nome.toLowerCase()) ? (
                            <button
                              onClick={() => handleSaveToLibrary('custosIndiretos', ci.nome)}
                              title="Salvar no Cadastro"
                              className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md transition-all relative"
                            >
                              <Database className="w-4 h-4" />
                              <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setActiveLibraryTarget({ id: ci.id, type: 'custosIndiretos' }); setShowDatabase(true); }}
                              title="Buscar na Biblioteca"
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                            >
                              <Database className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-end gap-1">
                        <button
                          onClick={() => handleCopyToClipboard('custosIndiretos', ci)}
                          title="Copiar Custo Variável"
                          className="p-2 text-slate-300 hover:text-blue-500 transition-colors print:hidden"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.filter(i => i.id !== ci.id) })}
                          title="Excluir Custo Variável"
                          aria-label="Excluir Custo Variável"
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Valor Mensal (R$)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(ci.valor, ci.id, 'i')}
                          title="Valor do Custo Variável"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(ci.id, 'i', e.target.value, (v) => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === ci.id ? { ...i, valor: v } : i) }))}
                          className={`${inputBase} font-mono !py-2 pr-10 text-right !text-sm font-black !text-red-600 dark:!text-red-500`}
                        />
                        <button
                          onClick={() => setActiveCalc({ id: ci.id, field: 'i' })}
                          title="Abrir Calculadora"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => updateCurrentProduct({ custosIndiretos: [...currentProduct.custosIndiretos, { id: Math.random().toString(36), nome: '', valor: 0 }] })} className="w-full py-2.5 text-[9px] font-black text-blue-500 uppercase border border-dashed border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all">+ Novo Variável</button>
              </div>
            </div>

            {/* Subtotal da Seção 3 */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resumo Operacional Mensal</h4>
                    <p className="text-[9px] text-slate-400 font-medium italic">Soma total dos custos fixos e variáveis antes da diluição por peça.</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {formatCurrency(
                        currentProduct.custosFixos.reduce((acc, curr) => acc + (curr.valor || 0), 0) +
                        currentProduct.custosIndiretos.reduce((acc, curr) => acc + (curr.valor || 0), 0)
                      )}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Total Mensal (Fixos + Variáveis)</span>
                  </div>
                </div>
                {(!currentProduct.production?.producaoDiaria || !currentProduct.production?.diasTrabalhados) && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[9px] text-amber-700 dark:text-amber-400 font-bold">Configure a Produção (Item 4) para calcular o custo diluído por par.</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="4. (Capacidade de Produção/Expectativa de Vendas)" icon={<Settings className="text-blue-500 w-5 h-5" />} expanded={expandedSection === 'producao'} onToggle={() => toggleSection('producao')}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Dias Trabalhados</label>
                  <input type="text" value={getDisplayValue(currentProduct.production?.diasTrabalhados || 0, 'p', 'd')} title="Dias Trabalhados" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('p', 'd', e.target.value, (v) => updateCurrentProduct({ production: { ...(currentProduct.production || { diasTrabalhados: 22, producaoDiaria: 0 }), diasTrabalhados: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-2xl font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Produção / Vendas por Dia</label>
                  <input type="text" value={getDisplayValue(currentProduct.production?.producaoDiaria || 0, 'p', 'u')} title="Produção Diária" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('p', 'u', e.target.value, (v) => updateCurrentProduct({ production: { ...(currentProduct.production || { diasTrabalhados: 22, producaoDiaria: 0 }), producaoDiaria: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-2xl font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </Section>

            <Section title="5. Metas e Taxas" icon={<Target className="text-indigo-500 w-5 h-5" />} expanded={expandedSection === 'markup'} onToggle={() => toggleSection('markup')}>
              <div className="space-y-3">

                {/* Meta de Margem */}
                <div className="flex items-center justify-between gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Meta de Lucro</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {(currentProduct.markup?.margemLucroMode ?? 'percent') === 'fixed'
                        ? 'Valor fixo de lucro desejado em R$ por unidade vendida (será somado ao custo antes dos impostos)'
                        : 'Percentual de lucro desejado sobre o preço de venda final'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), margemLucroMode: (currentProduct.markup?.margemLucroMode ?? 'percent') === 'percent' ? 'fixed' : 'percent', margemLucro: 0 } })}
                      title={(currentProduct.markup?.margemLucroMode ?? 'percent') === 'percent' ? 'Clique para mudar para valor fixo R$' : 'Clique para mudar para porcentagem %'}
                      className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all active:scale-95 border-2 ${(currentProduct.markup?.margemLucroMode ?? 'percent') === 'percent' ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'}`}
                    >
                      {(currentProduct.markup?.margemLucroMode ?? 'percent') === 'percent' ? '%' : 'R$'}
                    </button>
                    <input
                      type="text"
                      value={getDisplayValue(currentProduct.markup?.margemLucro || 0, 'm', 'l')}
                      title="Meta de Lucro"
                      onBlur={() => setEditingValue(null)}
                      onChange={(e) => handleNumericChange('m', 'l', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), margemLucro: v } }))}
                      className="w-24 bg-white dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-xl py-2 text-[15px] font-black text-center text-blue-700 dark:text-blue-400 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Impostos */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Impostos sobre Venda</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Tributos incidentes sobre o preço de venda (ex: Simples Nacional, ICMS, ISS)</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="text" value={getDisplayValue(currentProduct.markup?.impostos || 0, 'm', 'i')} title="Impostos %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'i', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), impostos: v } }))} className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 text-[15px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                    <span className="text-[11px] font-black text-slate-400">%</span>
                  </div>
                </div>

                {/* Comissão */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Comissão de Venda</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Percentual pago a representantes, vendedores ou plataformas sobre o preço de venda</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="text" value={getDisplayValue(currentProduct.markup?.comissao || 0, 'm', 'c')} title="Comissão %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'c', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), comissao: v } }))} className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 text-[15px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                    <span className="text-[11px] font-black text-slate-400">%</span>
                  </div>
                </div>

                {/* Frete */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Frete de Entrega</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Custo fixo de envio cobrado por unidade vendida (valor em R$)</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[11px] font-black text-slate-400">R$</span>
                    <input type="text" value={getDisplayValue(currentProduct.markup?.freteFixo || 0, 'm', 'ff')} title="Frete Fixo R$" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'ff', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 0 }), freteFixo: v } }))} className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 text-[15px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Perda / Extravio */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{currentProduct.type === 'ready' ? 'Extravio' : 'Perdas de Produção'}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {(currentProduct.markup?.perdasMode ?? 'percent') === 'fixed'
                        ? (currentProduct.type === 'ready'
                            ? 'Valor fixo em R$ por unidade perdida por extravio, furto ou danos no transporte'
                            : 'Valor fixo em R$ de desperdício por unidade produzida')
                        : (currentProduct.type === 'ready'
                            ? 'Percentual estimado de perdas por extravio, furto ou danos no transporte e estoque'
                            : 'Percentual de desperdício de materiais e rejeitos gerados durante a fabricação')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle % / R$ */}
                    <button
                      onClick={() => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), perdasMode: (currentProduct.markup?.perdasMode ?? 'percent') === 'percent' ? 'fixed' : 'percent', perdas: 0 } })}
                      title={(currentProduct.markup?.perdasMode ?? 'percent') === 'percent' ? 'Clique para mudar para valor fixo R$' : 'Clique para mudar para porcentagem %'}
                      className={`w-9 h-9 rounded-xl font-black text-[11px] transition-all active:scale-95 border-2 ${(currentProduct.markup?.perdasMode ?? 'percent') === 'percent' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'}`}
                    >
                      {(currentProduct.markup?.perdasMode ?? 'percent') === 'percent' ? '%' : 'R$'}
                    </button>
                    <input
                      type="text"
                      value={getDisplayValue(currentProduct.markup?.perdas || 0, 'm', 'p')}
                      title={currentProduct.type === 'ready' ? 'Extravio' : 'Perdas'}
                      onBlur={() => setEditingValue(null)}
                      onChange={(e) => handleNumericChange('m', 'p', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), perdas: v } }))}
                      className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 text-[15px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

              </div>

              {(db.library.impostos?.length > 0 || db.library.comissoes?.length > 0 || db.library.fretes?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  {db.library.impostos && db.library.impostos.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Impostos da Biblioteca</label>
                      <div className="flex flex-wrap gap-2">
                        {db.library.impostos.map(imp => {
                          const isSelected = (currentProduct.markup?.selectedImpostos || []).includes(imp.id);
                          return (
                            <button
                              key={imp.id}
                              onClick={() => {
                                const selected = currentProduct.markup?.selectedImpostos || [];
                                const newSelected = isSelected
                                  ? selected.filter(id => id !== imp.id)
                                  : [...selected, imp.id];

                                const totalTax = db.library.impostos
                                  .filter(i => newSelected.includes(i.id))
                                  .reduce((sum, i) => sum + i.aliquota, 0);

                                updateCurrentProduct({
                                  markup: {
                                    ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }),
                                    selectedImpostos: newSelected,
                                    impostos: totalTax
                                  }
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                            >
                              {imp.nome} ({imp.aliquota}%)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {db.library.comissoes && db.library.comissoes.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Comissões da Biblioteca</label>
                      <div className="flex flex-wrap gap-2">
                        {db.library.comissoes.map(com => {
                          const isSelected = (currentProduct.markup?.selectedComissoes || []).includes(com.id);
                          return (
                            <button
                              key={com.id}
                              onClick={() => {
                                const selected = currentProduct.markup?.selectedComissoes || [];
                                const newSelected = isSelected ? selected.filter(id => id !== com.id) : [...selected, com.id];
                                const total = db.library.comissoes.filter(i => newSelected.includes(i.id)).reduce((sum, i) => sum + i.aliquota, 0);
                                updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }), selectedComissoes: newSelected, comissao: total } });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}
                            >
                              {com.nome} ({com.aliquota}%)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {db.library.fretes && db.library.fretes.length > 0 && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Fretes da Biblioteca</label>
                      <div className="flex flex-wrap gap-2">
                        {db.library.fretes.map(f => {
                          const isSelected = (currentProduct.markup?.selectedFretes || []).includes(f.id);
                          return (
                            <button
                              key={f.id}
                              onClick={() => {
                                const selected = currentProduct.markup?.selectedFretes || [];
                                const newSelected = isSelected ? selected.filter(id => id !== f.id) : [...selected, f.id];
                                const total = db.library.fretes.filter(i => newSelected.includes(i.id)).reduce((sum, i) => sum + i.valor, 0);
                                updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }), selectedFretes: newSelected, freteFixo: total } });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
                            >
                              {f.nome} (R$ {f.valor})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              )}
            </Section>

            <Section title="6. Preço da Sua Venda" icon={<CheckCircle2 className="text-emerald-500 w-5 h-5" />} expanded={expandedSection === 'price'} onToggle={() => toggleSection('price')}>
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                  Estipule abaixo o seu preço final de venda. O sistema calculará o seu lucro real e margem baseado neste valor.
                </p>
                <div className="relative bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Valor de Venda Estipulado</label>
                    <span className="text-[9px] font-black text-slate-400">R$ Unitário</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-500/50 pointer-events-none">R$</span>
                    <input
                      type="text"
                      value={getDisplayValue(currentProduct.precoVendaManual || 0, 'root-section', 'manual')}
                      title="Preço de Venda Praticado"
                      onBlur={() => setEditingValue(null)}
                      onChange={(e) => handleNumericChange('root-section', 'manual', e.target.value, (v) => updateCurrentProduct({ precoVendaManual: v }))}
                      className="w-full bg-transparent border-none pl-8 text-3xl font-black tabular-nums focus:ring-0 placeholder:text-emerald-200/50 text-emerald-700 dark:text-emerald-400 font-mono outline-none"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <button
                  onClick={() => updateCurrentProduct({ precoVendaManual: summary.precoFinal })}
                  className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Usar Preço Sugerido ({formatCurrency(summary.precoFinal)})
                </button>
              </div>
            </Section>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 lg:p-6 text-white shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full"></div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Preço de Venda Final</h3>
            <div className="relative mb-8 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-500 pointer-events-none">R$</span>
              <input type="text" value={getDisplayValue(currentProduct.precoVendaManual || 0, 'root', 'manual')} title="Preço de Venda Praticado" aria-label="Preço de Venda" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('root', 'manual', e.target.value, (v) => updateCurrentProduct({ precoVendaManual: v }))} className="w-full bg-transparent border-none pl-12 text-5xl font-black tabular-nums focus:ring-0 placeholder:text-slate-800 font-mono outline-none tracking-tighter" placeholder="0,00" />
            </div>

            <button
              onClick={() => updateCurrentProduct({ precoVendaManual: summary.precoFinal })}
              className="w-full mb-8 py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Aplicar Preço Sugerido ({formatCurrency(summary.precoFinal)})
            </button>

            <div className="space-y-4 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Lucro por par</span>
                  <span className={`font-mono text-xl font-black ${summary.lucroRealUnitario >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(summary.lucroRealUnitario)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Lucro Total Mensal</span>
                  <span className={`font-mono text-xl font-black ${summary.lucroRealUnitario >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(summary.lucroRealUnitario * summary.producaoMensal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase font-black text-slate-500 block mb-1">Preço Sugerido</span>
                  <span className="font-mono text-[13px] font-bold text-slate-200">{formatCurrency(summary.precoFinal)}</span>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-white/5">
                  <span className="text-[8px] uppercase font-black text-slate-500 block mb-1">Custo de Fábrica</span>
                  <span className="font-mono text-[13px] font-bold text-slate-200">{formatCurrency(summary.custoProducaoUnitario)}</span>
                </div>
              </div>

              <div className={`p-6 rounded-md border-2 transition-all ${summary.margemReal >= (currentProduct.markup?.margemLucro || 0) ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider leading-none">Margem Alcançada</span>
                  <span className={`text-4xl font-black font-mono leading-none ${summary.margemReal >= (currentProduct.markup?.margemLucro || 0) ? 'text-emerald-400' : 'text-orange-400'}`}>{summary.margemReal.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-md p-6 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6">Resumo de Custos</h4>
            <div className="space-y-4">
              {currentProduct.type === 'ready' ? (
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Preço de Compra</span><span className="font-mono">{formatCurrency(summary.custoMaterial)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Materiais</span><span className="font-mono">{formatCurrency(summary.custoMaterial)}</span></div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Serviços</span><span className="font-mono">{formatCurrency(summary.custoTerceirizados)}</span></div>
                </>
              )}
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Operacional</span><span className="font-mono">{formatCurrency(summary.custoFixoPorUnidade)}</span></div>
              <div className="flex justify-between text-xs font-medium text-red-400"><span>{currentProduct.type === 'ready' ? 'Custo com Extravio ou Perca' : 'Perdas de Produção'}</span><span className="font-mono">+{formatCurrency(summary.valorPerdaUnitario)}</span></div>
              <div className="flex justify-between text-xs font-medium text-amber-500"><span>Impostos sobre Venda</span><span className="font-mono">+{formatCurrency(summary.valorImpostoUnitario)}</span></div>
              <div className="flex justify-between text-xs font-medium text-blue-500"><span>Comissões de Venda</span><span className="font-mono">+{formatCurrency(summary.valorComissaoUnitaria)}</span></div>
              <div className="flex justify-between text-xs font-medium text-emerald-500"><span>Fretes de Venda</span><span className="font-mono">+{formatCurrency(summary.valorFreteUnitario)}</span></div>


              {/* Detalhamento de Impostos da Biblioteca */}
              {currentProduct.markup?.selectedImpostos && currentProduct.markup.selectedImpostos.length > 0 && (
                <div className="space-y-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 mb-2">
                  {currentProduct.markup.selectedImpostos.map(id => {
                    const tax = db.library.impostos?.find(t => t.id === id);
                    if (!tax) return null;
                    const val = summary.precoPraticado * (tax.aliquota / 100);
                    return (
                      <div key={id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 italic">
                        <span>{tax.nome} ({tax.aliquota}%)</span>
                        <span className="font-mono">+{formatCurrency(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Detalhamento de Comissões da Biblioteca */}
              {currentProduct.markup?.selectedComissoes && currentProduct.markup.selectedComissoes.length > 0 && (
                <div className="space-y-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 mb-2">
                  {currentProduct.markup.selectedComissoes.map(id => {
                    const item = db.library.comissoes?.find(t => t.id === id);
                    if (!item) return null;
                    const val = summary.precoPraticado * (item.aliquota / 100);
                    return (
                      <div key={id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 italic">
                        <span>{item.nome} ({item.aliquota}%)</span>
                        <span className="font-mono">+{formatCurrency(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Detalhamento de Fretes da Biblioteca */}
              {currentProduct.markup?.selectedFretes && currentProduct.markup.selectedFretes.length > 0 && (
                <div className="space-y-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 mb-2">
                  {currentProduct.markup.selectedFretes.map(id => {
                    const item = db.library.fretes?.find(t => t.id === id);
                    if (!item) return null;
                    return (
                      <div key={id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 italic">
                        <span>{item.nome}</span>
                        <span className="font-mono">+{formatCurrency(item.valor)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Detalhamento de Corretagens da Biblioteca */}
              {currentProduct.markup?.selectedCorretagens && currentProduct.markup.selectedCorretagens.length > 0 && (
                <div className="space-y-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 mb-2">
                  {currentProduct.markup.selectedCorretagens.map(id => {
                    const item = db.library.corretagens?.find(t => t.id === id);
                    if (!item) return null;
                    const val = summary.precoPraticado * (item.aliquota / 100);
                    return (
                      <div key={id} className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 italic">
                        <span>{item.nome} ({item.aliquota}%)</span>
                        <span className="font-mono">+{formatCurrency(val)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-400">Total de Encargos (Perda + Taxas)</span>
                <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300">
                  {formatCurrency(
                    summary.valorPerdaUnitario +
                    summary.valorImpostoUnitario +
                    summary.valorComissaoUnitaria +
                    summary.valorFreteUnitario +
                    0
                  )}
                </span>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-black text-[11px] uppercase text-slate-500">Custo Total Real</span>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono tracking-tighter block">
                    {formatCurrency(
                      summary.custoProducaoUnitario +
                      summary.valorImpostoUnitario +
                      summary.valorComissaoUnitaria +
                      summary.valorFreteUnitario +
                      0
                    )}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-black">(Custo + Perda + Imp + Com + Fre + Cor)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {activeCalc && (
        <InlineCalculator
          initialValue={
            activeCalc.field === 'v'
              ? (currentProduct.insumos.find(i => i.id === activeCalc.id)?.valorUnitario || 0)
              : activeCalc.field === 'q'
                ? (currentProduct.insumos.find(i => i.id === activeCalc.id)?.quantidade || 0)
                : activeCalc.field === 'tv'
                  ? (currentProduct.terceirizados.find(i => i.id === activeCalc.id)?.valorUnitario || 0)
                  : activeCalc.field === 'tq'
                    ? (currentProduct.terceirizados.find(i => i.id === activeCalc.id)?.quantidade || 0)
                    : activeCalc.field === 'f'
                      ? (currentProduct.custosFixos.find(i => i.id === activeCalc.id)?.valor || 0)
                      : activeCalc.field === 'i'
                        ? (currentProduct.custosIndiretos.find(i => i.id === activeCalc.id)?.valor || 0)
                        : activeCalc.field === 'purchase'
                          ? (currentProduct.purchasePrice || 0)
                          : 0
          }
          onApply={(val) => {
            const roundedVal = ['q', 'tq', 'u', 'd'].includes(activeCalc.field) ? Math.round(val * 10000) / 10000 : val;
            if (activeCalc.field === 'v') {
              updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === activeCalc.id ? { ...i, valorUnitario: roundedVal } : i) });
            } else if (activeCalc.field === 'q') {
              updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === activeCalc.id ? { ...i, quantidade: roundedVal } : i) });
            } else if (activeCalc.field === 'tv') {
              updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === activeCalc.id ? { ...i, valorUnitario: roundedVal } : i) });
            } else if (activeCalc.field === 'tq') {
              updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === activeCalc.id ? { ...i, quantidade: roundedVal } : i) });
            } else if (activeCalc.field === 'f') {
              updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === activeCalc.id ? { ...i, valor: roundedVal } : i) });
            } else if (activeCalc.field === 'i') {
              updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === activeCalc.id ? { ...i, valor: roundedVal } : i) });
            } else if (activeCalc.field === 'purchase') {
              updateCurrentProduct({ purchasePrice: roundedVal });
            }
            setActiveCalc(null);
          }}
          onClose={() => setActiveCalc(null)}
        />
      )}

      {activeConsumptionCalc && (
        <ConsumptionCalculator
          initialValue={currentProduct.insumos.find(i => i.id === activeConsumptionCalc)?.quantidade || 0}
          initialState={currentProduct.insumos.find(i => i.id === activeConsumptionCalc)?.consumptionCalcState}
          onApply={(val, state) => {
            const roundedVal = Math.round(val * 10000) / 10000;
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i => i.id === activeConsumptionCalc ? { ...i, quantidade: roundedVal, consumptionCalcState: state } : i)
            });
            setActiveConsumptionCalc(null);
          }}
          onClose={(state) => {
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i => i.id === activeConsumptionCalc ? { ...i, consumptionCalcState: state } : i)
            });
            setActiveConsumptionCalc(null);
          }}
        />
      )}

      {/* ====== BALLOON COMMENT MODAL ====== */}
      {commentingItem && (() => {
        const isInsumo = commentingItem.type === 'insumos';
        const item = isInsumo
          ? currentProduct.insumos.find(i => i.id === commentingItem.id)
          : currentProduct.terceirizados.find(i => i.id === commentingItem.id);
        const itemName = item ? (isInsumo ? (item.material || item.nome || 'Material') : item.nome) : 'Item';

        const saveComment = () => {
          if (isInsumo) {
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i =>
                i.id === commentingItem.id ? { ...i, comentario: commentingItem.comment.trim() || undefined } : i
              )
            });
          } else {
            updateCurrentProduct({
              terceirizados: currentProduct.terceirizados.map(i =>
                i.id === commentingItem.id ? { ...i, comentario: commentingItem.comment.trim() || undefined } : i
              )
            });
          }
          setCommentingItem(null);
        };

        return (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 md:items-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setCommentingItem(null)}
            />

            {/* Balloon panel */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-amber-500/10 border border-amber-200 dark:border-amber-800/50 p-6 animate-in slide-in-from-bottom duration-300">
              {/* Balloon tail */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-3 overflow-hidden md:hidden">
                <div className="w-4 h-4 bg-white dark:bg-slate-900 border-b border-r border-amber-200 dark:border-amber-800/50 rotate-45 mx-auto -mt-2" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Anotação</h3>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate max-w-[200px]">{itemName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCommentingItem(null)}
                  title="Fechar anotação"
                  aria-label="Fechar anotação"
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  title="Anotação do item"
                  placeholder="Escreva uma observação sobre este item...\n\nEx: Fornecedor preferido, condições de compra, observações técnicas..."
                  value={commentingItem.comment}
                  onChange={e => setCommentingItem({ ...commentingItem, comment: e.target.value })}
                  autoFocus
                  rows={5}
                  className="w-full bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3.5 text-[13px] text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-amber-400 resize-none leading-relaxed font-medium"
                />
                <span className="absolute bottom-3 right-3 text-[9px] text-slate-400 font-bold">
                  {commentingItem.comment.length} car.
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                {commentingItem.comment.trim() && (
                  <button
                    onClick={() => setCommentingItem({ ...commentingItem, comment: '' })}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 rounded-xl transition-all"
                    title="Limpar anotação"
                  >
                    Limpar
                  </button>
                )}
                <button
                  onClick={saveComment}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" /> Salvar Anotação
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showDatabase && (
        <LibraryView
          library={db.library}
          units={db.settings.unidadesMedida || DEFAULT_UNITS}
          existingItemsNames={[
            ...currentProduct.insumos.map(i => i.nome),
            ...currentProduct.insumos.map(i => i.material || ''),
            ...currentProduct.insumos.map(i => i.peca || ''),
            ...currentProduct.terceirizados.map(i => i.nome),
            ...currentProduct.custosFixos.map(i => i.nome),
            ...currentProduct.custosIndiretos.map(i => i.nome)
          ].filter(Boolean)}
          initialTab={activeLibraryTarget?.type || undefined}
          onClose={() => { setShowDatabase(false); setActiveLibraryTarget(null); }}
          onSelectItem={handleSelectItem}
          onSelectMultipleItems={handleSelectMultipleItems}
          onAddItem={handleAddItemToLibrary}
          onDeleteItem={handleDeleteItemFromLibrary}
          onUpdateItem={handleUpdateItemInLibrary}
          onPriceReadjustment={(item, type) => setReadjustmentItem({ item, type })}
          onUpdateUnits={(newUnits) => setDb(prev => ({ ...prev, settings: { ...prev.settings, unidadesMedida: newUnits } }))}
          onResetCloud={handleResetCloud}
          isSyncing={syncStatus === 'syncing'}
          onShowPriceComparison={() => setShowMaterialPrices(true)}
        />
      )}

      {showQuickAdd && (
        <QuickAddModal 
          type={showQuickAdd.type}
          units={db.settings.unidadesMedida || DEFAULT_UNITS}
          getThemeColor={getThemeColor}
          initialName={showQuickAdd.initialName}
          onClose={() => setShowQuickAdd(null)}
          onSave={(item) => {
            const type = showQuickAdd.type;
            const context = showQuickAdd.context;
            const itemWithId = { ...item, id: Math.random().toString(36) };
            
            // 1. Add to library
            handleAddItemToLibrary(type, itemWithId);

            // 2. Update product row if context exists
            if (context && context.id) {
              if (type === 'insumos') {
                updateCurrentProduct({
                  insumos: currentProduct.insumos.map(i => i.id === context.id ? { 
                    ...i, 
                    material: itemWithId.material || itemWithId.nome,
                    nome: `${i.peca ? i.peca + ' - ' : ''}${itemWithId.material || itemWithId.nome}`,
                    unidade: itemWithId.unidade,
                    valorUnitario: itemWithId.valorUnitario,
                    quantidade: itemWithId.fator / (itemWithId.rendimento || 1)
                  } : i)
                });
              } else if (type === 'pecas') {
                updateCurrentProduct({
                  insumos: currentProduct.insumos.map(i => i.id === context.id ? { 
                    ...i, 
                    peca: itemWithId.nome,
                    nome: `${itemWithId.nome}${i.material ? ' - ' + i.material : ''}`,
                    unidade: itemWithId.unidade,
                    valorUnitario: itemWithId.valorUnitario
                  } : i)
                });
              } else if (type === 'terceirizados') {
                updateCurrentProduct({
                  terceirizados: currentProduct.terceirizados.map(i => i.id === context.id ? { 
                    ...i, 
                    nome: itemWithId.nome,
                    unidade: itemWithId.unidade,
                    valorUnitario: itemWithId.valorUnitario
                  } : i)
                });
              }
            }
            setShowQuickAdd(null);
          }}
        />
      )}

      {showProjectList && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowProjectList(false)} />
          <div className="relative w-full max-w-2xl h-[85vh] bg-white dark:bg-slate-950 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-black uppercase flex items-center gap-3"><FolderOpen className="text-amber-500 w-5 h-5" /> PROJETOS</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
                  title="Alternar Modo Noturno"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
                <button onClick={() => setShowProjectList(false)} title="Fechar" aria-label="Fechar" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
              </div>
            </div>

             <div className="flex gap-2 mb-3">
              <button onClick={() => { const p = DEFAULT_PRODUCT(Math.random().toString(36)); setDb(prev => ({ ...prev, products: [...prev.products, p], lastSelectedProductId: p.id })); setShowProjectList(false); }} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Plus className="w-3 h-3" /> PROJETO</button>
              <button onClick={() => {
                const name = prompt("Nome do novo cliente:");
                if (name) {
                  setDb(prev => ({
                    ...prev,
                    clients: [...(prev.clients || []), { id: Math.random().toString(36), name }]
                  }));
                }
              }} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl active:scale-95 transition-all"><Users className="w-3 h-3" /> CLIENTE</button>
             </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar projetos ou clientes..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
              {(() => {
                const searchLower = projectSearch.toLowerCase();
                const explicitClients = db.clients || [];
                const implicitClientNames = [...new Set(db.products.map(p => p.client).filter(c => !!c && !explicitClients.find(cl => cl.name === c)))];
                const allClients = [
                  ...explicitClients,
                  ...implicitClientNames.map(name => ({ id: name as string, name: name as string }))
                ];

                const unassignedProducts = db.products.filter(p => !p.client && p.name?.toLowerCase().includes(searchLower));

                return (
                  <>
                    {allClients.map(client => {
                      const clientProducts = db.products.filter(p => p.client === client.name);
                      const matchesSearch = client.name.toLowerCase().includes(searchLower) || clientProducts.some(p => p.name?.toLowerCase().includes(searchLower));
                      
                      if (!matchesSearch && clientProducts.length === 0 && searchLower !== '') return null;

                      const isExpanded = expandedClients[client.id] !== false;

                      return (
                        <div key={client.id} className="mb-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                          <div 
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                            onClick={() => setExpandedClients(prev => ({ ...prev, [client.id]: !isExpanded }))}
                            title={isExpanded ? "Minimizar cliente" : "Expandir cliente"}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              <FolderOpen className={`w-4 h-4 text-emerald-500 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-12'}`} />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{client.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{clientProducts.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = prompt("Editar nome do cliente:", client.name);
                                  if (newName && newName !== client.name) {
                                    setDb(prev => ({
                                      ...prev,
                                      clients: (prev.clients || []).map(c => c.id === client.id ? { ...c, name: newName } : c),
                                      products: prev.products.map(p => p.client === client.name ? { ...p, client: newName } : p)
                                    }));
                                  }
                                }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all"
                                title="Renomear Cliente"
                               >
                                 <Edit className="w-4 h-4" />
                               </button>
                               <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClientToDelete({ id: client.id, name: client.name });
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                title="Apagar Cliente"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                               <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const p = DEFAULT_PRODUCT(Math.random().toString(36));
                                  p.client = client.name;
                                  setDb(prev => ({ ...prev, products: [...prev.products, p], lastSelectedProductId: p.id }));
                                  setExpandedClients(prev => ({ ...prev, [client.id]: true }));
                                  setShowProjectList(false);
                                }}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                title="Novo Projeto neste Cliente"
                               >
                                 <Plus className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-2 pt-0 space-y-2">
                              {clientProducts.filter(p => p.name?.toLowerCase().includes(searchLower)).map(p => (
                                <div key={p.id} className={`group relative flex flex-col animate-in fade-in duration-500 p-4 rounded-2xl cursor-pointer transition-all border-2 ${p.id === db.lastSelectedProductId ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:border-slate-300 hover:shadow-md'}`}
                                  onClick={() => {
                                    if (editingProjectId !== p.id) {
                                      setDb(prev => ({ ...prev, lastSelectedProductId: p.id }));
                                      setShowProjectList(false);
                                    }
                                  }}>
                                  {editingProjectId === p.id ? (
                                    <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                      <input
                                        autoFocus
                                        value={editingName}
                                        placeholder="Nome do Projeto"
                                        title="Nome do Projeto"
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs font-black uppercase outline-none"
                                      />
                                      <select
                                        value={editingClient}
                                        title="Ligar a Cliente"
                                        onChange={(e) => setEditingClient(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-xs font-black uppercase outline-none"
                                      >
                                        <option value="">Sem Cliente</option>
                                        {(db.clients || []).map(c => (
                                          <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          setDb(prev => ({
                                            ...prev,
                                            products: prev.products.map(prod => prod.id === p.id ? { ...prod, name: editingName, client: editingClient, lastModified: Date.now() } : prod)
                                          }));
                                          setEditingProjectId(null);
                                        }}
                                        className="mt-1 p-1.5 bg-emerald-500 text-white rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-emerald-600"
                                      >
                                        <Check className="w-3 h-3" /> Salvar
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex justify-between items-start mb-2">
                                        <p className="font-black text-xs truncate uppercase tracking-tight pr-2">{p.name || 'Sem Nome'}</p>
                                        {p.client && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap">
                                            {p.client}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">{new Date(p.lastModified).toLocaleDateString()}</p>
                                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                        <div className="flex gap-1">
                                          <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setEditingName(p.name); setEditingClient(p.client || ''); }} title="Editar Projeto/Ligar Cliente" className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                          <button onClick={(e) => {
                                            e.stopPropagation();
                                            const duplicatedProduct = JSON.parse(JSON.stringify(p));
                                            duplicatedProduct.id = Math.random().toString(36);
                                            duplicatedProduct.name = `${p.name} (Cópia)`;
                                            duplicatedProduct.lastModified = Date.now();
                                            setDb(prev => ({ ...prev, products: [...prev.products, duplicatedProduct], lastSelectedProductId: duplicatedProduct.id }));
                                            setShowProjectList(false);
                                          }} title="Duplicar Produto" className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"><Copy className="w-3.5 h-3.5" /></button>
                                          <button onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const summary = calculateSummary(
                                                p.insumos || [],
                                                p.custosFixos || [],
                                                p.custosIndiretos || [],
                                                p.production || { diasTrabalhados: 0, producaoDiaria: 0 },
                                                p.markup || { impostos: 0, perdas: 0, margemLucro: 0 },
                                                p.terceirizados || [],
                                                p.precoVendaManual || 0,
                                                p.type || 'detailed',
                                                p.purchasePrice || 0,
                                                db.library.unidadesMedida || []
                                              );
                                              await downloadPDF(
                                                p.insumos || [],
                                                summary,
                                                p.name || 'Produto',
                                                p.terceirizados || [],
                                                p.type || 'detailed',
                                                p.markup?.selectedImpostos || [],
                                                db.library.impostos || [],
                                                p.markup?.selectedComissoes || [],
                                                db.library.comissoes || [],
                                                p.markup?.selectedFretes || [],
                                                db.library.fretes || []
                                              );
                                            } catch(err) {
                                              console.error(err);
                                              alert("Erro ao gerar PDF.");
                                            }
                                          }} title="Exportar PDF" className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /></button>
                                        </div>
                                        {db.products.length > 1 && (
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (window.confirm(`Tem certeza que deseja excluir o projeto "${p.name}"? Esta ação não pode ser desfeita.`)) {
                                                const id = p.id;
                                                setDb(prev => {
                                                  const next = prev.products.filter(item => item.id !== id);
                                                  return { ...prev, products: next, lastSelectedProductId: next[0].id };
                                                });
                                                if (user) {
                                                  try {
                                                    await firebaseService.deleteProject(user.uid, id);
                                                  } catch (err) {
                                                    console.error("App: Error deleting project from cloud:", err);
                                                  }
                                                }
                                              }
                                            }}
                                            title="Excluir Produto"
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                              {clientProducts.length === 0 && (
                                <div className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                  Nenhum projeto
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {unassignedProducts.length > 0 && (
                      <div className="mb-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sem Cliente</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">{unassignedProducts.length}</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {unassignedProducts.map(p => (
                            <div key={p.id} className={`group relative flex flex-col animate-in fade-in duration-500 p-4 rounded-2xl cursor-pointer transition-all border-2 ${p.id === db.lastSelectedProductId ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:border-slate-300 hover:shadow-md'}`}
                                onClick={() => {
                                  if (editingProjectId !== p.id) {
                                    setDb(prev => ({ ...prev, lastSelectedProductId: p.id }));
                                    setShowProjectList(false);
                                  }
                                }}>
                                {editingProjectId === p.id ? (
                                  <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                    <input
                                      autoFocus
                                      value={editingName}
                                      placeholder="Nome do Projeto"
                                      title="Nome do Projeto"
                                      onChange={(e) => setEditingName(e.target.value)}
                                      className="flex-1 bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs font-black uppercase outline-none"
                                    />
                                    <select
                                      value={editingClient}
                                      title="Ligar a Cliente"
                                      onChange={(e) => setEditingClient(e.target.value)}
                                      className="flex-1 bg-white dark:bg-slate-800 border border-emerald-500 rounded px-2 py-1 text-xs font-black uppercase outline-none"
                                    >
                                      <option value="">Sem Cliente</option>
                                      {(db.clients || []).map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => {
                                        setDb(prev => ({
                                          ...prev,
                                          products: prev.products.map(prod => prod.id === p.id ? { ...prod, name: editingName, client: editingClient, lastModified: Date.now() } : prod)
                                        }));
                                        setEditingProjectId(null);
                                      }}
                                      className="mt-1 p-1.5 bg-emerald-500 text-white rounded text-[10px] font-black uppercase flex items-center justify-center gap-1 hover:bg-emerald-600"
                                    >
                                      <Check className="w-3 h-3" /> Salvar
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-black text-xs truncate uppercase tracking-tight pr-2">{p.name || 'Sem Nome'}</p>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-3">{new Date(p.lastModified).toLocaleDateString()}</p>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-800/60">
                                      <div className="flex gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setEditingName(p.name); setEditingClient(p.client || ''); }} title="Editar Projeto/Ligar Cliente" className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                        <button onClick={(e) => {
                                          e.stopPropagation();
                                          const duplicatedProduct = JSON.parse(JSON.stringify(p));
                                          duplicatedProduct.id = Math.random().toString(36);
                                          duplicatedProduct.name = `${p.name} (Cópia)`;
                                          duplicatedProduct.lastModified = Date.now();
                                          setDb(prev => ({ ...prev, products: [...prev.products, duplicatedProduct], lastSelectedProductId: duplicatedProduct.id }));
                                          setShowProjectList(false);
                                        }} title="Duplicar Produto" className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"><Copy className="w-3.5 h-3.5" /></button>
                                        <button onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            const summary = calculateSummary(
                                              p.insumos || [],
                                              p.custosFixos || [],
                                              p.custosIndiretos || [],
                                              p.production || { diasTrabalhados: 0, producaoDiaria: 0 },
                                              p.markup || { impostos: 0, perdas: 0, margemLucro: 0 },
                                              p.terceirizados || [],
                                              p.precoVendaManual || 0,
                                              p.type || 'detailed',
                                              p.purchasePrice || 0,
                                              db.library.unidadesMedida || []
                                            );
                                            await downloadPDF(
                                              p.insumos || [],
                                              summary,
                                              p.name || 'Produto',
                                              p.terceirizados || [],
                                              p.type || 'detailed',
                                              p.markup?.selectedImpostos || [],
                                              db.library.impostos || [],
                                              p.markup?.selectedComissoes || [],
                                              db.library.comissoes || [],
                                              p.markup?.selectedFretes || [],
                                              db.library.fretes || []
                                            );
                                          } catch(err) {
                                            console.error(err);
                                            alert("Erro ao gerar PDF.");
                                          }
                                        }} title="Exportar PDF" className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /></button>
                                      </div>
                                      {db.products.length > 1 && (
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Tem certeza que deseja excluir o projeto "${p.name}"? Esta ação não pode ser desfeita.`)) {
                                              const id = p.id;
                                              setDb(prev => {
                                                const next = prev.products.filter(item => item.id !== id);
                                                return { ...prev, products: next, lastSelectedProductId: next[0].id };
                                              });
                                              if (user) {
                                                try {
                                                  await firebaseService.deleteProject(user.uid, id);
                                                } catch (err) {
                                                  console.error("App: Error deleting project from cloud:", err);
                                                }
                                              }
                                            }
                                          }}
                                          title="Excluir Produto"
                                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Modal de Confirmação — Apagar Cliente */}
            {clientToDelete && (
              <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 rounded-3xl bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="p-6 flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 mb-1">Apagar Cliente</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tem certeza que deseja apagar o cliente <span className="font-black text-slate-700 dark:text-slate-200">"{clientToDelete.name}"</span>?
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">Os projetos vinculados serão mantidos, mas ficarão sem cliente associado.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 px-6 pb-6">
                    <button
                      onClick={() => setClientToDelete(null)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setDb(prev => ({
                          ...prev,
                          clients: (prev.clients || []).filter(c => c.id !== clientToDelete!.id),
                          products: prev.products.map(p =>
                            p.client === clientToDelete!.name ? { ...p, client: '' } : p
                          )
                        }));
                        setClientToDelete(null);
                      }}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Accordion Ferramentas */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setShowTools(!showTools)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-4 h-4 ${showTools ? 'text-blue-500 animate-spin-slow' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Opções & Backup</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showTools ? 'rotate-180 text-blue-500' : ''}`} />
              </button>

              {showTools && (
                <div className="space-y-4 mt-4 animate-in slide-in-from-top-2 duration-300">
                  {/* Sync Status moved here */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4 shadow-sm">
                    <div className="relative">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-sm uppercase">
                        {user.email?.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-blue-500' : 'bg-red-500'}`}>
                        {syncStatus === 'synced' ? <Check className="w-2.5 h-2.5 text-white" /> : <RefreshCw className="w-2.5 h-2.5 text-white animate-spin" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter truncate">{user.email}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Erro na Nuvem'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleExportPDF} className="py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col items-center justify-center gap-1 group shadow-sm">
                      <Download className="w-4 h-4 group-hover:text-blue-500" />
                      <span className="text-[8px] font-black uppercase">Exportar</span>
                    </button>
                    <button onClick={handleExportExcel} className="py-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col items-center justify-center gap-1 group shadow-sm">
                      <FileSpreadsheet className="w-4 h-4 group-hover:text-emerald-500" />
                      <span className="text-[8px] font-black uppercase">Excel</span>
                    </button>
                    <button onClick={handleExportBackup} className="py-3 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col items-center justify-center gap-1 group shadow-sm">
                      <Cloud className="w-4 h-4 group-hover:text-amber-500" />
                      <span className="text-[8px] font-black uppercase">Backup</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="py-3 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-600 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex flex-col items-center justify-center gap-1 group shadow-sm">
                      <Upload className="w-4 h-4 group-hover:text-purple-500" />
                      <span className="text-[8px] font-black uppercase">Restaurar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        title="Selecionar arquivo de backup"
        className="hidden"
      />
      {commentingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 shadow-2xl" onClick={() => setCommentingItem(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                </div>
                Observações do Item
              </h3>
              <button onClick={() => setCommentingItem(null)} title="Fechar" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8">
              <textarea
                autoFocus
                value={commentingItem.comment}
                onChange={(e) => setCommentingItem({ ...commentingItem, comment: e.target.value })}
                className="w-full h-44 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-6 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all placeholder:text-slate-300"
                placeholder="Escreva aqui detalhes importantes sobre este material ou serviço..."
              />
              <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => setCommentingItem(null)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Fechar</button>
                <button
                  onClick={() => {
                    handleUpdateComment(commentingItem.id, commentingItem.type, commentingItem.comment);
                    setCommentingItem(null);
                  }}
                  className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  Salvar Alteração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showMaterialPrices && (
        <MaterialPriceComparison
          prices={db.materialPrices || []}
          libraryInsumos={db.library.insumos}
          suppliers={db.suppliers || []}
          units={db.settings.unidadesMedida || DEFAULT_UNITS}
          onAddPrice={(p) => {
            const newPriceRecord = { ...p, id: Math.random().toString(36), data: Date.now() };
            setDb(prev => ({ ...prev, materialPrices: [...(prev.materialPrices || []), newPriceRecord] }));
          }}
          onUpdatePrice={(p) => setDb(prev => ({ ...prev, materialPrices: (prev.materialPrices || []).map(item => item.id === p.id ? p : item) }))}
          onDeletePrice={(id) => setDb(prev => ({ ...prev, materialPrices: (prev.materialPrices || []).filter(p => p.id !== id) }))}
          onAddSupplier={(s) => {
            const newSupplierRecord = { ...s, id: Math.random().toString(36) };
            setDb(prev => ({ ...prev, suppliers: [...(prev.suppliers || []), newSupplierRecord] }));
          }}
          onUpdateSupplier={(s) => setDb(prev => ({ ...prev, suppliers: (prev.suppliers || []).map(item => item.id === s.id ? s : item) }))}
          onDeleteSupplier={(id) => setDb(prev => ({ ...prev, suppliers: (prev.suppliers || []).filter(s => s.id !== id) }))}
          onUpdateUnits={(newUnits) => setDb(prev => ({ ...prev, settings: { ...prev.settings, unidadesMedida: newUnits } }))}
          onClose={() => setShowMaterialPrices(false)}
        />
      )}

      {readjustmentItem && (
        <PriceReadjustmentModal
          item={readjustmentItem.item}
          type={readjustmentItem.type}
          onClose={() => setReadjustmentItem(null)}
          onConfirm={(newPrice) => handlePerformReadjustment(readjustmentItem.item, readjustmentItem.type, newPrice)}
        />
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; expanded: boolean; onToggle: () => void; disabled?: boolean; }> = ({ title, icon, children, expanded, onToggle, disabled }) => (
  <div className={`rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden scroll-mt-24 print:border-none print:shadow-none print:bg-transparent ${disabled ? 'border-slate-100 dark:border-slate-800/50 opacity-50' : expanded ? 'bg-slate-200 dark:bg-slate-800 shadow-md border-slate-300 dark:border-slate-700 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
    <button onClick={disabled ? undefined : onToggle} disabled={disabled} className={`w-full md:px-8 px-4 md:py-6 py-4 flex items-center justify-between transition-colors ${disabled ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : `hover:bg-slate-100 dark:hover:bg-slate-800/60 ${expanded ? 'bg-slate-300/40 dark:bg-slate-800/80' : ''}`} print:hidden`}>
      <div className="flex items-center gap-5">
        <div className={`p-3 rounded-xl shadow-sm transition-colors ${disabled ? 'bg-slate-100 dark:bg-slate-800' : expanded ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {icon}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-black text-[13px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">{title}</span>
          {disabled && <span className="text-[9px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Indisponível</span>}
        </div>
      </div>
      <div className={`p-2 rounded-full transition-all duration-300 ${disabled ? 'bg-slate-100 dark:bg-slate-800 text-slate-300' : expanded ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
        <ChevronDown
          className={`w-6 h-6 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          strokeWidth={3}
        />
      </div>
    </button>
    <div className={`hidden print:flex items-center gap-3 mb-4 mt-6 border-b-2 border-slate-800 pb-2`}>
      {icon}
      <h3 className="font-black text-lg uppercase tracking-wider text-slate-900">{title}</h3>
    </div>
    <div className={`transition-all duration-500 ease-in-out ${expanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'} overflow-visible print:max-h-max print:opacity-100 print:block`}>
      <div className={`md:px-8 px-4 md:pb-10 pb-6 pt-4 border-t print:p-0 print:border-none ${expanded ? 'bg-slate-200/60 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700' : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/50'}`}>
        {children}
        {expanded && (
          <div className="mt-8 flex justify-center print:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const container = e.currentTarget.closest('.rounded-2xl');
                if (container) {
                  onToggle();
                  // Pequeno atraso para garantir que a transição de fechamento começou
                  setTimeout(() => {
                    const topElement = document.getElementById('main-content-top');
                    if (topElement) {
                      topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-500 transition-all shadow-sm active:scale-95 group"
            >
              <ChevronDown className="w-4 h-4 rotate-180 group-hover:-translate-y-1 transition-transform" />
              Recolher Seção
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const MaterialPriceComparison: React.FC<{
  prices: MaterialPriceRecord[];
  libraryInsumos?: Insumo[];
  suppliers: Supplier[];
  units: typeof DEFAULT_UNITS;
  onAddPrice: (price: Omit<MaterialPriceRecord, 'id' | 'data'>) => void;
  onUpdatePrice: (price: MaterialPriceRecord) => void;
  onDeletePrice: (id: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onUpdateUnits: (units: typeof DEFAULT_UNITS) => void;
  onClose: () => void;
}> = ({ prices, libraryInsumos = [], suppliers, units, onAddPrice, onUpdatePrice, onDeletePrice, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onUpdateUnits, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cadastro_precos' | 'historico_precos' | 'suppliers' | 'analysis'>('cadastro_precos');
  const [filter, setFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [copiedItem, setCopiedItem] = useState<{ type: string; data: any } | null>(null);

  // States for Price CRUD
  const [editingPrice, setEditingPrice] = useState<MaterialPriceRecord | null>(null);
  const [newPrice, setNewPrice] = useState({ material: '', fornecedor: '', preco: '', unidade: 'Kg', largura: '' });
  const [showPriceCalc, setShowPriceCalc] = useState(false);

  // Converter State
  const [showConverter, setShowConverter] = useState(false);
  const [convM2Price, setConvM2Price] = useState('');
  const [convWidth, setConvWidth] = useState('');

  // Units Management State
  const [showUnitManager, setShowUnitManager] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  // States for Supplier CRUD
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({ nome: '', telefone: '', email: '' });
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showHistoryAccordion, setShowHistoryAccordion] = useState(false);

  // Filtered Data
  const filteredPrices = useMemo(() => {
    return (prices || []).filter(p => {
      const matchesSearch = (p.material || '').toLowerCase().includes(filter.toLowerCase()) ||
                          (p.fornecedor || '').toLowerCase().includes(filter.toLowerCase());
      const matchesSupplier = !supplierFilter || p.fornecedor === supplierFilter;
      return matchesSearch && matchesSupplier;
    }).sort((a, b) => b.data - a.data);
  }, [prices, filter, supplierFilter]);

  const filteredSuppliers = useMemo(() => {
    return (suppliers || []).filter(s =>
      (s.nome || '').toLowerCase().includes(filter.toLowerCase())
    );
  }, [suppliers, filter]);

  // Analysis State
  const [analysisMaterial, setAnalysisMaterial] = useState('');
  const [analysisSearch, setAnalysisSearch] = useState('');
  const uniqueMaterials = useMemo(() => {
    const set = new Set((prices || []).map(p => p.material));
    return Array.from(set).sort();
  }, [prices]);

  const uniqueSuppliersInHistory = useMemo(() => {
    const set = new Set((prices || []).filter(p => p.fornecedor).map(p => p.fornecedor));
    return Array.from(set).sort();
  }, [prices]);

  const analysisData = useMemo(() => {
    if (!analysisMaterial) return [];
    return prices
      .filter(p => p.material === analysisMaterial)
      .sort((a, b) => a.data - b.data);
  }, [prices, analysisMaterial]);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 w-full h-full sm:h-[90vh] sm:max-w-5xl sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-t sm:border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-black uppercase tracking-tight">Comparação de Preços</h2>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest pl-0.5">Histórico & Fornecedores</p>
            </div>
          </div>
          <button onClick={onClose} title="Fechar" className="p-2 md:p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {[
            { id: 'cadastro_precos', label: 'Cadastro', fullLabel: 'Cadastro de Materiais', icon: <Plus className="w-3.5 h-3.5" /> },
            { id: 'historico_precos', label: 'Histórico', fullLabel: 'Histórico de Preços', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: 'suppliers', label: 'Fornecedores', fullLabel: 'Fornecedores', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'analysis', label: 'Análise', fullLabel: 'Análise de Variação', icon: <Layout className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilter(''); }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest transition-all border-b-2 ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50/30 dark:bg-blue-900/10'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.fullLabel}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          {activeTab === 'cadastro_precos' && (
            <>
              {/* Form Preços */}
              <div className="p-4 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 relative">
                {showPriceCalc && (
                  <div className="absolute right-4 top-4 md:right-8 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <InlineCalculator
                      initialValue={parseFloat(editingPrice ? editingPrice.preco.toString() : newPrice.preco || '0') || 0}
                      onApply={(val) => {
                        const roundedVal = Math.round(val * 100) / 100;
                        if (editingPrice) {
                          setEditingPrice({ ...editingPrice, preco: roundedVal });
                        } else {
                          setNewPrice({ ...newPrice, preco: roundedVal.toString() });
                        }
                        setShowPriceCalc(false);
                      }}
                      onClose={() => setShowPriceCalc(false)}
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Material</label>
                    <div className="relative group/library">
                      <AutocompleteInput
                        value={editingPrice ? editingPrice.material : newPrice.material}
                        suggestions={libraryInsumos}
                        onChange={(val) => {
                          if (editingPrice) setEditingPrice({ ...editingPrice, material: val });
                          else setNewPrice({ ...newPrice, material: val });
                        }}
                        onSelect={(item) => {
                          if (editingPrice) {
                            setEditingPrice({
                              ...editingPrice,
                              material: item.nome,
                              unidade: item.unidade || editingPrice.unidade,
                              preco: item.valorUnitario || item.valor_unitario || item.valor || editingPrice.preco
                            });
                          } else {
                            setNewPrice({
                              ...newPrice,
                              material: item.nome,
                              unidade: item.unidade || newPrice.unidade,
                              preco: (item.valorUnitario || item.valor_unitario || item.valor || 0).toString()
                            });
                          }
                        }}
                        placeholder="Ex: Couro Bovino"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Database className="w-4 h-4 text-emerald-500/50" />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Fornecedor</label>
                    <div className="relative group/supplier">
                      <AutocompleteInput
                        value={editingPrice ? editingPrice.fornecedor : newPrice.fornecedor}
                        suggestions={suppliers}
                        hidePrice={true}
                        onChange={(val) => {
                          if (editingPrice) setEditingPrice({ ...editingPrice, fornecedor: val });
                          else setNewPrice({ ...newPrice, fornecedor: val });
                        }}
                        onSelect={(item) => {
                          if (editingPrice) setEditingPrice({ ...editingPrice, fornecedor: item.nome });
                          else setNewPrice({ ...newPrice, fornecedor: item.nome });
                        }}
                        placeholder="Ex: Curtume Silva"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Users className="w-4 h-4 text-blue-500/50" />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Preço</label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1 flex gap-2 relative">
                        <input
                          type="number"
                          value={editingPrice ? editingPrice.preco : newPrice.preco}
                          onChange={e => editingPrice ? setEditingPrice({ ...editingPrice, preco: parseFloat(e.target.value) }) : setNewPrice({ ...newPrice, preco: e.target.value })}
                          placeholder="0,00"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-0 font-mono font-bold"
                        />
                        <button
                          onClick={() => setShowPriceCalc(!showPriceCalc)}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${showPriceCalc ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          title="Calculadora de Preço"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={editingPrice ? editingPrice.unidade || (units[0]?.nome || '') : newPrice.unidade}
                          onChange={e => editingPrice ? setEditingPrice({ ...editingPrice, unidade: e.target.value }) : setNewPrice({ ...newPrice, unidade: e.target.value })}
                          className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          title="Unidade"
                        >
                          {units.map(u => (
                            <option key={u.id || u.nome} value={u.nome}>{u.nome}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => setShowUnitManager(!showUnitManager)}
                        className={`p-2.5 rounded-xl transition-all ${showUnitManager ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title="Gerenciar Unidades"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Larg. (m)</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={editingPrice ? editingPrice.largura || '' : newPrice.largura}
                        onChange={e => editingPrice ? setEditingPrice({ ...editingPrice, largura: parseFloat(e.target.value) }) : setNewPrice({ ...newPrice, largura: e.target.value })}
                        placeholder="1.40"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <div className="flex gap-2">
                      {editingPrice ? (
                        <>
                          <button
                            onClick={() => {
                              if (editingPrice.material && editingPrice.preco) {
                                onUpdatePrice(editingPrice);
                                setEditingPrice(null);
                              }
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" /> Salvar
                          </button>
                          <button
                            onClick={() => setEditingPrice(null)}
                            className="px-3 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-all font-black text-[10px]"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (newPrice.material && newPrice.preco) {
                              onAddPrice({
                                material: newPrice.material,
                                fornecedor: newPrice.fornecedor,
                                preco: parseFloat(newPrice.preco),
                                unidade: newPrice.unidade,
                                largura: newPrice.largura ? parseFloat(newPrice.largura) : undefined
                              });
                              setNewPrice({ material: '', fornecedor: '', preco: '', unidade: 'Kg', largura: '' });
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Cadastrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gerenciador de Unidades */}
                {showUnitManager && (
                  <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5" /> Gerenciar Unidades de Medida
                      </h3>
                      <button onClick={() => setShowUnitManager(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all" title="Fechar Gerenciador de Unidades">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {units.map(unit => (
                        <div key={unit.id || unit.nome} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-1 py-1 rounded-lg shadow-sm">
                          <span className="text-[10px] font-bold uppercase">{unit.nome}</span>
                          <button
                            onClick={() => onUpdateUnits(units.filter(u => u.id !== unit.id))}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-md transition-all"
                            title="Remover unidade"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        value={newUnitName}
                        onChange={e => setNewUnitName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newUnitName.trim()) {
                            if (!units.some((u: any) => u.nome.toLowerCase() === newUnitName.trim().toLowerCase())) {
                              onUpdateUnits([...units, { id: Math.random().toString(36), nome: newUnitName.trim(), fator: 1 }] as any);
                              setNewUnitName('');
                            }
                          }
                        }}
                        placeholder="Nova unidade (Ex: Pacote)"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (newUnitName.trim() && !units.some((u: any) => u.nome.toLowerCase() === newUnitName.trim().toLowerCase())) {
                            onUpdateUnits([...units, { id: Math.random().toString(36), nome: newUnitName.trim(), fator: 1 }] as any);
                            setNewUnitName('');
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95 transition-all"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                )}

                {/* Conversor de M2 para ML */}
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button
                    onClick={() => setShowConverter(!showConverter)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    {showConverter ? 'Fechar Conversor' : 'Conversor M² para Linear'}
                  </button>

                  {showConverter && (
                    <div className="mt-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="text-[8px] font-black text-blue-400 uppercase block mb-1.5 px-1">Preço por M² (R$)</label>
                          <input
                            type="number"
                            value={convM2Price}
                            onChange={e => setConvM2Price(e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-blue-400 uppercase block mb-1.5 px-1">Largura (Metros)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={convWidth}
                            onChange={e => setConvWidth(e.target.value)}
                            placeholder="Ex: 1.40"
                            className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const m2 = parseFloat(convM2Price);
                            const w = parseFloat(convWidth);
                            if (!isNaN(m2) && !isNaN(w)) {
                              const linearPrice = m2 * w;
                              if (editingPrice) {
                                setEditingPrice({ ...editingPrice, preco: linearPrice, unidade: 'ML', largura: w });
                              } else {
                                setNewPrice({ ...newPrice, preco: linearPrice.toString(), unidade: 'ML', largura: w.toString() });
                              }
                              setShowConverter(false);
                            }
                          }}
                          className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                        >
                          Calcular e Aplicar
                        </button>
                      </div>
                      <p className="text-[8px] text-blue-400 font-bold mt-3 uppercase tracking-wider italic">* Cálculo: Preço M² × Largura = Preço por Metro Linear (ML)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico Accordion na parte inferior */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                <div className="max-w-5xl mx-auto mt-4">
                  <button
                    onClick={() => setShowHistoryAccordion(!showHistoryAccordion)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-all shadow-sm border border-slate-200 dark:border-slate-700 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-colors ${showHistoryAccordion ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">Histórico de Preços Recentes</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Clique para expandir e consultar registros</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showHistoryAccordion ? 'rotate-180 text-blue-500' : ''}`} />
                  </button>

                  {showHistoryAccordion && (
                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Filtrar por material..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                          />
                        </div>
                        <div className="relative w-full md:w-64">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <select
                            value={supplierFilter}
                            onChange={e => setSupplierFilter(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                            title="Filtrar por fornecedor"
                          >
                            <option value="">Todos Fornecedores</option>
                            {uniqueSuppliersInHistory.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                        {/* Desktop Grid */}
                        <div className="hidden md:block">
                          <div className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.7fr] gap-4 px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <div>Material</div>
                            <div>Fornecedor</div>
                            <div>Preço</div>
                            <div>Data</div>
                            <div className="text-right">Ações</div>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {filteredPrices.map(p => (
                              <div key={p.id} className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.7fr] gap-4 p-4 border-b border-slate-50 dark:border-slate-700/50 items-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all">
                                <div className="font-bold text-sm truncate uppercase" title={p.material}>{p.material}</div>
                                <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase truncate">{p.fornecedor || '---'}</div>
                                <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                                  {formatCurrency(p.preco)}
                                  <span className="text-[10px] text-slate-400 ml-1">/{p.unidade || 'Kg'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(p.data).toLocaleDateString()}</div>
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Copiar" className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Copy className="w-4 h-4" /></button>
                                  <button onClick={() => { setEditingPrice(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Editar" className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => onDeletePrice(p.id)} title="Excluir" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mobile List */}
                        <div className="md:hidden p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                          {filteredPrices.map(p => (
                            <div key={p.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase truncate pr-4">{p.material}</h4>
                                <div className="flex gap-1">
                                  <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-blue-500"><Copy className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => { setEditingPrice(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-amber-500"><Edit className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                                  {formatCurrency(p.preco)}<span className="text-[9px] text-slate-400 ml-0.5">/{p.unidade}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(p.data).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'historico_precos' && (
            <>
              {/* Lista Preços */}
              <div className="p-4 md:p-8 md:pb-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filter}
                      onChange={e => setFilter(e.target.value)}
                      placeholder="Filtrar por material..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                  </div>
                  <div className="relative w-full md:w-64">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={supplierFilter}
                      onChange={e => setSupplierFilter(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm appearance-none"
                      title="Filtrar por fornecedor"
                    >
                      <option value="">Todos Fornecedores</option>
                      {uniqueSuppliersInHistory.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
                <div className="hidden md:block">
                  <div className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.7fr] gap-4 px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <div>Material</div>
                    <div>Fornecedor</div>
                    <div>Preço</div>
                    <div>Data</div>
                    <div className="text-right">Ações</div>
                  </div>
                  <div className="space-y-3 mt-3">
                    {filteredPrices.map(p => (
                      <div key={p.id} className="grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.7fr] gap-4 p-4 bg-white dark:bg-slate-800 shadow-sm rounded-2xl items-center border border-slate-100 dark:border-slate-700/50 hover:border-blue-300 transition-all">
                        <div className="font-bold text-sm truncate uppercase" title={p.material}>{p.material}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase truncate">{p.fornecedor || '---'}</div>
                        <div className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                          {formatCurrency(p.preco)}
                          <span className="text-[10px] text-slate-400 ml-1">/{p.unidade || 'Kg'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(p.data).toLocaleDateString()}</div>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); setActiveTab('cadastro_precos'); }} title="Copiar Dados" className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingPrice(p); setActiveTab('cadastro_precos'); }} title="Editar Registro" className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => onDeletePrice(p.id)} title="Excluir Registro" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {filteredPrices.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-8 -mt-8 rounded-full" />

                      <div className="flex justify-between items-start mb-3 relative z-10">
                        <div className="flex-1 pr-12">
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tight">{p.material}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.fornecedor || 'Geral'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); setActiveTab('cadastro_precos'); }} title="Copiar" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-90 transition-all"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingPrice(p); setActiveTab('cadastro_precos'); }} title="Editar" className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 active:scale-90 transition-all"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => onDeletePrice(p.id)} title="Excluir" className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 active:scale-90 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/50 relative z-10">
                        <div>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">Valor Unitário</p>
                          <div className="font-mono font-black text-xl text-blue-600 dark:text-blue-400 flex items-baseline gap-1">
                            {formatCurrency(p.preco)}
                            <span className="text-[10px] text-slate-400 uppercase font-black">/{p.unidade || 'kg'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-black text-slate-500 uppercase">{new Date(p.data).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredPrices.length === 0 && (
                    <div className="text-center py-20 opacity-30">
                      <Database className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'suppliers' && (
            <>
              {/* Form Fornecedores (Accordion) */}
              <div className="p-4 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => setShowSupplierForm(!showSupplierForm)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm border border-slate-200 dark:border-slate-700 active:scale-[0.98] mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                      <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
                        {editingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ease-in-out ${showSupplierForm || editingSupplier ? 'rotate-180 text-emerald-500' : ''}`}
                  />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSupplierForm || editingSupplier ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end mt-2">
                    <div className="md:col-span-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Nome do Fornecedor</label>
                      <input
                        type="text"
                        value={editingSupplier ? editingSupplier.nome : newSupplier.nome}
                        onChange={e => editingSupplier ? setEditingSupplier({ ...editingSupplier, nome: e.target.value }) : setNewSupplier({ ...newSupplier, nome: e.target.value })}
                        placeholder="Ex: Curtume Silva"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Telefone</label>
                      <input
                        type="text"
                        value={editingSupplier ? editingSupplier.telefone || '' : newSupplier.telefone}
                        onChange={e => editingSupplier ? setEditingSupplier({ ...editingSupplier, telefone: e.target.value }) : setNewSupplier({ ...newSupplier, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Email</label>
                      <input
                        type="email"
                        value={editingSupplier ? editingSupplier.email || '' : newSupplier.email}
                        onChange={e => editingSupplier ? setEditingSupplier({ ...editingSupplier, email: e.target.value }) : setNewSupplier({ ...newSupplier, email: e.target.value })}
                        placeholder="contato@empresa.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      {editingSupplier ? (
                        <>
                          <button
                            onClick={() => {
                              if (editingSupplier.nome) {
                                onUpdateSupplier(editingSupplier);
                                setEditingSupplier(null);
                                setShowSupplierForm(false);
                              }
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" /> Salvar
                          </button>
                          <button onClick={() => { setEditingSupplier(null); setShowSupplierForm(false); }} title="Cancelar edição" className="px-4 bg-slate-200 rounded-xl"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (newSupplier.nome) {
                              onAddSupplier(newSupplier);
                              setNewSupplier({ nome: '', telefone: '', email: '' });
                              setShowSupplierForm(false);
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Cadastrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista Fornecedores */}
              <div className="p-4 md:p-8 md:pb-4 shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filtrar fornecedores..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSuppliers.map(s => (
                    <div key={s.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-md group relative overflow-hidden transition-all active:scale-[0.98]">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-12 -mt-12 rounded-full" />

                      <div className="flex justify-between items-start mb-5 relative z-10">
                        <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingSupplier(s)} title="Editar fornecedor" className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-amber-500 rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => onDeleteSupplier(s.id)} title="Excluir fornecedor" className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white mb-3 leading-tight">{s.nome}</h3>
                        <div className="space-y-2">
                          {s.telefone && (
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full text-blue-500">
                                <Phone className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{s.telefone}</span>
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-full text-blue-500">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">{s.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="p-4 md:p-8 h-full flex flex-col">
              <div className="max-w-md mb-8 shrink-0">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 px-1">Selecione o Material para Análise</label>
                <AutocompleteInput
                  value={analysisSearch || analysisMaterial}
                  suggestions={uniqueMaterials.map(m => ({ id: m, nome: m }))}
                  onChange={(val) => {
                    setAnalysisSearch(val);
                    if (val === '') setAnalysisMaterial('');
                  }}
                  onSelect={(item) => {
                    setAnalysisMaterial(item.nome);
                    setAnalysisSearch(item.nome);
                  }}
                  placeholder="Pesquisar material para análise..."
                  hidePrice={true}
                  className="py-4 px-6 text-sm font-bold rounded-2xl bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pb-10">
                {analysisMaterial ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                        <TrendingUp className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-10 rotate-12" />
                        <p className="text-[10px] font-black uppercase opacity-60 mb-1 relative z-10">Último Preço</p>
                        <h4 className="text-3xl font-black relative z-10">{analysisData.length > 0 ? formatCurrency(analysisData[analysisData.length - 1].preco) : '---'}</h4>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <ArrowDownCircle className="absolute right-[-10px] top-[-10px] w-24 h-24 text-emerald-500/10 rotate-12" />
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 relative z-10">Mínimo</p>
                        <h4 className="text-3xl font-black text-emerald-600 relative z-10">{analysisData.length > 0 ? formatCurrency(Math.min(...analysisData.map(d => d.preco))) : '---'}</h4>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <ArrowUpCircle className="absolute right-[-10px] top-[-10px] w-24 h-24 text-red-500/10 rotate-12" />
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 relative z-10">Máximo</p>
                        <h4 className="text-3xl font-black text-red-600 relative z-10">{analysisData.length > 0 ? formatCurrency(Math.max(...analysisData.map(d => d.preco))) : '---'}</h4>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Evolução de Preços / Fornecedor</h3>
                      <div className="space-y-4">
                        {analysisData.slice().reverse().map((d, idx, arr) => {
                          const diff = idx < arr.length - 1 ? d.preco - arr[idx + 1].preco : 0;
                          return (
                            <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl relative overflow-hidden group">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-400">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(d.data).toLocaleDateString()}</p>
                                  <p className="font-black text-slate-800 dark:text-white">{d.fornecedor || 'Geral'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-black text-lg text-blue-600 dark:text-blue-400">{formatCurrency(d.preco)}</p>
                                {diff !== 0 && (
                                  <p className={`text-[9px] font-black uppercase flex items-center justify-end gap-1 ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {diff > 0 ? '▲' : '▼'} {formatCurrency(Math.abs(diff))}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                    <TrendingUp className="w-16 h-16 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Selecione um material para ver a análise histórica</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

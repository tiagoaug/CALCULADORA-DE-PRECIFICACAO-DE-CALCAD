
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
  ClipboardPaste
} from 'lucide-react';
import { ProductData, AppDatabase } from './types';
import { calculateSummary, formatCurrency } from './utils/calculations';
import { downloadPDF, sharePDF, shareFile, copyBackupToClipboard, shareTextReport } from './utils/export';

const DB_KEY = 'preco_pro_db_v1';

// Dados do Backup fornecidos pelo usuário
const BACKUP_PRODUCT_320_BOSS: ProductData = {
  "id": "default",
  "name": "320 boss",
  "lastModified": 1770324245468,
  "insumos": [
    { "id": "1", "nome": "Palmilha intertela", "quantidade": 0.0577, "unidade": "Ml", "valorUnitario": 5.5 },
    { "id": "0.x8nbfhrivlo", "nome": "Palmilha acabamento ", "quantidade": 0.049, "unidade": "Ml", "valorUnitario": 9.8 },
    { "id": "0.t2z37kzqixs", "nome": "Nilon latera", "quantidade": 0.125, "unidade": "Ml", "valorUnitario": 18 },
    { "id": "0.udl0razbae9", "nome": "Borracha tubox", "quantidade": 0.01, "unidade": "Ml", "valorUnitario": 4.56 },
    { "id": "0.hm4muwfggkq", "nome": "Forro traseiro ", "quantidade": 0.03, "unidade": "Ml", "valorUnitario": 9.8 },
    { "id": "0.3l7anefqeex", "nome": "Vies elástico ", "quantidade": 0.95, "unidade": "Ml", "valorUnitario": 0.8 },
    { "id": "0.cs3cs3x38bd", "nome": "Sola", "quantidade": 1, "unidade": "Par", "valorUnitario": 9.8 },
    { "id": "0.nzfnkn9vf0a", "nome": "Palmilha de sola", "quantidade": 0.0411, "unidade": "Ml", "valorUnitario": 4.56 },
    { "id": "0.5ifd01cdzvx", "nome": "Linha", "quantidade": 1, "unidade": "un", "valorUnitario": 0.25 },
    { "id": "0.8vi80invgy4", "nome": "Cola", "quantidade": 1, "unidade": "un", "valorUnitario": 1.2 },
    { "id": "0.ycwmukd2cnh", "nome": "Caixa unitário ", "quantidade": 1, "unidade": "un", "valorUnitario": 1.7 },
    { "id": "0.l5f27su3sq", "nome": "Caixa coletiva", "quantidade": 0.08333333333333333, "unidade": "un", "valorUnitario": 4.3 },
    { "id": "0.fbf980d0dr", "nome": "Etiquetas zebra", "quantidade": 1, "unidade": "un", "valorUnitario": 0.2 },
    { "id": "0.0glbudhpq0b6", "nome": "Saquinho gominha esqueiro ", "quantidade": 1, "unidade": "un", "valorUnitario": 0.2 },
    { "id": "0.q79frrgz19", "nome": "Gorgorão ", "quantidade": 1, "unidade": "un", "valorUnitario": 0.18 }
  ],
  "terceirizados": [
    { "id": "0.cd82xiz9t5s", "nome": "Pesponto", "quantidade": 1, "unidade": "par", "valorUnitario": 4.2 },
    { "id": "0.1c2jzc7do66", "nome": "Montagem ", "quantidade": 1, "unidade": "par", "valorUnitario": 2.5 },
    { "id": "0.npwyquo06js", "nome": "Corte", "quantidade": 1, "unidade": "par", "valorUnitario": 1 },
    { "id": "0.79hod3c5j1d", "nome": "Bordados", "quantidade": 1, "unidade": "par", "valorUnitario": 1.4 },
    { "id": "0.4cdwp3ua8ai", "nome": "Overloque ", "quantidade": 1, "unidade": "par", "valorUnitario": 0.35 },
    { "id": "0.t1y29esrqs", "nome": "Blaque", "quantidade": 1, "unidade": "par", "valorUnitario": 0.8 }
  ],
  "custosFixos": [
    { "id": "f1", "nome": "Salários ", "valor": 3000 },
    { "id": "0.3lfeh6l60fa", "nome": "Água ", "valor": 120 },
    { "id": "0.6d07bishee7", "nome": "Luz", "valor": 120 },
    { "id": "0.kxq3mwalja", "nome": "Celular ", "valor": 200 },
    { "id": "0.h13wayinj3t", "nome": "Programas ", "valor": 120 },
    { "id": "0.wbd8bsy3wki", "nome": "Manutenção de contas em banco ", "valor": 300 },
    { "id": "0.dn2ctiy50gw", "nome": "Internet ", "valor": 130 }
  ],
  "custosIndiretos": [
    { "id": "i1", "nome": "Manutenção", "valor": 250 },
    { "id": "0.li8817qo54", "nome": "Gasolina ", "valor": 1200 }
  ],
  "production": { "diasTrabalhados": 22, "producaoDiaria": 240 },
  "markup": { "impostos": 0, "perdas": 0.5, "margemLucro": 25 },
  "precoVendaManual": 36
};

const DEFAULT_PRODUCT = (id: string = 'new'): ProductData => ({
  id,
  name: 'Novo Produto',
  lastModified: Date.now(),
  insumos: [{ id: '1', nome: 'Material Exemplo', quantidade: 1, unidade: 'un', valorUnitario: 0 }],
  terceirizados: [],
  custosFixos: [{ id: 'f1', nome: 'Aluguel/Luz', valor: 0 }],
  custosIndiretos: [{ id: 'i1', nome: 'Manutenção', valor: 0 }],
  production: { diasTrabalhados: 22, producaoDiaria: 0 },
  markup: { impostos: 0, perdas: 0, margemLucro: 30 },
  precoVendaManual: 0
});

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
  onApply: (val: number) => void;
  onClose: () => void;
  initialValue: number;
}> = ({ onApply, onClose, initialValue }) => {
  const [mode, setMode] = useState<'paper' | 'cut'>('paper');

  // Mode 1: Papel Milimetrado
  const [linearMeterWidth, setLinearMeterWidth] = useState('100');
  const [side1, setSide1] = useState('');
  const [side2, setSide2] = useState('');
  const [piecesPerPair, setPiecesPerPair] = useState('2');

  // Mode 2: Corte em material
  const [totalMeters, setTotalMeters] = useState('');
  const [totalPairs, setTotalPairs] = useState('');

  const calculateMode1Linear = () => {
    const w = parseFloat(linearMeterWidth);
    const s1 = parseFloat(side1);
    const s2 = parseFloat(side2);
    const p = parseFloat(piecesPerPair);
    if (w && s1 && s2 && p) {
      // (lado x lado) dividido pelo metro linear em centimetros e multiplicar por 100
      // Depois multiplicar pela quantidade de pecas por par
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
      // (lado x lado) / 10000 (cm2 to m2) * pecas
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
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-[0_30px_90px_rgba(0,0,0,0.6)] rounded-xl p-7 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-emerald-500" />
            <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Calculador de Consumo</span>
          </div>
          <button onClick={onClose} title="Fechar Calculador de Consumo" aria-label="Fechar Calculador de Consumo" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
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
                    onClick={() => onApply(calculateMode1Linear())}
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
                    onClick={() => onApply(calculateMode1Square())}
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
              onClick={() => onApply(calculateMode2())}
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

const App: React.FC = () => {
  const [db, setDb] = useState<AppDatabase>(() => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.products?.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return {
      version: '1.0',
      products: [BACKUP_PRODUCT_320_BOSS],
      lastSelectedProductId: BACKUP_PRODUCT_320_BOSS.id
    };
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingValue, setEditingValue] = useState<{ id: string, field: string, val: string } | null>(null);
  const [activeCalc, setActiveCalc] = useState<{ id: string, field: string } | null>(null);
  const [activeConsumptionCalc, setActiveConsumptionCalc] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  const [showLibrary, setShowLibrary] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('insumos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProduct = useMemo(() => {
    const found = db.products.find(p => p.id === db.lastSelectedProductId);
    return found || db.products[0] || BACKUP_PRODUCT_320_BOSS;
  }, [db]);

  const persistData = useCallback(() => {
    setSaveStatus('saving');
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(DB_KEY + '_lastId', db.lastSelectedProductId);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 200);
  }, [db]);

  useEffect(() => {
    const debounceTimer = setTimeout(persistData, 1000);
    const periodicTimer = setInterval(persistData, 60000);
    const handleBeforeUnload = () => { localStorage.setItem(DB_KEY, JSON.stringify(db)); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearTimeout(debounceTimer);
      clearInterval(periodicTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [db, persistData]);

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
  }, [theme]);

  const updateCurrentProduct = useCallback((updates: Partial<ProductData>) => {
    setDb(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === prev.lastSelectedProductId ? { ...p, ...updates, lastModified: Date.now() } : p
      )
    }));
  }, [db.lastSelectedProductId]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(db, null, 2);
    const fileName = `backup_preco_pro_${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
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
          if (confirm('Atenção: Isso substituirá todos os seus projetos atuais. Deseja continuar?')) {
            setDb(importedDb);
            setShowLibrary(false);
            alert('Backup restaurado com sucesso!');
          }
        }
      } catch (err) { alert('Erro ao ler o arquivo de backup.'); }
    };
    reader.readAsText(file);
  };

  const summary = useMemo(() =>
    calculateSummary(
      currentProduct.insumos || [],
      currentProduct.custosFixos || [],
      currentProduct.custosIndiretos || [],
      currentProduct.production || { diasTrabalhados: 0, producaoDiaria: 0 },
      currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 },
      currentProduct.terceirizados || [],
      currentProduct.precoVendaManual || 0
    ),
    [currentProduct]
  );

  const handleNumericChange = (id: string, field: string, rawVal: string, updateFn: (numValue: number) => void) => {
    const normalized = rawVal.replace(',', '.');
    const parsed = parseFloat(normalized);
    setEditingValue({ id, field, val: rawVal });
    updateFn(isNaN(parsed) ? 0 : parsed);
  };

  const getDisplayValue = (val: number, id: string, field: string): string => {
    if (editingValue?.id === id && editingValue?.field === field) return editingValue.val;
    return val === 0 ? '' : val.toString().replace('.', ',');
  };

  const inputBase = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-sm px-2.5 py-2.5 text-[12px] font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-100";

  return (
    <div className="min-h-screen pt-[0.4cm] pb-10 bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans overflow-x-hidden md:px-0 px-[0.4cm]">

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[0.4cm] z-50 px-3 sm:px-6 h-14 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-2">
          <button onClick={() => setShowLibrary(true)} title="Abrir Biblioteca de Produtos" aria-label="Biblioteca" className="p-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </button>
          <div className="flex flex-col flex-1 min-w-0">
            <input value={currentProduct.name} title="Nome do Produto" aria-label="Nome do Produto" onChange={(e) => updateCurrentProduct({ name: e.target.value })} className="bg-transparent border-none font-black text-sm sm:text-base focus:ring-0 w-full min-w-0 truncate leading-tight p-0 text-slate-800 dark:text-white" placeholder="Nome do Produto" />
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${saveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tight truncate">
                {saveStatus === 'saving' ? 'Salvando...' : 'Salvo Localmente'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1 sm:p-2 text-slate-500 hover:text-blue-500 transition-colors">{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => shareTextReport(currentProduct.insumos || [], summary, currentProduct.name, currentProduct.terceirizados || [])}
              title="Compartilhar Resumo (Texto)"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-blue-600 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="hidden sm:inline text-[10px] font-black uppercase">Resumo</span>
              <Share className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadPDF(currentProduct.insumos || [], summary, currentProduct.name, currentProduct.terceirizados || [])}
              title="Baixar PDF"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-blue-600 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => sharePDF(currentProduct.insumos || [], summary, currentProduct.name, currentProduct.terceirizados || [])}
              title="Exportar/Compartilhar PDF"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-emerald-600 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
            </button>
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

      <main className="max-w-[1440px] mx-auto md:px-6 px-0 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:gap-4">
        <div className="lg:col-span-8 space-y-6 print:space-y-4">

          <Section title="1. Detalhamento de Insumos" icon={<Package className="text-emerald-500 w-5 h-5" />} expanded={expandedSection === 'insumos'} onToggle={() => toggleSection('insumos')}>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 mb-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {currentProduct.insumos.map((insumo) => (
                <div key={insumo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-4 shadow-sm relative group">
                  <div className="mb-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Descrição do Material</label>
                    <input
                      value={insumo.nome}
                      title="Nome do Material"
                      onChange={(e) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, nome: e.target.value } : i) })}
                      className={`${inputBase} w-full`}
                      placeholder="Ex: Couro, Tecido, Cola..."
                    />
                    <button
                      onClick={() => setActiveConsumptionCalc(insumo.id)}
                      title="Calculador de Consumo"
                      className="absolute right-2 top-[34px] p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-emerald-500 transition-all active:scale-90"
                    >
                      <Ruler className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[0.8fr_1.2fr_1.5fr] gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-center">Unid.</label>
                      <input
                        value={insumo.unidade}
                        onChange={(e) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: e.target.value } : i) })}
                        title="Unidade de medida"
                        className={`${inputBase} text-center uppercase px-1`}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-center">Qtd</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(insumo.quantidade, insumo.id, 'q')}
                          title="Quantidade"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(insumo.id, 'q', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, quantidade: v } : i) }))}
                          className={`${inputBase} text-center font-mono pr-8`}
                        />
                        <button onClick={() => setActiveCalc({ id: insumo.id, field: 'q' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-emerald-500">
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-right">Valor Unit.</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(insumo.valorUnitario, insumo.id, 'v')}
                          title="Valor Unitário"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(insumo.id, 'v', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, valorUnitario: v } : i) }))}
                          className={`${inputBase} text-right font-mono pr-9`}
                        />
                        <button onClick={() => setActiveCalc({ id: insumo.id, field: 'v' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500">
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Subtotal</span>
                      <span className="text-[15px] font-black text-blue-600 font-mono">{formatCurrency(insumo.quantidade * insumo.valorUnitario)}</span>
                    </div>
                    <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors print:hidden">
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-2 px-2">
              <div className="min-w-[780px] pb-4">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 px-3 py-2.5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <div className="pl-1">Descrição</div><div className="text-center">Unidade</div><div className="text-center">Quantidade</div><div className="text-center">V. Unitário</div><div className="text-right">V. Total</div><div className="text-center">Ações</div>
                </div>
                <div className="space-y-2 p-1">
                  {currentProduct.insumos.map((insumo) => (
                    <div key={insumo.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md items-center hover:border-blue-400 transition-all shadow-sm group">
                      <div className="relative">
                        <input value={insumo.nome} title="Nome do Material" onChange={(e) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, nome: e.target.value } : i) })} className={`${inputBase} !bg-transparent truncate pr-8`} />
                        <button
                          onClick={() => setActiveConsumptionCalc(insumo.id)}
                          title="Calculador de Consumo"
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-500 transition-all"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input value={insumo.unidade} title="Unidade" onChange={(e) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, unidade: e.target.value } : i) })} className={`${inputBase} text-center uppercase text-[10px]`} />
                      <div className="relative">
                        <input type="text" value={getDisplayValue(insumo.quantidade, insumo.id, 'q')} title="Quantidade" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(insumo.id, 'q', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, quantidade: v } : i) }))} className={`${inputBase} text-center font-mono pr-8`} />
                        <button onClick={() => setActiveCalc({ id: insumo.id, field: 'q' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-emerald-500"><Calculator className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="relative">
                        <input type="text" value={getDisplayValue(insumo.valorUnitario, insumo.id, 'v')} title="Valor Unitário" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(insumo.id, 'v', e.target.value, (v) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, valorUnitario: v } : i) }))} className={`${inputBase} text-right font-mono pr-10`} />
                        <button onClick={() => setActiveCalc({ id: insumo.id, field: 'v' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-4 h-4" /></button>
                      </div>
                      <div className="text-right text-[12px] font-black text-blue-600 font-mono">{formatCurrency(insumo.quantidade * insumo.valorUnitario)}</div>
                      <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} title="Excluir Material" aria-label="Excluir Material" className="text-slate-300 hover:text-red-500 mx-auto print:hidden"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => updateCurrentProduct({ insumos: [...currentProduct.insumos, { id: Math.random().toString(36), nome: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }] })} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md text-slate-400 hover:text-blue-600 text-[11px] font-black uppercase flex items-center justify-center gap-2 print:hidden"><Plus className="w-4 h-4" /> NOVO MATERIAL</button>
          </Section>

          <Section title="2. Mão de Obra e Serviços" icon={<Users className="text-orange-500 w-5 h-5" />} expanded={expandedSection === 'terceirizados'} onToggle={() => toggleSection('terceirizados')}>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 mb-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {currentProduct.terceirizados.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative group">
                  <div className="mb-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Descrição do Serviço</label>
                    <input
                      value={t.nome}
                      title="Nome do Serviço"
                      onChange={(e) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, nome: e.target.value } : i) })}
                      className={`${inputBase} w-full`}
                      placeholder="Ex: Corte, Costura, Montagem..."
                    />
                  </div>

                  <div className="grid grid-cols-[0.8fr_1.2fr_1.5fr] gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-center">Unid.</label>
                      <input
                        value={t.unidade}
                        onChange={(e) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: e.target.value } : i) })}
                        title="Unidade de medida"
                        className={`${inputBase} text-center uppercase px-1`}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-center">Qtd</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(t.quantidade, t.id, 'tq')}
                          title="Quantidade"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(t.id, 'tq', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, quantidade: v } : i) }))}
                          className={`${inputBase} text-center font-mono pr-8`}
                        />
                        <button onClick={() => setActiveCalc({ id: t.id, field: 'tq' })} title="Abrir Calculadora para Quantidade" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-emerald-500">
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block text-right">Valor Unit.</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={getDisplayValue(t.valorUnitario, t.id, 'tv')}
                          title="Valor Unitário"
                          onBlur={() => setEditingValue(null)}
                          onChange={(e) => handleNumericChange(t.id, 'tv', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, valorUnitario: v } : i) }))}
                          className={`${inputBase} text-right font-mono pr-9`}
                        />
                        <button onClick={() => setActiveCalc({ id: t.id, field: 'tv' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500">
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">Subtotal</span>
                      <span className="text-[15px] font-black text-orange-600 font-mono">{formatCurrency(t.quantidade * t.valorUnitario)}</span>
                    </div>
                    <button onClick={() => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => i.id !== t.id) })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-2 px-2">
              <div className="min-w-[780px] pb-4 space-y-2">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 px-3 py-2.5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <div className="pl-1">Serviço</div><div className="text-center">Unidade</div><div className="text-center">Quantidade</div><div className="text-center">V. Unitário</div><div className="text-right">V. Total</div><div className="text-center">Ações</div>
                </div>
                {currentProduct.terceirizados.map((t) => (
                  <div key={t.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md items-center shadow-sm hover:border-orange-400 transition-all">
                    <input value={t.nome} title="Nome do Serviço" onChange={(e) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, nome: e.target.value } : i) })} className={`${inputBase} !bg-transparent truncate`} />
                    <input value={t.unidade} title="Unidade" onChange={(e) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: e.target.value } : i) })} className={`${inputBase} text-center uppercase text-[10px]`} />
                    <input type="text" value={getDisplayValue(t.quantidade, t.id, 'tq')} title="Quantidade" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tq', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, quantidade: v } : i) }))} className={`${inputBase} text-center font-mono`} />
                    <div className="relative">
                      <input type="text" value={getDisplayValue(t.valorUnitario, t.id, 'tv')} onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tv', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, valorUnitario: v } : i) }))} className={`${inputBase} text-right font-mono pr-10`} />
                      <button onClick={() => setActiveCalc({ id: t.id, field: 'tv' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-4 h-4" /></button>
                    </div>
                    <div className="text-right text-[12px] font-black text-orange-600 font-mono">{formatCurrency(t.quantidade * t.valorUnitario)}</div>
                    <button onClick={() => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => i.id !== t.id) })} title="Excluir Serviço" aria-label="Excluir Serviço" className="text-slate-300 hover:text-red-500 mx-auto"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => updateCurrentProduct({ terceirizados: [...currentProduct.terceirizados, { id: Math.random().toString(36), nome: '', quantidade: 1, unidade: 'par', valorUnitario: 0 }] })} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md text-slate-400 hover:text-orange-600 text-[11px] font-black uppercase flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> NOVO SERVIÇO</button>
          </Section>

          <Section title="3. Operacional e Fixos" icon={<TrendingUp className="text-purple-500 w-5 h-5" />} expanded={expandedSection === 'operacional'} onToggle={() => toggleSection('operacional')}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">Fixos Mensais</h4>
                {currentProduct.custosFixos.map(cf => (
                  <div key={cf.id} className="relative bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Fixo</label>
                        <input
                          value={cf.nome}
                          title="Nome do Custo Fixo"
                          onChange={(e) => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === cf.id ? { ...i, nome: e.target.value } : i) })}
                          className={`${inputBase} !bg-transparent !py-2`}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.filter(i => i.id !== cf.id) })}
                          title="Excluir Custo Fixo"
                          aria-label="Excluir Custo Fixo"
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
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
                          className={`${inputBase} font-mono !py-2 pr-10 text-right !text-red-600 dark:!text-red-500`}
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
                <button onClick={() => updateCurrentProduct({ custosFixos: [...currentProduct.custosFixos, { id: Math.random().toString(36), nome: '', valor: 0 }] })} className="w-full py-2 text-[9px] font-black text-blue-500 uppercase border border-dashed border-blue-200 rounded-lg">+ Novo Fixo</button>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-1">Variáveis Mensais</h4>
                {currentProduct.custosIndiretos.map(ci => (
                  <div key={ci.id} className="relative bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Variável</label>
                        <input
                          value={ci.nome}
                          title="Nome do Custo Variável"
                          onChange={(e) => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === ci.id ? { ...i, nome: e.target.value } : i) })}
                          className={`${inputBase} !bg-transparent !py-2`}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.filter(i => i.id !== ci.id) })}
                          title="Excluir Custo Variável"
                          aria-label="Excluir Custo Variável"
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
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
                          className={`${inputBase} font-mono !py-2 pr-10 text-right !text-red-600 dark:!text-red-500`}
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
                <button onClick={() => updateCurrentProduct({ custosIndiretos: [...currentProduct.custosIndiretos, { id: Math.random().toString(36), nome: '', valor: 0 }] })} className="w-full py-2 text-[9px] font-black text-blue-500 uppercase border border-dashed border-blue-200 rounded-lg">+ Novo Variável</button>
              </div>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="4. Escala de Produção" icon={<Settings className="text-blue-500 w-5 h-5" />} expanded={expandedSection === 'producao'} onToggle={() => toggleSection('producao')}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Dias Trabalhados</label>
                  <input type="text" value={getDisplayValue(currentProduct.production?.diasTrabalhados || 0, 'p', 'd')} title="Dias Trabalhados" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('p', 'd', e.target.value, (v) => updateCurrentProduct({ production: { ...(currentProduct.production || { diasTrabalhados: 22, producaoDiaria: 0 }), diasTrabalhados: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-3 text-2xl font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Pçs/Dia</label>
                  <input type="text" value={getDisplayValue(currentProduct.production?.producaoDiaria || 0, 'p', 'u')} title="Produção Diária" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('p', 'u', e.target.value, (v) => updateCurrentProduct({ production: { ...(currentProduct.production || { diasTrabalhados: 22, producaoDiaria: 0 }), producaoDiaria: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-3 text-2xl font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </Section>

            <Section title="5. Metas e Taxas" icon={<Target className="text-indigo-500 w-5 h-5" />} expanded={expandedSection === 'markup'} onToggle={() => toggleSection('markup')}>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Imp %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.impostos || 0, 'm', 'i')} title="Impostos %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'i', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }), impostos: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-blue-500 uppercase block mb-1">Meta %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.margemLucro || 0, 'm', 'l')} title="Margem de Lucro %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'l', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }), margemLucro: v } }))} className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg py-2.5 text-[14px] font-black text-center text-blue-700 dark:text-blue-400 font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Perda %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.perdas || 0, 'm', 'p')} title="Perdas %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'p', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, perdas: 0, margemLucro: 0 }), perdas: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-lg py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
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

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-md p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full"></div>
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Preço de Venda Final</h3>
            <div className="relative mb-8 bg-slate-800/50 p-6 rounded-md border border-slate-700/50 backdrop-blur-sm">
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
          <div className="bg-white dark:bg-slate-900 rounded-md p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6">Resumo de Custos</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Materiais</span><span className="font-mono">{formatCurrency(summary.custoMaterial)}</span></div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Serviços</span><span className="font-mono">{formatCurrency(summary.custoTerceirizados)}</span></div>
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400"><span>Operacional</span><span className="font-mono">{formatCurrency(summary.custoFixoPorUnidade)}</span></div>
              <div className="flex justify-between text-xs font-medium text-red-400"><span>Perdas de Produção</span><span className="font-mono">+{formatCurrency(summary.valorPerdaUnitario)}</span></div>
              <div className="flex justify-between text-xs font-medium text-amber-500"><span>Impostos sobre Venda</span><span className="font-mono">+{formatCurrency(summary.valorImpostoUnitario)}</span></div>

              <div className="py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-400">Total de Encargos (Perda + Imp)</span>
                <span className="text-xs font-black font-mono text-slate-600 dark:text-slate-300">{formatCurrency(summary.valorPerdaUnitario + summary.valorImpostoUnitario)}</span>
              </div>

              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="font-black text-[11px] uppercase text-slate-500">Custo Total Real</span>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono tracking-tighter block">{formatCurrency(summary.custoProducaoUnitario + summary.valorImpostoUnitario)}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-black">(Custo + Perda + Imposto)</span>
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
                : (currentProduct.terceirizados.find(i => i.id === activeCalc.id)?.valorUnitario || 0)
          }
          onApply={(val) => {
            if (activeCalc.field === 'v') {
              updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === activeCalc.id ? { ...i, valorUnitario: val } : i) });
            } else if (activeCalc.field === 'q') {
              updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === activeCalc.id ? { ...i, quantidade: val } : i) });
            } else if (activeCalc.field === 'tv') {
              updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === activeCalc.id ? { ...i, valorUnitario: val } : i) });
            }
            setActiveCalc(null);
          }}
          onClose={() => setActiveCalc(null)}
        />
      )}

      {activeConsumptionCalc && (
        <ConsumptionCalculator
          initialValue={currentProduct.insumos.find(i => i.id === activeConsumptionCalc)?.quantidade || 0}
          onApply={(val) => {
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i => i.id === activeConsumptionCalc ? { ...i, quantidade: val } : i)
            });
            setActiveConsumptionCalc(null);
          }}
          onClose={() => setActiveConsumptionCalc(null)}
        />
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-start">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowLibrary(false)} />
          <div className="relative w-80 h-full bg-white dark:bg-slate-950 p-8 shadow-2xl animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase flex items-center gap-3"><Database className="text-blue-600 w-5 h-5" /> BIBLIOTECA</h2>
              <button onClick={() => setShowLibrary(false)} title="Fechar Biblioteca" aria-label="Fechar Biblioteca" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <button onClick={() => { const p = DEFAULT_PRODUCT(Math.random().toString(36)); setDb(prev => ({ ...prev, products: [...prev.products, p], lastSelectedProductId: p.id })); setShowLibrary(false); }} className="w-full py-4 mb-8 bg-blue-600 text-white rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Plus className="w-4 h-4" /> NOVO PRODUTO</button>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {db.products.map(p => (
                <div key={p.id} className="group flex gap-2 animate-in fade-in duration-500">
                  <div onClick={() => { setDb(prev => ({ ...prev, lastSelectedProductId: p.id })); setShowLibrary(false); }} className={`flex-1 p-5 rounded-2xl cursor-pointer transition-all border-2 ${p.id === db.lastSelectedProductId ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                    <p className="font-black text-xs truncate uppercase tracking-tight">{p.name || 'Sem Nome'}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(p.lastModified).toLocaleDateString()}</p>
                  </div>
                  {db.products.length > 1 && <button onClick={() => { const id = p.id; setDb(prev => { const next = prev.products.filter(item => item.id !== id); return { ...prev, products: next, lastSelectedProductId: next[0].id }; }); }} title="Excluir Produto" aria-label="Excluir Produto" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Backup e Segurança</h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="contents">
                    <button onClick={handleExportBackup} title="Baixar Backup (JSON)" className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group">
                      <Download className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-blue-600">Baixar</span>
                    </button>
                    <button onClick={handleCopyBackup} title="Copiar Backup (Texto)" className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group">
                      <Copy className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-emerald-600">Copiar Cód.</span>
                    </button>
                  </div>
                  <button onClick={() => {
                    const code = prompt('Cole aqui o código do backup:');
                    if (code) {
                      try {
                        const importedDb = JSON.parse(code);
                        if (importedDb.products && Array.isArray(importedDb.products)) {
                          if (confirm('Atenção: Isso substituirá todos os seus projetos atuais. Deseja continuar?')) {
                            setDb(importedDb);
                            setShowLibrary(false);
                            alert('Backup restaurado com sucesso!');
                          }
                        } else {
                          alert('Código de backup inválido.');
                        }
                      } catch (err) { alert('Erro ao ler o código de backup. O texto copiado não é um formato de backup válido.'); }
                    }
                  }} title="Colar Backup" className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group">
                    <ClipboardPaste className="w-4 h-4 text-emerald-500" />
                    <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-emerald-600">Colar Cód.</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} title="Importar Arquivo Backup" className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-emerald-600">Arquivo</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" title="Selecionar arquivo de backup" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; expanded: boolean; onToggle: () => void; }> = ({ title, icon, children, expanded, onToggle }) => (
  <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 overflow-hidden print:border-none print:shadow-none print:bg-transparent">
    <button onClick={onToggle} className={`w-full md:px-8 px-4 md:py-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${expanded ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''} print:hidden`}>
      <div className="flex items-center gap-5"><div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-sm shadow-sm">{icon}</div><span className="font-black text-[13px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">{title}</span></div>
      <ChevronDown className={`w-6 h-6 text-slate-300 transition-all duration-300 ${expanded ? 'rotate-180 text-blue-600' : ''}`} />
    </button>
    <div className={`hidden print:flex items-center gap-3 mb-4 mt-6 border-b-2 border-slate-800 pb-2`}>
      {icon}
      <h3 className="font-black text-lg uppercase tracking-wider text-slate-900">{title}</h3>
    </div>
    <div className={`transition-all duration-500 ease-in-out ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-visible print:max-h-max print:opacity-100 print:block`}>
      <div className="md:px-8 px-4 md:pb-10 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800/50 print:p-0 print:border-none">{children}</div>
    </div>
  </div>
);

export default App;


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
  Mail,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { ProductData, AppDatabase, LibraryData, MaterialPriceRecord, Sola, Supplier } from './types';
import { calculateSummary, formatCurrency, calculateSolaAverageCost } from './utils/calculations';
import { downloadPDF, sharePDF, shareFile, copyBackupToClipboard, shareTextReport, exportToXLS } from './utils/export';
import LibraryView from './LibraryView';
import AutocompleteInput from './AutocompleteInput';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { firebaseService } from './firebaseService';
import AuthScreen from './AuthScreen';


const DB_KEY = 'preco_pro_db_v1';

const DEFAULT_UNITS = ['Kg', 'Un', 'Par', 'M', 'M²', 'ML', 'Rolo', 'Lata'];

// Dados do Backup fornecidos pelo usuário
const BACKUP_PRODUCT_320_BOSS: ProductData = {
  "id": "default",
  "name": "(100 modelo base)",
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
  "markup": { "impostos": 0, "comissao": 0, "frete": 0, "freteFixo": 0, "perdas": 0.5, "margemLucro": 25, "selectedImpostos": [], "selectedComissoes": [], "selectedFretes": [] },
  "precoVendaManual": 36
};

const DEFAULT_PRODUCT = (id: string = 'new'): ProductData => ({
  id,
  name: 'Novo Produto',
  lastModified: Date.now(),
  type: 'detailed',
  purchasePrice: 0,
  insumos: [{ id: '1', nome: 'Material Exemplo', quantidade: 1, unidade: 'un', valorUnitario: 0 }],
  terceirizados: [],
  custosFixos: [{ id: 'f1', nome: 'Aluguel/Luz', valor: 0 }],
  custosIndiretos: [{ id: 'i1', nome: 'Manutenção', valor: 0 }],
  production: { diasTrabalhados: 22, producaoDiaria: 0 },
  markup: { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 30, selectedImpostos: [], selectedComissoes: [], selectedFretes: [] },
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

const INITIAL_LIBRARY: LibraryData = {
  insumos: BACKUP_PRODUCT_320_BOSS.insumos.map(i => ({ ...i, id: Math.random().toString(36), valorUnitario: 0 })),
  terceirizados: BACKUP_PRODUCT_320_BOSS.terceirizados.map(i => ({ ...i, id: Math.random().toString(36), valorUnitario: 0 })),
  custosFixos: BACKUP_PRODUCT_320_BOSS.custosFixos.map(i => ({ ...i, id: Math.random().toString(36), valor: 0 })),
  custosIndiretos: BACKUP_PRODUCT_320_BOSS.custosIndiretos.map(i => ({ ...i, id: Math.random().toString(36), valor: 0 })),
  impostos: [],
  comissoes: [],
  fretes: [],
  solados: []
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Load cloud data upon login
  useEffect(() => {
    if (user && isInitialLoad) {
      const loadCloudData = async () => {
        try {
          const cloudData = await firebaseService.loadFullDatabase(user.uid);
          if (cloudData) {
            setDb(cloudData);
          } else {
            // If cloud is empty but we have local data, migrate
            const localData = localStorage.getItem(DB_KEY);
            if (localData) {
              const parsed = JSON.parse(localData);
              await firebaseService.syncLocalToFirebase(user.uid, parsed);
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
  }, [user, isInitialLoad]);

  const [db, setDb] = useState<AppDatabase>(() => {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.products?.length > 0) {
          // Robust initialization for old data
          const migratedLibrary = {
            ...INITIAL_LIBRARY,
            ...(parsed.library || {}),
            impostos: parsed.library?.impostos || [],
            comissoes: parsed.library?.comissoes || [],
            fretes: parsed.library?.fretes || [],
            solados: parsed.library?.solados || [],
            // Mapear campos antigos para novos se necessário
            terceirizados: parsed.library?.terceirizados || parsed.library?.terceirizados || [],
            custosIndiretos: parsed.library?.custosIndiretos || parsed.library?.custosIndiretos || [],
          };

          const migratedProducts = parsed.products.map((p: ProductData) => ({
            ...p,
            type: p.type || 'detailed',
            purchasePrice: p.purchasePrice || 0,
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
            ...parsed,
            products: migratedProducts,
            library: migratedLibrary,
            materialPrices: parsed.materialPrices || [],
            suppliers: parsed.suppliers || [],
            settings: parsed.settings ? {
              ...parsed.settings,
              unidadesMedida: parsed.settings.unidadesMedida || DEFAULT_UNITS
            } : {
              productionDays: 22,
              dailyProduction: 0,
              currency: 'BRL',
              theme: 'light',
              unidadesMedida: DEFAULT_UNITS
            }
          };
        }
      } catch (e) { console.error(e); }
    }
    return {
      products: [BACKUP_PRODUCT_320_BOSS],
      lastSelectedProductId: BACKUP_PRODUCT_320_BOSS.id,
      library: INITIAL_LIBRARY,
      materialPrices: [],
      suppliers: [],
      settings: {
        productionDays: 22,
        dailyProduction: 0,
        currency: 'BRL',
        theme: theme,
        unidadesMedida: DEFAULT_UNITS
      }
    };
  });

  const [activeLibraryTarget, setActiveLibraryTarget] = useState<{ id: string, type: string } | null>(null);
  const [copiedSection, setCopiedSection] = useState<{ type: string, data: any[] } | null>(null);
  const [copiedItem, setCopiedItem] = useState<{ type: string, data: any } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingValue, setEditingValue] = useState<{ id: string, field: string, val: string } | null>(null);
  const [activeCalc, setActiveCalc] = useState<{ id: string, field: string } | null>(null);
  const [activeConsumptionCalc, setActiveConsumptionCalc] = useState<string | null>(null);
  const [commentingItem, setCommentingItem] = useState<{ id: string, type: string, comment: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('theme') === 'dark' ? 'dark' : 'light');
  const [showProjectList, setShowProjectList] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showMaterialPrices, setShowMaterialPrices] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentProduct = useMemo(() => {
    const found = db.products.find(p => p.id === db.lastSelectedProductId);
    return found || db.products[0] || BACKUP_PRODUCT_320_BOSS;
  }, [db]);

  const persistData = useCallback(async () => {
    setSaveStatus('saving');
    setSyncStatus('syncing');
    
    // Local backup
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(DB_KEY + '_lastId', db.lastSelectedProductId);

    // Sync to Cloud if authenticated
    if (user) {
      try {
        await firebaseService.syncLocalToFirebase(user.uid, db);
        setSyncStatus('synced');
      } catch (error) {
        console.error("Cloud sync fail:", error);
        setSyncStatus('error');
      }
    }

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 200);
  }, [db, user]);

  useEffect(() => {
    const debounceTimer = setTimeout(persistData, 2000); // 2s debounce for cloud sync
    return () => clearTimeout(debounceTimer);
  }, [db, persistData]);

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

  const handleAddItemToLibrary = useCallback((type: keyof LibraryData, item: any) => {
    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: [...prev.library[type], { ...item, id: Math.random().toString(36) }]
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
    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: prev.library[type].map(item => item.id === id ? { ...updatedItem, id } : item)
      }
    }));
  }, []);

  const handleSaveToLibrary = useCallback((type: keyof LibraryData, name: string) => {
    const existing = db.library[type].find(item => item.nome.toLowerCase() === name.toLowerCase());
    if (existing) {
      alert('Este item já existe no banco de dados.');
      return;
    }

    const newItem = {
      id: Math.random().toString(36),
      nome: name,
      unidade: type === 'insumos' ? 'un' : 'par',
      valorUnitario: 0,
      valor: 0
    };

    setDb(prev => ({
      ...prev,
      library: {
        ...prev.library,
        [type]: [...prev.library[type], newItem]
      }
    }));
    alert(`"${name}" salvo com sucesso no banco de dados!`);
  }, [db.library]);

  const handleSelectItem = useCallback((type: string, item: any) => {
    if (activeLibraryTarget && activeLibraryTarget.type === type) {
      // Preencher item existente
      const id = activeLibraryTarget.id;
      switch (type) {
        case 'insumos':
          updateCurrentProduct({
            insumos: currentProduct.insumos.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              unidade: item.unidade || i.unidade,
              valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario
            } : i)
          });
          break;
        case 'terceirizados':
          updateCurrentProduct({
            terceirizados: currentProduct.terceirizados.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              unidade: item.unidade || i.unidade,
              valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario
            } : i)
          });
          break;
        case 'custosFixos':
          updateCurrentProduct({
            custosFixos: currentProduct.custosFixos.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              valor: item.valor || i.valor
            } : i)
          });
          break;
        case 'custosIndiretos':
          updateCurrentProduct({
            custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === id ? {
              ...i,
              nome: item.nome,
              valor: item.valor || i.valor
            } : i)
          });
          break;
      }
      setActiveLibraryTarget(null);
    } else {
      // Adicionar novo item (comportamento original)
      switch (type) {
        case 'insumos':
          updateCurrentProduct({
            insumos: [
              ...currentProduct.insumos,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                quantidade: Math.round((item.quantidade || 1) * 10000) / 10000,
                unidade: item.unidade || 'un',
                valorUnitario: item.valor_unitario || item.valorUnitario || 0
              }
            ]
          });
          break;
        case 'terceirizados':
          updateCurrentProduct({
            terceirizados: [
              ...currentProduct.terceirizados,
              {
                id: Math.random().toString(36),
                nome: item.nome,
                quantidade: 1,
                unidade: 'par',
                valorUnitario: item.valor_unitario || item.valorUnitario || 0
              }
            ]
          });
          break;
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
          const solaCost = calculateSolaAverageCost(item, db.library.insumos);
          updateCurrentProduct({
            insumos: [
              ...currentProduct.insumos,
              {
                id: Math.random().toString(36),
                nome: `Sola: ${item.nome}`,
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
  }, [currentProduct, updateCurrentProduct, activeLibraryTarget]);

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
      currentProduct.purchasePrice || 0
    ),
    [currentProduct]
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

  const handleNumericChange = (id: string, field: string, rawVal: string, updateFn: (numValue: number) => void) => {
    let normalizedVal = rawVal;
    
    // Limitar campo manual de preço de venda a 2 casas decimais
    if (field === 'manual') {
      if (normalizedVal.includes(',')) {
        const parts = normalizedVal.split(',');
        if (parts[1].length > 2) normalizedVal = parts[0] + ',' + parts[1].substring(0, 2);
      } else if (normalizedVal.includes('.')) {
        const parts = normalizedVal.split('.');
        if (parts[1].length > 2) normalizedVal = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }

    const normalized = normalizedVal.replace(',', '.');
    let parsed = parseFloat(normalized);

    // Limitar a 4 casas decimais para campos de quantidade
    if (['q', 'tq', 'u', 'd'].includes(field) && !isNaN(parsed)) {
      parsed = Math.round(parsed * 10000) / 10000;
    }

    setEditingValue({ id, field, val: normalizedVal });
    updateFn(isNaN(parsed) ? 0 : parsed);
  };

  const getDisplayValue = (val: number, id: string, field: string): string => {
    if (editingValue?.id === id && editingValue?.field === field) return editingValue.val;
    if (val === 0) return '';

    // Para campos de quantidade, garantir no máximo 4 casas decimais na exibição
    if (['q', 'tq', 'u', 'd'].includes(field)) {
      return (Math.round(val * 10000) / 10000).toString().replace('.', ',');
    }

    return val.toString().replace('.', ',');
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
    <div className="min-h-screen pt-[0.4cm] pb-10 bg-slate-200 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans overflow-x-hidden md:px-0 px-[0.4cm]">

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[0.4cm] z-50 px-3 sm:px-6 h-14 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 pr-2">
          <button onClick={() => setShowProjectList(true)} title="Abrir Lista de Projetos" aria-label="Projetos" className="p-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <FolderOpen className="w-5 h-5 text-amber-500" />
          </button>
          <button onClick={() => setShowDatabase(true)} title="Abrir Biblioteca de Itens" aria-label="Biblioteca" className="p-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            <Database className="w-5 h-5 text-emerald-600" />
          </button>
          <button 
            onClick={() => setShowMaterialPrices(true)} 
            title="Comparação de Preços" 
            aria-label="Preços" 
            className="p-1.5 shrink-0 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </button>
          <div className="flex flex-col flex-1 min-w-0">
            <input value={currentProduct.name} title="Nome do Produto" aria-label="Nome do Produto" onChange={(e) => updateCurrentProduct({ name: e.target.value })} className="bg-transparent border-none font-black text-sm sm:text-base focus:ring-0 w-full min-w-0 truncate leading-tight p-0 text-slate-800 dark:text-white" placeholder="Nome do Produto" />
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                  syncStatus === 'synced' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
                  syncStatus === 'syncing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 
                  'bg-red-100 dark:bg-red-900/30 text-red-600'
                }`}>
                  {syncStatus === 'synced' ? <><Cloud className="w-2.5 h-2.5" /> Nuvem</> : 
                   syncStatus === 'syncing' ? <><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Sinc</> : 
                   <><AlertCircle className="w-2.5 h-2.5" /> Erro</>}
                </div>
                <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tight truncate">
                  {saveStatus === 'saving' ? 'Gravando...' : 'Seguro'}
                </span>
              </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Conta ativa</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[120px] truncate">{user.email}</span>
          </div>
          
          <button 
            onClick={() => signOut(auth)}
            className="p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-all active:scale-95 border border-transparent hover:border-red-100"
            title="Sair (Logout)"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>

          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-1 sm:p-2 text-slate-500 hover:text-blue-500 transition-colors">{theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}</button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => shareTextReport(
                summary, 
                currentProduct.name, 
                currentProduct.type, 
                currentProduct.markup?.selectedImpostos || [], 
                db.library.impostos || [],
                currentProduct.markup?.selectedComissoes || [],
                db.library.comissoes || [],
                currentProduct.markup?.selectedFretes || [],
                db.library.fretes || []
              )}
              title="Compartilhar Resumo (Texto)"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-blue-600 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="hidden sm:inline text-[10px] font-black uppercase">Resumo</span>
              <Share className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadPDF(
                currentProduct.insumos || [], 
                summary, 
                currentProduct.name, 
                currentProduct.terceirizados || [], 
                currentProduct.type, 
                currentProduct.markup?.selectedImpostos || [], 
                db.library.impostos || [],
                currentProduct.markup?.selectedComissoes || [],
                db.library.comissoes || [],
                currentProduct.markup?.selectedFretes || [],
                db.library.fretes || []
              )}
              title="Baixar PDF"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-blue-600 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => sharePDF(
                currentProduct.insumos || [], 
                summary, 
                currentProduct.name, 
                currentProduct.terceirizados || [], 
                currentProduct.type, 
                currentProduct.markup?.selectedImpostos || [], 
                db.library.impostos || [],
                currentProduct.markup?.selectedComissoes || [],
                db.library.comissoes || [],
                currentProduct.markup?.selectedFretes || [],
                db.library.fretes || []
              )}
              title="Exportar/Compartilhar PDF"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-emerald-600 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => exportToXLS(
                currentProduct.insumos || [], 
                summary, 
                currentProduct.name, 
                currentProduct.terceirizados || [],
                currentProduct.type, 
                currentProduct.markup?.selectedImpostos || [], 
                db.library.impostos || [],
                currentProduct.markup?.selectedComissoes || [],
                db.library.comissoes || [],
                currentProduct.markup?.selectedFretes || [],
                db.library.fretes || []
              )}
              title="Baixar Excel (XLSX)"
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-emerald-700 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
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

          <Section title="1. Materiais e Peças" icon={<Package className="text-emerald-500 w-5 h-5" />} expanded={expandedSection === 'insumos'} onToggle={() => toggleSection('insumos')}>
            
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
                Modelo Pronto
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
              <button onClick={() => setCopiedSection({ type: 'insumos', data: currentProduct.insumos })} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-500 rounded-md transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copiar Lista
              </button>
              {copiedSection?.type === 'insumos' && (
                <button onClick={() => {
                  if (confirm('Deseja substituir a lista atual pela lista copiada?')) {
                    const newItems = copiedSection.data.map(i => ({...i, id: Math.random().toString(36)}));
                    updateCurrentProduct({ insumos: newItems });
                  }
                }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 rounded-md transition-colors">
                  <ClipboardPaste className="w-3.5 h-3.5" /> Colar Lista
                </button>
              )}
              {copiedItem?.type === 'insumos' && (
                <button onClick={() => {
                  const newItem = { ...copiedItem.data, id: Math.random().toString(36) };
                  updateCurrentProduct({ insumos: [...currentProduct.insumos, newItem] });
                }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800">
                  <ClipboardPaste className="w-3.5 h-3.5" /> Colar Material Copiado
                </button>
              )}
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 mb-4 max-h-[850px] overflow-y-auto custom-scrollbar pr-2">
              {currentProduct.insumos.map((insumo) => (
                <div key={insumo.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm relative group">
                  <div className="mb-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Descrição</label>
                    <div className="relative group">
                      <AutocompleteInput
                        value={insumo.nome}
                        suggestions={db.library.insumos}
                        placeholder="Ex: Couro, Cola, Solado..."
                        className={`${inputBase} w-full pr-16`}
                        onChange={(val) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, nome: val } : i) })}
                        onSelect={(item) => updateCurrentProduct({
                          insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                            ...i,
                            nome: item.nome,
                            unidade: item.unidade || i.unidade,
                            valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || i.valor || 0
                          } : i)
                        })}
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 z-10">
                        <button
                          onClick={() => setCommentingItem({ id: insumo.id, type: 'insumos', comment: insumo.comentario || '' })}
                          title={insumo.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                          className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${insumo.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {insumo.nome.trim().length > 2 && !db.library.insumos.find(s => s.nome.toLowerCase() === insumo.nome.toLowerCase()) ? (
                          <button
                            onClick={() => handleSaveToLibrary('insumos', insumo.nome)}
                            title="Salvar no Cadastro"
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md text-amber-500 transition-all relative"
                          >
                            <Database className="w-4 h-4" />
                            <Plus className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActiveLibraryTarget({ id: insumo.id, type: 'insumos' }); setShowDatabase(true); }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setActiveConsumptionCalc(insumo.id)}
                          title="Calculador de Consumo"
                          className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-md text-emerald-500 transition-all"
                        >
                          <Ruler className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
                    <div className="flex gap-2">
                      <button onClick={() => setCopiedItem({ type: 'insumos', data: insumo })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 transition-colors print:hidden">
                        <Copy className="w-4 h-4" /> Copiar
                      </button>
                      <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 transition-colors print:hidden">
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
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
                    <div key={insumo.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl items-center hover:border-blue-400 transition-all shadow-sm group">
                      <div className="relative group">
                        <AutocompleteInput
                          value={insumo.nome}
                          suggestions={db.library.insumos}
                          placeholder="Ex: Couro..."
                          className={`${inputBase} !bg-transparent truncate pr-16`}
                          onChange={(val) => updateCurrentProduct({ insumos: currentProduct.insumos.map(i => i.id === insumo.id ? { ...i, nome: val } : i) })}
                          onSelect={(item) => updateCurrentProduct({
                            insumos: currentProduct.insumos.map(i => i.id === insumo.id ? {
                              ...i,
                              nome: item.nome,
                              unidade: item.unidade || i.unidade,
                              valorUnitario: item.valor_unitario || item.valorUnitario || i.valorUnitario || i.valor || 0
                            } : i)
                          })}
                        />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                          <button
                            onClick={() => setCommentingItem({ id: insumo.id, type: 'insumos', comment: insumo.comentario || '' })}
                            title={insumo.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                            className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all ${insumo.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {insumo.nome.trim().length > 2 && !db.library.insumos.find(s => s.nome.toLowerCase() === insumo.nome.toLowerCase()) ? (
                            <button
                              onClick={() => handleSaveToLibrary('insumos', insumo.nome)}
                              title="Salvar no Cadastro"
                              className="p-1 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded text-amber-500 transition-all relative"
                            >
                              <Database className="w-3.5 h-3.5" />
                              <Plus className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                            </button>
                          ) : (
                            <button
                              onClick={() => { setActiveLibraryTarget({ id: insumo.id, type: 'insumos' }); setShowDatabase(true); }}
                              title="Buscar na Biblioteca"
                              className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded text-blue-500"
                            >
                              <Database className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setActiveConsumptionCalc(insumo.id)}
                            title="Calculador de Consumo"
                            className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded text-emerald-500"
                          >
                            <Ruler className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
                      <div className="flex justify-center gap-2 items-center print:hidden">
                        <button onClick={() => setCopiedItem({ type: 'insumos', data: insumo })} title="Copiar Material" className="text-slate-300 hover:text-blue-500"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => updateCurrentProduct({ insumos: currentProduct.insumos.filter(i => i.id !== insumo.id) })} title="Excluir Material" aria-label="Excluir Material" className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => updateCurrentProduct({ insumos: [...currentProduct.insumos, { id: Math.random().toString(36), nome: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }] })} className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-blue-600 text-[11px] font-black uppercase flex items-center justify-center gap-2 print:hidden"><Plus className="w-4 h-4" /> NOVO MATERIAL</button>

            {/* Subtotal da Seção 1 */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total de Materiais</h4>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium italic">Soma total de todos os insumos aplicados por par.</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrency(currentProduct.insumos.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0))}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Total Acumulado (Item 1)</span>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
          </Section>

          <Section title="2. Mão de Obra e Serviços" icon={<Users className="text-orange-500 w-5 h-5" />} expanded={expandedSection === 'terceirizados'} onToggle={() => toggleSection('terceirizados')}>

            {/* Toolbar Copiar/Colar */}
            <div className="flex justify-end gap-2 mb-4 print:hidden">
              <button onClick={() => setCopiedSection({ type: 'terceirizados', data: currentProduct.terceirizados })} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-500 rounded-md transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copiar Lista
              </button>
              {copiedSection?.type === 'terceirizados' && (
                <button onClick={() => {
                  if (confirm('Deseja substituir a lista atual pela lista copiada?')) {
                    const newItems = copiedSection.data.map(i => ({...i, id: Math.random().toString(36)}));
                    updateCurrentProduct({ terceirizados: newItems });
                  }
                }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 rounded-md transition-colors">
                  <ClipboardPaste className="w-3.5 h-3.5" /> Colar Lista
                </button>
              )}
              {copiedItem?.type === 'terceirizados' && (
                <button onClick={() => {
                  const newItem = { ...copiedItem.data, id: Math.random().toString(36) };
                  updateCurrentProduct({ terceirizados: [...currentProduct.terceirizados, newItem] });
                }} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800">
                  <ClipboardPaste className="w-3.5 h-3.5" /> Colar Serviço Copiado
                </button>
              )}
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden space-y-4 mb-4 max-h-[850px] overflow-y-auto custom-scrollbar pr-2">
              {currentProduct.terceirizados.map((t) => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative group">
                  <div className="mb-4">
                    <div className="relative group">
                      <AutocompleteInput
                        value={t.nome}
                        suggestions={db.library.terceirizados}
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
                            onClick={() => handleSaveToLibrary('terceirizados', t.nome)}
                            title="Salvar no Cadastro"
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/40 rounded-md text-amber-500 transition-all relative"
                          >
                            <Database className="w-4 h-4" />
                            <Plus className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 text-white rounded-full border border-white dark:border-slate-900" />
                          </button>
                        ) : (
                          <button
                            onClick={() => { setActiveLibraryTarget({ id: t.id, type: 'terceirizados' }); setShowDatabase(true); }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
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
                    <div className="flex gap-2">
                      <button onClick={() => setCopiedItem({ type: 'terceirizados', data: t })} className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 transition-colors print:hidden">
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

            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar -mx-2 px-2">
              <div className="min-w-[780px] pb-4 space-y-2">
                <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 px-3 py-2.5 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <div className="pl-1">Serviço</div><div className="text-center">Unidade</div><div className="text-center">Quantidade</div><div className="text-center">V. Unitário</div><div className="text-right">V. Total</div><div className="text-center">Ações</div>
                </div>
                {currentProduct.terceirizados.map((t) => (
                  <div key={t.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1.2fr_0.5fr] gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl items-center shadow-sm hover:border-orange-400 transition-all">
                    <div className="relative group">
                      <AutocompleteInput
                        value={t.nome}
                        suggestions={db.library.terceirizados}
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
                            onClick={() => handleSaveToLibrary('terceirizados', t.nome)}
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
                    <input value={t.unidade} title="Unidade" onChange={(e) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, unidade: e.target.value } : i) })} className={`${inputBase} text-center uppercase text-[10px]`} />
                    <input type="text" value={getDisplayValue(t.quantidade, t.id, 'tq')} title="Quantidade" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tq', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, quantidade: v } : i) }))} className={`${inputBase} text-center font-mono`} />
                    <div className="relative">
                      <input type="text" value={getDisplayValue(t.valorUnitario, t.id, 'tv')} onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange(t.id, 'tv', e.target.value, (v) => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.map(i => i.id === t.id ? { ...i, valorUnitario: v } : i) }))} className={`${inputBase} text-right font-mono pr-10`} />
                      <button onClick={() => setActiveCalc({ id: t.id, field: 'tv' })} title="Abrir Calculadora para Valor Unitário" aria-label="Calculadora" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-blue-500"><Calculator className="w-4 h-4" /></button>
                    </div>
                    <div className="text-right text-[12px] font-black text-orange-600 font-mono">{formatCurrency(t.quantidade * t.valorUnitario)}</div>
                    <div className="flex justify-center gap-2 items-center print:hidden">
                      <button onClick={() => setCopiedItem({ type: 'terceirizados', data: t })} title="Copiar Serviço" className="text-slate-300 hover:text-blue-500"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => updateCurrentProduct({ terceirizados: currentProduct.terceirizados.filter(i => i.id !== t.id) })} title="Excluir Serviço" aria-label="Excluir Serviço" className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
                      {formatCurrency(currentProduct.terceirizados.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0))}
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
                    <button onClick={() => setCopiedSection({ type: 'custosFixos', data: currentProduct.custosFixos })} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-500 rounded-md transition-colors">
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                    {copiedSection?.type === 'custosFixos' && (
                      <button onClick={() => {
                        if (confirm('Deseja substituir a lista atual pela lista copiada?')) {
                          const newItems = copiedSection.data.map(i => ({...i, id: Math.random().toString(36)}));
                          updateCurrentProduct({ custosFixos: newItems });
                        }
                      }} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 rounded-md transition-colors">
                        <ClipboardPaste className="w-3 h-3" /> Colar
                      </button>
                    )}
                    {copiedItem?.type === 'custosFixos' && (
                      <button onClick={() => {
                        const newItem = { ...copiedItem.data, id: Math.random().toString(36) };
                        updateCurrentProduct({ custosFixos: [...currentProduct.custosFixos, newItem] });
                      }} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800">
                        <ClipboardPaste className="w-3 h-3" /> Colar Custo
                      </button>
                    )}
                  </div>
                </div>
                {currentProduct.custosFixos.map(cf => (
                  <div key={cf.id} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1 relative group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Fixo</label>
                        <input
                          value={cf.nome}
                          title="Nome do Custo Fixo"
                          onChange={(e) => updateCurrentProduct({ custosFixos: currentProduct.custosFixos.map(i => i.id === cf.id ? { ...i, nome: e.target.value } : i) })}
                          className={`${inputBase} !bg-transparent !py-2 pr-10`}
                        />
                        <div className="absolute right-1 top-[22px] flex gap-1">
                          <button
                            onClick={() => setCommentingItem({ id: cf.id, type: 'custosFixos', comment: cf.comentario || '' })}
                            title={cf.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${cf.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActiveLibraryTarget({ id: cf.id, type: 'custosFixos' }); setShowDatabase(true); }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end gap-1">
                        <button
                          onClick={() => setCopiedItem({ type: 'custosFixos', data: cf })}
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
                <button onClick={() => updateCurrentProduct({ custosFixos: [...currentProduct.custosFixos, { id: Math.random().toString(36), nome: '', valor: 0 }] })} className="w-full py-2.5 text-[9px] font-black text-blue-500 uppercase border border-dashed border-blue-200 rounded-xl hover:bg-blue-50/50 transition-all">+ Novo Fixo</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Variáveis Mensais</h4>
                  <div className="flex gap-2 print:hidden">
                    <button onClick={() => setCopiedSection({ type: 'custosIndiretos', data: currentProduct.custosIndiretos })} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-500 rounded-md transition-colors">
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                    {copiedSection?.type === 'custosIndiretos' && (
                      <button onClick={() => {
                        if (confirm('Deseja substituir a lista atual pela lista copiada?')) {
                          const newItems = copiedSection.data.map(i => ({...i, id: Math.random().toString(36)}));
                          updateCurrentProduct({ custosIndiretos: newItems });
                        }
                      }} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-500 rounded-md transition-colors">
                        <ClipboardPaste className="w-3 h-3" /> Colar
                      </button>
                    )}
                    {copiedItem?.type === 'custosIndiretos' && (
                      <button onClick={() => {
                        const newItem = { ...copiedItem.data, id: Math.random().toString(36) };
                        updateCurrentProduct({ custosIndiretos: [...currentProduct.custosIndiretos, newItem] });
                      }} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-200 dark:border-emerald-800">
                        <ClipboardPaste className="w-3 h-3" /> Colar Custo
                      </button>
                    )}
                  </div>
                </div>
                {currentProduct.custosIndiretos.map(ci => (
                  <div key={ci.id} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-3 mb-3">
                      <div className="flex-1 relative group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Descrição do Custo Variável</label>
                        <input
                          value={ci.nome}
                          title="Nome do Custo Variável"
                          onChange={(e) => updateCurrentProduct({ custosIndiretos: currentProduct.custosIndiretos.map(i => i.id === ci.id ? { ...i, nome: e.target.value } : i) })}
                          className={`${inputBase} !bg-transparent !py-2 pr-10`}
                        />
                        <div className="absolute right-1 top-[22px] flex gap-1">
                          <button
                            onClick={() => setCommentingItem({ id: ci.id, type: 'custosIndiretos', comment: ci.comentario || '' })}
                            title={ci.comentario ? "Ver Comentário" : "Adicionar Comentário"}
                            className={`p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-all ${ci.comentario ? 'text-blue-500' : 'text-slate-300'}`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setActiveLibraryTarget({ id: ci.id, type: 'custosIndiretos' }); setShowDatabase(true); }}
                            title="Buscar na Biblioteca"
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-md text-blue-500 transition-all"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end gap-1">
                        <button
                          onClick={() => setCopiedItem({ type: 'custosIndiretos', data: ci })}
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
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Imp %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.impostos || 0, 'm', 'i')} title="Impostos %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'i', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), impostos: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Com %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.comissao || 0, 'm', 'c')} title="Comissão %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'c', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), comissao: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Frete R$</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.freteFixo || 0, 'm', 'ff')} title="Frete Fixo R$" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'ff', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, freteFixo: 0, perdas: 0, margemLucro: 0 }), freteFixo: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-blue-500 uppercase block mb-1">Meta %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.margemLucro || 0, 'm', 'l')} title="Margem de Lucro %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'l', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), margemLucro: v } }))} className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl py-2.5 text-[14px] font-black text-center text-blue-700 dark:text-blue-400 font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="text-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Perda %</label>
                  <input type="text" value={getDisplayValue(currentProduct.markup?.perdas || 0, 'm', 'p')} title="Perdas %" onBlur={() => setEditingValue(null)} onChange={(e) => handleNumericChange('m', 'p', e.target.value, (v) => updateCurrentProduct({ markup: { ...(currentProduct.markup || { impostos: 0, comissao: 0, frete: 0, perdas: 0, margemLucro: 0 }), perdas: v } }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 text-[14px] font-black text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
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

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
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
          <div className="bg-white dark:bg-slate-900 rounded-md p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
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
              <div className="flex justify-between text-xs font-medium text-red-400"><span>Perdas de Produção</span><span className="font-mono">+{formatCurrency(summary.valorPerdaUnitario)}</span></div>
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
          onApply={(val) => {
            const roundedVal = Math.round(val * 10000) / 10000;
            updateCurrentProduct({
              insumos: currentProduct.insumos.map(i => i.id === activeConsumptionCalc ? { ...i, quantidade: roundedVal } : i)
            });
            setActiveConsumptionCalc(null);
          }}
          onClose={() => setActiveConsumptionCalc(null)}
        />
      )}

      {showDatabase && (
        <LibraryView
          library={db.library}
          units={db.settings.unidadesMedida || DEFAULT_UNITS}
          existingItemsNames={[
            ...currentProduct.insumos.map(i => i.nome),
            ...currentProduct.terceirizados.map(i => i.nome),
            ...currentProduct.custosFixos.map(i => i.nome),
            ...currentProduct.custosIndiretos.map(i => i.nome)
          ]}
          onClose={() => setShowDatabase(false)}
          onSelectItem={handleSelectItem}
          onAddItem={handleAddItemToLibrary}
          onDeleteItem={handleDeleteItemFromLibrary}
          onUpdateItem={handleUpdateItemInLibrary}
          onUpdateUnits={(newUnits) => setDb(prev => ({ ...prev, settings: { ...prev.settings, unidadesMedida: newUnits } }))}
        />
      )}

      {showProjectList && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-start">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowProjectList(false)} />
          <div className="relative w-80 h-full bg-white dark:bg-slate-950 p-8 shadow-2xl animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase flex items-center gap-3"><FolderOpen className="text-amber-500 w-5 h-5" /> PROJETOS</h2>
              <button onClick={() => setShowProjectList(false)} title="Fechar" aria-label="Fechar" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <button onClick={() => { const p = DEFAULT_PRODUCT(Math.random().toString(36)); setDb(prev => ({ ...prev, products: [...prev.products, p], lastSelectedProductId: p.id })); setShowProjectList(false); }} className="w-full py-4 mb-3 bg-blue-600 text-white rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl active:scale-95 transition-all"><Plus className="w-4 h-4" /> NOVO PRODUTO</button>
            <button onClick={() => { setShowMaterialPrices(true); setShowProjectList(false); }} className="w-full py-4 mb-8 bg-slate-800 text-white rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-700 shadow-xl active:scale-95 transition-all"><TrendingUp className="w-4 h-4" /> COMPARAÇÃO DE PREÇOS</button>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {db.products.map(p => (
                <div key={p.id} className="group flex gap-2 animate-in fade-in duration-500">
                  <div 
                    onClick={() => { 
                      if (editingProjectId !== p.id) {
                        setDb(prev => ({ ...prev, lastSelectedProductId: p.id })); 
                        setShowProjectList(false); 
                      }
                    }} 
                    className={`flex-1 p-5 rounded-2xl cursor-pointer transition-all border-2 ${p.id === db.lastSelectedProductId ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                  >
                    {editingProjectId === p.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editingName}
                          title="Nome do Projeto"
                          aria-label="Editar Nome do Projeto"
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setDb(prev => ({
                                ...prev,
                                products: prev.products.map(prod => prod.id === p.id ? { ...prod, name: editingName, lastModified: Date.now() } : prod)
                              }));
                              setEditingProjectId(null);
                            } else if (e.key === 'Escape') {
                              setEditingProjectId(null);
                            }
                          }}
                          className="flex-1 bg-white dark:bg-slate-800 border border-blue-500 rounded px-2 py-1 text-xs font-black uppercase outline-none"
                        />
                        <button 
                          onClick={() => {
                            setDb(prev => ({
                              ...prev,
                              products: prev.products.map(prod => prod.id === p.id ? { ...prod, name: editingName, lastModified: Date.now() } : prod)
                            }));
                            setEditingProjectId(null);
                          }}
                          title="Salvar"
                          aria-label="Salvar Nome"
                          className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-black text-xs truncate uppercase tracking-tight">{p.name || 'Sem Nome'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(p.lastModified).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 justify-center">
                    <button onClick={() => { setEditingProjectId(p.id); setEditingName(p.name); }} title="Editar Nome" aria-label="Editar Nome" className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => {
                      const duplicatedProduct = JSON.parse(JSON.stringify(p));
                      duplicatedProduct.id = Math.random().toString(36);
                      duplicatedProduct.name = `${p.name} (Cópia)`;
                      duplicatedProduct.lastModified = Date.now();
                      setDb(prev => ({ ...prev, products: [...prev.products, duplicatedProduct], lastSelectedProductId: duplicatedProduct.id }));
                      setShowProjectList(false);
                    }} title="Duplicar Produto" aria-label="Duplicar Produto" className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Copy className="w-4 h-4" /></button>
                    {db.products.length > 1 && <button onClick={() => { const id = p.id; setDb(prev => { const next = prev.products.filter(item => item.id !== id); return { ...prev, products: next, lastSelectedProductId: next[0].id }; }); }} title="Excluir Produto" aria-label="Excluir Produto" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Backup e Segurança</h3>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={handleExportBackup} title="Exportar Arquivo (JSON)" className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group">
                  <Download className="w-4 h-4 text-blue-500 mb-1" />
                  <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-blue-600">Exportar</span>
                </button>
                <button onClick={handleShareBackup} title="Compartilhar Arquivo (JSON)" className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group">
                  <Share className="w-4 h-4 text-blue-500 mb-1" />
                  <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-blue-600">Partilhar</span>
                </button>
                <button onClick={handleCopyBackup} title="Copiar Código de Backup (Texto)" className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all group">
                  <ClipboardPaste className="w-4 h-4 text-blue-500 mb-1" />
                  <span className="text-[8px] font-black uppercase text-slate-500 group-hover:text-blue-600">Copiar</span>
                </button>
              </div>

              <div className="space-y-2">
                <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span className="text-[8px] font-black uppercase text-slate-500">Restaurar do Arquivo</span>
                </button>
              </div>
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
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; expanded: boolean; onToggle: () => void; }> = ({ title, icon, children, expanded, onToggle }) => (
  <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 overflow-hidden print:border-none print:shadow-none print:bg-transparent ${expanded ? 'bg-slate-200 dark:bg-slate-800 shadow-md border-slate-300 dark:border-slate-700' : 'bg-white dark:bg-slate-900'}`}>
    <button onClick={onToggle} className={`w-full md:px-8 px-4 md:py-6 py-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ${expanded ? 'bg-slate-300/40 dark:bg-slate-800/80' : ''} print:hidden`}>
      <div className="flex items-center gap-5">
        <div className={`p-3 rounded-xl shadow-sm transition-colors ${expanded ? 'bg-white dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {icon}
        </div>
        <span className="font-black text-[13px] uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <div className={`p-2 rounded-full transition-all duration-300 ${expanded ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
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
      <div className={`md:px-8 px-4 md:pb-10 pb-6 pt-4 border-t print:p-0 print:border-none ${expanded ? 'bg-slate-200/60 dark:bg-slate-900/40 border-slate-300 dark:border-slate-700' : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/50'}`}>{children}</div>
    </div>
  </div>
);

const MaterialPriceComparison: React.FC<{
  prices: MaterialPriceRecord[];
  suppliers: Supplier[];
  units: string[];
  onAddPrice: (price: Omit<MaterialPriceRecord, 'id' | 'data'>) => void;
  onUpdatePrice: (price: MaterialPriceRecord) => void;
  onDeletePrice: (id: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onUpdateUnits: (units: string[]) => void;
  onClose: () => void;
}> = ({ prices, suppliers, units, onAddPrice, onUpdatePrice, onDeletePrice, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onUpdateUnits, onClose }) => {
  const [activeTab, setActiveTab] = useState<'prices' | 'suppliers' | 'analysis'>('prices');
  const [filter, setFilter] = useState('');
  
  // States for Price CRUD
  const [editingPrice, setEditingPrice] = useState<MaterialPriceRecord | null>(null);
  const [newPrice, setNewPrice] = useState({ material: '', fornecedor: '', preco: '', unidade: 'Kg', largura: '' });
  
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

  // Filtered Data
  const filteredPrices = useMemo(() => {
    return (prices || []).filter(p => 
      (p.material || '').toLowerCase().includes(filter.toLowerCase()) ||
      (p.fornecedor || '').toLowerCase().includes(filter.toLowerCase())
    ).sort((a, b) => b.data - a.data);
  }, [prices, filter]);

  const filteredSuppliers = useMemo(() => {
    return (suppliers || []).filter(s => 
      (s.nome || '').toLowerCase().includes(filter.toLowerCase())
    );
  }, [suppliers, filter]);

  // Analysis State
  const [analysisMaterial, setAnalysisMaterial] = useState('');
  const uniqueMaterials = useMemo(() => {
    const set = new Set((prices || []).map(p => p.material));
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
        <div className="grid grid-cols-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {[
            { id: 'prices', label: 'Histórico', fullLabel: 'Histórico de Preços', icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { id: 'suppliers', label: 'Fornecedores', fullLabel: 'Fornecedores', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'analysis', label: 'Análise', fullLabel: 'Análise de Variação', icon: <Layout className="w-3.5 h-3.5" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilter(''); }}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest transition-all border-b-2 ${
                activeTab === tab.id 
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
          {activeTab === 'prices' && (
            <>
              {/* Form Preços */}
              <div className="p-4 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Material</label>
                    <input 
                      type="text" 
                      value={editingPrice ? editingPrice.material : newPrice.material} 
                      onChange={e => editingPrice ? setEditingPrice({...editingPrice, material: e.target.value}) : setNewPrice({...newPrice, material: e.target.value})}
                      placeholder="Ex: Couro Bovino"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Fornecedor</label>
                    <select
                      value={editingPrice ? editingPrice.fornecedor : newPrice.fornecedor}
                      onChange={e => editingPrice ? setEditingPrice({...editingPrice, fornecedor: e.target.value}) : setNewPrice({...newPrice, fornecedor: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      title="Selecionar fornecedor"
                    >
                      <option value="">Selecione...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.nome}>{s.nome}</option>
                      ))}
                      {!suppliers.find(s => s.nome === (editingPrice?.fornecedor || newPrice.fornecedor)) && (editingPrice?.fornecedor || newPrice.fornecedor) && (
                        <option value={editingPrice?.fornecedor || newPrice.fornecedor}>{editingPrice?.fornecedor || newPrice.fornecedor} (Não Cadastrado)</option>
                      )}
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Preço</label>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="number" 
                          value={editingPrice ? editingPrice.preco : newPrice.preco} 
                          onChange={e => editingPrice ? setEditingPrice({...editingPrice, preco: parseFloat(e.target.value)}) : setNewPrice({...newPrice, preco: e.target.value})}
                          placeholder="0,00"
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-0" 
                        />
                        <select
                          value={editingPrice ? editingPrice.unidade || units[0] : newPrice.unidade}
                          onChange={e => editingPrice ? setEditingPrice({...editingPrice, unidade: e.target.value}) : setNewPrice({...newPrice, unidade: e.target.value})}
                          className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          title="Unidade"
                        >
                          {units.map(u => (
                            <option key={u} value={u}>{u}</option>
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
                  <div className="lg:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Largura (m)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingPrice ? editingPrice.largura || '' : newPrice.largura} 
                        onChange={e => editingPrice ? setEditingPrice({...editingPrice, largura: parseFloat(e.target.value)}) : setNewPrice({...newPrice, largura: e.target.value})}
                        placeholder="Ex: 1.40"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                      <button 
                        onClick={() => setShowConverter(!showConverter)}
                        className={`p-2.5 rounded-xl transition-all ${showConverter ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title="Conversor M² ➜ ML"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 lg:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase block px-1">Ações</label>
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
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" /> Salvar
                          </button>
                          <button 
                            onClick={() => setEditingPrice(null)}
                            className="px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl hover:bg-slate-300 transition-all font-black text-[10px]"
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
                      <button onClick={() => setShowUnitManager(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {units.map(unit => (
                        <div key={unit} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-1 py-1 rounded-lg shadow-sm">
                          <span className="text-[10px] font-bold uppercase">{unit}</span>
                          <button 
                            onClick={() => onUpdateUnits(units.filter(u => u !== unit))}
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
                            if (!units.includes(newUnitName.trim())) {
                              onUpdateUnits([...units, newUnitName.trim()]);
                              setNewUnitName('');
                            }
                          }
                        }}
                        placeholder="Nova unidade (Ex: Pacote)"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => {
                          if (newUnitName.trim() && !units.includes(newUnitName.trim())) {
                            onUpdateUnits([...units, newUnitName.trim()]);
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

              {/* Lista Preços */}
              <div className="p-4 md:p-8 md:pb-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filtrar por material ou fornecedor..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-sm md:text-base font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
                <div className="hidden md:block">
                  <table className="w-full text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-2">Material</th>
                        <th className="px-6 py-2">Fornecedor</th>
                        <th className="px-6 py-2">Preço</th>
                        <th className="px-6 py-2">Data</th>
                        <th className="px-6 py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrices.map(p => (
                        <tr key={p.id} className="bg-white dark:bg-slate-800 shadow-sm rounded-2xl group border border-slate-100 dark:border-slate-700/50">
                          <td className="px-6 py-4 rounded-l-2xl font-bold text-sm">{p.material}</td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{p.fornecedor || '---'}</td>
                          <td className="px-6 py-4 font-mono font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(p.preco)}
                            <span className="text-[10px] text-slate-400 ml-1">/{p.unidade || 'Kg'}</span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-slate-400 font-bold uppercase">{new Date(p.data).toLocaleDateString()}</td>
                          <td className="px-6 py-4 rounded-r-2xl text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); setActiveTab('prices'); }} title="Copiar Dados" className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Copy className="w-4 h-4" /></button>
                              <button onClick={() => setEditingPrice(p)} title="Editar Registro" className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => onDeletePrice(p.id)} title="Excluir Registro" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                           <button onClick={() => { setNewPrice({ material: p.material, fornecedor: p.fornecedor, preco: p.preco.toString(), unidade: p.unidade || 'Kg', largura: p.largura?.toString() || '' }); }} title="Copiar" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-90 transition-all"><Copy className="w-4 h-4" /></button>
                           <button onClick={() => setEditingPrice(p)} title="Editar" className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 active:scale-90 transition-all"><Edit className="w-4 h-4" /></button>
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
              {/* Form Fornecedores */}
              <div className="p-4 md:p-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Nome do Fornecedor</label>
                    <input 
                      type="text" 
                      value={editingSupplier ? editingSupplier.nome : newSupplier.nome} 
                      onChange={e => editingSupplier ? setEditingSupplier({...editingSupplier, nome: e.target.value}) : setNewSupplier({...newSupplier, nome: e.target.value})}
                      placeholder="Ex: Curtume Silva"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Telefone</label>
                    <input 
                      type="text" 
                      value={editingSupplier ? editingSupplier.telefone || '' : newSupplier.telefone} 
                      onChange={e => editingSupplier ? setEditingSupplier({...editingSupplier, telefone: e.target.value}) : setNewSupplier({...newSupplier, telefone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 px-1">Email</label>
                    <input 
                      type="email" 
                      value={editingSupplier ? editingSupplier.email || '' : newSupplier.email} 
                      onChange={e => editingSupplier ? setEditingSupplier({...editingSupplier, email: e.target.value}) : setNewSupplier({...newSupplier, email: e.target.value})}
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
                            }
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> Salvar
                        </button>
                        <button onClick={() => setEditingSupplier(null)} title="Cancelar edição" className="px-4 bg-slate-200 rounded-xl"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          if (newSupplier.nome) {
                            onAddSupplier(newSupplier);
                            setNewSupplier({ nome: '', telefone: '', email: '' });
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
              <div className="max-w-md mb-8">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-2 px-1">Selecione o Material para Análise</label>
                <select 
                  value={analysisMaterial}
                  onChange={e => setAnalysisMaterial(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  title="Selecionar material para análise"
                >
                  <option value="">Escolha um material...</option>
                  {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
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

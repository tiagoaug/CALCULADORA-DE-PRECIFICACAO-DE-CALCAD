import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Plus, Trash2, Search, Package, Users,
    TrendingUp, Calculator, Ruler, Download, Upload, Database, RefreshCw, Edit2, Check, XCircle,
    DollarSign, Percent, Maximize, Settings, Box, Cloud
} from 'lucide-react';
import { formatCurrency, calculateSolaAverageCost, findUnitFactor, calculateSolaMaterialsTotal, calculateSolaLaborTotal, formatNumber } from './utils/calculations';
import { LibraryData, Sola, SolaMaterial, SolaLaborItem, SolaGradeItem } from './types';
import AutocompleteInput from './AutocompleteInput';
import QuickAddModal from './QuickAddModal';

interface LibraryItem {
    id: string;
    nome: string;
    quantidade?: number;
    unidade?: string;
    valor?: number;
    valor_unitario?: number;
    valorUnitario?: number;
    quantidadeCompra?: number;
    fator?: number;
    rendimento?: number;
    aliquota?: number;
}

interface LibraryViewProps {
    library: LibraryData;
    existingItemsNames?: string[];
    units: string[];
    onClose: () => void;
    onSelectItem: (type: string, item: any) => void;
    onSelectMultipleItems?: (type: string, items: any[]) => void;
    onAddItem: (type: string, item: any) => void;
    onDeleteItem: (type: keyof LibraryData, id: string) => void;
    onUpdateItem: (type: keyof LibraryData, id: string, item: any) => void;
    onUpdateUnits: (units: string[]) => void;
    onResetCloud?: () => void;
    isSyncing?: boolean;
    initialTab?: keyof LibraryData | null;
    onPriceReadjustment?: (item: any, type: string) => void;
    onShowPriceComparison?: () => void;
}

const InlineCalculator: React.FC<{
    onApply: (val: number) => void;
    onClose: () => void;
    initialValue: number;
    color?: string;
}> = ({ onApply, onClose, initialValue, color = 'blue' }) => {
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
                        <Calculator className={`w-5 h-5 text-${color}-500`} />
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">Calculadora Biblioteca</span>
                    </div>
                    <button onClick={onClose} title="Fechar Calculadora" aria-label="Fechar Calculadora" className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-lg mb-6 text-right border border-slate-200 dark:border-slate-800 shadow-inner">
                    <div className="text-[11px] text-slate-400 h-4 font-mono truncate mb-1">{prevValue !== null ? `${prevValue} ${operator || ''}` : '\u00A0'}</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white truncate font-mono tracking-tighter">{display.replace('.', ',')}</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {['7', '8', '9', '/'].map(btn => <button key={btn} title={`Tecla ${btn}`} aria-label={`Tecla ${btn}`} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
                    {['4', '5', '6', '*'].map(btn => <button key={btn} title={`Tecla ${btn}`} aria-label={`Tecla ${btn}`} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
                    {['1', '2', '3', '-'].map(btn => <button key={btn} title={`Tecla ${btn}`} aria-label={`Tecla ${btn}`} onClick={() => isNaN(Number(btn)) ? performOperation(btn) : inputDigit(btn)} className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all">{btn}</button>)}
                    <button onClick={clear} title="Limpar" aria-label="Limpar" className="p-4 rounded-2xl text-lg font-bold bg-red-100 text-red-600 active:scale-90 transition-all">C</button>
                    <button onClick={() => inputDigit('0')} title="Tecla 0" aria-label="Tecla 0" className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 active:scale-90 transition-all">0</button>
                    <button onClick={inputDot} title="Tecla Vírgula" aria-label="Tecla Vírgula" className="p-4 rounded-2xl text-lg font-bold bg-slate-50 dark:bg-slate-800 active:scale-90 transition-all">,</button>
                    <button onClick={() => performOperation('+')} title="Tecla Mais" aria-label="Tecla Mais" className={`p-4 rounded-2xl text-lg font-bold bg-${color}-100 text-${color}-600 active:scale-90 transition-all`}>+</button>
                    <button onClick={() => performOperation('=')} title="Resultado" aria-label="Resultado" className="col-span-2 p-4 rounded-2xl text-xl font-black bg-slate-200 dark:bg-slate-700 active:scale-95 transition-all">=</button>
                    <button onClick={() => onApply(parseFloat(display))} title="Aplicar Valor" aria-label="Aplicar Valor" className={`col-span-2 p-4 rounded-2xl text-xs font-black bg-${color}-600 text-white flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg active:scale-95 transition-all`}><Check className="w-5 h-5" /> Aplicar</button>
                </div>
            </div>
        </div>
    );
};

const LibraryView: React.FC<LibraryViewProps> = ({ 
    library, 
    existingItemsNames = [], 
    units, 
    onClose, 
    onSelectItem, 
    onSelectMultipleItems,
    onAddItem, 
    onDeleteItem, 
    onUpdateItem, 
    onUpdateUnits, 
    onResetCloud,
    isSyncing,
    initialTab,
    onPriceReadjustment,
    onShowPriceComparison
}) => {
    const [activeTab, setActiveTab] = useState<keyof LibraryData>(initialTab || 'insumos');
    const [showDetails, setShowDetails] = useState(!!initialTab);
    const [searchTerm, setSearchTerm] = useState('');
    const [newItem, setNewItem] = useState<Partial<LibraryItem>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<LibraryItem & Sola>>({});
    const [activeCalc, setActiveCalc] = useState<{ mode: 'new' | 'edit', field: string } | null>(null);
    
    // States specifically for Sola complex form
    const [solaMaterials, setSolaMaterials] = useState<SolaMaterial[]>([]);
    const [solaGrades, setSolaGrades] = useState<SolaGradeItem[]>([]);
    const [solaLabor, setSolaLabor] = useState<SolaLaborItem[]>([]);
    const [solaFornecedor, setSolaFornecedor] = useState('');
    const [solaTipo, setSolaTipo] = useState<'simples' | 'mistura' | 'porcentagem'>('simples');
    const [solaRendimentoGlobal, setSolaRendimentoGlobal] = useState<number>(0);
    
    // Multi-select state
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
    const [showQuickAdd, setShowQuickAdd] = useState<{ type: 'insumos' | 'terceirizados' | 'pecas', context: any, initialName?: string } | null>(null);

    const [editingValue, setEditingValue] = useState<{ id: string, field: string, val: string } | null>(null);

    const getDisplayValue = (val: number, id: string, field: string): string => {
        if (editingValue?.id === id && editingValue?.field === field) return editingValue.val;
        if (val === 0) return (field === 'porcentagem' || field === 'rendimentoGlobal') ? '0' : '';

        // Campos que devem ter sempre 2 casas decimais (Valores Unitários/Monetários)
        const isPrice = ['v', 'tv', 'valor', 'precoAlternativo', 'aliquota'].includes(field);
        return formatNumber(val, isPrice ? 2 : 4);
    };

    const handleNumericChange = (id: string, field: string, rawVal: string, updateFn: (numValue: number) => void) => {
        setEditingValue({ id, field, val: rawVal });
        const normalized = rawVal.replace(',', '.');
        const numValue = parseFloat(normalized);

        if (!isNaN(numValue)) {
            const isPrice = ['v', 'tv', 'valor', 'precoAlternativo', 'aliquota', 'rendimentoPares', 'porcentagem'].includes(field);
            const roundedValue = isPrice ? Math.round(numValue * 100) / 100 : Math.round(numValue * 10000) / 10000;
            updateFn(roundedValue);
        }
    };
    
    // Sync activeTab with initialTab when it changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
            setShowDetails(true);
        }
    }, [initialTab]);

    // Units Management State
    const [showUnitManager, setShowUnitManager] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');

    const handleAddItem = () => {
        if (!newItem.nome) return;
        
        // Ensure a unit is assigned for categories that need it
        const itemWithDefaults = { ...newItem };
        if ((activeTab === 'insumos' || activeTab === 'terceirizados') && !itemWithDefaults.unidade) {
            itemWithDefaults.unidade = units[0] || 'Un';
        }
        
        onAddItem(activeTab, itemWithDefaults);
        setNewItem({});
    };

    const startEditing = (item: any) => {
        if (activeTab === 'solados') {
            const sola = item as Sola;
            setEditingId(sola.id);
            setSolaFornecedor(sola.fornecedor || '');
            setSolaMaterials([...sola.materiais]);
            setSolaGrades([...sola.grade]);
            setSolaLabor([...sola.maoDeObra]);
            setSolaTipo(sola.tipo || 'simples');
            setSolaRendimentoGlobal(sola.rendimentoGlobal || 0);
            setNewItem({ 
                nome: sola.nome,
                valor: sola.valor,
                valorUnitario: sola.valor 
            });
            // Scroll to top to see the form
            document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setEditingId(item.id);
            setEditForm({ ...item });
        }
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
        setSolaFornecedor('');
        setSolaMaterials([]);
        setSolaGrades([]);
        setSolaLabor([]);
        setSolaTipo('simples');
        setSolaRendimentoGlobal(0);
        setNewItem({});
        setSelectedItemIds([]);
        setSearchTerms({});
    };

    const handleSaveEdit = () => {
        if (editingId && editForm.nome) {
            onUpdateItem(activeTab, editingId, editForm);
            setEditingId(null);
            setEditForm({});
        }
    };

    const getTabIcon = (tab: keyof LibraryData, sizeClasses = "w-6 h-6") => {
        const props = { className: `${sizeClasses} shrink-0`, fill: "currentColor", fillOpacity: 0.2 };
        
        switch (tab) {
            case 'pecas': return <Box {...props} />;
            case 'insumos': return <Package {...props} />;
            case 'terceirizados': return <Users {...props} />;
            case 'custosFixos': return <Calculator {...props} />;
            case 'custosIndiretos': return <TrendingUp {...props} />;
            case 'impostos': return <Percent {...props} />;
            case 'comissoes': return <Users {...props} />;
            case 'fretes': return <Download {...props} />;
            case 'solados': return <Database {...props} />;
            case 'unidadesMedida': return <Ruler {...props} />;
            default: return <Database {...props} />;
        }
    };

    const getThemeColor = (tab: keyof LibraryData) => {
        switch (tab) {
            case 'pecas': return 'amber';
            case 'insumos': return 'blue';
            case 'terceirizados': return 'purple';
            case 'custosFixos': return 'orange';
            case 'custosIndiretos': return 'rose';
            case 'impostos': return 'amber';
            case 'comissoes': return 'indigo';
            case 'fretes': return 'cyan';
            case 'solados': return 'teal';
            case 'unidadesMedida': return 'blue';
            default: return 'slate';
        }
    };

    const getTabColor = (tab: keyof LibraryData) => {
        const color = getThemeColor(tab);
        if (color === 'slate') return 'text-slate-400 bg-slate-50 dark:bg-slate-900/20';
        return `text-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`;
    };

    const getTabLabel = (tab: keyof LibraryData) => {
        switch (tab) {
            case 'pecas': return 'Peças';
            case 'insumos': return 'Materiais';
            case 'terceirizados': return 'Serviços';
            case 'custosFixos': return 'Fixos';
            case 'custosIndiretos': return 'Variáveis';
            case 'impostos': return 'Impostos';
            case 'comissoes': return 'Comissões';
            case 'fretes': return 'Fretes';
            case 'solados': return 'Solados';
            case 'unidadesMedida': return 'Unidades';
            default: return tab;
        }
    };

    const items = useMemo(() => {
        if (activeTab === 'insumos') {
            const insumos = (library.insumos || []).map(i => ({ ...i, _type: 'insumos' }));
            const solados = (library.solados || []).map(s => ({ ...s, _type: 'solados' }));
            return [...insumos, ...solados];
        }
        return (library[activeTab] || []).map(i => ({ ...i, _type: activeTab }));
    }, [library, activeTab]);

    const filteredItems = items.filter(item =>
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectItem = (type: string, id: string) => {
        const compositeId = `${type}:${id}`;
        setSelectedItemIds(prev => 
            prev.includes(compositeId) ? prev.filter(i => i !== compositeId) : [...prev, compositeId]
        );
    };

    const handleSelectAll = () => {
        const itemIds = filteredItems.map(i => `${i._type || activeTab}:${i.id}`);
        if (itemIds.every(id => selectedItemIds.includes(id))) {
            setSelectedItemIds(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedItemIds(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    const handleCopySelected = () => {
        // Collect all items from all relevant categories
        const allItems = [
            ...(library.pecas || []).map(i => ({ ...i, _type: 'pecas' })),
            ...(library.insumos || []).map(i => ({ ...i, _type: 'insumos' })),
            ...(library.solados || []).map(s => ({ ...s, _type: 'solados' })),
            ...(library.terceirizados || []).map(t => ({ ...t, _type: 'terceirizados' })),
            ...(library.custosFixos || []).map(t => ({ ...t, _type: 'custosFixos' })),
            ...(library.custosIndiretos || []).map(t => ({ ...t, _type: 'custosIndiretos' })),
            ...(library.impostos || []).map(t => ({ ...t, _type: 'impostos' })),
            ...(library.comissoes || []).map(t => ({ ...t, _type: 'comissoes' })),
            ...(library.fretes || []).map(t => ({ ...t, _type: 'fretes' }))
        ];

        // Group selected items by type
        const selectedByType: Record<string, any[]> = {};
        
        selectedItemIds.forEach(compositeId => {
            const [type, id] = compositeId.split(':');
            const item = allItems.find(i => i.id === id && i._type === type);
            
            if (item) {
                const isAlreadyInProject = existingItemsNames.some(name => name.toLowerCase() === item.nome.toLowerCase());
                if (!isAlreadyInProject) {
                    if (!selectedByType[type]) selectedByType[type] = [];
                    selectedByType[type].push(item);
                }
            }
        });

        // Call multi-select if available, otherwise fallback to single select loop
        Object.entries(selectedByType).forEach(([type, items]) => {
            if (onSelectMultipleItems) {
                onSelectMultipleItems(type, items);
            } else {
                items.forEach(item => onSelectItem(type, item));
            }
        });

        setSelectedItemIds([]);
    };

    const currentSolaForCalculation = useMemo(() => ({
        ...newItem,
        tipo: solaTipo,
        rendimentoGlobal: solaRendimentoGlobal,
        materiais: solaMaterials,
        maoDeObra: solaLabor,
        grade: solaGrades,
        fornecedor: solaFornecedor
    } as Sola), [newItem, solaTipo, solaRendimentoGlobal, solaMaterials, solaLabor, solaGrades, solaFornecedor]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">

                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        {showDetails && (
                            <button 
                                onClick={() => { setShowDetails(false); setShowUnitManager(false); }}
                                className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                                title="Voltar para categorias"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <div className={`p-3 rounded-2xl ${getTabColor(showDetails ? activeTab : 'insumos')} shadow-sm shrink-0`}>
                            {showDetails ? getTabIcon(activeTab, "w-6 h-6 sm:w-8 sm:h-8") : <Database className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" fillOpacity={0.2} />}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase leading-tight">
                                {showDetails ? getTabLabel(activeTab) : "Biblioteca de Custos"}
                            </h2>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {showDetails ? `Gerencie seus itens de ${getTabLabel(activeTab).toLowerCase()}` : "Selecione uma categoria para gerenciar"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {onShowPriceComparison && (
                            <button
                                onClick={onShowPriceComparison}
                                title="Comparação de Preços"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95"
                            >
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Comparar Preços</span>
                            </button>
                        )}
                        <button 
                            onClick={() => window.location.reload()}
                            title="Atualizar Sistema"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Atualizar</span>
                        </button>
                        <button onClick={onClose} title="Sair da Biblioteca" className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-all active:scale-95 border border-red-100 dark:border-red-900/30">
                            <X className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">Sair</span>
                        </button>
                    </div>
                </div>

                {!showDetails ? (
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-3 mb-6">
                            {(['pecas', 'insumos', 'terceirizados', 'custosFixos', 'custosIndiretos', 'impostos', 'comissoes', 'fretes', 'solados', 'unidadesMedida'] as const).map(tab => (
                                <button
                                    key={tab}
                                    id={`tab-${tab}`}
                                    onClick={() => { setActiveTab(tab); cancelEditing(); setShowDetails(true); }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:scale-105 active:scale-95 group shadow-sm hover:shadow-md`}
                                >
                                    <div className={`p-4 rounded-2xl shadow-sm transition-all group-hover:shadow-lg ${getTabColor(tab)} group-hover:bg-opacity-80`}>
                                        {getTabIcon(tab)}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest text-center leading-none mt-1 text-${getThemeColor(tab)}-500`}>
                                        {getTabLabel(tab)}
                                    </span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="text-center py-10 opacity-50">
                            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Escolha acima o que deseja cadastrar</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Tema dinâmico para o formulário */}
                        <div className={`flex flex-wrap gap-4 mb-8 bg-${getThemeColor(activeTab)}-50 dark:bg-${getThemeColor(activeTab)}-900/10 p-5 rounded-2xl border border-${getThemeColor(activeTab)}-100 dark:border-${getThemeColor(activeTab)}-800/50`}>
                            <div className="flex-1 min-w-[200px]">
                                <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>
                                    {activeTab === 'pecas' ? 'Nome da Peça' : activeTab === 'insumos' ? 'Nome do Material' : 'Nome do Item'}
                                </label>
                                <input
                                    type="text"
                                    value={newItem.nome || ''}
                                    title={activeTab === 'pecas' ? 'Nome da Peça' : 'Nome do Item'}
                                    onChange={e => {
                                        const name = e.target.value;
                                        setNewItem({ 
                                            ...newItem, 
                                            nome: name,
                                            peca: activeTab === 'pecas' ? name : undefined,
                                            material: activeTab === 'insumos' ? name : undefined
                                        });
                                    }}
                                    placeholder={activeTab === 'pecas' ? "Ex: Cabedal, Traseira..." : "Ex: Couro, Sintético, Lona..."}
                                    className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                />
                            </div>

                            {(activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                <>
                                    <div className="flex-1 min-w-[120px]">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Unidade</label>
                                        <select
                                            value={newItem.unidade || ''}
                                            onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}
                                            className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                            title="Selecione a unidade de medida"
                                        >
                                            <option value="">Selecione</option>
                                            {library.unidadesMedida && library.unidadesMedida.length > 0 
                                                ? library.unidadesMedida.map(u => (
                                                    <option key={u.id} value={u.nome}>{u.nome}</option>
                                                  ))
                                                : units.map((u, i) => {
                                                    const value = typeof u === 'string' ? u : (u as any).nome || '';
                                                    return <option key={i} value={value}>{value}</option>
                                                  })
                                            }
                                        </select>
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Preço de Compra (Embalagem)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                title="Preço de Compra"
                                                placeholder="0,00"
                                                value={getDisplayValue(newItem.valorUnitario || 0, 'new', 'v')}
                                                onChange={e => handleNumericChange('new', 'v', e.target.value, (v) => setNewItem({ ...newItem, valorUnitario: v }))}
                                                onBlur={() => setEditingValue(null)}
                                                className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Qtd na Embalagem</label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            title="Quantidade na Embalagem"
                                            value={getDisplayValue(newItem.quantidadeCompra || 0, 'new', 'q_compra')}
                                            onChange={e => handleNumericChange('new', 'q_compra', e.target.value, (v) => {
                                                setNewItem({ ...newItem, quantidadeCompra: v, fator: v });
                                            })}
                                            onBlur={() => setEditingValue(null)}
                                            placeholder="Ex: 1000"
                                            className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                        />
                                        {newItem.valorUnitario && newItem.quantidadeCompra ? (
                                            <div className="mt-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                                Custo Unitário: <span className={`text-[11px] font-black text-${getThemeColor(activeTab)}-600`}>{formatCurrency(newItem.valorUnitario / newItem.quantidadeCompra, 4)}</span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex-1 min-w-[150px]">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block flex items-center gap-2`}>
                                            Fator de Conversão
                                            <div className="group relative">
                                                <Settings className="w-3 h-3 text-slate-400 cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    Calculado automaticamente pela Quantidade na Embalagem. Ex: 1 Milheiro = 1000 unidades.
                                                </div>
                                            </div>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                title="Fator de Conversão"
                                                value={getDisplayValue(newItem.fator || 0, 'new', 'fator')}
                                                onChange={e => handleNumericChange('new', 'fator', e.target.value, (v) => setNewItem({ ...newItem, fator: v }))}
                                                onBlur={() => setEditingValue(null)}
                                                placeholder="Ex: 1000"
                                                className={`flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-[110px]">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Rendimento (Pares)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={getDisplayValue(newItem.rendimento || 0, 'new', 'rendimento')}
                                                onChange={e => handleNumericChange('new', 'rendimento', e.target.value, (v) => setNewItem({ ...newItem, rendimento: v }))}
                                                onBlur={() => setEditingValue(null)}
                                                placeholder=""
                                                title="Quantos pares este item rende?"
                                                className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                            />
                                            <button 
                                                onClick={() => setActiveCalc({ mode: 'new', field: 'rendimento' })}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-${getThemeColor(activeTab)}-500 hover:bg-${getThemeColor(activeTab)}-50 dark:hover:bg-${getThemeColor(activeTab)}-900/30 rounded-lg transition-colors`}
                                                title="Abrir Calculadora"
                                            >
                                                <Calculator className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}


                            {activeTab !== 'solados' && activeTab !== 'unidadesMedida' && activeTab !== 'insumos' && activeTab !== 'terceirizados' && activeTab !== 'pecas' && (
                                <div className="flex-1 min-w-[120px]">
                                    <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>
                                        {(activeTab === 'impostos' || activeTab === 'comissoes') ? 'Alíquota (%)' : 'Valor'}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        title={(activeTab === 'impostos' || activeTab === 'comissoes') ? 'Alíquota (%)' : 'Valor'}
                                        value={getDisplayValue(newItem.aliquota || newItem.valor || 0, 'new', (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : 'valor')}
                                        onChange={e => {
                                            const field = (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : 'valor';
                                            handleNumericChange('new', field, e.target.value, (v) => setNewItem({ ...newItem, [field]: v }));
                                        }}
                                        onBlur={() => setEditingValue(null)}
                                        placeholder="0,00"
                                        className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                    />
                                </div>
                            )}

                            {activeTab !== 'solados' && (
                                <div className="flex items-end">
                                    <button
                                        onClick={handleAddItem}
                                        title="Cadastrar Item"
                                        className={`h-[42px] px-8 bg-${getThemeColor(activeTab)}-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-${getThemeColor(activeTab)}-700 transition-all shadow-lg shadow-${getThemeColor(activeTab)}-500/30 flex items-center gap-2 active:scale-95`}
                                    >
                                        <Plus className="w-4 h-4" /> Cadastrar
                                    </button>
                                </div>
                            )}
                        </div>



                        {activeTab === 'solados' && (
                            <div className="w-full space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex-1">
                                        <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Fornecedor da Sola</label>
                                        <input
                                            type="text"
                                            value={solaFornecedor}
                                            onChange={e => setSolaFornecedor(e.target.value)}
                                            placeholder="Ex: Solados Estrela"
                                            className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                        />
                                    </div>
                                </div>

                                 {/* Materiais Blend */}
                                <div className={`p-4 sm:p-6 rounded-2xl border-2 border-dashed border-${getThemeColor(activeTab)}-200 dark:border-${getThemeColor(activeTab)}-800 bg-white/50 dark:bg-slate-800/30`}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                        <div className="flex flex-col gap-1">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest text-${getThemeColor(activeTab)}-600`}>Composição de Materiais (g)</h4>
                                            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                                                <button 
                                                    onClick={() => {
                                                        setSolaTipo('simples');
                                                        if (solaMaterials.length > 1) {
                                                            setSolaMaterials([solaMaterials[0]]);
                                                        } else if (solaMaterials.length === 0) {
                                                            setSolaMaterials([{ id: Math.random().toString(36), materialId: '', pesoGrams: 0 }]);
                                                        }
                                                    }}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${solaTipo === 'simples' ? `bg-white dark:bg-slate-800 text-${getThemeColor(activeTab)}-600 shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Simples
                                                </button>
                                                <button 
                                                    onClick={() => setSolaTipo('mistura')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${solaTipo === 'mistura' ? `bg-white dark:bg-slate-800 text-${getThemeColor(activeTab)}-600 shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Mistura
                                                </button>
                                                <button 
                                                    onClick={() => setSolaTipo('porcentagem')}
                                                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${solaTipo === 'porcentagem' ? `bg-white dark:bg-slate-800 text-${getThemeColor(activeTab)}-600 shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    % Porcentagem
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (solaTipo === 'simples') setSolaTipo('mistura');
                                                setSolaMaterials([...solaMaterials, { id: Math.random().toString(36), materialId: '', pesoGrams: 0, porcentagem: 0 }]);
                                            }}
                                            title="Adicionar material à composição"
                                            className={`p-1.5 bg-${getThemeColor(activeTab)}-100 dark:bg-${getThemeColor(activeTab)}-900/40 text-${getThemeColor(activeTab)}-600 rounded-lg hover:bg-${getThemeColor(activeTab)}-200 transition-colors`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {solaTipo === 'porcentagem' && (
                                        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Configuração de Mistura Global</h5>
                                                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${solaMaterials.reduce((sum, m) => sum + (m.porcentagem || 0), 0) === 100 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    Total: {solaMaterials.reduce((sum, m) => sum + (m.porcentagem || 0), 0)}%
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rendimento Global da Mistura</span>
                                                <div className="relative group max-w-[200px]">
                                                    <input 
                                                        type="text" 
                                                        inputMode="decimal"
                                                        value={getDisplayValue(solaRendimentoGlobal || 0, 'sola-rend-global', 'rendimentoGlobal')} 
                                                        onChange={e => handleNumericChange('sola-rend-global', 'rendimentoGlobal', e.target.value, setSolaRendimentoGlobal)}
                                                        onBlur={() => setEditingValue(null)}
                                                        placeholder=""
                                                        className={`w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-3 py-3 text-xs font-bold text-right pr-24 shadow-sm focus:ring-2 focus:ring-indigo-500/20`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 pointer-events-none">PARES/KG</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {solaMaterials.map((mat, idx) => {
                                            const selectedMat = library.insumos.find(i => i.id === mat.materialId);
                                            const effectivePrice = mat.precoAlternativo !== undefined ? mat.precoAlternativo : (selectedMat?.valorUnitario || 0);
                                            const factor = selectedMat ? findUnitFactor(selectedMat.unidade, library.unidadesMedida) : 1;
                                            
                                            const matCost = solaTipo === 'porcentagem'
                                                ? (solaRendimentoGlobal > 0 ? (effectivePrice * (mat.porcentagem || 0) / 100) / solaRendimentoGlobal : 0)
                                                : mat.tipoCalculo === 'rendimento'
                                                    ? (mat.rendimentoPares && mat.rendimentoPares > 0 ? effectivePrice / mat.rendimentoPares : 0)
                                                    : (mat.pesoGrams / (factor || 1)) * effectivePrice;

                                            const averageWeight = solaGrades.length > 0 
                                                ? solaGrades.reduce((acc, curr) => acc + (curr.peso || 0), 0) / solaGrades.length 
                                                : 0;
                                            
                                            const currentSearch = searchTerms[`sola-mat-${idx}`] !== undefined ? searchTerms[`sola-mat-${idx}`] : (selectedMat?.nome || '');
                                            const isNewMaterial = currentSearch.length > 0 && !library.insumos.some(i => i.nome.toLowerCase() === currentSearch.toLowerCase());
                                            
                                            return (
                                                <div key={mat.id} className={`flex flex-col gap-4 bg-white dark:bg-slate-950 border-l-4 border-${getThemeColor(activeTab)}-500 shadow-sm p-4 rounded-xl w-full transition-all hover:shadow-md mb-2`}>
                                                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <div className="flex-1 flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Material (Sugestão de Lista)</span>
                                                            <div className="relative group/search">
                                                                <AutocompleteInput 
                                                                    value={currentSearch}
                                                                    suggestions={library.insumos}
                                                                    placeholder="Digite para buscar material..."
                                                                    onSelect={(item) => {
                                                                        const newMats = [...solaMaterials];
                                                                        newMats[idx].materialId = item.id;
                                                                        setSolaMaterials(newMats);
                                                                        setSearchTerms(prev => ({ ...prev, [`sola-mat-${idx}`]: item.nome }));
                                                                    }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(val) => {
                                                                        setSearchTerms(prev => ({ ...prev, [`sola-mat-${idx}`]: val }));
                                                                    }}
                                                                    className="!bg-slate-50 dark:!bg-slate-900 border-none rounded-xl"
                                                                />
                                                                {isNewMaterial && (
                                                                    <button 
                                                                        onClick={() => setShowQuickAdd({ type: 'insumos', context: { idx }, initialName: currentSearch })}
                                                                        title={`Cadastrar "${currentSearch}" na biblioteca`}
                                                                        className={`absolute right-10 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 text-${getThemeColor(activeTab)}-600 rounded-xl shadow-lg border border-${getThemeColor(activeTab)}-200 dark:border-${getThemeColor(activeTab)}-800 transition-all active:scale-95 flex items-center gap-1.5 z-10 animate-in fade-in zoom-in slide-in-from-right-2`}
                                                                    >
                                                                        <Database className="w-3.5 h-3.5" />
                                                                        <span className="text-[8px] font-black uppercase">Novo</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => setSolaMaterials(solaMaterials.filter((_, i) => i !== idx))} 
                                                            title="Remover material" 
                                                            className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {solaTipo !== 'porcentagem' ? (
                                                            <>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newMats = [...solaMaterials];
                                                                        newMats[idx].tipoCalculo = 'peso';
                                                                        setSolaMaterials(newMats);
                                                                        setEditingValue(null);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${!mat.tipoCalculo || mat.tipoCalculo === 'peso' ? `bg-${getThemeColor(activeTab)}-500 text-white shadow-lg shadow-${getThemeColor(activeTab)}-500/20` : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    Peso e Média
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        const newMats = [...solaMaterials];
                                                                        newMats[idx].tipoCalculo = 'rendimento';
                                                                        setSolaMaterials(newMats);
                                                                        setEditingValue(null);
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mat.tipoCalculo === 'rendimento' ? `bg-${getThemeColor(activeTab)}-500 text-white shadow-lg shadow-${getThemeColor(activeTab)}-500/20` : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    Rendimento Pares/Kg
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <div className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                                                Modo Porcentagem
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                                                        {solaTipo === 'porcentagem' ? (
                                                            <div key={`perc-container-${idx}`} className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">% da Mistura</span>
                                                                <div className="relative group">
                                                                    <input 
                                                                        type="text" 
                                                                        inputMode="decimal"
                                                                        value={getDisplayValue(mat.porcentagem || 0, `sola-mat-perc-${idx}`, 'porcentagem')} 
                                                                        onChange={e => {
                                                                            const newMats = [...solaMaterials];
                                                                            handleNumericChange(`sola-mat-perc-${idx}`, 'porcentagem', e.target.value, (v) => {
                                                                                const otherTotal = solaMaterials.reduce((sum, m, i) => i !== idx ? sum + (m.porcentagem || 0) : sum, 0);
                                                                                if (otherTotal + v > 100) {
                                                                                    newMats[idx].porcentagem = Math.max(0, 100 - otherTotal);
                                                                                } else {
                                                                                    newMats[idx].porcentagem = v;
                                                                                }
                                                                                setSolaMaterials(newMats);
                                                                            });
                                                                        }}
                                                                        onBlur={() => setEditingValue(null)}
                                                                        placeholder=""
                                                                        className={`w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-3 sm:px-4 py-3 text-xs font-bold text-right pr-14 shadow-sm focus:ring-2 focus:ring-indigo-500/20`}
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                                                </div>
                                                                {(() => {
                                                                    const otherTotal = solaMaterials.reduce((sum, m, i) => i !== idx ? sum + (m.porcentagem || 0) : sum, 0);
                                                                    const remaining = 100 - otherTotal;
                                                                    if (remaining > 0 && (mat.porcentagem || 0) < remaining) {
                                                                        return (
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newMats = [...solaMaterials];
                                                                                    newMats[idx].porcentagem = remaining;
                                                                                    setSolaMaterials(newMats);
                                                                                }}
                                                                                className="mt-2 py-1 px-3 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1 w-fit shadow-md shadow-indigo-500/20 animate-in fade-in zoom-in"
                                                                            >
                                                                                <Check className="w-3 h-3" />
                                                                                Completar ({remaining}%)
                                                                            </button>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>
                                                        ) : (!mat.tipoCalculo || mat.tipoCalculo === 'peso') ? (
                                                            <div key={`peso-container-${idx}`} className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peso e Média</span>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="relative group">
                                                                        <input 
                                                                            type="text" 
                                                                            inputMode="decimal"
                                                                            value={getDisplayValue(mat.pesoGrams || 0, `sola-mat-${idx}`, 'pesoGrams')} 
                                                                            onChange={e => {
                                                                                const newMats = [...solaMaterials];
                                                                                handleNumericChange(`sola-mat-${idx}`, 'pesoGrams', e.target.value, (v) => {
                                                                                    newMats[idx].pesoGrams = v;
                                                                                    setSolaMaterials(newMats);
                                                                                });
                                                                            }}
                                                                            onBlur={() => setEditingValue(null)}
                                                                            placeholder="Peso (g)"
                                                                            className={`w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-3 sm:px-4 py-3 text-xs font-bold text-right pr-6 sm:pr-8 shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500/20`}
                                                                            title="Peso em gramas"
                                                                        />
                                                                        <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">g</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newMats = [...solaMaterials];
                                                                            newMats[idx].pesoGrams = Number(averageWeight.toFixed(1));
                                                                            setSolaMaterials(newMats);
                                                                        }}
                                                                        title={`Usar peso médio da grade (${averageWeight.toFixed(1)}g)`}
                                                                        className="w-full py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                                                    >
                                                                        <Maximize className="w-3.5 h-3.5" />
                                                                        <span className="text-[9px] font-black uppercase tracking-wider">Peso Médio</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div key={`rend-container-${idx}`} className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rendimento pares por kg</span>
                                                                <div className="relative group">
                                                                    <input 
                                                                        type="text" 
                                                                        inputMode="decimal"
                                                                        value={getDisplayValue(mat.rendimentoPares || 0, `sola-mat-rend-${idx}`, 'rendimentoPares')} 
                                                                        onChange={e => {
                                                                            const newMats = [...solaMaterials];
                                                                            handleNumericChange(`sola-mat-rend-${idx}`, 'rendimentoPares', e.target.value, (v) => {
                                                                                newMats[idx].rendimentoPares = v;
                                                                                setSolaMaterials(newMats);
                                                                            });
                                                                        }}
                                                                        onBlur={() => setEditingValue(null)}
                                                                        placeholder=""
                                                                        className={`w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-3 sm:px-4 py-3 text-xs font-bold text-right pr-24 shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500/20`}
                                                                        title="Quantos pares produz com 1Kg"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-400 pointer-events-none">PARES/KG</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preço Alternativo (Kg)</span>
                                                            <div className="relative group">
                                                                <DollarSign className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-${getThemeColor(activeTab)}-600/50`} />
                                                                <input 
                                                                    type="text" 
                                                                    inputMode="decimal"
                                                                    value={getDisplayValue(mat.precoAlternativo !== undefined ? mat.precoAlternativo : 0, `sola-mat-${idx}`, 'precoAlternativo')} 
                                                                    onChange={e => {
                                                                        const newMats = [...solaMaterials];
                                                                        handleNumericChange(`sola-mat-${idx}`, 'precoAlternativo', e.target.value, (v) => {
                                                                            newMats[idx].precoAlternativo = e.target.value === '' ? undefined : v;
                                                                            setSolaMaterials(newMats);
                                                                        });
                                                                    }}
                                                                    onBlur={() => setEditingValue(null)}
                                                                    placeholder="Biblioteca"
                                                                    className={`w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-6 pr-3 py-3 text-xs font-bold text-${getThemeColor(activeTab)}-600 shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500/20`}
                                                                    title="Preço alternativo por Kg (sobrescreve a biblioteca)"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={`flex flex-col gap-1.5 xs:col-span-2 sm:col-span-1 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0`}>
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Custo do Item</span>
                                                            <div className={`bg-${getThemeColor(activeTab)}-50 dark:bg-${getThemeColor(activeTab)}-900/30 px-4 py-2.5 rounded-xl border border-${getThemeColor(activeTab)}-100 dark:border-${getThemeColor(activeTab)}-800 text-right`}>
                                                                <span className={`text-base font-mono font-black text-${getThemeColor(activeTab)}-600`}>
                                                                    {formatCurrency(matCost)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            );
                                        })}
                                        {solaMaterials.length === 0 && (
                                            <p className="text-center py-4 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Nenhum material adicionado</p>
                                        )}
                                    </div>

                                    {/* Resumo da Composição */}
                                    <div className={`mt-6 p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4`}>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Materiais (por par)</span>
                                            <div className={`text-xl font-mono font-black text-${getThemeColor(activeTab)}-600`}>
                                                {formatCurrency(calculateSolaMaterialsTotal({ 
                                                    materiais: solaMaterials, 
                                                    tipo: solaTipo, 
                                                    rendimentoGlobal: solaRendimentoGlobal 
                                                } as any, library.insumos, library.unidadesMedida))}
                                            </div>
                                        </div>
                                        {solaTipo === 'porcentagem' && (
                                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${solaMaterials.reduce((sum, m) => sum + (m.porcentagem || 0), 0) > 100 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-100 text-green-600'}`}>
                                                {solaMaterials.reduce((sum, m) => sum + (m.porcentagem || 0), 0) > 100 ? '⚠️ Excesso: ' : 'Soma: '}
                                                {solaMaterials.reduce((sum, m) => sum + (m.porcentagem || 0), 0)}% / 100%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Grade e Pesos */}
                                    <div className={`bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-${getThemeColor(activeTab)}-200 dark:border-${getThemeColor(activeTab)}-800`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest text-${getThemeColor(activeTab)}-600`}>Grade de Numeração e Pesos</h4>
                                            <button 
                                                onClick={() => setSolaGrades([...solaGrades, { id: Math.random().toString(36), tamanho: '', peso: 0 }])}
                                                title="Adicionar tamanho à grade"
                                                className={`p-1.5 bg-${getThemeColor(activeTab)}-100 dark:bg-${getThemeColor(activeTab)}-900/40 text-${getThemeColor(activeTab)}-600 rounded-lg hover:bg-${getThemeColor(activeTab)}-200 transition-colors`}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                         <div className="space-y-2">
                                            {solaGrades.map((g, idx) => (
                                                <div key={g.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900/40 p-2 sm:p-0 rounded-lg sm:bg-transparent">
                                                    <div className="w-14 sm:w-16">
                                                        <input 
                                                            type="text" 
                                                            placeholder="38" 
                                                            value={g.tamanho} 
                                                            onChange={e => {
                                                                const newGrade = [...solaGrades];
                                                                newGrade[idx].tamanho = e.target.value;
                                                                setSolaGrades(newGrade);
                                                            }}
                                                            className="w-full bg-white dark:bg-slate-950 sm:bg-slate-50 sm:dark:bg-slate-900 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-center"
                                                        />
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <input 
                                                            type="text" 
                                                            inputMode="decimal"
                                                            placeholder="Peso (g)" 
                                                            value={getDisplayValue(g.peso || 0, g.id, 'pesoGrade')} 
                                                            onChange={e => {
                                                                const newGrade = [...solaGrades];
                                                                handleNumericChange(g.id, 'pesoGrade', e.target.value, (v) => {
                                                                    newGrade[idx].peso = v;
                                                                    setSolaGrades(newGrade);
                                                                });
                                                            }}
                                                            onBlur={() => setEditingValue(null)}
                                                            className="w-full bg-white dark:bg-slate-950 sm:bg-slate-50 sm:dark:bg-slate-900 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-right pr-6"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">g</span>
                                                    </div>
                                                    <button onClick={() => setSolaGrades(solaGrades.filter((_, i) => i !== idx))} title="Remover tamanho" className="p-1.5 text-slate-300 hover:text-red-500 flex-shrink-0 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            ))}
                                            {solaGrades.length === 0 && (
                                                <p className="text-center py-4 text-[9px] text-slate-400 font-bold uppercase tracking-tight">Grade vazia</p>
                                            )}
                                            {solaGrades.length > 0 && (
                                                <div className={`mt-4 pt-4 border-t border-${getThemeColor(activeTab)}-100 dark:border-${getThemeColor(activeTab)}-800/50 flex justify-between items-center px-2`}>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Média de Peso</span>
                                                    <span className={`text-xs font-black text-${getThemeColor(activeTab)}-600`}>
                                                        {(solaGrades.reduce((acc, curr) => acc + (curr.peso || 0), 0) / solaGrades.length).toFixed(1)} g
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mão de Obra */}
                                    <div className={`bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-${getThemeColor(activeTab)}-200 dark:border-${getThemeColor(activeTab)}-800`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className={`text-[10px] font-black uppercase tracking-widest text-${getThemeColor(activeTab)}-600`}>Serviços e Mão de Obra</h4>
                                            <button 
                                                onClick={() => setSolaLabor([...solaLabor, { id: Math.random().toString(36), nome: '', valor: 0 }])}
                                                title="Adicionar serviço de mão de obra"
                                                className={`p-1.5 bg-${getThemeColor(activeTab)}-100 dark:bg-${getThemeColor(activeTab)}-900/40 text-${getThemeColor(activeTab)}-600 rounded-lg hover:bg-${getThemeColor(activeTab)}-200 transition-colors`}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {solaLabor.map((l, idx) => (
                                                <div key={l.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-slate-50 dark:bg-slate-900/40 p-2 sm:p-0 rounded-lg sm:bg-transparent">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Serviço" 
                                                        value={l.nome} 
                                                        onChange={e => {
                                                            const newLabor = [...solaLabor];
                                                            newLabor[idx].nome = e.target.value;
                                                            setSolaLabor(newLabor);
                                                        }}
                                                        className="w-full sm:flex-1 bg-white dark:bg-slate-950 sm:bg-slate-50 sm:dark:bg-slate-900 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold"
                                                    />
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="flex-1 sm:w-24 relative">
                                                            <input 
                                                                type="text" 
                                                                inputMode="decimal"
                                                                placeholder="0,00" 
                                                                value={getDisplayValue(l.valor || 0, `sola-labor-${idx}`, 'valor')} 
                                                                onChange={e => {
                                                                    const newLabor = [...solaLabor];
                                                                    handleNumericChange(`sola-labor-${idx}`, 'valor', e.target.value, (v) => {
                                                                        newLabor[idx].valor = v;
                                                                        setSolaLabor(newLabor);
                                                                    });
                                                                }}
                                                                onBlur={() => setEditingValue(null)}
                                                                className="w-full bg-white dark:bg-slate-950 sm:bg-slate-50 sm:dark:bg-slate-900 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-right"
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => setShowQuickAdd({ type: 'terceirizados', context: { idx } })}
                                                            title="Cadastrar novo serviço na biblioteca"
                                                            className="p-1.5 text-slate-400 hover:text-purple-500 transition-colors"
                                                        >
                                                            <Database className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => setSolaLabor(solaLabor.filter((_, i) => i !== idx))} title="Remover serviço" className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>

                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    {editingId && (
                                        <button
                                            onClick={cancelEditing}
                                            className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (!newItem.nome) return;
                                            const solaData: Sola = {
                                                id: editingId || Math.random().toString(36),
                                                nome: newItem.nome,
                                                fornecedor: solaFornecedor,
                                                valor: newItem.valorUnitario || newItem.valor,
                                                tipo: solaTipo,
                                                rendimentoGlobal: solaRendimentoGlobal,
                                                materiais: solaMaterials,
                                                grade: solaGrades,
                                                maoDeObra: solaLabor,
                                                lastModified: Date.now()
                                            };
                                            if (editingId) {
                                                onUpdateItem('solados', editingId, solaData);
                                            } else {
                                                onAddItem('solados', solaData);
                                            }
                                            cancelEditing();
                                        }}
                                        className={`px-10 py-4 bg-${getThemeColor(activeTab)}-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-${getThemeColor(activeTab)}-500/30 hover:bg-${getThemeColor(activeTab)}-700 transition-all flex items-center gap-3 hover:scale-[1.05] active:scale-95`}
                                    >
                                        <Database className="w-5 h-5" /> {editingId ? 'Salvar Alterações Sola' : 'Cadastrar Sola'}
                                    </button>
                                </div>

                                {/* Formação do Preço de Custo (Breakdown) */}
                                <div className={`bg-gradient-to-br from-${getThemeColor(activeTab)}-600 to-${getThemeColor(activeTab)}-700 p-6 rounded-[2rem] text-white shadow-xl shadow-${getThemeColor(activeTab)}-500/20 border border-white/10`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Calculator className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] leading-tight">Formação do Preço de Custo</h4>
                                            <p className={`text-[9px] font-bold text-${getThemeColor(activeTab)}-100 uppercase tracking-widest leading-none mt-1 opacity-70`}>Total por par de calçado</p>
                                        </div>
                                        {(newItem.valorUnitario || 0) > 0 && (
                                            <div className="bg-amber-500/30 px-3 py-1.5 rounded-lg border border-amber-500/30 backdrop-blur-sm">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white">Usando Valor Fixo</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/20 transition-all cursor-default">
                                            <p className={`text-[9px] font-black text-${getThemeColor(activeTab)}-200 uppercase mb-1 flex items-center gap-1.5`}>
                                                <Package className="w-3 h-3" /> MATERIAIS
                                            </p>
                                            <p className="text-xl font-mono font-black tracking-tight">
                                                {(newItem.valorUnitario || 0) > 0 
                                                    ? formatCurrency(newItem.valorUnitario || 0) 
                                                    : formatCurrency(calculateSolaMaterialsTotal(currentSolaForCalculation, library.insumos, library.unidadesMedida))
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/20 transition-all cursor-default">
                                            <p className={`text-[9px] font-black text-${getThemeColor(activeTab)}-200 uppercase mb-1 flex items-center gap-1.5`}>
                                                <Users className="w-3 h-3" /> Mão de Obra
                                            </p>
                                            <p className="text-xl font-mono font-black tracking-tight">
                                                {(newItem.valorUnitario || 0) > 0 
                                                    ? formatCurrency(0) 
                                                    : formatCurrency(calculateSolaLaborTotal(currentSolaForCalculation))
                                                }
                                            </p>
                                        </div>
                                        <div className={`p-4 bg-${getThemeColor(activeTab)}-500/40 rounded-2xl backdrop-blur-md border border-white/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default lg:col-span-1 sm:col-span-3`}>
                                            <p className="text-[9px] font-black text-white uppercase mb-1 flex items-center gap-1.5 z-10 relative">
                                                <TrendingUp className="w-3 h-3" /> Custo Total / Par
                                            </p>
                                            <p className="text-2xl font-mono font-black tracking-tighter text-white z-10 relative">
                                                {formatCurrency(
                                                    (newItem.valorUnitario || 0) > 0 
                                                        ? (newItem.valorUnitario || 0)
                                                        : calculateSolaAverageCost(currentSolaForCalculation, library.insumos, library.unidadesMedida)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        <div className="relative my-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                 type="text"
                                placeholder="Buscar na biblioteca local..."
                                title="Buscar na biblioteca"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                }}
                                className={`w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500 transition-all`}
                            />
                            {filteredItems.length > 0 && (['pecas', 'insumos', 'terceirizados', 'solados', 'custosFixos', 'custosIndiretos', 'impostos', 'comissoes', 'fretes'].includes(activeTab)) && (
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.includes(`${i._type || activeTab}:${i.id}`)) ? `bg-${getThemeColor(activeTab)}-500 border-${getThemeColor(activeTab)}-500 text-white` : 'border-slate-300 dark:border-slate-700'}`}>
                                            {filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.includes(`${i._type || activeTab}:${i.id}`)) && <Check className="w-3 h-3" />}
                                        </div>
                                        {filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.includes(`${i._type || activeTab}:${i.id}`)) ? 'Desmarcar Filtro' : 'Selecionar Filtro'}
                                    </button>
                                    <span className="text-[10px] font-bold text-slate-300">|</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedItemIds.length} selecionados</span>
                                </div>
                            )}
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-slate-400 text-sm font-bold">Nenhum item cadastrado nesta categoria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredItems.map(item => {
                                    const itemType = (item as any)._type || activeTab;
                                    const isAdded = (existingItemsNames || []).some(name => name.toLowerCase() === item.nome.toLowerCase());
                                    const themeColor = isAdded ? 'slate' : getThemeColor(itemType as keyof LibraryData);
                                    const isSola = itemType === 'solados';
                                    const compositeId = `${itemType}:${item.id}`;
                                    const isSelected = selectedItemIds.includes(compositeId);
                                    
                                    return (
                                        <div 
                                            key={compositeId} 
                                            onClick={() => !isAdded && editingId !== item.id && toggleSelectItem(itemType, item.id)}
                                            className={`group bg-white dark:bg-slate-900 border ${editingId === item.id ? `border-${themeColor}-500 ring-2 ring-${themeColor}-500/10` : isSelected ? `border-${themeColor}-500 bg-${themeColor}-50/30 ring-1 ring-${themeColor}-500/10` : isAdded ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-800'} p-4 rounded-2xl transition-all shadow-sm ${!isAdded ? `hover:shadow-md cursor-pointer hover:border-${themeColor}-200 dark:hover:border-${themeColor}-900/40` : ''}`}
                                        >
                                            {editingId === item.id ? (
                                                <div className="space-y-4 bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                                    {/* Nome principal */}
                                                    <div>
                                                        <label className={`text-[10px] font-black text-${themeColor}-600 uppercase mb-1.5 block tracking-widest`}>
                                                            {activeTab === 'pecas' ? 'Nome da Peça' : activeTab === 'insumos' ? 'Nome do Material' : 'Nome do Item'}
                                                        </label>
                                                        <input
                                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black uppercase text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                            value={editForm.nome || ''}
                                                            title={activeTab === 'pecas' ? 'Nome da Peça' : 'Nome do Item'}
                                                            placeholder={activeTab === 'pecas' ? 'Nome da Peça' : 'Nome do Item'}
                                                            onChange={e => {
                                                                const name = e.target.value;
                                                                setEditForm({ 
                                                                    ...editForm, 
                                                                    nome: name,
                                                                    peca: activeTab === 'pecas' ? name : undefined,
                                                                    material: activeTab === 'insumos' ? name : undefined
                                                                });
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        {(activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Unidade de Compra</label>
                                                                <select
                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold uppercase text-slate-800 dark:text-slate-100 shadow-sm outline-none"
                                                                    value={editForm.unidade || ''}
                                                                    onChange={e => setEditForm({ ...editForm, unidade: e.target.value })}
                                                                    title="Unidade de Medida"
                                                                >
                                                                    <option value="">Selecione uma unidade</option>
                                                                    {(() => {
                                                                        let options = (library.unidadesMedida && library.unidadesMedida.length > 0) 
                                                                            ? library.unidadesMedida.map(u => ({ label: u.nome, value: u.nome.toUpperCase() }))
                                                                            : (units && units.length > 0)
                                                                                ? units.map(u => {
                                                                                    const value = typeof u === 'string' ? u : (u as any).nome || '';
                                                                                    return { label: value, value };
                                                                                  })
                                                                                : [
                                                                                    { label: 'Kg', value: 'Kg' },
                                                                                    { label: 'Un', value: 'Un' },
                                                                                    { label: 'M', value: 'M' },
                                                                                    { label: 'ML', value: 'ML' },
                                                                                    { label: 'Par', value: 'Par' }
                                                                                  ];

                                                                        if (editForm.unidade && !options.some(o => o.value === editForm.unidade)) {
                                                                            options.unshift({ label: editForm.unidade, value: editForm.unidade });
                                                                        }

                                                                        return options.map((opt, i) => (
                                                                            <option key={`${opt.value}-${i}`} value={opt.value}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ));
                                                                    })()}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {activeTab !== 'unidadesMedida' && activeTab !== 'pecas' && (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">
                                                                        {(activeTab === 'impostos' || activeTab === 'comissoes') ? 'Alíquota de Cálculo (%)' : 'Preço de Compra (Embalagem)'}
                                                                    </label>
                                                                    <div className="relative">
                                                                        {(activeTab === 'impostos' || activeTab === 'comissoes') ? (
                                                                            <Percent className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-${themeColor}-600`} />
                                                                        ) : (
                                                                            <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-${themeColor}-600`} />
                                                                        )}
                                                                        <input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold text-right text-${themeColor}-600 shadow-sm outline-none`}
                                                                            value={getDisplayValue(editForm.aliquota || editForm.valorUnitario || editForm.valor || 0, editForm.id || 'edit', (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : (activeTab === 'custosFixos' || activeTab === 'custosIndiretos' || activeTab === 'fretes') ? 'valor' : 'v')}
                                                                            title="Valor do item"
                                                                            placeholder="0,00"
                                                                            onChange={e => {
                                                                                const field = (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : (activeTab === 'custosFixos' || activeTab === 'custosIndiretos' || activeTab === 'fretes') ? 'valor' : 'v';
                                                                                handleNumericChange(editForm.id || 'edit', field, e.target.value, (v) => {
                                                                                    const updateKey = (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : (activeTab === 'custosFixos' || activeTab === 'custosIndiretos' || activeTab === 'fretes') ? 'valor' : 'valorUnitario';
                                                                                    setEditForm({ ...editForm, [updateKey]: v });
                                                                                });
                                                                            }}
                                                                            onBlur={() => setEditingValue(null)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {(activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Qtd na Embalagem</label>
                                                                            <input
                                                                                type="text"
                                                                                inputMode="decimal"
                                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                                value={getDisplayValue(editForm.quantidadeCompra || 0, editForm.id || 'edit', 'q')}
                                                                                onChange={e => handleNumericChange(editForm.id || 'edit', 'q', e.target.value, (v) => setEditForm({ ...editForm, quantidadeCompra: v, fator: v }))}
                                                                                onBlur={() => setEditingValue(null)}
                                                                                title="Quantidade contida na embalagem comprada"
                                                                                placeholder="Ex: 1000"
                                                                            />
                                                                            {editForm.valorUnitario && editForm.quantidadeCompra ? (
                                                                                <div className="mt-1 text-[8px] font-bold text-emerald-500 uppercase">
                                                                                    Unitário: {formatCurrency(editForm.valorUnitario / editForm.quantidadeCompra, 4)}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Fator Conv.</label>
                                                                            <input
                                                                                type="text"
                                                                                inputMode="decimal"
                                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                                value={getDisplayValue(editForm.fator || 0, editForm.id || 'edit', 'fator')}
                                                                                onChange={e => handleNumericChange(editForm.id || 'edit', 'fator', e.target.value, (v) => setEditForm({ ...editForm, fator: v }))}
                                                                                onBlur={() => setEditingValue(null)}
                                                                                title="Fator de conversão (Calculado pela Qtd na Embalagem)"
                                                                                placeholder="1000"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Rendimento</label>
                                                                            <div className="relative">
                                                                                <input
                                                                                    type="text"
                                                                                    inputMode="decimal"
                                                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                                                    value={getDisplayValue(editForm.rendimento || 0, editForm.id || 'edit', 'rendimento')}
                                                                                    onChange={e => handleNumericChange(editForm.id || 'edit', 'rendimento', e.target.value, (v) => setEditForm({ ...editForm, rendimento: v }))}
                                                                                    onBlur={() => setEditingValue(null)}
                                                                                    title="Rendimento em pares por unidade"
                                                                                    placeholder=""
                                                                                />
                                                                                <button 
                                                                                    onClick={() => setActiveCalc({ mode: 'edit', field: 'rendimento' })}
                                                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-${themeColor}-500 hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-900/30 rounded-lg transition-colors`}
                                                                                    title="Abrir Calculadora"
                                                                                >
                                                                                    <Calculator className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                                        <button 
                                                            onClick={cancelEditing} 
                                                            className="px-4 py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs uppercase flex items-center gap-2 transition-colors"
                                                            title="Cancelar"
                                                        >
                                                            <XCircle className="w-4 h-4" /> Cancelar
                                                        </button>
                                                        <button 
                                                            onClick={handleSaveEdit} 
                                                            className={`px-8 py-2.5 bg-${themeColor}-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-${themeColor}-700 transition-all shadow-md shadow-${themeColor}-500/20 active:scale-95`}
                                                        >
                                                            <Check className="w-4 h-4" /> Salvar Alterações
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 min-w-0 w-full overflow-hidden">
                                                    {/* Nome e Informações principais */}
                                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                                        {(['pecas', 'insumos', 'terceirizados', 'solados', 'custosFixos', 'custosIndiretos', 'impostos', 'comissoes', 'fretes'].includes(itemType)) && !isAdded && (
                                                            <div 
                                                                onClick={(e) => { e.stopPropagation(); toggleSelectItem(itemType, item.id); }}
                                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? `bg-${themeColor}-500 border-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/30` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'}`}
                                                            >
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </div>
                                                        )}
                                                        <div 
                                                            className={`p-3 rounded-xl bg-${themeColor}-500/10 shrink-0 text-${themeColor}-600 shadow-sm border border-${themeColor}-500/20 cursor-pointer`}
                                                            onClick={(e) => { e.stopPropagation(); !isAdded && onSelectItem(itemType, item); }}
                                                        >
                                                            {getTabIcon(itemType, "w-6 h-6")}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate flex items-center gap-1">
                                                                    <span className="truncate max-w-[150px] sm:max-w-none">{item.nome}</span>
                                                                    {isSola && (
                                                                        <span className="ml-2 bg-teal-100 dark:bg-teal-900/30 text-[8px] font-black text-teal-600 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 border border-teal-500/20">SOLADO</span>
                                                                    )}
                                                                </h4>
                                                                {isAdded && (
                                                                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-[7px] font-black text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 border border-emerald-500/20">NO PROJETO</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                                {isSola ? (
                                                                    <>
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px] sm:max-w-[120px]">{(item as any).fornecedor || 'Fab. Própria'}</span>
                                                                        <div 
                                                                            className="flex flex-col items-end cursor-help group/price relative"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (onPriceReadjustment) {
                                                                                    onPriceReadjustment(item, itemType);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <span className={`text-[11px] font-black text-${themeColor}-600 font-mono`}>
                                                                                {formatCurrency(calculateSolaAverageCost(item as Sola, library.insumos, library.unidadesMedida))} <span className="text-[9px] opacity-60">/ par</span>
                                                                            </span>
                                                                            <span className="text-[7px] font-black uppercase text-orange-500 animate-pulse opacity-100">Reajustar Geral</span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {item.unidade && itemType !== 'pecas' && itemType !== 'unidadesMedida' && (
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                                {item.unidade}
                                                                            </span>
                                                                        )}
                                                                            {activeTab === 'unidadesMedida' 
                                                                                ? (
                                                                                    <div className="flex items-center gap-1 opacity-70">
                                                                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[8px]">UNIDADE DE MEDIDA</span>
                                                                                    </div>
                                                                                )
                                                                                : activeTab === 'pecas'
                                                                                    ? null
                                                                                    : (
                                                                                        <span className={`text-[10px] font-black text-slate-500 font-mono`}>
                                                                                            {(activeTab === 'impostos' || activeTab === 'comissoes') 
                                                                                                ? `${item.aliquota?.toFixed(2)}%`
                                                                                                : (item.valorUnitario && item.quantidadeCompra && item.quantidadeCompra > 1)
                                                                                                    ? (
                                                                                                        <div 
                                                                                                            className="flex flex-col items-end cursor-help group/price relative"
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                if (onPriceReadjustment) {
                                                                                                                    onPriceReadjustment(item, itemType);
                                                                                                                }
                                                                                                            }}
                                                                                                        >
                                                                                                            <div className="flex items-center gap-1.5">
                                                                                                                <span className="hover:text-blue-500 transition-colors text-slate-800 dark:text-slate-200">{formatCurrency(item.valorUnitario)}</span>
                                                                                                                <span className="text-[8px] opacity-40">c/ {item.quantidadeCompra}</span>
                                                                                                                <TrendingUp className="w-3 h-3 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                                                                                                            </div>
                                                                                                            <span className="text-[8px] opacity-60">Unitário: {formatCurrency(item.valorUnitario / item.quantidadeCompra, 4)}</span>
                                                                                                            <span className="text-[7px] font-black uppercase text-orange-500 animate-pulse opacity-100">Reajustar Geral</span>
                                                                                                        </div>
                                                                                                    )
                                                                                                    : (
                                                                                                <div 
                                                                                                    className="flex flex-col items-end cursor-help group/price relative"
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        if (onPriceReadjustment) {
                                                                                                            onPriceReadjustment(item, itemType);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                        <span className="hover:text-blue-500 transition-colors">{formatCurrency(item.valorUnitario || item.valor || 0)}</span>
                                                                                                        <TrendingUp className="w-3 h-3 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                                                                                                    </div>
                                                                                                    <span className="text-[7px] font-black uppercase text-orange-500 animate-pulse opacity-100">Reajustar Geral</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </span>
                                                                                    )
                                                                            }
                                                                        {item.rendimento && item.rendimento > 1 && (activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                                                            <span className="text-[8px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                                                                                <RefreshCw className="w-2.5 h-2.5" /> RENDE {Number(item.rendimento).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} PARES
                                                                            </span>
                                                                        )}
                                                                        {item.fator && item.fator !== 1 && (itemType === 'insumos' || itemType === 'terceirizados') && (
                                                                            <span className="text-[8px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                                <Settings className="w-2 h-2" /> FATOR: {item.fator}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Ações (CRUD) */}
                                                    <div className="flex items-center gap-1.5 sm:gap-2 justify-end sm:opacity-0 group-hover:opacity-100 transition-all pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/50">
                                                        {!isAdded && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                                                                    className="flex-1 sm:flex-none py-2 px-2.5 sm:p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-1 sm:gap-2 shadow-sm border border-blue-200 dark:border-blue-800/50"
                                                                    title="Editar item"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="text-[10px] font-black uppercase sm:hidden">Editar</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onSelectItem(itemType, item); }}
                                                                    className={`flex-1 sm:flex-none py-2 px-2.5 sm:p-2.5 bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 rounded-xl hover:bg-${themeColor}-100 transition-all flex items-center justify-center gap-1 sm:gap-2 shadow-sm border border-${themeColor}-200 dark:border-${themeColor}-800/50`}
                                                                    title="Usar no cálculo"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 shrink-0" />
                                                                    <span className="text-[10px] font-black uppercase sm:hidden">Usar</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteItem(activeTab, item.id); }}
                                                            className="flex-1 sm:flex-none py-2 px-2.5 sm:p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1 sm:gap-2 shadow-sm border border-red-200 dark:border-red-800/50"
                                                            title="Remover permanentemente"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="text-[10px] font-black uppercase sm:hidden">Excluir</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest relative">
                    <span>{filteredItems.length} itens no seu dispositivo</span>
                    
                    {selectedItemIds.length > 0 && (
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                            <span className="font-black text-[9px] uppercase tracking-wider">{selectedItemIds.length} selecionados</span>
                            <button
                                onClick={handleCopySelected}
                                className={`px-4 py-1.5 bg-${getTabColor(activeTab).split(' ')[0].replace('text-', '')}-500 text-white rounded-lg font-black text-[9px] uppercase hover:opacity-90 active:scale-95 transition-all flex items-center gap-2`}
                            >
                                <Plus className="w-3.5 h-3.5" /> Copiar para Projeto
                            </button>
                            <button onClick={() => setSelectedItemIds([])} title="Limpar seleção" className="p-1 hover:bg-white/10 dark:hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    
                    <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 bg-${getThemeColor(showDetails ? activeTab : 'solados')}-500 rounded-full animate-pulse`}></div> Armazenamento Local Ativo</span>
                </div>

                {activeCalc && (
                    <InlineCalculator
                        initialValue={Number(activeCalc.mode === 'new' ? newItem.rendimento : editForm.rendimento) || 0}
                        color={getThemeColor(activeTab)}
                        onClose={() => setActiveCalc(null)}
                        onApply={(val) => {
                            if (activeCalc.mode === 'new') {
                                setNewItem({ ...newItem, rendimento: val });
                            } else {
                                setEditForm({ ...editForm, rendimento: val });
                            }
                            setActiveCalc(null);
                        }}
                    />
                )}

                {/* Quick Add Modal */}
                {showQuickAdd && (
                    <QuickAddModal 
                        type={showQuickAdd.type}
                        units={units}
                        onClose={() => setShowQuickAdd(null)}
                        getThemeColor={getThemeColor}
                        initialName={showQuickAdd.initialName}
                        onSave={(item) => {
                            // 1. Adicionar à biblioteca global (o App.tsx vai receber via onAddItem)
                            // Para uso imediato, precisamos de um ID. O onAddItem no App.tsx gera um.
                            // Vamos gerar um ID temporário aqui para vincular ao solado.
                            const itemWithId = { ...item, id: Math.random().toString(36) };
                            onAddItem(showQuickAdd.type, itemWithId);
                            
                            // 2. Se o contexto for um índice de material de solado, vincular o novo ID
                            if (showQuickAdd.context && showQuickAdd.context.idx !== undefined) {
                                if (showQuickAdd.type === 'insumos') {
                                    const newMats = [...solaMaterials];
                                    newMats[showQuickAdd.context.idx].materialId = itemWithId.id;
                                    setSolaMaterials(newMats);
                                    setSearchTerms(prev => ({ ...prev, [`sola-mat-${showQuickAdd.context.idx}`]: itemWithId.nome }));
                                } else if (showQuickAdd.type === 'terceirizados') {
                                    const newLabor = [...solaLabor];
                                    newLabor[showQuickAdd.context.idx].nome = itemWithId.nome;
                                    newLabor[showQuickAdd.context.idx].valor = itemWithId.valorUnitario;
                                    setSolaLabor(newLabor);
                                }
                            }
                            setShowQuickAdd(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default LibraryView;

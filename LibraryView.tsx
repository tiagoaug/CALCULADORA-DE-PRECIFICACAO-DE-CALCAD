import React, { useState } from 'react';
import {
    X, Plus, Trash2, Search, Package, Users,
    TrendingUp, Calculator, Ruler, Download, Upload, Database, RefreshCw, Edit2, Check, XCircle,
    DollarSign, Percent, Maximize, Settings
} from 'lucide-react';
import { formatCurrency, calculateSolaAverageCost } from './utils/calculations';
import { LibraryData, Sola, SolaMaterial, SolaLaborItem, SolaGradeItem } from './types';

interface LibraryItem {
    id: string;
    nome: string;
    quantidade?: number;
    unidade?: string;
    valor?: number;
    valor_unitario?: number;
    valorUnitario?: number;
    aliquota?: number;
}

interface LibraryViewProps {
    library: LibraryData;
    existingItemsNames?: string[];
    units: string[];
    onClose: () => void;
    onSelectItem: (type: string, item: any) => void;
    onAddItem: (type: keyof LibraryData, item: any) => void;
    onDeleteItem: (type: keyof LibraryData, id: string) => void;
    onUpdateItem: (type: keyof LibraryData, id: string, item: any) => void;
    onUpdateUnits: (units: string[]) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ library, existingItemsNames = [], units, onClose, onSelectItem, onAddItem, onDeleteItem, onUpdateItem, onUpdateUnits }) => {
    const [activeTab, setActiveTab] = useState<keyof LibraryData>('insumos');
    const [showDetails, setShowDetails] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newItem, setNewItem] = useState<Partial<LibraryItem>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<LibraryItem & Sola>>({});
    
    // States specifically for Sola complex form
    const [solaMaterials, setSolaMaterials] = useState<SolaMaterial[]>([]);
    const [solaGrades, setSolaGrades] = useState<SolaGradeItem[]>([]);
    const [solaLabor, setSolaLabor] = useState<SolaLaborItem[]>([]);
    const [solaFornecedor, setSolaFornecedor] = useState('');

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
            setNewItem({ nome: sola.nome });
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
        setNewItem({});
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
            case 'insumos': return <Package {...props} />;
            case 'terceirizados': return <Users {...props} />;
            case 'custosFixos': return <Calculator {...props} />;
            case 'custosIndiretos': return <TrendingUp {...props} />;
            case 'impostos': return <Percent {...props} />;
            case 'comissoes': return <Users {...props} />;
            case 'fretes': return <Download {...props} />;
            case 'solados': return <Database {...props} />;
            default: return <Database {...props} />;
        }
    };

    const getThemeColor = (tab: keyof LibraryData) => {
        switch (tab) {
            case 'insumos': return 'blue';
            case 'terceirizados': return 'purple';
            case 'custosFixos': return 'orange';
            case 'custosIndiretos': return 'rose';
            case 'impostos': return 'amber';
            case 'comissoes': return 'indigo';
            case 'fretes': return 'cyan';
            case 'solados': return 'teal';
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
            case 'insumos': return 'Materiais e Peças';
            case 'terceirizados': return 'Serviços';
            case 'custosFixos': return 'Fixos';
            case 'custosIndiretos': return 'Variáveis';
            case 'impostos': return 'Impostos';
            case 'comissoes': return 'Comissões';
            case 'fretes': return 'Fretes';
            case 'solados': return 'Solados';
            default: return tab;
        }
    };

    const items = library[activeTab] || [];

    const filteredItems = items.filter(item =>
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800">

                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
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
                        <div className={`p-3 rounded-2xl ${getTabColor(showDetails ? activeTab : 'insumos')} shadow-sm`}>
                            {showDetails ? getTabIcon(activeTab, "w-8 h-8") : <Database className="w-8 h-8" fill="currentColor" fillOpacity={0.2} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase">
                                {showDetails ? getTabLabel(activeTab) : "Biblioteca de Custos"}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {showDetails ? `Gerencie seus itens de ${getTabLabel(activeTab).toLowerCase()}` : "Selecione uma categoria para gerenciar"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowUnitManager(!showUnitManager)}
                            className={`p-2.5 rounded-xl transition-all ${showUnitManager ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500'}`}
                            title="Gerenciar Unidades de Medida"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                        <button onClick={onClose} title="Fechar Biblioteca" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {!showDetails ? (
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                            {(['insumos', 'terceirizados', 'custosFixos', 'custosIndiretos', 'impostos', 'comissoes', 'fretes', 'solados'] as const).map(tab => (
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
                                <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Nome do Item</label>
                                <input
                                    type="text"
                                    value={newItem.nome || ''}
                                    onChange={e => setNewItem({ ...newItem, nome: e.target.value })}
                                    placeholder="Ex: Cabedal, Forro, Sola..."
                                    className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                />
                            </div>

                            {(activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                <div className="w-32">
                                    <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>Unidade</label>
                                    <select
                                        value={newItem.unidade || units[0]}
                                        onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}
                                        className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                        title="Selecionar unidade"
                                    >
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className={`text-[9px] font-black text-${getThemeColor(activeTab)}-600 uppercase mb-1.5 block`}>
                                    {(activeTab === 'impostos' || activeTab === 'comissoes') ? 'Alíquota (%)' : 'Valor'}
                                </label>
                                <div className="relative">
                                    {(activeTab === 'impostos' || activeTab === 'comissoes') ? (
                                        <Percent className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-${getThemeColor(activeTab)}-400`} />
                                    ) : (
                                        <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-${getThemeColor(activeTab)}-400`} />
                                    )}
                                    <input
                                        type="number"
                                        value={newItem.aliquota || newItem.valorUnitario || newItem.valor || ''}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            const key = (activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : (activeTab === 'custosFixos' || activeTab === 'custosIndiretos' || activeTab === 'fretes') ? 'valor' : 'valorUnitario';
                                            setNewItem({ ...newItem, [key]: val });
                                        }}
                                        placeholder="0,00"
                                        className={`w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500`}
                                    />
                                </div>
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
                                <div className={`bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-dashed border-${getThemeColor(activeTab)}-200 dark:border-${getThemeColor(activeTab)}-800`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest text-${getThemeColor(activeTab)}-600`}>Composição de Materiais (g)</h4>
                                        <button 
                                            onClick={() => {
                                                const materialId = library.insumos[0]?.id || '';
                                                if (materialId) setSolaMaterials([...solaMaterials, { id: Math.random().toString(36), materialId, pesoGrams: 0 }]);
                                            }}
                                            title="Adicionar material à composição"
                                            className={`p-1.5 bg-${getThemeColor(activeTab)}-100 dark:bg-${getThemeColor(activeTab)}-900/40 text-${getThemeColor(activeTab)}-600 rounded-lg hover:bg-${getThemeColor(activeTab)}-200 transition-colors`}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {solaMaterials.map((mat, idx) => {
                                            const selectedMat = library.insumos.find(i => i.id === mat.materialId);
                                            const effectivePrice = mat.precoAlternativo !== undefined ? mat.precoAlternativo : (selectedMat?.valorUnitario || 0);
                                            const matCost = (mat.pesoGrams / 1000) * effectivePrice;
                                            const averageWeight = solaGrades.length > 0 
                                                ? solaGrades.reduce((acc, curr) => acc + (curr.peso || 0), 0) / solaGrades.length 
                                                : 0;
                                            
                                            return (
                                                <div key={mat.id} className={`flex flex-col gap-4 bg-white dark:bg-slate-950 border-l-4 border-${getThemeColor(activeTab)}-500 shadow-sm p-4 rounded-xl w-full transition-all hover:shadow-md mb-2`}>
                                                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                        <div className="flex-1 flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Material</span>
                                                            <select 
                                                                value={mat.materialId}
                                                                onChange={e => {
                                                                    const newMats = [...solaMaterials];
                                                                    newMats[idx].materialId = e.target.value;
                                                                    setSolaMaterials(newMats);
                                                                }}
                                                                title="Selecionar material"
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-xs font-bold"
                                                            >
                                                                <option value="">Selecione um material</option>
                                                                {library.insumos.map(i => (
                                                                    <option key={i.id} value={i.id}>{i.nome} ({formatCurrency(i.valorUnitario)}/Kg)</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <button 
                                                            onClick={() => setSolaMaterials(solaMaterials.filter((_, i) => i !== idx))} 
                                                            title="Remover material" 
                                                            className="mt-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Peso e Média</span>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="relative group">
                                                                    <input 
                                                                        type="number" 
                                                                        value={mat.pesoGrams || ''} 
                                                                        onChange={e => {
                                                                            const newMats = [...solaMaterials];
                                                                            newMats[idx].pesoGrams = Number(e.target.value);
                                                                            setSolaMaterials(newMats);
                                                                        }}
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

                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preço Alternativo (Kg)</span>
                                                            <div className="relative group">
                                                                <DollarSign className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-${getThemeColor(activeTab)}-600/50`} />
                                                                <input 
                                                                    type="number" 
                                                                    value={mat.precoAlternativo !== undefined ? mat.precoAlternativo : ''} 
                                                                    onChange={e => {
                                                                        const newMats = [...solaMaterials];
                                                                        newMats[idx].precoAlternativo = e.target.value === '' ? undefined : Number(e.target.value);
                                                                        setSolaMaterials(newMats);
                                                                    }}
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
                                                            type="number" 
                                                            placeholder="Peso (g)" 
                                                            value={g.peso || ''} 
                                                            onChange={e => {
                                                                const newGrade = [...solaGrades];
                                                                newGrade[idx].peso = Number(e.target.value);
                                                                setSolaGrades(newGrade);
                                                            }}
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
                                                                type="number" 
                                                                placeholder="0.00" 
                                                                value={l.valor || ''} 
                                                                onChange={e => {
                                                                    const newLabor = [...solaLabor];
                                                                    newLabor[idx].valor = Number(e.target.value);
                                                                    setSolaLabor(newLabor);
                                                                }}
                                                                className="w-full bg-white dark:bg-slate-950 sm:bg-slate-50 sm:dark:bg-slate-900 border-none rounded-lg px-2 py-1.5 text-[10px] font-bold text-right"
                                                            />
                                                        </div>
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
                                        <Database className="w-5 h-5" /> {editingId ? 'Salvar Alterações Sola' : 'Cadastrar Sola de Fabricação'}
                                    </button>
                                </div>

                                {/* Formação do Preço de Custo (Breakdown) */}
                                <div className={`bg-gradient-to-br from-${getThemeColor(activeTab)}-600 to-${getThemeColor(activeTab)}-700 p-6 rounded-[2rem] text-white shadow-xl shadow-${getThemeColor(activeTab)}-500/20 border border-white/10`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Calculator className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] leading-tight">Formação do Preço de Custo</h4>
                                            <p className={`text-[9px] font-bold text-${getThemeColor(activeTab)}-100 uppercase tracking-widest leading-none mt-1 opacity-70`}>Total por par de calçado</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/20 transition-all cursor-default">
                                            <p className={`text-[9px] font-black text-${getThemeColor(activeTab)}-200 uppercase mb-1 flex items-center gap-1.5`}>
                                                <Package className="w-3 h-3" /> Materiais
                                            </p>
                                            <p className="text-xl font-mono font-black tracking-tight">
                                                {formatCurrency(solaMaterials.reduce((acc, mat) => {
                                                    const selectedMat = library.insumos.find(i => i.id === mat.materialId);
                                                    const price = mat.precoAlternativo !== undefined ? mat.precoAlternativo : (selectedMat?.valorUnitario || 0);
                                                    return acc + ((mat.pesoGrams / 1000) * price);
                                                }, 0))}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 group hover:bg-white/20 transition-all cursor-default">
                                            <p className={`text-[9px] font-black text-${getThemeColor(activeTab)}-200 uppercase mb-1 flex items-center gap-1.5`}>
                                                <Users className="w-3 h-3" /> Mão de Obra
                                            </p>
                                            <p className="text-xl font-mono font-black tracking-tight">
                                                {formatCurrency(solaLabor.reduce((acc, l) => acc + (l.valor || 0), 0))}
                                            </p>
                                        </div>
                                        <div className={`p-4 bg-${getThemeColor(activeTab)}-500/40 rounded-2xl backdrop-blur-md border border-white/20 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default lg:col-span-1 sm:col-span-3`}>
                                            <p className="text-[9px] font-black text-white uppercase mb-1 flex items-center gap-1.5 z-10 relative">
                                                <TrendingUp className="w-3 h-3" /> Custo Total / Par
                                            </p>
                                            <p className="text-2xl font-mono font-black tracking-tighter text-white z-10 relative">
                                                {formatCurrency(
                                                    solaMaterials.reduce((acc, mat) => {
                                                        const selectedMat = library.insumos.find(i => i.id === mat.materialId);
                                                        const price = mat.precoAlternativo !== undefined ? mat.precoAlternativo : (selectedMat?.valorUnitario || 0);
                                                        return acc + ((mat.pesoGrams / 1000) * price);
                                                    }, 0) + 
                                                    solaLabor.reduce((acc, l) => acc + (l.valor || 0), 0)
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'solados' && (
                            <button
                                onClick={handleAddItem}
                                className={`self-end px-8 py-2.5 bg-${getThemeColor(activeTab)}-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-${getThemeColor(activeTab)}-500/20 hover:bg-${getThemeColor(activeTab)}-700 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95`}
                            >
                                <Plus className="w-5 h-5" /> Cadastrar
                            </button>
                        )}
                    </div>

                    {/* Units Manager UI */}
                    {showUnitManager && (
                        <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Settings className="w-3.5 h-3.5" /> Gerenciar Unidades de Medida
                                </h3>
                                <button onClick={() => setShowUnitManager(false)} title="Fechar" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    value={newUnitName}
                                    onChange={e => setNewUnitName(e.target.value)}
                                    placeholder="Nova unidade (Ex: Galão)"
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button 
                                    onClick={() => {
                                        if (newUnitName && !units.includes(newUnitName)) {
                                            onUpdateUnits([...units, newUnitName]);
                                            setNewUnitName('');
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {units.map(u => (
                                    <div key={u} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-1 py-1 rounded-lg shadow-sm">
                                        <span className="text-[10px] font-bold uppercase">{u}</span>
                                        <button 
                                            onClick={() => onUpdateUnits(units.filter(unit => unit !== u))}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-md transition-all"
                                            title="Remover unidade"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar na biblioteca local..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-${getThemeColor(activeTab)}-500 transition-all`}
                        />
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            <p className="text-slate-400 text-sm font-bold">Nenhum item cadastrado nesta categoria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredItems.map(item => {
                                const isAdded = existingItemsNames.some(name => name.toLowerCase() === item.nome.toLowerCase());
                                return (
                                    <div key={item.id} className={`group bg-white dark:bg-slate-900 border ${editingId === item.id ? `border-${getThemeColor(activeTab)}-500 ring-2 ring-${getThemeColor(activeTab)}-500/10` : isAdded ? 'border-slate-100 dark:border-slate-800 opacity-40 grayscale' : 'border-slate-200 dark:border-slate-800'} p-4 rounded-2xl transition-all shadow-sm ${!isAdded ? `hover:shadow-md hover:border-${getThemeColor(activeTab)}-200 dark:hover:border-${getThemeColor(activeTab)}-900/40` : 'pointer-events-none'}`}>
                                        {editingId === item.id ? (
                                            <div className="space-y-3">
                                                <input
                                                    className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl px-3 py-2.5 text-sm font-black uppercase text-slate-800 dark:text-white"
                                                    value={editForm.nome || ''}
                                                    title="Nome do item"
                                                    placeholder="Nome do item"
                                                    onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    {(activeTab === 'insumos' || activeTab === 'terceirizados') && (
                                                        <select
                                                            className="w-24 bg-slate-100 dark:bg-slate-950 border-none rounded-xl px-2 py-2.5 text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 outline-none"
                                                            value={editForm.unidade || ''}
                                                            onChange={e => setEditForm({ ...editForm, unidade: e.target.value })}
                                                            title="Unidade"
                                                        >
                                                            {units.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    )}
                                                            <div className="flex-1 relative">
                                                                {(activeTab === 'impostos' || activeTab === 'comissoes') ? (
                                                                    <Percent className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-${getThemeColor(activeTab)}-600`} />
                                                                ) : (
                                                                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-${getThemeColor(activeTab)}-600`} />
                                                                )}
                                                                <input
                                                                    type="number"
                                                                    className={`w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-right text-${getThemeColor(activeTab)}-600`}
                                                                    value={editForm.aliquota || editForm.valorUnitario || editForm.valor || ''}
                                                            title="Valor do item"
                                                            placeholder="0,00"
                                                            onChange={e => setEditForm({ ...editForm, [(activeTab === 'impostos' || activeTab === 'comissoes') ? 'aliquota' : (activeTab === 'custosFixos' || activeTab === 'custosIndiretos' || activeTab === 'fretes') ? 'valor' : 'valorUnitario']: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button onClick={cancelEditing} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Cancelar"><XCircle className="w-5 h-5" /></button>
                                                    <button onClick={handleSaveEdit} className={`px-6 py-2.5 bg-${getThemeColor(activeTab)}-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-${getThemeColor(activeTab)}-700 transition-all shadow-md shadow-${getThemeColor(activeTab)}-500/20`}><Check className="w-4 h-4" /> Salvar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0 pr-4 cursor-pointer flex items-center gap-3" onClick={() => !isAdded && onSelectItem(activeTab, item)}>
                                                    <div className={`p-2 rounded-xl bg-${getThemeColor(activeTab)}-500/10 shrink-0 text-${getThemeColor(activeTab)}-600`}>
                                                        {getTabIcon(activeTab, "w-4 h-4")}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-black text-slate-800 dark:text-white text-sm truncate uppercase">{item.nome}</h4>
                                                            {isAdded && (
                                                                <span className="bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">JÁ NO PROJETO</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            {activeTab === 'solados' ? (
                                                                <>
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(item as Sola).fornecedor || 'Fab. Própria'}</span>
                                                                    <span className={`text-[12px] font-black text-${getThemeColor(activeTab)}-600 font-mono`}>
                                                                        {formatCurrency(calculateSolaAverageCost(item as Sola, library.insumos))} / par (médio)
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    {item.unidade && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.unidade}</span>}
                                                                    <span className={`text-[12px] font-black text-${getThemeColor(activeTab)}-600 font-mono`}>
                                                                        {(activeTab === 'impostos' || activeTab === 'comissoes') 
                                                                            ? `${item.aliquota?.toFixed(2)}%`
                                                                            : formatCurrency(item.valor_unitario || item.valorUnitario || item.valor || 0)
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                                                    {!isAdded && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditing(item)}
                                                                className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-all shrink-0"
                                                                title="Editar item"
                                                            >
                                                                <Edit2 className="w-4 h-4 shrink-0" />
                                                            </button>
                                                            <button
                                                                onClick={() => onSelectItem(activeTab, item)}
                                                                className={`p-2.5 bg-${getThemeColor(activeTab)}-50 dark:bg-${getThemeColor(activeTab)}-900/20 text-${getThemeColor(activeTab)}-600 rounded-lg hover:bg-${getThemeColor(activeTab)}-100 transition-all shrink-0`}
                                                                title="Usar no cálculo"
                                                            >
                                                                <Plus className="w-4 h-4 shrink-0" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => onDeleteItem(activeTab, item.id)}
                                                        className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-all shrink-0"
                                                        title="Remover permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4 shrink-0" />
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

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{filteredItems.length} itens no seu dispositivo</span>
                    <span className="flex items-center gap-2"><div className={`w-1.5 h-1.5 bg-${getThemeColor(showDetails ? activeTab : 'solados')}-500 rounded-full animate-pulse`}></div> Armazenamento Local Ativo</span>
                </div>
            </div>
        </div>
    );
};

export default LibraryView;

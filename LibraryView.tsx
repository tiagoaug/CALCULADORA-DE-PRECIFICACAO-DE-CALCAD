import React, { useState } from 'react';
import {
    X, Plus, Trash2, Search, Package, Users,
    TrendingUp, Calculator, Ruler, Download, Upload, Database, RefreshCw, Edit2, Check, XCircle,
    DollarSign
} from 'lucide-react';
import { formatCurrency } from './utils/calculations';
import { LibraryData } from './types';

interface LibraryItem {
    id: string;
    nome: string;
    quantidade?: number;
    unidade?: string;
    valor?: number;
    valor_unitario?: number;
    valorUnitario?: number;
}

interface LibraryViewProps {
    library: LibraryData;
    existingItemsNames?: string[];
    onClose: () => void;
    onSelectItem: (type: string, item: any) => void;
    onAddItem: (type: keyof LibraryData, item: any) => void;
    onDeleteItem: (type: keyof LibraryData, id: string) => void;
    onUpdateItem: (type: keyof LibraryData, id: string, item: any) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ library, existingItemsNames = [], onClose, onSelectItem, onAddItem, onDeleteItem, onUpdateItem }) => {
    const [activeTab, setActiveTab] = useState<keyof LibraryData>('insumos');
    const [searchTerm, setSearchTerm] = useState('');
    const [newItem, setNewItem] = useState<Partial<LibraryItem>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<LibraryItem>>({});

    const handleAddItem = () => {
        if (!newItem.nome) return;
        onAddItem(activeTab, newItem);
        setNewItem({});
    };

    const startEditing = (item: LibraryItem) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = () => {
        if (editingId && editForm.nome) {
            onUpdateItem(activeTab, editingId, editForm);
            setEditingId(null);
            setEditForm({});
        }
    };

    const getTabIcon = (tab: keyof LibraryData) => {
        switch (tab) {
            case 'insumos': return <Package className="w-4 h-4" />;
            case 'servicos': return <Users className="w-4 h-4" />;
            case 'custosFixos': return <Calculator className="w-4 h-4" />;
            case 'custosVariaveis': return <TrendingUp className="w-4 h-4" />;
            default: return <Database className="w-4 h-4" />;
        }
    };

    const getTabLabel = (tab: keyof LibraryData) => {
        switch (tab) {
            case 'insumos': return 'Peças';
            case 'servicos': return 'Serviços';
            case 'custosFixos': return 'Fixos';
            case 'custosVariaveis': return 'Variáveis';
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
                    <div className="flex items-center gap-3">
                        <Database className="w-6 h-6 text-emerald-600" />
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase">Biblioteca de Custos</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens cadastrados localmente no navegador</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 mx-6 mb-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {(['insumos', 'servicos', 'custosFixos', 'custosVariaveis'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); cancelEditing(); }}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-xl ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm border border-slate-100 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {getTabIcon(tab)}
                            {getTabLabel(tab)}
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">

                    <div className="flex flex-wrap gap-4 mb-8 bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Nome do Item</label>
                            <input
                                type="text"
                                value={newItem.nome || ''}
                                onChange={e => setNewItem({ ...newItem, nome: e.target.value })}
                                placeholder="Ex: Cabedal, Forro, Sola..."
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        {activeTab === 'insumos' && (
                            <>
                                <div className="w-24">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Unid.</label>
                                    <input
                                        type="text"
                                        value={newItem.unidade || ''}
                                        onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}
                                        title="Unidade de medida"
                                        placeholder="un"
                                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-center shadow-sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Valor Unit.</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                                        <input
                                            type="number"
                                            value={newItem.valorUnitario || ''}
                                            onChange={e => setNewItem({ ...newItem, valorUnitario: Number(e.target.value) })}
                                            title="Valor unitário"
                                            placeholder="0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-right shadow-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {(activeTab === 'servicos') && (
                            <>
                                <div className="w-24">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Unid.</label>
                                    <input
                                        type="text"
                                        value={newItem.unidade || ''}
                                        onChange={e => setNewItem({ ...newItem, unidade: e.target.value })}
                                        placeholder="und"
                                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-center shadow-sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Valor Unit.</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                                        <input
                                            type="number"
                                            value={newItem.valorUnitario || ''}
                                            onChange={e => setNewItem({ ...newItem, valorUnitario: Number(e.target.value) })}
                                            placeholder="0,00"
                                            className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-right shadow-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {(activeTab === 'custosFixos' || activeTab === 'custosVariaveis') && (
                            <div className="w-32">
                                <label className="text-[9px] font-black text-emerald-600 uppercase mb-1.5 block">Valor Mensal</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                                    <input
                                        type="number"
                                        value={newItem.valor || ''}
                                        onChange={e => setNewItem({ ...newItem, valor: Number(e.target.value) })}
                                        placeholder="0,00"
                                        className="w-full bg-white dark:bg-slate-800 border-none rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-right shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleAddItem}
                            className="self-end px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                        >
                            <Plus className="w-5 h-5" /> Cadastrar
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar na biblioteca local..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
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
                                    <div key={item.id} className={`group bg-white dark:bg-slate-900 border ${editingId === item.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : isAdded ? 'border-slate-100 dark:border-slate-800 opacity-40 grayscale' : 'border-slate-200 dark:border-slate-800'} p-4 rounded-2xl transition-all shadow-sm ${!isAdded ? 'hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/40' : 'pointer-events-none'}`}>
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
                                                    {(activeTab === 'insumos' || activeTab === 'servicos') && (
                                                        <input
                                                            className="w-20 bg-slate-100 dark:bg-slate-950 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-center"
                                                            value={editForm.unidade || ''}
                                                            onChange={e => setEditForm({ ...editForm, unidade: e.target.value })}
                                                            placeholder="und"
                                                        />
                                                    )}
                                                    <div className="flex-1 relative">
                                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600" />
                                                        <input
                                                            type="number"
                                                            className="w-full bg-slate-100 dark:bg-slate-950 border-none rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono font-bold text-right text-emerald-600"
                                                            value={editForm.valorUnitario || editForm.valor || ''}
                                                            onChange={e => setEditForm({ ...editForm, [(activeTab === 'custosFixos' || activeTab === 'custosVariaveis') ? 'valor' : 'valorUnitario']: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button onClick={cancelEditing} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Cancelar"><XCircle className="w-5 h-5" /></button>
                                                    <button onClick={handleSaveEdit} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20"><Check className="w-4 h-4" /> Salvar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => !isAdded && onSelectItem(activeTab, item)}>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm truncate uppercase">{item.nome}</h4>
                                                        {isAdded && (
                                                            <span className="bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">JÁ NO PROJETO</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {item.unidade && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.unidade}</span>}
                                                        <span className="text-[12px] font-black text-emerald-600 font-mono">
                                                            {formatCurrency(item.valor_unitario || item.valorUnitario || item.valor || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-all">
                                                    {!isAdded && (
                                                        <>
                                                            <button
                                                                onClick={() => startEditing(item)}
                                                                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                                                title="Editar item"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onSelectItem(activeTab, item)}
                                                                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                                                                title="Usar no cálculo"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => onDeleteItem(activeTab, item.id)}
                                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                                                        title="Remover permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{filteredItems.length} itens no seu dispositivo</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Armazenamento Local Ativo</span>
                </div>
            </div>
        </div>
    );
};

export default LibraryView;

import React, { useState, useMemo } from 'react';
import { X, Save, Package, Users, Ruler, DollarSign, Box } from 'lucide-react';
import { formatCurrency } from './utils/calculations';

interface QuickAddModalProps {
  type: 'insumos' | 'terceirizados' | 'pecas';
  units: string[];
  onClose: () => void;
  onSave: (item: any) => void;
  getThemeColor: (type: string) => string;
  initialName?: string;
}

const QuickAddModal: React.FC<QuickAddModalProps> = ({ type, units = [], onClose, onSave, getThemeColor, initialName }) => {
  const unitStrings = useMemo(() => 
    units.map(u => typeof u === 'string' ? u : (u as any).nome || ''), 
    [units]
  );

  const [formData, setFormData] = useState<any>({
    nome: initialName || '',
    unidade: unitStrings[0] || 'Un',
    valor: 0,
    quantidadeCompra: 1,
    valorUnitario: 0,
    fator: (unitStrings[0] || '').toLowerCase().includes('kg') ? 1000 : 1,
    rendimento: 1,
    comentario: ''
  });

  const color = getThemeColor(type);

  const handleSave = () => {
    if (!formData.nome) return;
    
    // Calcular valor unitário final se não estiver setado
    const finalItem = { ...formData };
    if (finalItem.quantidadeCompra > 1 && finalItem.valor > 0) {
        finalItem.valorUnitario = finalItem.valor / finalItem.quantidadeCompra;
    } else if (finalItem.valor > 0) {
        finalItem.valorUnitario = finalItem.valor;
    }

    onSave(finalItem);
    onClose();
  };

  const getTitle = () => {
    switch (type) {
      case 'insumos': return 'Rápido: Novo Material';
      case 'terceirizados': return 'Rápido: Novo Serviço';
      case 'pecas': return 'Rápido: Nova Peça';
      default: return 'Cadastro Rápido';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'insumos': return <Package className={`w-6 h-6 text-${color}-500`} />;
      case 'terceirizados': return <Users className={`w-6 h-6 text-${color}-500`} />;
      case 'pecas': return <Box className={`w-6 h-6 text-${color}-500`} />;
      default: return <Package className={`w-6 h-6 text-${color}-500`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className={`bg-${color}-500 p-6 flex justify-between items-center text-white`}>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">{getTitle()}</h3>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Preencha os dados básicos</p>
            </div>
          </div>
          <button onClick={onClose} title="Fechar" aria-label="Fechar" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome do Item</label>
            <input 
              autoFocus
              type="text"
              title="Nome do Item"
              placeholder="Ex: Couro Bovino Premium"
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-${color}-500/20 shadow-sm transition-all`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Unidade */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unidade de Medida</label>
              <div className="relative">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  value={formData.unidade}
                  title="Unidade de Medida"
                  onChange={e => {
                    const newUnit = e.target.value;
                    const newFator = newUnit.toLowerCase().includes('kg') ? 1000 : 1;
                    setFormData({...formData, unidade: newUnit, fator: newFator});
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 appearance-none shadow-sm"
                >
                  {unitStrings.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Valor */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                {type === 'insumos' ? 'Preço de Compra' : 'Valor do Serviço'}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="number"
                  placeholder="0,00"
                  title="Preço / Valor"
                  value={formData.valor || ''}
                  onChange={e => setFormData({...formData, valor: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-green-500/20 shadow-sm"
                />
              </div>
            </div>

            {type === 'insumos' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qtd na Embalagem</label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number"
                    title="Quantidade na Embalagem"
                    value={formData.quantidadeCompra}
                    onChange={e => setFormData({...formData, quantidadeCompra: parseFloat(e.target.value) || 1})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {type === 'insumos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  Fator (Embalagem)
                  <span className="text-[8px] opacity-60 normal-case">Ex: 1000g em 1Kg</span>
                </label>
                <input 
                  type="number"
                  title="Fator de Conversão"
                  value={formData.fator}
                  onChange={e => setFormData({...formData, fator: parseFloat(e.target.value) || 1})}
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  Rendimento Médio
                  <span className="text-[8px] opacity-60 normal-case">Pares por Embalagem</span>
                </label>
                <input 
                  type="number"
                  title="Rendimento Médio"
                  value={formData.rendimento}
                  onChange={e => setFormData({...formData, rendimento: parseFloat(e.target.value) || 1})}
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2 text-xs font-bold"
                />
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Custo por Unidade ({formData.unidade})</label>
                  <div className="text-xs font-black text-blue-600">
                    {formatCurrency(formData.valor / (formData.quantidadeCompra || 1))}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Custo Estimado por Par</label>
                  <div className="text-xs font-black text-emerald-600">
                    {formatCurrency((formData.valor / (formData.quantidadeCompra || 1)) * (formData.fator / (formData.rendimento || 1)) / (formData.fator || 1))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comentário */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observações (Opcional)</label>
            <textarea 
              rows={2}
              title="Observações"
              placeholder="Alguma nota importante sobre este item..."
              value={formData.comentario}
              onChange={e => setFormData({...formData, comentario: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-slate-500/10 shadow-sm resize-none"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex gap-4">
          <button 
            onClick={onClose}
            title="Cancelar Cadastro"
            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!formData.nome}
            title="Salvar e Usar Item"
            className={`flex-1 py-4 bg-${color}-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-${color}-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale`}
          >
            <Save className="w-4 h-4" />
            Cadastrar e Usar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;

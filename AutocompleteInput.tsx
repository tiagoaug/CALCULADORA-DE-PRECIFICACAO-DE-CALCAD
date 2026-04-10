import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

interface Suggestion {
  id: string;
  nome: string;
  unidade?: string;
  valorUnitario?: number;
  valor_unitario?: number;
  valor?: number;
}

interface AutocompleteInputProps {
  id?: string;
  value: string;
  suggestions: Suggestion[];
  placeholder?: string;
  className?: string;
  onSelect: (item: Suggestion) => void;
  onChange: (value: string) => void;
  hidePrice?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  value,
  suggestions = [],
  placeholder,
  className,
  onSelect,
  onChange,
  hidePrice = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<Suggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && Array.isArray(suggestions)) {
      const searchTerm = value.toLowerCase();
      const matches = suggestions.filter(s => {
        if (!s || !s.nome) return false;
        if (searchTerm.length === 0) return true;
        const name = s.nome.toLowerCase();
        const words = name.split(' ');
        return name.startsWith(searchTerm) || words.some(word => word.startsWith(searchTerm));
      }).slice(0, 8);
      setFiltered(matches);
      setHighlightedIndex(-1);
    } else {
      setFiltered([]);
    }
  }, [value, suggestions, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      onSelect(filtered[highlightedIndex]);
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        title={placeholder || "Buscar item"}
        className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${className}`}
      />
      
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[9999] w-full mt-2 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="py-2">
            {filtered.map((item, index) => (
              <li
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  highlightedIndex === index 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="block font-bold text-slate-800 dark:text-white truncate" title={item.nome}>{item.nome}</span>
                   {item.unidade && !hidePrice && (
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unidade} • R$ {(item.valor_unitario || item.valorUnitario || item.valor || 0).toFixed(2).replace('.', ',')}</span>
                   )}
                   {item.unidade && hidePrice && (
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.unidade}</span>
                   )}
                </div>
                {highlightedIndex === index && <Check className="w-4 h-4" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;

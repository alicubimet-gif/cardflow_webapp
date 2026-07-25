import React, { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';

interface SearchableMultiSelectProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function SearchableMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options..."
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) &&
    !selectedValues.includes(opt.value)
  );

  const handleSelect = (val: string) => {
    onChange([...selectedValues, val]);
    setSearch('');
  };

  const handleRemove = (val: string) => {
    onChange(selectedValues.filter(v => v !== val));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedValues.map(val => {
          const opt = options.find(o => o.value === val);
          return (
            <span key={val} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-semibold">
              {opt ? opt.label : val}
              <button
                type="button"
                onClick={() => handleRemove(val)}
                className="text-slate-400 hover:text-slate-600 focus:outline-hidden font-bold cursor-pointer ml-1"
              >
                &times;
              </button>
            </span>
          );
        })}
        {selectedValues.length === 0 && (
          <span className="text-xs text-slate-400 italic">No assignments allocated yet.</span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs font-semibold text-slate-900 pr-8"
        />
        <div className="absolute right-2.5 top-2.5 text-slate-450 pointer-events-none">
          <Layers size={14} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-60 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-50">
          {filteredOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 hover:text-blue-700 text-xs font-semibold text-slate-700 transition-colors cursor-pointer block"
            >
              {opt.label}
            </button>
          ))}
          {filteredOptions.length === 0 && (
            <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
              No options available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

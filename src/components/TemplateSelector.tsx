import React from 'react';
import { templatesForIndustry } from '../services/templatesRegistry';

export default function TemplateSelector({ industryId, selected, onSelect }: { industryId: string; selected: string; onSelect: (id: string) => void }) {
  const options = industryId ? templatesForIndustry(industryId) : [];

  if (!industryId) {
    return (
      <div className="p-6 bg-neutral-900 border border-[#2F3336] rounded-lg text-sm text-neutral-400">请选择先选择行业。</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {options.map(opt => (
        <div key={opt.id} className={`p-4 rounded-lg border cursor-pointer ${selected === opt.id ? 'border-[#1D9BF0] bg-[#1D9BF0]/5' : 'border-[#2F3336] bg-neutral-950'}`} onClick={() => onSelect(opt.id)}>
          <div className="text-sm font-bold text-white">{opt.name}</div>
          <div className="text-xs text-[#8B949E] mt-2">{opt.description}</div>
          <div className="mt-3 text-[11px] text-[#8B949E] font-mono">模板 id: {opt.id}</div>
        </div>
      ))}
    </div>
  );
}

import React, { useState } from 'react';
import { Template } from '../types/editor';
import { TEMPLATES } from '../data/templates';
import { translations, Language } from '../utils/i18n';
import { X, Sparkles, LayoutTemplate, Crown } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  lang: Language;
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  lang,
  onSelectTemplate,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const t = translations[lang];

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: t.categories.all },
    { id: 'youtube', label: t.categories.youtube },
    { id: 'punjabi', label: t.categories.punjabi },
    { id: 'instagram', label: t.categories.instagram },
    { id: 'reels', label: t.categories.reels },
    { id: 'logo', label: t.categories.logo },
  ];

  const filteredTemplates =
    activeCategory === 'all'
      ? TEMPLATES
      : TEMPLATES.filter((tpl) => tpl.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {t.templates}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                YouTube, Instagram, Reels &amp; Punjabi Posters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto border-b border-slate-200 bg-white scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          {filteredTemplates.map((template) => {
            const isPunjabi = lang === 'pa';
            const title = isPunjabi ? template.titlePa : template.title;

            return (
              <div
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 hover:border-purple-400 bg-white hover:shadow-xl cursor-pointer transition transform hover:-translate-y-0.5"
              >
                {/* Visual Preview Banner */}
                <div
                  className={`h-36 w-full bg-gradient-to-br ${template.thumbnailGradient} flex flex-col items-center justify-center p-3 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />

                  {/* Sample stylized badge inside card */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <Crown className="w-6 h-6 text-amber-300 mb-1 drop-shadow" />
                    <span className="text-xs font-black tracking-widest text-white uppercase drop-shadow">
                      {template.category}
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 max-w-[200px] truncate drop-shadow">
                      {title}
                    </span>
                  </div>

                  {/* Size tag */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                    {template.preset.width} × {template.preset.height} ({template.preset.aspectRatio})
                  </span>
                </div>

                {/* Footer description */}
                <div className="p-3.5 flex items-center justify-between bg-white border-t border-slate-100">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 truncate">
                      {title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium capitalize truncate">
                      {template.preset.name}
                    </span>
                  </div>

                  <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white transition shadow-2xs">
                    Use
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

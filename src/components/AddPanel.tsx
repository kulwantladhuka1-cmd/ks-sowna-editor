import React, { useRef } from 'react';
import { ShapeType } from '../types/editor';
import { translations, Language, QUICK_PUNJABI_PHRASES } from '../utils/i18n';
import { STICKERS, StickerItem } from '../data/stickers';
import {
  Upload,
  Type,
  Square,
  Circle,
  Star,
  Crown,
  Shield,
  Heart,
  Triangle,
  Award,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

interface AddPanelProps {
  lang: Language;
  onAddText: (initialText?: string, font?: string) => void;
  onAddImage: (dataUrl: string) => void;
  onAddShape: (shapeType: ShapeType) => void;
  onAddSticker: (sticker: StickerItem) => void;
  onClose?: () => void;
}

export const AddPanel: React.FC<AddPanelProps> = ({
  lang,
  onAddText,
  onAddImage,
  onAddShape,
  onAddSticker,
  onClose,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onAddImage(result);
        if (onClose) onClose();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white border-t lg:border-t-0 lg:border-l border-slate-200 text-slate-900 overflow-y-auto font-sans">
      {/* Hidden file input for phone gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="p-4 space-y-6 pb-24">
        {/* 1. UPLOAD IMAGE FROM GALLERY */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            {t.uploadPhoto}
          </label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3.5 p-4 rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-pink-50 hover:border-purple-500 hover:shadow-md transition group active:scale-[0.98]"
          >
            <div className="p-3 rounded-xl bg-purple-600 text-white shadow-sm group-hover:scale-105 transition">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition">
                {t.uploadPhoto}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {t.uploadPhotoDesc}
              </div>
            </div>
          </button>
        </div>

        {/* 2. ADD TEXT (PUNJABI & ENGLISH) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {t.addText}
            </label>
            <span className="text-[11px] font-bold text-purple-600">
              Gurmukhi + English
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onAddText('ਪੰਜਾਬੀ ਟੈਕਸਟ', 'Anek Gurmukhi');
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md text-left transition"
            >
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">ਪੰਜਾਬੀ ਲਿਖਤ</div>
                <div className="text-[10px] text-slate-500 font-medium">Anek Gurmukhi</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAddText('KS SOWNA', 'Cinzel');
                if (onClose) onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md text-left transition"
            >
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Royal Gold Text</div>
                <div className="text-[10px] text-slate-500 font-medium">Cinzel Serif</div>
              </div>
            </button>
          </div>

          {/* Quick Punjabi phrases chips */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.textControls.quickPunjabiPhrases}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {QUICK_PUNJABI_PHRASES.slice(0, 10).map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onAddText(phrase, 'Baloo Paaji 2');
                    if (onClose) onClose();
                  }}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-slate-800 font-semibold transition truncate shadow-2xs"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. ADD SHAPES */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
            {t.addShape}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'rectangle', icon: Square, label: 'Rect' },
              { id: 'roundedRect', icon: Square, label: 'Round' },
              { id: 'circle', icon: Circle, label: 'Circle' },
              { id: 'ring', icon: Circle, label: 'Ring' },
              { id: 'crown', icon: Crown, label: 'Crown' },
              { id: 'shield', icon: Shield, label: 'Shield' },
              { id: 'star', icon: Star, label: 'Star' },
              { id: 'badge', icon: Award, label: 'Badge' },
              { id: 'triangle', icon: Triangle, label: 'Triangle' },
              { id: 'heart', icon: Heart, label: 'Heart' },
            ].map((shape) => {
              const Icon = shape.icon;
              return (
                <button
                  key={shape.id}
                  onClick={() => {
                    onAddShape(shape.id as ShapeType);
                    if (onClose) onClose();
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-800 transition"
                >
                  <Icon className="w-5 h-5 mb-1 text-purple-600" />
                  <span className="text-[10px] font-bold text-slate-800">{shape.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. ADD LUXURY STICKERS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {t.addSticker}
            </label>
            <span className="text-[11px] font-bold text-amber-600">
              Crowns &amp; Punjabi Badges
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => {
                  onAddSticker(sticker);
                  if (onClose) onClose();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md hover:scale-105 transition"
              >
                <div className="w-10 h-10 flex items-center justify-center text-amber-500 mb-1">
                  <svg
                    viewBox={sticker.viewBox}
                    className="w-8 h-8 fill-current drop-shadow-sm"
                  >
                    <path d={sticker.path} />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-slate-800 text-center truncate max-w-full">
                  {lang === 'pa' ? sticker.namePa : sticker.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

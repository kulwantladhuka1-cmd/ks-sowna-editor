import React, { useRef } from 'react';
import { CanvasBackground, CanvasPreset } from '../types/editor';
import { CANVAS_PRESETS } from '../data/templates';
import { translations, Language, COLOR_PALETTE, GOLD_GRADIENTS } from '../utils/i18n';
import {
  X,
  Maximize2,
  Palette,
  Upload,
  Check,
  Smartphone,
  Square,
  Tv,
  Image,
  Crown,
} from 'lucide-react';

interface CanvasSettingsModalProps {
  isOpen: boolean;
  lang: Language;
  currentWidth: number;
  currentHeight: number;
  background: CanvasBackground;
  onUpdateCanvasSize: (width: number, height: number, presetId: string) => void;
  onUpdateBackground: (bg: CanvasBackground) => void;
  onClose: () => void;
}

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({
  isOpen,
  lang,
  currentWidth,
  currentHeight,
  background,
  onUpdateCanvasSize,
  onUpdateBackground,
  onClose,
}) => {
  const t = translations[lang];
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        onUpdateBackground({
          ...background,
          type: 'image',
          imageSrc: src,
          imageOpacity: 1,
          imageBlur: 0,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'youtube-thumb':
      case 'youtube-banner':
        return <Tv className="w-5 h-5 text-red-500" />;
      case 'reels-story':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'punjabi-poster':
        return <Image className="w-5 h-5 text-indigo-600" />;
      case 'logo-maker':
        return <Crown className="w-5 h-5 text-amber-500" />;
      default:
        return <Square className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {t.canvas} &amp; {t.bgSettings}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentWidth} × {currentHeight} px
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* 1. CANVAS PRESETS */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              {t.canvasPresets}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {CANVAS_PRESETS.map((preset) => {
                const isSelected =
                  currentWidth === preset.width && currentHeight === preset.height;
                const label = lang === 'pa' ? preset.namePa : preset.name;

                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onUpdateCanvasSize(preset.width, preset.height, preset.id);
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-500 shadow-sm ring-1 ring-purple-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="mt-0.5">{getPresetIcon(preset.id)}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {preset.width} × {preset.height} ({preset.aspectRatio})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BACKGROUND SETTINGS */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              {t.bgSettings}
            </label>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
              {[
                { id: 'transparent', label: t.transparent },
                { id: 'solid', label: t.solidColor },
                { id: 'gradient', label: t.gradient },
                { id: 'image', label: 'Photo' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() =>
                    onUpdateBackground({
                      ...background,
                      type: mode.id as any,
                    })
                  }
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    background.type === mode.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Transparent Note */}
            {background.type === 'transparent' && (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="font-medium">{t.saveTransparentTip}</span>
              </div>
            )}

            {/* Solid Color Picker */}
            {background.type === 'solid' && (
              <div className="space-y-4">
                {/* Named Quick Swatches per User Request */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-2">
                    Popular Background Tones
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { name: 'White', color: '#ffffff', border: 'border-slate-300' },
                      { name: 'Light Grey', color: '#f1f5f9', border: 'border-slate-300' },
                      { name: 'Lavender', color: '#ede9fe', border: 'border-purple-200' },
                      { name: 'Sky Blue', color: '#e0f2fe', border: 'border-sky-200' },
                      { name: 'Mint Green', color: '#d1fae5', border: 'border-emerald-200' },
                      { name: 'Pink', color: '#fce7f3', border: 'border-pink-200' },
                    ].map((item) => {
                      const isActive = background.color?.toLowerCase() === item.color.toLowerCase();
                      return (
                        <button
                          key={item.name}
                          onClick={() => onUpdateBackground({ ...background, color: item.color })}
                          className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left transition ${
                            isActive
                              ? 'ring-2 ring-purple-600 border-purple-600 bg-purple-50/50'
                              : `${item.border} hover:border-slate-400 bg-white`
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] font-bold text-slate-800 truncate">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color with Hex input */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-2">
                    Custom Color
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={background.color || '#ffffff'}
                      onChange={(e) =>
                        onUpdateBackground({ ...background, color: e.target.value })
                      }
                      className="w-10 h-10 rounded-xl border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={background.color || '#ffffff'}
                      onChange={(e) =>
                        onUpdateBackground({ ...background, color: e.target.value })
                      }
                      className="w-28 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* Full Color Palette Grid */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
                    Extended Palette
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onUpdateBackground({ ...background, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full border border-black/10 shadow-xs transition transform hover:scale-110 ${
                          background.color?.toLowerCase() === c.toLowerCase()
                            ? 'ring-2 ring-purple-600 ring-offset-2'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gradient Presets */}
            {background.type === 'gradient' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {GOLD_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        onUpdateBackground({
                          ...background,
                          gradient: {
                            colors: grad.colors,
                            type: 'linear',
                            angle: grad.angle,
                          },
                        })
                      }
                      style={{
                        background: `linear-gradient(${grad.angle}deg, ${grad.colors[0]}, ${grad.colors[1]})`,
                      }}
                      className="h-10 rounded-xl border border-black/10 text-xs font-bold text-slate-900 drop-shadow-xs shadow-xs flex items-center justify-center transition hover:scale-102"
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Image Upload */}
            {background.type === 'image' && (
              <div className="space-y-3">
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  className="hidden"
                />

                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.uploadBgImage}</span>
                </button>

                {background.imageSrc && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Blur</span>
                      <span className="font-mono text-purple-600">
                        {background.imageBlur || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={background.imageBlur || 0}
                      onChange={(e) =>
                        onUpdateBackground({
                          ...background,
                          imageBlur: Number(e.target.value),
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />

                    <div className="flex justify-between text-xs font-bold text-slate-700 pt-1">
                      <span>Opacity</span>
                      <span className="font-mono text-purple-600">
                        {Math.round((background.imageOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={Math.round((background.imageOpacity ?? 1) * 100)}
                      onChange={(e) =>
                        onUpdateBackground({
                          ...background,
                          imageOpacity: Number(e.target.value) / 100,
                        })
                      }
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

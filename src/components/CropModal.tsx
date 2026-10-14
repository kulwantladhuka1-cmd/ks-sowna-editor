import React, { useState, useRef, useEffect } from 'react';
import { ImageLayer } from '../types/editor';
import { translations, Language } from '../utils/i18n';
import { X, Check, Crop as CropIcon } from 'lucide-react';

interface CropModalProps {
  layer: ImageLayer | null;
  lang: Language;
  onApplyCrop: (layerId: string, crop: { x: number; y: number; width: number; height: number }) => void;
  onClose: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  layer,
  lang,
  onApplyCrop,
  onClose,
}) => {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 100,
    height: 100,
  });

  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  });

  const [activeAspect, setActiveAspect] = useState<string>('free');
  const imgRef = useRef<HTMLImageElement | null>(null);
  const t = translations[lang];

  useEffect(() => {
    if (!layer) return;
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (layer.crop) {
        setCropRect({
          x: layer.crop.x / img.naturalWidth,
          y: layer.crop.y / img.naturalHeight,
          w: layer.crop.width / img.naturalWidth,
          h: layer.crop.height / img.naturalHeight,
        });
      } else {
        setCropRect({ x: 0, y: 0, w: 1, h: 1 });
      }
    };
    img.src = layer.src;
  }, [layer]);

  if (!layer) return null;

  const setAspect = (ratio: number | null, name: string) => {
    setActiveAspect(name);
    if (!ratio) {
      setCropRect({ x: 0, y: 0, w: 1, h: 1 });
      return;
    }

    const imgAspect = naturalSize.width / naturalSize.height;
    let newW = 1;
    let newH = 1;

    if (imgAspect > ratio) {
      newH = 0.9;
      newW = (ratio / imgAspect) * 0.9;
    } else {
      newW = 0.9;
      newH = (imgAspect / ratio) * 0.9;
    }

    setCropRect({
      x: (1 - newW) / 2,
      y: (1 - newH) / 2,
      w: newW,
      h: newH,
    });
  };

  const handleApply = () => {
    const finalCrop = {
      x: Math.round(cropRect.x * naturalSize.width),
      y: Math.round(cropRect.y * naturalSize.height),
      width: Math.round(cropRect.w * naturalSize.width),
      height: Math.round(cropRect.h * naturalSize.height),
    };
    onApplyCrop(layer.id, finalCrop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-xs">
              <CropIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black text-slate-900">
              {t.layerActions.crop}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Buttons */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-white border-b border-slate-200 overflow-x-auto scrollbar-none">
          {[
            { id: 'free', label: 'Reset (Full)', ratio: null },
            { id: '1:1', label: '1:1 Square', ratio: 1 },
            { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9 },
            { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5 },
            { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAspect(item.ratio, item.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                activeAspect === item.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Interactive Crop Visual Area */}
        <div className="relative flex-1 p-4 flex items-center justify-center bg-slate-900 min-h-[260px] overflow-hidden">
          <div className="relative max-w-full max-h-[380px] select-none">
            <img
              ref={imgRef}
              src={layer.src}
              alt="Crop target"
              className="max-w-full max-h-[380px] object-contain block opacity-60"
            />

            {/* Visual Crop Box overlay */}
            <div
              style={{
                left: `${cropRect.x * 100}%`,
                top: `${cropRect.y * 100}%`,
                width: `${cropRect.w * 100}%`,
                height: `${cropRect.h * 100}%`,
              }}
              className="absolute border-2 border-purple-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] pointer-events-none"
            >
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-purple-300/40" />
                <div className="border-r border-b border-purple-300/40" />
                <div className="border-b border-purple-300/40" />
                <div className="border-r border-b border-purple-300/40" />
                <div className="border-r border-b border-purple-300/40" />
                <div className="border-b border-purple-300/40" />
                <div className="border-r border-b border-purple-300/40" />
                <div className="border-r border-b border-purple-300/40" />
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};

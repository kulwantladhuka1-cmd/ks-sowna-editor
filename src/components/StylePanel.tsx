import React from 'react';
import {
  Layer,
  TextLayer,
  ImageLayer,
  ShapeLayer,
  StickerLayer,
  ShapeType,
} from '../types/editor';
import {
  translations,
  Language,
  AVAILABLE_FONTS,
  GOLD_GRADIENTS,
  COLOR_PALETTE,
  QUICK_PUNJABI_PHRASES,
} from '../utils/i18n';
import {
  Type,
  Sliders,
  Sparkles,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Crop,
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Circle,
  Square,
  Shield,
  Star,
  Crown,
  Heart,
  Triangle,
  Award,
  Eraser,
  Upload,
} from 'lucide-react';

interface StylePanelProps {
  layer: Layer | null;
  lang: Language;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onOpenCrop: (layer: ImageLayer) => void;
  onOpenEraser?: (layer: ImageLayer) => void;
  onClose?: () => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  layer,
  lang,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onBringForward,
  onSendBackward,
  onOpenCrop,
  onOpenEraser,
  onClose,
}) => {
  const t = translations[lang];
  const [customFonts, setCustomFonts] = React.useState<{ name: string; label: string; category: string }[]>([]);
  const fontInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUploadCustomFont = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const fontName = `Custom_${rawName}_${Date.now()}`;
      const fontFace = new FontFace(fontName, buffer);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      const fontEntry = {
        name: fontName,
        label: `Custom: ${file.name.slice(0, 20)}`,
        category: 'custom',
      };
      setCustomFonts((prev) => [fontEntry, ...prev]);
      if (layer && layer.type === 'text') {
        onUpdateLayer(layer.id, { fontFamily: fontName });
      }
    } catch (err) {
      console.error('Failed to load custom font:', err);
    }
  };

  if (!layer) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 font-sans">
        <Sliders className="w-10 h-10 mb-3 text-purple-400" />
        <p className="text-sm font-semibold text-slate-600">{t.noLayerSelected}</p>
      </div>
    );
  }

  const isText = layer.type === 'text';
  const isImage = layer.type === 'image';
  const isShape = layer.type === 'shape';
  const isSticker = layer.type === 'sticker';

  const textLayer = isText ? (layer as TextLayer) : null;
  const imgLayer = isImage ? (layer as ImageLayer) : null;
  const shapeLayer = isShape ? (layer as ShapeLayer) : null;
  const stickerLayer = isSticker ? (layer as StickerLayer) : null;

  return (
    <div className="flex flex-col h-full bg-white border-t lg:border-t-0 lg:border-l border-slate-200 text-slate-900 overflow-y-auto font-sans">
      {/* Header bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-50/95 border-b border-slate-200 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
            {isText && <Type className="w-4 h-4" />}
            {isImage && <Crop className="w-4 h-4" />}
            {isShape && <Star className="w-4 h-4" />}
            {isSticker && <Crown className="w-4 h-4" />}
          </div>
          <span className="text-sm font-black text-slate-900 truncate max-w-[150px]">
            {layer.name}
          </span>
        </div>

        {/* Quick layer action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onBringForward(layer.id)}
            title={t.layerActions.bringForward}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSendBackward(layer.id)}
            title={t.layerActions.sendBackward}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicateLayer(layer.id)}
            title={t.layerActions.duplicate}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 hover:text-purple-600 transition"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
            title={layer.locked ? t.layerActions.unlock : t.layerActions.lock}
            className={`p-1.5 rounded-lg transition ${
              layer.locked ? 'bg-amber-100 text-amber-800' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDeleteLayer(layer.id)}
            title={t.layerActions.delete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-24">
        {/* TEXT LAYER PROPERTIES */}
        {textLayer && (
          <>
            {/* Live Text Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                {t.textControls.editContent}
              </label>
              <textarea
                value={textLayer.text}
                onChange={(e) => onUpdateLayer(textLayer.id, { text: e.target.value })}
                rows={2}
                dir="auto"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                placeholder="ਟੈਕਸਟ ਲਿਖੋ / Type text here..."
              />
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                {t.textControls.punjabiSupportNote}
              </p>
            </div>

            {/* Quick Punjabi Phrases */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>{t.textControls.quickPunjabiPhrases}</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {QUICK_PUNJABI_PHRASES.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => onUpdateLayer(textLayer.id, { text: phrase })}
                    className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-slate-800 font-semibold transition truncate shadow-2xs"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family & TTF/OTF Import */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.fontFamily}
                </label>
                <button
                  type="button"
                  onClick={() => fontInputRef.current?.click()}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200 transition"
                  title="Upload TTF or OTF font from your device"
                >
                  <Upload className="w-3 h-3 text-purple-600" />
                  <span>+ {t.textControls.importFont || 'Import Font'}</span>
                </button>
                <input
                  ref={fontInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={handleUploadCustomFont}
                />
              </div>

              <select
                value={textLayer.fontFamily}
                onChange={(e) => onUpdateLayer(textLayer.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {customFonts.length > 0 && (
                  <optgroup label="Uploaded Custom Fonts">
                    {customFonts.map((font) => (
                      <option key={font.name} value={font.name}>
                        ⭐ {font.label}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Built-in Gurmukhi & Luxury Fonts">
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Font Size & Spacing */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.textControls.fontSize}</span>
                  <span className="font-mono text-purple-600">{textLayer.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="180"
                  value={textLayer.fontSize}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, { fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.textControls.spacing}</span>
                  <span className="font-mono text-purple-600">{textLayer.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={textLayer.letterSpacing || 0}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, { letterSpacing: Number(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Align & Style Toggles */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateLayer(textLayer.id, { textAlign: 'left' })}
                  className={`p-2 rounded-xl transition ${
                    textLayer.textAlign === 'left' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateLayer(textLayer.id, { textAlign: 'center' })}
                  className={`p-2 rounded-xl transition ${
                    textLayer.textAlign === 'center' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateLayer(textLayer.id, { textAlign: 'right' })}
                  className={`p-2 rounded-xl transition ${
                    textLayer.textAlign === 'right' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onUpdateLayer(textLayer.id, {
                      fontWeight: textLayer.fontWeight === '800' ? '400' : '800',
                    })
                  }
                  className={`p-2 rounded-xl transition ${
                    textLayer.fontWeight === '800' || textLayer.fontWeight === '900'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    onUpdateLayer(textLayer.id, {
                      fontStyle: textLayer.fontStyle === 'italic' ? 'normal' : 'italic',
                    })
                  }
                  className={`p-2 rounded-xl transition ${
                    textLayer.fontStyle === 'italic' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fill Mode: Solid Color vs Gradient */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.textColor}
                </label>
                <div className="flex gap-1 text-xs">
                  <button
                    onClick={() => onUpdateLayer(textLayer.id, { fillType: 'solid' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      textLayer.fillType === 'solid'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() => onUpdateLayer(textLayer.id, { fillType: 'gradient' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      textLayer.fillType === 'gradient'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {textLayer.fillType === 'solid' ? (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textLayer.color}
                      onChange={(e) => onUpdateLayer(textLayer.id, { color: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textLayer.color}
                      onChange={(e) => onUpdateLayer(textLayer.id, { color: e.target.value })}
                      className="w-24 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
                    />
                  </div>
                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onUpdateLayer(textLayer.id, { color: c })}
                        style={{ backgroundColor: c }}
                        className="w-6 h-6 rounded-full border border-black/10 shadow-sm transition transform hover:scale-110"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Gradient selection */
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {GOLD_GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          onUpdateLayer(textLayer.id, {
                            gradientColors: grad.colors,
                            gradientAngle: grad.angle,
                          })
                        }
                        style={{
                          background: `linear-gradient(${grad.angle}deg, ${grad.colors[0]}, ${grad.colors[1]})`,
                        }}
                        className="h-8 rounded-xl border border-black/10 text-[10px] font-bold text-slate-900 drop-shadow-xs shadow-xs flex items-center justify-center transition hover:scale-102"
                      >
                        {grad.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Curved / Arc Text */}
            <div className="p-3.5 space-y-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.curvedText}
                </span>
                <input
                  type="checkbox"
                  checked={textLayer.curved?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, {
                      curved: {
                        enabled: e.target.checked,
                        radius: textLayer.curved?.radius || 240,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {textLayer.curved?.enabled && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{t.textControls.curveRadius}</span>
                    <span className="font-mono text-purple-600">
                      {textLayer.curved.radius}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="600"
                    value={textLayer.curved.radius}
                    onChange={(e) =>
                      onUpdateLayer(textLayer.id, {
                        curved: {
                          enabled: textLayer.curved?.enabled ?? true,
                          radius: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Outline / Stroke */}
            <div className="p-3.5 space-y-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.strokeOutline}
                </span>
                <input
                  type="checkbox"
                  checked={textLayer.stroke?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, {
                      stroke: {
                        enabled: e.target.checked,
                        color: textLayer.stroke?.color || '#000000',
                        width: textLayer.stroke?.width || 4,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {textLayer.stroke?.enabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textLayer.stroke.color}
                      onChange={(e) =>
                        onUpdateLayer(textLayer.id, {
                          stroke: { ...textLayer.stroke, color: e.target.value },
                        })
                      }
                      className="w-8 h-7 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={textLayer.stroke.width}
                      onChange={(e) =>
                        onUpdateLayer(textLayer.id, {
                          stroke: { ...textLayer.stroke, width: Number(e.target.value) },
                        })
                      }
                      className="flex-1 accent-purple-600 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-purple-600 w-8">
                      {textLayer.stroke.width}px
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Drop Shadow */}
            <div className="p-3.5 space-y-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.shadowEffect}
                </span>
                <input
                  type="checkbox"
                  checked={textLayer.shadow?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, {
                      shadow: {
                        enabled: e.target.checked,
                        color: textLayer.shadow?.color || 'rgba(0,0,0,0.8)',
                        blur: textLayer.shadow?.blur || 12,
                        offsetX: textLayer.shadow?.offsetX || 0,
                        offsetY: textLayer.shadow?.offsetY || 3,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {textLayer.shadow?.enabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Blur</span>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={textLayer.shadow.blur}
                      onChange={(e) =>
                        onUpdateLayer(textLayer.id, {
                          shadow: { ...textLayer.shadow, blur: Number(e.target.value) },
                        })
                      }
                      className="w-32 accent-purple-600 cursor-pointer"
                    />
                    <span className="font-mono text-purple-600">{textLayer.shadow.blur}px</span>
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Box Banner */}
            <div className="p-3.5 space-y-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.textControls.highlightBox}
                </span>
                <input
                  type="checkbox"
                  checked={textLayer.highlightBox?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(textLayer.id, {
                      highlightBox: {
                        enabled: e.target.checked,
                        color: textLayer.highlightBox?.color || 'rgba(10,10,15,0.8)',
                        padding: textLayer.highlightBox?.padding || 10,
                        radius: textLayer.highlightBox?.radius || 6,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {textLayer.highlightBox?.enabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textLayer.highlightBox.color}
                      onChange={(e) =>
                        onUpdateLayer(textLayer.id, {
                          highlightBox: {
                            enabled: textLayer.highlightBox?.enabled ?? true,
                            color: e.target.value,
                            padding: textLayer.highlightBox?.padding ?? 10,
                            radius: textLayer.highlightBox?.radius ?? 6,
                          },
                        })
                      }
                      className="w-8 h-7 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Padding</span>
                        <span className="text-purple-600">{textLayer.highlightBox.padding}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={textLayer.highlightBox.padding}
                        onChange={(e) =>
                          onUpdateLayer(textLayer.id, {
                            highlightBox: {
                              enabled: textLayer.highlightBox?.enabled ?? true,
                              color: textLayer.highlightBox?.color ?? 'rgba(10,10,15,0.8)',
                              padding: Number(e.target.value),
                              radius: textLayer.highlightBox?.radius ?? 6,
                            },
                          })
                        }
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* IMAGE LAYER PROPERTIES */}
        {imgLayer && (
          <>
            {/* Quick action buttons (Crop, Eraser/Cutout, Flip, Rotate) */}
            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={() => onOpenCrop(imgLayer)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition"
                title={t.layerActions.crop}
              >
                <Crop className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold text-slate-900">{t.layerActions.crop}</span>
              </button>

              <button
                onClick={() => onOpenEraser?.(imgLayer)}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 transition"
                title={t.imageControls.manualEraser || 'Cutout / Eraser'}
              >
                <Eraser className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold text-slate-900">{t.eraser || 'Eraser'}</span>
              </button>

              <button
                onClick={() => onUpdateLayer(imgLayer.id, { flipH: !imgLayer.flipH })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  imgLayer.flipH
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={t.layerActions.flipH}
              >
                <FlipHorizontal className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold">{t.layerActions.flipH}</span>
              </button>

              <button
                onClick={() => onUpdateLayer(imgLayer.id, { flipV: !imgLayer.flipV })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                  imgLayer.flipV
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={t.layerActions.flipV}
              >
                <FlipVertical className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold">{t.layerActions.flipV}</span>
              </button>

              <button
                onClick={() =>
                  onUpdateLayer(imgLayer.id, {
                    rotation: ((imgLayer.rotation || 0) + 90) % 360,
                  })
                }
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                title={t.layerActions.rotate90}
              >
                <RotateCw className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-bold text-slate-900">{t.layerActions.rotate90}</span>
              </button>
            </div>

            {/* Adjustments: Brightness, Contrast, Saturation, Warmth, Sepia, Grayscale, Blur */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                {t.imageControls.filters}
              </label>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.brightness}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.brightness ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={imgLayer.filter?.brightness ?? 100}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { contrast: 100, saturation: 100, blur: 0 }),
                        brightness: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.contrast}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.contrast ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={imgLayer.filter?.contrast ?? 100}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, saturation: 100, blur: 0 }),
                        contrast: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.saturation}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.saturation ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={imgLayer.filter?.saturation ?? 100}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, contrast: 100, blur: 0 }),
                        saturation: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Warmth */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.warmth || 'Warmth'}</span>
                  <span className="font-mono text-purple-600">
                    {(imgLayer.filter?.warmth ?? 0) > 0 ? `+${imgLayer.filter?.warmth}` : imgLayer.filter?.warmth ?? 0}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={imgLayer.filter?.warmth ?? 0}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, contrast: 100, saturation: 100, blur: 0 }),
                        warmth: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Vintage Sepia */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.sepia || 'Vintage Sepia'}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.sepia ?? 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imgLayer.filter?.sepia ?? 0}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, contrast: 100, saturation: 100, blur: 0 }),
                        sepia: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Black & White Grayscale */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.grayscale || 'Black & White'}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.grayscale ?? 0}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={imgLayer.filter?.grayscale ?? 0}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, contrast: 100, saturation: 100, blur: 0 }),
                        grayscale: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Blur */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.blur}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.filter?.blur ?? 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={imgLayer.filter?.blur ?? 0}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      filter: {
                        ...(imgLayer.filter || { brightness: 100, contrast: 100, saturation: 100 }),
                        blur: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Corner Radius & Border */}
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{t.imageControls.roundedCorners}</span>
                  <span className="font-mono text-purple-600">
                    {imgLayer.borderRadius || 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={imgLayer.borderRadius || 0}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, { borderRadius: Number(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.imageControls.border}
                </span>
                <input
                  type="checkbox"
                  checked={imgLayer.border?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(imgLayer.id, {
                      border: {
                        enabled: e.target.checked,
                        color: imgLayer.border?.color || '#D4AF37',
                        width: imgLayer.border?.width || 4,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {imgLayer.border?.enabled && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={imgLayer.border.color}
                    onChange={(e) =>
                      onUpdateLayer(imgLayer.id, {
                        border: {
                          enabled: imgLayer.border?.enabled ?? true,
                          color: e.target.value,
                          width: imgLayer.border?.width ?? 4,
                        },
                      })
                    }
                    className="w-8 h-7 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={imgLayer.border.width}
                    onChange={(e) =>
                      onUpdateLayer(imgLayer.id, {
                        border: {
                          enabled: imgLayer.border?.enabled ?? true,
                          color: imgLayer.border?.color ?? '#D4AF37',
                          width: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-purple-600 w-8">
                    {imgLayer.border.width}px
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* SHAPE LAYER PROPERTIES */}
        {shapeLayer && (
          <>
            {/* Shape Types */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                {t.shapeControls.shapeType}
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
                ].map((s) => {
                  const Icon = s.icon;
                  const isSelected = shapeLayer.shapeType === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        onUpdateLayer(shapeLayer.id, { shapeType: s.id as ShapeType })
                      }
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fill Mode */}
            <div className="space-y-2 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.shapeControls.fill}
                </label>
                <div className="flex gap-1">
                  {(['solid', 'gradient', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onUpdateLayer(shapeLayer.id, { fillType: mode })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                        shapeLayer.fillType === mode
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {shapeLayer.fillType === 'solid' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={shapeLayer.fillColor}
                      onChange={(e) => onUpdateLayer(shapeLayer.id, { fillColor: e.target.value })}
                      className="w-10 h-8 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={shapeLayer.fillColor}
                      onChange={(e) => onUpdateLayer(shapeLayer.id, { fillColor: e.target.value })}
                      className="w-24 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onUpdateLayer(shapeLayer.id, { fillColor: c })}
                        style={{ backgroundColor: c }}
                        className="w-6 h-6 rounded-full border border-black/10 shadow-sm transition transform hover:scale-110"
                      />
                    ))}
                  </div>
                </div>
              )}

              {shapeLayer.fillType === 'gradient' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {GOLD_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        onUpdateLayer(shapeLayer.id, {
                          gradientColors: grad.colors,
                          gradientAngle: grad.angle,
                        })
                      }
                      style={{
                        background: `linear-gradient(${grad.angle}deg, ${grad.colors[0]}, ${grad.colors[1]})`,
                      }}
                      className="h-8 rounded-xl border border-black/10 text-[10px] font-bold text-slate-900 drop-shadow-xs shadow-xs flex items-center justify-center transition hover:scale-102"
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stroke */}
            <div className="p-4 space-y-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.shapeControls.stroke}
                </span>
                <input
                  type="checkbox"
                  checked={shapeLayer.stroke?.enabled || false}
                  onChange={(e) =>
                    onUpdateLayer(shapeLayer.id, {
                      stroke: {
                        enabled: e.target.checked,
                        color: shapeLayer.stroke?.color || '#D4AF37',
                        width: shapeLayer.stroke?.width || 3,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {shapeLayer.stroke?.enabled && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={shapeLayer.stroke.color}
                    onChange={(e) =>
                      onUpdateLayer(shapeLayer.id, {
                        stroke: { ...shapeLayer.stroke, color: e.target.value },
                      })
                    }
                    className="w-8 h-7 rounded-lg border border-slate-300 bg-transparent cursor-pointer"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={shapeLayer.stroke.width}
                    onChange={(e) =>
                      onUpdateLayer(shapeLayer.id, {
                        stroke: { ...shapeLayer.stroke, width: Number(e.target.value) },
                      })
                    }
                    className="flex-1 accent-purple-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-purple-600 w-8">
                    {shapeLayer.stroke.width}px
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* STICKER LAYER PROPERTIES */}
        {stickerLayer && (
          <>
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {t.stickerControls.color}
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      onUpdateLayer(stickerLayer.id, {
                        useGradient: false,
                        fillColor: '#D4AF37',
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      !stickerLayer.useGradient
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Solid
                  </button>
                  <button
                    onClick={() =>
                      onUpdateLayer(stickerLayer.id, {
                        useGradient: true,
                        gradientColors: ['#FFF6CA', '#B38728'],
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      stickerLayer.useGradient
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Gold Foil
                  </button>
                </div>
              </div>

              {!stickerLayer.useGradient ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COLOR_PALETTE.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => onUpdateLayer(stickerLayer.id, { fillColor: c })}
                      style={{ backgroundColor: c }}
                      className="w-7 h-7 rounded-full border border-black/10 shadow-sm transition transform hover:scale-110"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {GOLD_GRADIENTS.map((grad, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        onUpdateLayer(stickerLayer.id, {
                          gradientColors: grad.colors,
                        })
                      }
                      style={{
                        background: `linear-gradient(${grad.angle}deg, ${grad.colors[0]}, ${grad.colors[1]})`,
                      }}
                      className="h-8 rounded-xl border border-black/10 text-[10px] font-bold text-slate-900 drop-shadow-xs shadow-xs flex items-center justify-center transition hover:scale-102"
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Flip controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() =>
                  onUpdateLayer(stickerLayer.id, { flipH: !stickerLayer.flipH })
                }
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                  stickerLayer.flipH
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>{t.layerActions.flipH}</span>
              </button>
              <button
                onClick={() =>
                  onUpdateLayer(stickerLayer.id, { flipV: !stickerLayer.flipV })
                }
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                  stickerLayer.flipV
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
                <span>{t.layerActions.flipV}</span>
              </button>
            </div>
          </>
        )}

        {/* COMMON OPACITY SLIDER */}
        <div className="space-y-1.5 pt-3 border-t border-slate-200">
          <div className="flex justify-between text-xs font-black text-slate-900 uppercase tracking-wider">
            <span>{t.layerActions.opacity}</span>
            <span className="font-mono text-purple-600">
              {Math.round((layer.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={Math.round((layer.opacity ?? 1) * 100)}
            onChange={(e) =>
              onUpdateLayer(layer.id, { opacity: Number(e.target.value) / 100 })
            }
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

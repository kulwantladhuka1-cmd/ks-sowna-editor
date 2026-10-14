import React, { useState } from 'react';
import { Layer } from '../types/editor';
import { translations, Language } from '../utils/i18n';
import {
  Type,
  Image,
  Star,
  Crown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Layers,
  Edit2,
  Check,
} from 'lucide-react';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  lang: Language;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  lang,
  onSelectLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
}) => {
  const t = translations[lang];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const reversedLayers = [...layers].reverse();

  if (layers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Layers className="w-10 h-10 mb-3 text-purple-400" />
        <p className="text-sm font-semibold text-slate-600">{t.emptyLayers}</p>
      </div>
    );
  }

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'text':
        return <Type className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-sky-600" />;
      case 'shape':
        return <Star className="w-4 h-4 text-emerald-600" />;
      case 'sticker':
        return <Crown className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleStartRename = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    if (editingName.trim()) {
      onUpdateLayer(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border-t lg:border-t-0 lg:border-l border-slate-200 text-slate-900 overflow-y-auto font-sans">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-200 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            {t.layers} ({layers.length})
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          Top to Bottom
        </span>
      </div>

      <div className="p-3 space-y-2 pb-24">
        {reversedLayers.map((layer, reversedIndex) => {
          const actualIndex = layers.length - 1 - reversedIndex;
          const isSelected = layer.id === selectedLayerId;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition cursor-pointer select-none ${
                isSelected
                  ? 'bg-purple-50/80 border-purple-400 shadow-sm ring-1 ring-purple-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Left icon & name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
                  {getLayerIcon(layer.type)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  {editingId === layer.id ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(layer.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="px-2 py-0.5 text-xs bg-white border border-purple-400 rounded-lg text-slate-900 font-bold w-full outline-none"
                      />
                      <button
                        onClick={(e) => handleSaveRename(layer.id, e)}
                        className="p-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-purple-900' : 'text-slate-900'
                        }`}
                      >
                        {layer.name}
                      </span>
                      <button
                        onClick={(e) => handleStartRename(layer, e)}
                        title="Rename Layer"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-purple-600 p-0.5 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    {layer.type === 'text'
                      ? (layer as any).text
                      : layer.type === 'shape'
                      ? (layer as any).shapeType
                      : `${Math.round(layer.width)} × ${Math.round(layer.height)}`}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div
                className="flex items-center gap-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bring to Top */}
                <button
                  disabled={actualIndex === layers.length - 1}
                  onClick={() => onMoveLayer(actualIndex, layers.length - 1)}
                  title="Bring to Top"
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-20"
                >
                  <ChevronsUp className="w-4 h-4" />
                </button>

                {/* Move Up in stack */}
                <button
                  disabled={actualIndex === layers.length - 1}
                  onClick={() => onMoveLayer(actualIndex, actualIndex + 1)}
                  title={t.layerActions.bringForward}
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-20"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>

                {/* Move Down in stack */}
                <button
                  disabled={actualIndex === 0}
                  onClick={() => onMoveLayer(actualIndex, actualIndex - 1)}
                  title={t.layerActions.sendBackward}
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-20"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Send to Bottom */}
                <button
                  disabled={actualIndex === 0}
                  onClick={() => onMoveLayer(actualIndex, 0)}
                  title="Send to Bottom"
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-20"
                >
                  <ChevronsDown className="w-4 h-4" />
                </button>

                {/* Duplicate */}
                <button
                  onClick={() => onDuplicateLayer(layer.id)}
                  title={t.layerActions.duplicate}
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-purple-600"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Lock */}
                <button
                  onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                  title={layer.locked ? t.layerActions.unlock : t.layerActions.lock}
                  className={`p-1 rounded-lg ${
                    layer.locked ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>

                {/* Visibility */}
                <button
                  onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}
                  title={layer.visible ? t.layerActions.hide : t.layerActions.show}
                  className={`p-1 rounded-lg ${
                    !layer.visible ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteLayer(layer.id)}
                  title={t.layerActions.delete}
                  className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

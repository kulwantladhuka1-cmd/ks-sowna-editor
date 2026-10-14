import React, { useRef, useState, useEffect } from 'react';
import { ImageLayer } from '../types/editor';
import { translations, Language } from '../utils/i18n';
import {
  X,
  Check,
  RotateCcw,
  Undo,
  Redo,
  Eraser,
  Paintbrush,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface EraserModalProps {
  layer: ImageLayer | null;
  lang: Language;
  onApplyMask: (layerId: string, newSrc: string) => void;
  onClose: () => void;
}

export const EraserModal: React.FC<EraserModalProps> = ({
  layer,
  lang,
  onApplyMask,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);

  const [brushMode, setBrushMode] = useState<'erase' | 'restore'>('erase');
  const [brushSize, setBrushSize] = useState<number>(30);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const t = translations[lang];

  useEffect(() => {
    if (!layer) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialData]);
      setHistoryIndex(0);
    };
    img.src = layer.src;
  }, [layer]);

  if (!layer) return null;

  const pushSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[prevIdx], 0, 0);
      setHistoryIndex(prevIdx);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[nextIdx], 0, 0);
      setHistoryIndex(nextIdx);
    }
  };

  const handleReset = () => {
    if (!originalImgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImgRef.current, 0, 0);
    pushSnapshot();
  };

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const drawBrush = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (brushMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      if (originalImgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(originalImgRef.current, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    drawBrush(x, y);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    drawBrush(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      pushSnapshot();
    }
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newSrc = canvas.toDataURL('image/png');
    onApplyMask(layer.id, newSrc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-100 text-pink-700 shadow-xs">
              <Eraser className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                {t.imageControls.manualEraser}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Manual cutout brush &amp; background cleanup
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

        {/* Toolbar: Brush Mode, Size, Undo/Redo */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setBrushMode('erase')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                brushMode === 'erase'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Erase</span>
            </button>
            <button
              onClick={() => setBrushMode('restore')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                brushMode === 'restore'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
          </div>

          {/* Brush Size Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Size:</span>
            <input
              type="range"
              min="6"
              max="120"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 sm:w-32 accent-purple-600 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-purple-600 w-8">
              {brushSize}px
            </span>
          </div>

          {/* Controls: Undo, Redo, Reset, Zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title={t.undo}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-25 hover:bg-slate-100"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title={t.redo}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-25 hover:bg-slate-100"
            >
              <Redo className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Image"
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(1)))}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Workspace with Transparent Pattern */}
        <div className="relative flex-1 p-3 flex items-center justify-center checkerboard-pattern bg-slate-100 overflow-hidden min-h-[300px]">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out',
            }}
            className="relative shadow-xl border border-slate-300 rounded-lg overflow-hidden bg-transparent"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="block cursor-crosshair touch-none"
              style={{
                maxWidth: '75vw',
                maxHeight: '55vh',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Drag to erase or restore transparent background pixels.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Apply Cutout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
